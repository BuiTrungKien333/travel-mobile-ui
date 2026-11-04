import { z } from "zod";
import type { Trip, TripStop } from "@/features/home/types/home-types";
import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/api-error";
import { isCalendarDate } from "@/utils/calendar-date";
import { parseApiData } from "./memory-api";

const dateSchema = z.string().refine(isCalendarDate);
const summarySchema = z.object({
  id: z.guid(), title: z.string().nullable(), destination: z.object({ name: z.string() }),
  startDate: dateSchema.nullable(), endDate: dateSchema.nullable(),
  status: z.enum(["DRAFT", "PLANNED", "PLANNING", "READY", "ACTIVE", "COMPLETED", "CANCELLED"]),
  coverImageUrl: z.string().nullable(),
});
const placeSchema = z.object({
  placeId: z.guid(), place: z.object({ name: z.string(), address: z.string().nullable(),
    latitude: z.number().nullable(), longitude: z.number().nullable() }),
});
const endpoint = "/api/v1/trips";
const statusMap = {
  DRAFT: "draft", PLANNING: "draft", PLANNED: "planned", READY: "planned",
  ACTIVE: "planned", COMPLETED: "completed", CANCELLED: "cancelled",
} as const;

export async function loadMemoryTrips(signal?: AbortSignal): Promise<Trip[]> {
  const result: Trip[] = [];
  for (let page = 0; ; page++) {
    const response = await apiClient.get<unknown>(endpoint, { params: { page, size: 50 }, signal });
    const data = parseApiData(z.object({ content: z.array(summarySchema), page: z.number(), totalPages: z.number() }), response.data);
    if (data.page !== page) throw new ApiError("INVALID_RESPONSE");
    const trips = await Promise.all(data.content.map(async (item): Promise<Trip> => {
      const placesResponse = await apiClient.get<unknown>(`${endpoint}/${item.id}/places`, { signal });
      const places = parseApiData(z.array(placeSchema), placesResponse.data);
      const stops: TripStop[] = places.map(({ placeId, place }) => ({
        // Memory requires the shared Place ID, not the TripPlace link ID.
        id: placeId, time: "", name: { vi: place.name, en: place.name }, kind: { vi: "", en: "" },
        address: place.address ? { vi: place.address, en: place.address } : undefined,
      }));
      const days: Trip["days"] = [];
      if (item.startDate && item.endDate) {
        const current = new Date(`${item.startDate}T12:00:00Z`);
        while (current.toISOString().slice(0, 10) <= item.endDate) {
          days.push({ date: current.toISOString().slice(0, 10), stops });
          current.setUTCDate(current.getUTCDate() + 1);
        }
      }
      return { id: item.id, title: item.title ?? undefined, destination: item.destination.name,
        startDate: item.startDate ?? undefined, endDate: item.endDate ?? undefined,
        status: statusMap[item.status], days, unscheduledStops: stops, coverImage: item.coverImageUrl ?? undefined };
    }));
    result.push(...trips);
    if (page + 1 >= data.totalPages) return result;
    if (!data.content.length) throw new ApiError("INVALID_RESPONSE");
  }
}
