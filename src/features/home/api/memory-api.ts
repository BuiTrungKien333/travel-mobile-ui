import { ApiError } from "@/services/api/api-error";
import { apiClient } from "@/services/api/client";
import { Platform } from "react-native";
import {
  memoriesEnvelopeSchema,
  memoryEnvelopeSchema,
  uploadedMediaEnvelopeSchema,
  createMemoryRequestSchema,
  type CreateMemoryRequest,
  type MemoryResponse,
} from "./memory-types";

function parse<T>(
  schema: {
    safeParse(value: unknown): { success: boolean; data?: { data: T } };
  },
  value: unknown,
): T {
  const result = schema.safeParse(value);
  if (!result.success || !result.data) throw new ApiError("INVALID_RESPONSE");
  return result.data.data;
}

export type LocalPhoto = { uri: string; fileName: string; mimeType: string };

export const memoryApi = {
  async list(page = 0, size = 50, tripId?: string, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>("/api/v1/journal/memories", {
      params: {
        page,
        size,
        sort: "experiencedAt,desc",
        ...(tripId ? { tripId } : {}),
      },
      signal,
    });
    return parse(memoriesEnvelopeSchema, response.data);
  },
  async create(request: CreateMemoryRequest): Promise<MemoryResponse> {
    const body = createMemoryRequestSchema.safeParse(request);
    if (!body.success) throw new ApiError("INVALID_MEMORY");
    const response = await apiClient.post<unknown>(
      "/api/v1/journal/memories",
      body.data,
    );
    return parse(memoryEnvelopeSchema, response.data);
  },
  async upload(memory: MemoryResponse, photo: LocalPhoto) {
    const body = new FormData();
    if (Platform.OS === "web") {
      // ImagePicker returns a browser URL on web. FormData cannot consume the
      // React Native { uri, name, type } file descriptor used on native.
      const fileResponse = await fetch(photo.uri);
      if (!fileResponse.ok) throw new ApiError("NETWORK");
      const file = await fileResponse.blob();
      if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024)
        throw new ApiError("INVALID_PHOTO");
      body.append("file", file, photo.fileName);
    } else {
      // React Native supports file descriptors; DOM's FormData typing only describes Blob.
      const nativeBody = body as FormData & {
        append(
          name: string,
          file: { uri: string; name: string; type: string },
        ): void;
      };
      nativeBody.append("file", {
        uri: photo.uri,
        name: photo.fileName,
        type: photo.mimeType,
      });
    }
    const response = await apiClient.post<unknown>(
      "/api/v1/media/upload",
      body,
      {
        params: { tripId: memory.tripId, memoryId: memory.id },
        timeout: 60000,
      },
    );
    return parse(uploadedMediaEnvelopeSchema, response.data);
  },
  async remove(memoryId: string) {
    await apiClient.delete("/api/v1/journal/memories", {
      params: { id: memoryId },
    });
  },
};
