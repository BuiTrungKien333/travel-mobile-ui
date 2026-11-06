import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memoryApi } from "./memory-api";
import { memoryQueryKeys } from "./memory-query-keys";
import { tripQueryKeys } from "@/features/trip/api/trip-query-keys";
import type { CreateMemoryRequest } from "./memory-types";
import type { LocalPhoto } from "./memory-api";

export function useMemoriesQuery(tripId?: string) {
  return useQuery({
    queryKey: memoryQueryKeys.list(tripId),
    queryFn: ({ signal }) => memoryApi.list(0, 50, tripId, signal),
  });
}

export function useCreateMemoryWithMediaMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ request, photos }: { request: CreateMemoryRequest; photos: LocalPhoto[] }) => {
      const memory = await memoryApi.create(request);
      const uploaded: string[] = [];
      for (const photo of photos) {
        const result = await memoryApi.upload(memory, photo);
        uploaded.push(result.mediaId);
      }
      return { memory, uploaded };
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: memoryQueryKeys.all }),
        client.invalidateQueries({ queryKey: tripQueryKeys.all }),
      ]);
    },
    onError: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: memoryQueryKeys.all }),
        client.invalidateQueries({ queryKey: tripQueryKeys.all }),
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
        client.invalidateQueries({ queryKey: tripQueryKeys.all }),
      ]);
    },
  });
}
