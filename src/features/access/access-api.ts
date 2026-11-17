import { z } from "zod";
import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/api-error";
import { placePageSchema, placeDetailSchema } from "@/features/trip/api/place-discovery-api";
import { accountPageSchema, eventPageSchema, catalogPageSchema } from "./access-contract";

async function get<T>(path: string, schema: z.ZodType<T>, params: Record<string, string | number>, signal?: AbortSignal) {
  const response = await apiClient.get<unknown>(path, { params, signal });
  const result = z.object({ success: z.literal(true), data: schema }).safeParse(response.data);
  if (!result.success) throw new ApiError("INVALID_RESPONSE");
  return result.data.data;
}
export const accessApi = {
  places: (provinceId: string, page: number, locale: string, signal?: AbortSignal) =>
    get("/api/v1/public/places", placePageSchema, { provinceId, page, size: 20, locale }, signal),
  place: (id: string, locale: string, signal?: AbortSignal) => get(`/api/v1/public/places/${id}`, placeDetailSchema, { locale }, signal),
  accounts: (q: string, page: number, signal?: AbortSignal) => get("/api/v1/admin/users", accountPageSchema, { q, page, size: 20 }, signal),
  events: (page: number, signal?: AbortSignal) => get("/api/v1/admin/users/events", eventPageSchema, { page, size: 20 }, signal),
  catalog: (page: number, signal?: AbortSignal) => get("/api/v1/admin/catalog", catalogPageSchema, { page, size: 20 }, signal),
  change: async (id: string, value: { role: "USER" | "ADMIN" | "GUEST"; locked: boolean; version: number; }) => {
    await apiClient.patch(`/api/v1/admin/users/${id}`, value);
  },
  review: async (id: string, value: { approved: boolean; version: number; }) => {
    await apiClient.patch(`/api/v1/admin/catalog/${id}`, value);
  },
  index: async () => {
    const response = await apiClient.post<unknown>("/api/v1/admin/planning/retrieval/index", undefined, { timeout: 180000 });
    const parsed = z.object({ success: z.literal(true), data: z.object({ updated: z.number().int().nonnegative(), skipped: z.number().int().nonnegative(), failed: z.number().int().nonnegative() }) }).safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },
};
