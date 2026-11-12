import type { Trip } from "../../home/types/home-types.ts";
import {
  formatTripDates as formatDatesBase,
  tripDuration,
  dayDistance,
} from "../../home/utils/select-home.ts";

export type TripDisplayStatus =
  "ongoing" | "upcoming" | "planning" | "draft" | "completed" | "cancelled";

export function getTripDisplayStatus(
  trip: Trip,
  today: string,
): TripDisplayStatus {
  if (trip.serverMode) {
    if (trip.serverMode === "PLANNING")
      return preparationStatus(trip.startDate, today);
    const labels = {
      LIVE: "ongoing",
      RECAP: "completed",
      CANCELLED: "cancelled",
    } as const;
    return labels[trip.serverMode];
  }
  if (trip.status === "cancelled") return "cancelled";
  if (trip.status === "draft") return "draft";
  if (trip.status === "completed") return "completed";
  if (
    trip.status === "planned" &&
    trip.startDate &&
    trip.endDate &&
    trip.startDate <= today &&
    trip.endDate >= today
  ) {
    return "ongoing";
  }
  if (trip.status === "planned" && trip.startDate && trip.startDate > today) {
    return preparationStatus(trip.startDate, today);
  }
  if (trip.status === "planned" && trip.endDate && trip.endDate < today) {
    return "completed";
  }
  return "draft";
}

/** Both labels share backend PLANNING; date-only arithmetic avoids device timezone/DST drift. */
function preparationStatus(
  start: string | undefined,
  today: string,
): "planning" | "upcoming" {
  const remaining = start ? dayDistance(today, start) : NaN;
  return remaining >= 1 && remaining <= 7 ? "upcoming" : "planning";
}

export function getTripTitle(trip: Trip, locale: "vi" | "en" = "vi"): string {
  if (trip.title && trip.title.trim().length > 0) {
    return trip.title;
  }
  if (trip.status === "draft") {
    return locale === "vi"
      ? `Kế hoạch ${trip.destination}`
      : `${trip.destination} Draft`;
  }
  return locale === "vi"
    ? `Khám phá ${trip.destination}`
    : `Explore ${trip.destination}`;
}

export function getTotalTripStops(trip: Trip): number {
  if (trip.serverStopCount !== undefined) return trip.serverStopCount;
  if (!trip.days || !Array.isArray(trip.days)) return 0;
  return trip.days.reduce(
    (acc, day) => acc + (day.stops?.length ?? 0),
    trip.unscheduledStops?.length ?? 0,
  );
}

export function formatTripDurationAndStops(
  trip: Trip,
  locale: "vi" | "en" = "vi",
): string {
  const duration = tripDuration(trip);
  const totalStops = getTotalTripStops(trip);

  const daysText =
    duration > 0
      ? locale === "vi"
        ? `${duration} ngày`
        : duration === 1
          ? "1 day"
          : `${duration} days`
      : locale === "vi"
        ? "1 ngày"
        : "1 day";

  const stopsText =
    totalStops > 0
      ? locale === "vi"
        ? `${totalStops} địa điểm`
        : totalStops === 1
          ? "1 place"
          : `${totalStops} places`
      : locale === "vi"
        ? "Chưa có địa điểm"
        : "No places yet";

  return `${daysText} · ${stopsText}`;
}

export function formatTripDates(
  trip: Trip,
  locale: "vi" | "en" = "vi",
): string {
  const formatted = formatDatesBase(trip, locale);
  if (!formatted) {
    return locale === "vi" ? "Chưa chọn ngày" : "Dates not set";
  }
  return formatted;
}
