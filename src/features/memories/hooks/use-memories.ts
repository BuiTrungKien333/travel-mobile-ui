import { UI_PREVIEW_ENABLED } from "@/constants/development";
import {
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { authSession } from "@/features/auth/services/auth-session";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import type { Memory } from "@/features/home/types/home-types";
import { ApiError } from "@/services/api/api-error";
import { tripQueryKeys } from "@/features/trip/api/trip-query-keys";
import { memoryQueryKeys as homeMemoryQueryKeys } from "@/features/home/api/memory-query-keys";
import {
  memoryApi,
  memoryQueryKeys,
  type ServerMemory,
} from "../api/memory-api";
import { loadMemoryTrips } from "../api/memory-trips-api";
import { localMemorySchema } from "../schemas/local-memory-schema";
import { uploadLocalMemory } from "../services/upload-photo";
import { mergeMemories } from "../utils/server-memories";

/** Local photos remain readable independently of trip/media requests. */
export function useLocalMemories() {
  const profile = useProfile();
  const local = useTripPreview((state) => state.memories);
  return local.filter(
    (memory) =>
      memory.local &&
      (UI_PREVIEW_ENABLED ||
        (!!profile.data && memory.local.userId === profile.data.id)),
  );
}

export function useMemoryTrips() {
  const profile = useProfile();
  const localTrips = useTripPreview((state) => state.trips);
  const query = useQuery({
    queryKey: memoryQueryKeys.trips(profile.data?.id ?? ""),
    queryFn: ({ signal }) => loadMemoryTrips(signal),
    enabled: !UI_PREVIEW_ENABLED && !!profile.data,
  });
  const isError = profile.isError || query.isError;
  const remote = query.data ?? [];
  const trips = UI_PREVIEW_ENABLED ? localTrips : remote;
  return {
    ...query,
    trips,
    isPending:
      !UI_PREVIEW_ENABLED && !isError && (profile.isPending || query.isPending),
    isError: !UI_PREVIEW_ENABLED && isError,
  };
}

export function useMemories() {
  const profile = useProfile();
  const local = useTripPreview((state) => state.memories);
  const tripsQuery = useMemoryTrips();
  const query = useQuery({
    queryKey: memoryQueryKeys.list(profile.data?.id ?? ""),
    queryFn: ({ signal }) => memoryApi.list(signal),
    enabled: !UI_PREVIEW_ENABLED && !!profile.data,
  });
  const memories = UI_PREVIEW_ENABLED
    ? local
    : mergeMemories(
        query.data ?? [],
        local,
        tripsQuery.trips,
        profile.data?.id,
      );
  const isError = query.isError || tripsQuery.isError;
  return {
    ...query,
    memories,
    trips: tripsQuery.trips,
    isPending:
      !UI_PREVIEW_ENABLED &&
      !isError &&
      (query.isPending || tripsQuery.isPending),
    isError: !UI_PREVIEW_ENABLED && isError,
    refetch: async () => {
      await Promise.all([
        profile.refetch(),
        query.refetch(),
        tripsQuery.refetch(),
      ]);
    },
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
    client.setQueryData<ServerMemory[]>(queryKey, (old = []) => [
      memory,
      ...old.filter((item) => item.id !== memory.id),
    ]);
    void client.invalidateQueries({ queryKey });
    void client.invalidateQueries({ queryKey: homeMemoryQueryKeys.all });
    void client.invalidateQueries({ queryKey: tripQueryKeys.root });
  }
  function protectSession(memory: Memory) {
    const version = authSession.getVersion();
    if (memory.local?.userId && memory.local.userId !== profile.data?.id)
      throw new ApiError("CANCELLED");
    return () => {
      if (version !== authSession.getVersion()) throw new ApiError("CANCELLED");
    };
  }
  const upload = useMutation({
    mutationKey: ["memory-upload"],
    retry: false,
    networkMode: "always",
    mutationFn: async ({
      memory,
      onProgress,
    }: {
      memory: Memory;
      onProgress?: (progress: number) => void;
    }) => {
      if (!profile.data) throw new ApiError("AUTH_001", 401);
      const version = authSession.getVersion();
      const assertSession = () => {
        if (version !== authSession.getVersion())
          throw new ApiError("CANCELLED");
      };
      const photo = localMemorySchema.parse(memory);
      if (photo.local.userId && photo.local.userId !== profile.data.id)
        throw new ApiError("CANCELLED");
      assertSession();
      if (!onlineManager.isOnline()) throw new ApiError("NETWORK");
      return uploadLocalMemory(
        photo,
        profile.data.id,
        persist,
        assertSession,
        onProgress,
      );
    },
    onSuccess: accept,
    onError: () => {
      void client.invalidateQueries({ queryKey });
    },
  });
  const update = useMutation({
    retry: false,
    mutationFn: async ({ memory, text }: { memory: Memory; text: string }) => {
      const assertSession = protectSession(memory);
      if (memory.remote) {
        const result = await memoryApi.updateNote(
          memory.remote.memoryId,
          memory.remote.version,
          text,
        );
        assertSession();
        accept(result);
      } else if (memory.local?.serverId) {
        const current = await memoryApi.detail(memory.local.serverId);
        assertSession();
        const result = await memoryApi.updateNote(
          current.id,
          current.version,
          text,
        );
        assertSession();
        await updateLocal(memory.id, text);
        assertSession();
        accept(result);
      } else {
        // An ambiguous create must be replayed unchanged before its note can be edited.
        if (memory.local?.clientRequestId)
          throw new ApiError("MEMORY_004", 409);
        await updateLocal(memory.id, text);
      }
    },
    onError: () => {
      void client.invalidateQueries({ queryKey });
    },
  });
  const remove = useMutation({
    retry: false,
    mutationFn: async (memory: Memory) => {
      const assertSession = protectSession(memory);
      if (memory.remote) {
        await memoryApi.removePhoto(memory.remote.mediaId);
        assertSession();
        const backups = localMemories.filter(
          (item) =>
            item.local?.serverId === memory.remote?.memoryId &&
            item.local?.uploaded,
        );
        for (const backup of backups) {
          assertSession();
          await removeLocal(backup.id);
        }
        assertSession();
        client.setQueryData<ServerMemory[]>(queryKey, (old = []) =>
          old.map((item) => ({
            ...item,
            media: item.media.filter(
              (photo) => photo.id !== memory.remote?.mediaId,
            ),
          })),
        );
        void client.invalidateQueries({ queryKey });
      } else await removeLocal(memory.id);
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: homeMemoryQueryKeys.all });
      void client.invalidateQueries({ queryKey: tripQueryKeys.root });
    },
  });
  return { upload, update, remove };
}
