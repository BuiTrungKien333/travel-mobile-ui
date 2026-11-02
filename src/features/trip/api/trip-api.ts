import { z } from "zod";
import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/api-error";
import {
  tripReadSchema,
  tripPageSchema,
  type CreateTripPayload,
} from "./trip-contract";

export const tripEndpoints = {
  list: "/api/v1/trips",
  detail: (id: string) => `/api/v1/trips/${encodeURIComponent(id)}`,
};
const readEnvelope = z.object({
  success: z.literal(true),
  data: tripReadSchema,
});
const pageEnvelope = z.object({
  success: z.literal(true),
  data: tripPageSchema,
});

export const tripApi = {
  async create(payload: CreateTripPayload) {
    const response = await apiClient.post<unknown>(tripEndpoints.list, payload);
    const parsed = readEnvelope.safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },
  async list(page: number, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>(tripEndpoints.list, {
      params: { page, size: 20, sort: "createdAt,desc" },
      signal,
    });
    const parsed = pageEnvelope.safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },
  async detail(id: string, signal?: AbortSignal) {
    const response = await apiClient.get<unknown>(tripEndpoints.detail(id), {
      signal,
    });
    const parsed = readEnvelope.safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },
};
