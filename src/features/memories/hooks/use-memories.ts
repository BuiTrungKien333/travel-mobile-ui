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
import { localMemorySchema, type LocalMemory } from "../schemas/local-memory-schema";
import { uploadLocalMemory } from "../services/upload-photo";
import { mergeMemories } from "../utils/server-memories";
import { withMemoryOperation } from "../services/memory-operation";
import { localAlbumTrips } from "../utils/local-albums";

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
  const trips = [...tripsQuery.trips, ...(!tripsQuery.isSuccess ? localAlbumTrips(local, tripsQuery.trips, profile.data?.id) : [])];
  const memories = mergeMemories(query.data ?? [], local, trips, profile.data?.id, query.isSuccess);
  const isError = query.isError || tripsQuery.isError;
  return { ...query, memories, trips,
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
  const readLocal = useTripPreview((state) => state.getLocalPhotos);
  const userId = profile.data?.id ?? "";
  const generation = authSession.getVersion();
  const queryKey = memoryQueryKeys.list(userId);
  const active = () => !!userId && authSession.getVersion() === generation && authSession.getUserId() === userId;
  function assertSession() {
    if (!profile.data) throw new ApiError("AUTH_001", 401);
    if (!active()) throw new ApiError("CANCELLED");
  }
  function assertOwned(memory: Memory) {
    assertSession();
    if (memory.local && memory.local.userId !== userId) throw new ApiError("CANCELLED");
    if (memory.pendingDeletion || memory.local?.deletePending) throw new ApiError("MEMORY_DELETE_PENDING", 409);
  }
  const backups = (serverId: string) => readLocal().filter((item) => item.local?.userId === userId && item.local.serverId === serverId);
  const operationId = (memory: Memory) => memory.remote
    ? backups(memory.remote.memoryId)[0]?.id ?? `server:${memory.remote.memoryId}` : memory.id;
  async function checkpoint(memory: LocalMemory) { assertSession(); await persist(memory); assertSession(); }
  function invalidate() {
    if (!active()) return;
    void client.invalidateQueries({ queryKey });
    void client.invalidateQueries({ queryKey: homeMemoryQueryKeys.all });
    void client.invalidateQueries({ queryKey: tripQueryKeys.all });
  }
  function accept(memory: ServerMemory) {
    assertSession();
    if (memory.userId !== userId) throw new ApiError("CANCELLED");
    client.setQueryData<ServerMemory[]>(queryKey, (old = []) => [memory, ...old.filter((item) => item.id !== memory.id)]);
    invalidate();
  }
  function forgetMedia(serverId: string, mediaId?: string) {
    assertSession();
    client.setQueryData<ServerMemory[]>(queryKey, (old = []) => mediaId
      ? old.map((item) => item.id === serverId ? { ...item, media: item.media.filter((photo) => photo.id !== mediaId) } : item)
      : old.filter((item) => item.id !== serverId));
  }
  const upload = useMutation({
    mutationKey: ["memory-upload"], retry: false, networkMode: "always",
    mutationFn: async ({ memory, onProgress }: { memory: Memory; onProgress?: (progress: number) => void }) => {
      assertOwned(memory);
      const photo = localMemorySchema.parse(readLocal().find((item) => item.id === memory.id) ?? memory);
      assertOwned(photo);
      if (!onlineManager.isOnline()) throw new ApiError("NETWORK");
      return uploadLocalMemory(photo, userId, checkpoint, assertSession, onProgress, generation);
    },
    onSuccess: accept,
    onError: invalidate,
  });
  const update = useMutation({
    retry: false, networkMode: "always",
    mutationFn: async ({ memory, text }: { memory: Memory; text: string }) => {
      assertOwned(memory);
      return withMemoryOperation(userId, operationId(memory), async () => {
        assertSession();
        if (memory.local) {
          const latest = readLocal().find((item) => item.id === memory.id);
          if (!latest) throw new ApiError("MEMORY_001", 404);
          if (latest.local?.serverId !== memory.local.serverId || latest.local?.clientRequestId !== memory.local.clientRequestId
            || latest.local?.serverVersion !== memory.local.serverVersion) throw new ApiError("MEMORY_VERSION_REQUIRED", 409);
          if (latest.text !== memory.text) throw new ApiError("MEMORY_003", 409);
        }
        const serverId = memory.remote?.memoryId ?? memory.local?.serverId;
        if (!serverId) {
          if (memory.local?.clientRequestId) throw new ApiError("MEMORY_004", 409);
          await updateLocal(memory.id, text); assertSession(); return;
        }
        const version = memory.remote?.version ?? memory.local?.serverVersion;
        if (version === undefined) throw new ApiError("MEMORY_VERSION_REQUIRED", 409);
        const result = await memoryApi.updateNote(serverId, version, text);
        assertSession();
        accept(result);
        try {
          for (const backup of backups(serverId)) {
            await checkpoint(localMemorySchema.parse({ ...backup, text: result.note ?? "",
              local: { ...backup.local, serverVersion: result.version } }));
          }
        } catch (error) {
          assertSession();
          if (error instanceof ApiError && error.code === "CANCELLED") throw error;
          throw new ApiError("MEMORY_LOCAL_SYNC");
        }
      });
    },
    onError: invalidate,
  });
  const remove = useMutation({
    retry: false, networkMode: "always",
    mutationFn: async (memory: Memory) => {
      assertSession();
      if (memory.local && memory.local.userId !== userId) throw new ApiError("CANCELLED");
      return withMemoryOperation(userId, operationId(memory), async () => {
        assertSession();
        if (memory.remote) {
          const copies = backups(memory.remote.memoryId).filter((item) => !item.local?.mediaId || item.local.mediaId === memory.remote?.mediaId);
          for (const copy of copies) await checkpoint(localMemorySchema.parse({ ...copy, local: { ...copy.local, deletePending: true } }));
          await memoryApi.removePhoto(memory.remote.mediaId); assertSession();
          forgetMedia(memory.remote.memoryId, memory.remote.mediaId);
          for (const copy of copies) { await removeLocal(copy.id); assertSession(); }
          return;
        }
        let draft = localMemorySchema.parse(readLocal().find((item) => item.id === memory.id) ?? memory);
        draft = { ...draft, local: { ...draft.local, deletePending: true } };
        await checkpoint(draft);
        if (!draft.local.serverId && draft.local.clientRequestId) {
          if (!draft.tripId) throw new ApiError("TRIP_001");
          try {
            const created = await memoryApi.create({ clientRequestId: draft.local.clientRequestId,
              tripId: draft.tripId, placeId: draft.local.placeId, note: draft.text,
              experiencedAt: new Date(`${draft.date}T${draft.time}:00`).toISOString() });
            assertSession();
            draft = { ...draft, local: { ...draft.local, serverId: created.id, serverVersion: created.version } };
            await checkpoint(draft);
          } catch (error) {
            assertSession();
            if (!(error instanceof ApiError && error.code === "MEMORY_001" && error.status === 404)) throw error;
          }
        }
        if (draft.local.serverId) {
          try {
            const current = await memoryApi.detail(draft.local.serverId); assertSession();
            if (!current.media.length) { await memoryApi.removeEmptyMemory(current.id); forgetMedia(current.id); }
            else {
              const mediaId = draft.local.mediaId ?? (current.media.length === 1 ? current.media[0].id : undefined);
              if (!mediaId) throw new ApiError("MEMORY_MEDIA_REQUIRED", 409);
              await memoryApi.removePhoto(mediaId);
              forgetMedia(current.id, mediaId);
            }
          } catch (error) {
            assertSession();
            if (!(error instanceof ApiError && error.code === "MEMORY_001" && error.status === 404)) throw error;
          }
        }
        assertSession(); await removeLocal(memory.id); assertSession();
      });
    },
    onSettled: invalidate,
  });
  return { upload, update, remove };
}
