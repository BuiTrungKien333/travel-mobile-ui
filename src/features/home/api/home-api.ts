import { z } from "zod";
import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/api-error";
import { tripReadSchema } from "@/features/trip/api/trip-contract";
import type { Memory, TripStop } from "../types/home-types";
import { nextTravelDayRefreshDelay } from "@/utils/calendar-date";

const count = z.number().int().nonnegative().safe();

const photoSchema = z.object({
  id: z.guid(),
  memoryId: z.guid(),
  tripId: z.guid().nullable(),
  destination: z.string().nullable(),
  placeName: z.string().nullable(),
  url: z.url().refine((value) => /^https?:\/\//i.test(value)),
  note: z.string().nullable(),
  date: z.iso.date().nullable(),
  time: z.string().nullable(),
  experiencedAt: z.iso.datetime({ offset: true }).nullable(),
});

export const homeDashboardSchema = z
  .object({
    state: z.enum(["NEW", "PLANNING", "UPCOMING", "LIVE", "RETURNING"]),
    selectedTrip: tripReadSchema.nullable(),
    dayIndex: count.nullable(),
    todayStopCount: count,
    nextStop: z
      .object({
        id: z.guid(),
        placeId: z.guid(),
        itineraryItemId: z.guid(),
        name: z.string(),
        address: z.string().nullable(),
        latitude: z.number().min(-90).max(90).nullable(),
        longitude: z.number().min(-180).max(180).nullable(),
        category: z.string().nullable(),
        time: z.string().nullable(),
        durationMinutes: count,
        note: z.string().nullable(),
      })
      .nullable(),
    firstEmptyDay: count.min(1).nullable(),
    footprint: z.object({
      provinces: count,
      places: count,
      hasHistory: z.boolean(),
    }),
    recentPhotos: z.array(photoSchema).max(6),
    context: z.object({
      serverTime: z.iso.datetime({ offset: true }),
      evaluatedDate: z.iso.date(),
    }),
  })
  .superRefine((data, context) => {
    const trip = data.selectedTrip?.trip;
    if (
      (data.state === "NEW") !== !trip ||
      (data.state === "LIVE" &&
        (trip?.mode !== "LIVE" || data.dayIndex === null)) ||
      (data.state === "RETURNING" && trip?.mode !== "RECAP") ||
      ((data.state === "PLANNING" || data.state === "UPCOMING") &&
        trip?.mode !== "PLANNING")
    )
      context.addIssue({
        code: "custom",
        message: "Inconsistent home selection",
      });
  });

export type HomeDashboard = z.infer<typeof homeDashboardSchema>;

/** Re-evaluate at Vietnam midnight without polling or using the device's calendar. */
export function nextHomeRefreshDelay(context: HomeDashboard["context"]) {
  return nextTravelDayRefreshDelay(context);
}

export const homeApi = {
  async get(signal?: AbortSignal) {
    const response = await apiClient.get<unknown>("/api/v1/home/dashboard", {
      signal,
    });

    const result = z
      .object({ success: z.literal(true), data: homeDashboardSchema })
      .safeParse(response.data);
    if (!result.success) throw new ApiError("INVALID_RESPONSE");

    return result.data.data;
  },
};

export function homeNextStop(
  stop: HomeDashboard["nextStop"],
): TripStop | undefined {
  if (!stop) return;

  return {
    id: stop.id,
    placeId: stop.placeId,
    tripPlaceId: stop.id,
    itineraryItemId: stop.itineraryItemId,
    name: { vi: stop.name, en: stop.name },
    kind: { vi: stop.category ?? "", en: stop.category ?? "" },
    time: stop.time ?? "—",
    durationMinutes: stop.durationMinutes,
    note: stop.note ?? undefined,
    address: stop.address ? { vi: stop.address, en: stop.address } : undefined,
    location:
      stop.latitude !== null && stop.longitude !== null
        ? { latitude: stop.latitude, longitude: stop.longitude }
        : undefined,
  };
}

export function homeMemories(
  data: HomeDashboard,
  local: readonly Memory[],
  owner: string,
): Memory[] {
  const remote: Memory[] = data.recentPhotos.map((p) => ({
    id: p.id,
    tripId: p.tripId ?? undefined,
    destination: p.destination ?? "",
    text: p.note ?? "",
    photo: p.url,
    date: p.date ?? undefined,
    time: p.time ?? undefined,
    place: p.placeName ? { vi: p.placeName, en: p.placeName } : undefined,
  }));

  const drafts = local.filter(
    (m) =>
      !!owner &&
      m.local?.userId === owner &&
      m.tripId === data.selectedTrip?.trip.id &&
      !data.recentPhotos.some((p) => p.memoryId === m.local?.serverId) &&
      (data.state !== "LIVE" ||
        (m.tripId === data.selectedTrip?.trip.id &&
          m.date === data.context.evaluatedDate)),
  );

  return [...drafts, ...remote]
    .sort((a, b) =>
      `${b.date ?? ""} ${b.time ?? ""}`.localeCompare(
        `${a.date ?? ""} ${a.time ?? ""}`,
      ),
    )
    .slice(0, 6);
}
