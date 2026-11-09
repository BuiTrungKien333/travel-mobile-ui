import { z } from "zod";
import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/api-error";
import type { TripStop } from "@/features/home/types/home-types";

const source = z.enum(["INTERNAL", "USER"]);
const location = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
const category = z.object({ code: z.string(), label: z.string() }).nullable();
const reference = z.object({ kind: source, placeId: z.guid() });
const fields = {
  id: z.guid(),
  reference,
  source,
  name: z.string().min(1).max(255),
  formattedAddress: z.string().nullable(),
  location,
  provinceId: z.guid().nullable(),
  category,
};
export const placeSummarySchema = z
  .object({ ...fields, photo: z.null() })
  .refine((p) => p.id === p.reference.placeId && p.source === p.reference.kind);
export const placeDetailSchema = z
  .object({
    ...fields,
    environmentType: z.enum(["INDOOR", "OUTDOOR", "HYBRID", "UNSPECIFIED"]),
    openingHours: z
      .object({
        displayLines: z.array(z.string()),
        source: z.literal("INTERNAL"),
      })
      .nullable(),
    openingStatus: z.enum(["OPEN", "CLOSED", "UNKNOWN"]),
    admission: z.object({ text: z.string() }).nullable(),
    description: z.string().nullable().optional(),
    photos: z.array(z.unknown()).max(0),
    evaluatedAt: z.iso.datetime(),
  })
  .refine((p) => p.id === p.reference.placeId && p.source === p.reference.kind);
const count = z.number().int().nonnegative().safe();
export const placePageSchema = z.object({
  content: z.array(placeSummarySchema).max(100),
  page: count,
  size: count.min(1).max(100),
  totalElements: count,
  totalPages: count,
  reason: z.enum(["DESTINATION_NOT_LINKED", "EMPTY_CATALOG"]).nullable(),
  context: z.object({
    serverTime: z.iso.datetime(),
    evaluatedDate: z.iso.date(),
  }),
});
export type PlaceSummary = z.infer<typeof placeSummarySchema>;
export type PlaceDetail = z.infer<typeof placeDetailSchema>;
export type PlaceScope = { tripId?: string; provinceId?: string | null };

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = z
    .object({ success: z.literal(true), data: schema })
    .safeParse(value);
  if (!result.success) throw new ApiError("INVALID_RESPONSE");
  return result.data.data;
}
export const placeDiscoveryApi = {
  async list(
    scope: PlaceScope,
    q: string,
    page: number,
    locale: "vi" | "en",
    signal?: AbortSignal,
  ) {
    if (
      q.trim().length > 200 ||
      !Number.isSafeInteger(page) ||
      page < 0 ||
      (scope.tripId && scope.provinceId) ||
      (scope.tripId && !z.guid().safeParse(scope.tripId).success) ||
      (scope.provinceId && !z.guid().safeParse(scope.provinceId).success)
    )
      throw new ApiError("INVALID_PLACE");
    const response = await apiClient.get<unknown>(
      "/api/v1/places/suggestions",
      {
        params: { ...scope, q: q.trim(), page, size: 20, locale },
        signal,
      },
    );
    return parse(placePageSchema, response.data);
  },
  async detail(id: string, locale: "vi" | "en", signal?: AbortSignal) {
    if (!z.guid().safeParse(id).success) throw new ApiError("INVALID_PLACE");
    const response = await apiClient.get<unknown>(
      `/api/v1/places/${encodeURIComponent(id)}`,
      { params: { locale }, signal },
    );
    return parse(placeDetailSchema, response.data);
  },
};

/** Before a trip exists the selection key is the Place UUID, never a provider or membership ID. */
export function discoveryStop(place: PlaceSummary | PlaceDetail): TripStop {
  return {
    id: place.id,
    placeId: place.id,
    time: "",
    name: { vi: place.name, en: place.name },
    kind: {
      vi: place.category?.label ?? "Địa điểm",
      en: place.category?.label ?? "Place",
    },
    address: place.formattedAddress
      ? { vi: place.formattedAddress, en: place.formattedAddress }
      : undefined,
    location: place.location,
  };
}
