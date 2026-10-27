import type { Trip, TripDay, TripStop } from "@/features/home/types/home-types";
import { isCalendarDate } from "@/utils/calendar-date";
import { clockPattern } from "../schemas/trip-details-schema";

export type TripDetailsMode = "planning" | "live" | "recap" | "cancelled";

/** The preview supplies its clock; a future API can supply the device's local date. */
export function getTripDetailsMode(trip: Trip, today: string): TripDetailsMode {
  if (trip.status === "cancelled") return "cancelled";
  const { startDate: start, endDate: end } = trip;
  if (
    start &&
    end &&
    isCalendarDate(start) &&
    isCalendarDate(end) &&
    start <= end
  ) {
    if (today < start) return "planning";
    if (today > end) return "recap";
    return "live";
  }
  return trip.status === "completed" ? "recap" : "planning";
}

export function scheduledStops(day?: TripDay): TripStop[] {
  return day?.stops.filter((stop) => clockPattern.test(stop.time)) ?? [];
}

export function getTripStartInfo(trip: Trip, day?: TripDay, live = false) {
  if (!day) return null;
  const location =
    day.startLocation?.trim() || trip.accommodation?.trim() || "";
  if (live && !location) return null;
  const time =
    day.startTime && clockPattern.test(day.startTime)
      ? day.startTime
      : undefined;
  return { location, time };
}

export function tripBacklog(trip: Trip) {
  return [
    ...(trip.unscheduledStops ?? []).map((stop) => ({
      stop,
      date: null as string | null,
      key: `pool:${stop.id}`,
    })),
    ...trip.days.flatMap((day) =>
      day.stops
        .filter((stop) => !clockPattern.test(stop.time))
        .map((stop) => ({
          stop,
          date: day.date,
          key: `${day.date}:${stop.id}`,
        })),
    ),
  ];
}

/** Reorder only timed visits, leaving backlog entries and pinned slots untouched. */
export function mergeScheduledOrder(day: TripDay, ids: string[]): string[] {
  let index = 0;
  return day.stops.map((stop) =>
    clockPattern.test(stop.time) ? (ids[index++] ?? stop.id) : stop.id,
  );
}

export function visitTimeRange(stop: TripStop) {
  if (!clockPattern.test(stop.time)) return null;
  const [hours, minutes] = stop.time.split(":").map(Number);
  const end = hours * 60 + minutes + (stop.durationMinutes ?? 45);
  return {
    label: `${stop.time} – ${String(Math.floor(end / 60) % 24).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`,
    nextDay: end >= 24 * 60,
  };
}
