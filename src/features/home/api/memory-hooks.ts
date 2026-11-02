import { useRef } from "react";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memoryApi } from "./memory-api";
import { memoryQueryKeys } from "./memory-query-keys";
import { tripQueryKeys } from "@/features/trip/api/trip-query-keys";
import type { CreateMemoryRequest, MemoryResponse } from "./memory-types";
import type { LocalPhoto } from "./memory-api";
import { authSession } from "@/features/auth/services/auth-session";
import { ApiError } from "@/services/api/api-error";

export function useMemoriesQuery(tripId?: string) {
  const owner = useProfile().data?.id;
  return useQuery({
    enabled: !!owner,
    queryKey: memoryQueryKeys.list(owner, tripId),
    queryFn: ({ signal }) => memoryApi.list(0, 50, tripId, signal),
  });
}

export function useCreateMemoryWithMediaMutation() {
  const client = useQueryClient();
  const pending = useRef<{
    fingerprint: string;
    memory: MemoryResponse;
    uploaded: string[];
  } | null>(null);
  return useMutation({
    retry: false,
    mutationFn: async ({
      request,
      photos,
    }: {
      request: CreateMemoryRequest;
      photos: LocalPhoto[];
    }) => {
      if (!photos.length || photos.length > 10)
        throw new ApiError("INVALID_PHOTO");
      const sessionVersion = authSession.getVersion();
      const fingerprint = JSON.stringify({ request, photos, sessionVersion });
      if (pending.current?.fingerprint !== fingerprint) {
        pending.current = {
          fingerprint,
          memory: await memoryApi.create(request),
          uploaded: [],
        };
      }
      const attempt = pending.current;
      for (const photo of photos.slice(attempt.uploaded.length)) {
        if (sessionVersion !== authSession.getVersion())
          throw new ApiError("CANCELLED");
        const result = await memoryApi.upload(attempt.memory, photo);
        attempt.uploaded.push(result.mediaId);
      }
      if (sessionVersion !== authSession.getVersion())
        throw new ApiError("CANCELLED");
      return { memory: attempt.memory, uploaded: [...attempt.uploaded] };
    },
    onSuccess: async () => {
      pending.current = null;
      await Promise.all([
        client.invalidateQueries({ queryKey: memoryQueryKeys.all }),
        client.invalidateQueries({ queryKey: tripQueryKeys.root }),
      ]);
    },
    onError: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: memoryQueryKeys.all }),
        client.invalidateQueries({ queryKey: tripQueryKeys.root }),
      ]);
    },
  });
}

export function useDeleteMemoryMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (memoryId: string) => memoryApi.remove(memoryId),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: memoryQueryKeys.all }),
        client.invalidateQueries({ queryKey: tripQueryKeys.root }),
      ]);
    },
  });
}
