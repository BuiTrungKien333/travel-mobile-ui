import type { HomeSelection, Trip } from "../types/home-types.ts";

const DAY_MS = 86_400_000;

export function isPastTrip(trip: Trip, today: string): boolean {
  return (
    trip.status === "completed" ||
    (trip.status === "planned" && Boolean(trip.endDate && trip.endDate < today))
  );
}

export function dayDistance(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / DAY_MS,
  );
}

/** Date-only values are compared in the trip's calendar; drafts never count as travelled. */
export function selectHome(
  trips: readonly Trip[],
  today: string,
): HomeSelection {
  const active = trips.filter(
    (trip) => trip.status !== "cancelled" && trip.status !== "completed",
  );

  const ongoing = active
    .filter(
      (trip) =>
        trip.status === "planned" &&
        trip.startDate &&
        trip.endDate &&
        trip.startDate <= today &&
        trip.endDate >= today,
    )
    .sort(
      (a, b) =>
        (b.startDate ?? "").localeCompare(a.startDate ?? "") ||
        a.id.localeCompare(b.id),
    )[0];

  if (ongoing)
    return {
      kind: "ongoing",
      trip: ongoing,
      dayIndex: dayDistance(ongoing.startDate ?? today, today),
    };

  const upcoming = active
    .filter((trip) => trip.startDate && trip.startDate >= today)
    .sort(
      (a, b) =>
        (a.startDate ?? "").localeCompare(b.startDate ?? "") ||
        a.id.localeCompare(b.id),
    )[0];
  if (upcoming) return { kind: "upcoming", trip: upcoming };
  const hasTravelled = trips.some((trip) => isPastTrip(trip, today));

  return { kind: hasTravelled ? "returning" : "new" };
}

export function tripDuration(trip: Trip): number {
  if (trip.serverDayCount !== undefined) return trip.serverDayCount;
  return trip.startDate && trip.endDate
    ? dayDistance(trip.startDate, trip.endDate) + 1
    : 0;
}

export function formatTripDates(trip: Trip, locale: "vi" | "en"): string {
  if (!trip.startDate || !trip.endDate) return "";
  const format = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  return `${format.format(new Date(`${trip.startDate}T12:00:00Z`))} – ${format.format(new Date(`${trip.endDate}T12:00:00Z`))}`;
}
