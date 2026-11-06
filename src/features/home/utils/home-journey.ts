import type { TripSummary } from "@/features/trip/api/trip-types";

export function selectHomeJourney(trips: readonly TripSummary[], today: string) {
  const available = trips.filter((trip) => trip.status !== "CANCELLED");
  const completed = available.filter((trip) => trip.status === "COMPLETED"
    || (trip.status === "READY" && !!trip.endDate && trip.endDate < today));
  const current = available.filter((trip) => trip.status === "ACTIVE" || (trip.status === "READY"
    && !!trip.startDate && !!trip.endDate && trip.startDate <= today && trip.endDate >= today))
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))[0];
  const upcoming = available.filter((trip) => trip.status === "READY" && !!trip.startDate && trip.startDate > today)
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))[0];
  const draft = available.filter((trip) => trip.status === "PLANNING")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const previous = [...completed].sort((a, b) => (b.endDate ?? "").localeCompare(a.endDate ?? ""))[0];
  const state = current ? "ongoing" : upcoming ? "upcoming" : draft ? "draft" : previous ? "completed" : "new";
  return { state, trip: current ?? upcoming ?? draft ?? previous, completed } as const;
}
