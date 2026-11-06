import { onlineManager, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { authSession } from "@/features/auth/services/auth-session";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import type { Memory } from "@/features/home/types/home-types";
import { ApiError } from "@/services/api/api-error";
import { tripQueryKeys } from "@/features/trip/api/trip-query-keys";
import { memoryQueryKeys as homeMemoryQueryKeys } from "@/features/home/api/memory-query-keys";
import { memoryApi, memoryQueryKeys, type ServerMemory } from "../api/memory-api";
import { loadMemoryTrips } from "../api/memory-trips-api";
import { localMemorySchema } from "../schemas/local-memory-schema";
import { uploadLocalMemory } from "../services/upload-photo";
import { mergeMemories } from "../utils/server-memories";

export function useMemoryTrips() {
  const profile = useProfile();
  const localTrips = useTripPreview((state) => state.trips);
  const query = useQuery({
    queryKey: memoryQueryKeys.trips(profile.data?.id ?? ""),
    queryFn: ({ signal }) => loadMemoryTrips(signal), enabled: !!profile.data,
  });
  const isError = profile.isError || query.isError;
  const remote = query.data ?? [];
  const trips = [...remote, ...localTrips.filter((trip) =>
    trip.id.startsWith("draft-") && !remote.some((item) => item.id === trip.id),
  )];
  return { ...query, trips, isPending: !isError && (profile.isPending || query.isPending), isError };
}

export function useMemories() {
  const profile = useProfile();
  const local = useTripPreview((state) => state.memories);
  const tripsQuery = useMemoryTrips();
  const query = useQuery({
    queryKey: memoryQueryKeys.list(profile.data?.id ?? ""),
    queryFn: ({ signal }) => memoryApi.list(signal), enabled: !!profile.data,
  });
  const memories = mergeMemories(query.data ?? [], local, tripsQuery.trips, profile.data?.id);
  const isError = query.isError || tripsQuery.isError;
  return { ...query, memories, trips: tripsQuery.trips,
    isPending: !isError && (query.isPending || tripsQuery.isPending),
    isError,
    refetch: async () => { await Promise.all([profile.refetch(), query.refetch(), tripsQuery.refetch()]); },
  };
}

export function useMemoryActions() {
  const profile = useProfile();
  const client = useQueryClient();
  const persist = useTripPreview((state) => state.persistLocalPhoto);
  const removeLocal = useTripPreview((state) => state.removeMemory);
  const updateLocal = useTripPreview((state) => state.updateMemoryNote);
  const localMemories = useTripPreview((state) => state.memories);
  const queryKey = memoryQueryKeys.list(profile.data?.id ?? "");
  function accept(memory: ServerMemory) {
    client.setQueryData<ServerMemory[]>(queryKey, (old = []) => [memory, ...old.filter((item) => item.id !== memory.id)]);
    void client.invalidateQueries({ queryKey });
    void client.invalidateQueries({ queryKey: homeMemoryQueryKeys.all });
    void client.invalidateQueries({ queryKey: tripQueryKeys.all });
  }
  const upload = useMutation({
    mutationKey: ["memory-upload"],
    retry: false,
    networkMode: "always",
    mutationFn: async ({ memory, onProgress }: { memory: Memory; onProgress?: (progress: number) => void }) => {
      if (!profile.data) throw new ApiError("AUTH_001", 401);
      const version = authSession.getVersion();
      const assertSession = () => {
        if (version !== authSession.getVersion()) throw new ApiError("CANCELLED");
      };
      const photo = localMemorySchema.parse(memory);
      if (photo.local.userId && photo.local.userId !== profile.data.id)
        throw new ApiError("CANCELLED");
      assertSession();
      if (!onlineManager.isOnline()) throw new ApiError("NETWORK");
      return uploadLocalMemory(photo, profile.data.id, persist, assertSession, onProgress);
    },
    onSuccess: accept,
    onError: () => { void client.invalidateQueries({ queryKey }); },
  });
  const update = useMutation({
    mutationFn: async ({ memory, text }: { memory: Memory; text: string }) => {
      if (memory.remote) {
        const result = await memoryApi.updateNote(memory.remote.memoryId, memory.remote.version, text);
        accept(result);
      } else if (memory.local?.serverId) {
        const current = await memoryApi.detail(memory.local.serverId);
        const result = await memoryApi.updateNote(current.id, current.version, text);
        await updateLocal(memory.id, text);
        accept(result);
      } else {
        // An ambiguous create must be replayed unchanged before its note can be edited.
        if (memory.local?.clientRequestId) throw new ApiError("MEMORY_004", 409);
        await updateLocal(memory.id, text);
      }
    },
    onError: () => { void client.invalidateQueries({ queryKey }); },
  });
  const remove = useMutation({
    mutationFn: async (memory: Memory) => {
      if (memory.remote) {
        await memoryApi.removePhoto(memory.remote.mediaId);
        const backups = localMemories.filter((item) => item.local?.serverId === memory.remote?.memoryId && item.local?.uploaded);
        for (const backup of backups) await removeLocal(backup.id);
        client.setQueryData<ServerMemory[]>(queryKey, (old = []) => old.map((item) => ({
          ...item, media: item.media.filter((photo) => photo.id !== memory.remote?.mediaId),
        })));
        void client.invalidateQueries({ queryKey });
      } else await removeLocal(memory.id);
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: homeMemoryQueryKeys.all });
      void client.invalidateQueries({ queryKey: tripQueryKeys.all });
    },
  });
  return { upload, update, remove };
}
