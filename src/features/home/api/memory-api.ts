import { ApiError } from "@/services/api/api-error";
import { apiClient } from "@/services/api/client";
import { memoriesEnvelopeSchema } from "./memory-types";

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

export const memoryApi = {
  async list(
    page = 0,
    size = 50,
    tripId?: string,
    signal?: AbortSignal,
    date?: string,
  ) {
    const response = await apiClient.get<unknown>("/api/v1/journal/memories", {
      params: {
        page,
        size,
        sort: "experiencedAt,desc",
        ...(tripId ? { tripId } : {}),
        ...(date ? { date } : {}),
      },
      signal,
    });

    return parse(memoriesEnvelopeSchema, response.data);
  },
};
