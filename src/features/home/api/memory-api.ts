import { ApiError } from "@/services/api/api-error";
import { apiClient } from "@/services/api/client";
import {
  memoriesEnvelopeSchema,
  memoryEnvelopeSchema,
  uploadedMediaEnvelopeSchema,
  type CreateMemoryRequest,
  type MemoryResponse,
} from "./memory-types";

function parse<T>(schema: { safeParse(value: unknown): { success: boolean; data?: { data: T } } }, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success || !result.data) throw new ApiError("INVALID_RESPONSE");
  return result.data.data;
}

export type LocalPhoto = { uri: string; fileName: string; mimeType: string };

export const memoryApi = {
  async list(page = 0, size = 50, tripId?: string, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>("/api/v1/journal/memories", {
      params: { page, size, sort: "experiencedAt,desc", ...(tripId ? { tripId } : {}) },
      signal,
    });
    return parse(memoriesEnvelopeSchema, response.data);
  },
  async create(request: CreateMemoryRequest): Promise<MemoryResponse> {
    const response = await apiClient.post<unknown>("/api/v1/journal/memories", request);
    return parse(memoryEnvelopeSchema, response.data);
  },
  async upload(memory: MemoryResponse, photo: LocalPhoto) {
    const body = new FormData();
    body.append("file", {
      uri: photo.uri,
      name: photo.fileName,
      type: photo.mimeType,
    } as unknown as Blob);
    const response = await apiClient.post<unknown>("/api/v1/media/upload", body, {
      params: { tripId: memory.tripId, memoryId: memory.id },
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
    return parse(uploadedMediaEnvelopeSchema, response.data);
  },
  async remove(memoryId: string) {
    await apiClient.delete("/api/v1/journal/memories", { params: { id: memoryId } });
  },
};
