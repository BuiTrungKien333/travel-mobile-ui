import { memoryQueryKeys as homeMemoryQueryKeys } from "@/features/home/api/memory-query-keys";
import { z } from "zod";
import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/api-error";
import { tripQueryKeys } from "@/features/trip/api/trip-query-keys";
import {
  MEMORY_NOTE_MAX_LENGTH,
  MEMORY_MAX_PIXELS,
  MEMORY_MAX_DIMENSION,
} from "../constants/memory-limits";

export const memoryEndpoints = {
  memories: "/api/v1/journal/memories",
  upload: "/api/v1/media/upload",
  media: "/api/v1/media",
  limits: "/api/v1/media/limits",
} as const;
export const memoryQueryKeys = {
  list: (userId: string) =>
    [...homeMemoryQueryKeys.list(userId), "library"] as const,
  trips: (userId: string) =>
    [...tripQueryKeys.list(userId), "memory-choices"] as const,
};

const imageUrl = z.url().refine((value) => /^https?:\/\//i.test(value));
export const mediaSchema = z.object({
  id: z.guid(),
  url: imageUrl,
  displayOrder: z.number().int().nonnegative(),
  mimeType: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
});
export const serverMemorySchema = z.object({
  id: z.guid(),
  version: z.number().int().nonnegative(),
  userId: z.guid(),
  tripId: z.guid().nullable(),
  placeId: z.guid().nullable(),
  note: z.string().nullable(),
  experiencedAt: z.iso.datetime(),
  coverImageUrl: imageUrl.nullable(),
  mediaCount: z.number().int().nonnegative(),
  media: z.array(mediaSchema),
});
export type ServerMemory = z.infer<typeof serverMemorySchema>;
export const uploadLimitsSchema = z.object({
  maxFileBytes: z.number().int().positive(),
  maxPixels: z.number().int().positive().default(MEMORY_MAX_PIXELS),
  maxDimension: z.number().int().positive().default(MEMORY_MAX_DIMENSION),
});
export type UploadLimits = z.infer<typeof uploadLimitsSchema>;
const createSchema = z.object({
  clientRequestId: z.guid(),
  tripId: z.guid().optional(),
  placeId: z.guid().optional(),
  note: z.string().max(MEMORY_NOTE_MAX_LENGTH),
  experiencedAt: z.iso.datetime(),
});

export function parseApiData<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = z
    .object({ success: z.literal(true), data: schema })
    .safeParse(value);
  if (!result.success) throw new ApiError("INVALID_RESPONSE");
  return result.data.data;
}

export const memoryApi = {
  async list(signal?: AbortSignal) {
    const result: ServerMemory[] = [];
    for (let page = 0; ; page++) {
      const response = await apiClient.get<unknown>(memoryEndpoints.memories, {
        params: { page, size: 50, sort: "experiencedAt,desc" },
        signal,
      });
      const data = parseApiData(
        z.object({
          content: z.array(serverMemorySchema),
          number: z.number().int().nonnegative(),
          last: z.boolean(),
        }),
        response.data,
      );
      if (data.number !== page) throw new ApiError("INVALID_RESPONSE");
      result.push(...data.content);
      if (data.last) return result;
      if (!data.content.length) throw new ApiError("INVALID_RESPONSE");
    }
  },
  async create(input: z.infer<typeof createSchema>) {
    const response = await apiClient.post<unknown>(
      memoryEndpoints.memories,
      createSchema.parse(input),
    );
    return parseApiData(serverMemorySchema, response.data);
  },
  async detail(id: string) {
    const response = await apiClient.get<unknown>(
      `${memoryEndpoints.memories}/detail`,
      { params: { memoryId: z.guid().parse(id) } },
    );
    return parseApiData(serverMemorySchema, response.data);
  },
  async updateNote(id: string, version: number, note: string) {
    const response = await apiClient.patch<unknown>(
      `${memoryEndpoints.memories}/${z.guid().parse(id)}`,
      {
        version,
        note: z.string().max(MEMORY_NOTE_MAX_LENGTH).parse(note),
      },
    );
    return parseApiData(serverMemorySchema, response.data);
  },
  async removePhoto(mediaId: string) {
    await apiClient.delete(memoryEndpoints.media, {
      params: { id: z.guid().parse(mediaId) },
    });
  },
  async limits(signal?: AbortSignal) {
    const response = await apiClient.get<unknown>(memoryEndpoints.limits, {
      signal,
    });
    return parseApiData(uploadLimitsSchema, response.data);
  },
  async upload(
    memoryId: string,
    tripId: string,
    body: FormData,
    onProgress?: (progress: number) => void,
  ) {
    const response = await apiClient.post<unknown>(
      memoryEndpoints.upload,
      body,
      {
        params: {
          memoryId: z.guid().parse(memoryId),
          tripId: z.guid().parse(tripId),
        },
        timeout: 120000,
        // Axios' JSON default must be cleared; the platform supplies the multipart boundary.
        headers: { "Content-Type": undefined },
        onUploadProgress: ({ loaded, total }) => {
          if (total) onProgress?.(Math.min(1, loaded / total));
        },
      },
    );
    return parseApiData(
      z.object({ mediaId: z.guid(), url: imageUrl }),
      response.data,
    );
  },
};
