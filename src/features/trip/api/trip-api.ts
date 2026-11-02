import { z } from "zod";
import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/api-error";
import {
  tripReadSchema,
  tripPageSchema,
  type CreateTripPayload,
  updateTripSchema,
  datePreviewRequestSchema,
  dateImpactSchema,
  type UpdateTripPayload,
  type DatePreviewRequest,
} from "./trip-contract";

export const tripEndpoints = {
  list: "/api/v1/trips",
  detail: (id: string) => `/api/v1/trips/${encodeURIComponent(id)}`,
  datePreview: (id: string) =>
    `/api/v1/trips/${encodeURIComponent(id)}/date-change-preview`,
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
  async update(id: string, payload: UpdateTripPayload) {
    const body = updateTripSchema.safeParse(payload);
    if (!body.success) throw new ApiError("INVALID_TRIP");
    const response = await apiClient.patch<unknown>(
      tripEndpoints.detail(id),
      body.data,
    );
    const parsed = readEnvelope.safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },
  async previewDates(id: string, payload: DatePreviewRequest) {
    const body = datePreviewRequestSchema.safeParse(payload);
    if (!body.success) throw new ApiError("INVALID_TRIP");
    const response = await apiClient.post<unknown>(
      tripEndpoints.datePreview(id),
      body.data,
    );
    const parsed = z
      .object({ success: z.literal(true), data: dateImpactSchema })
      .safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },
  async remove(id: string, version: number) {
    if (!Number.isSafeInteger(version) || version < 0)
      throw new ApiError("INVALID_TRIP");
    await apiClient.delete(tripEndpoints.detail(id), { params: { version } });
  },
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
