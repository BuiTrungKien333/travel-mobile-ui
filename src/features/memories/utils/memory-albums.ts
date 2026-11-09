import type { Memory, Trip } from "@/features/home/types/home-types";
import { selectHome } from "@/features/home/utils/select-home";

export function getTripPhotos(memories: readonly Memory[], tripId: string) {
  return memories
    .filter((memory) => memory.tripId === tripId && !!memory.photo)
    .sort((a, b) =>
      `${b.date ?? ""} ${b.time ?? ""}`.localeCompare(
        `${a.date ?? ""} ${a.time ?? ""}`,
      ),
    );
}

export function getMemoryCaptureDays(trip: Trip, today: string): Trip["days"] {
  if (trip.status === "cancelled") return [];
  const days = trip.days.filter((day) => day.date <= today);
  if (days.length) return days;
  // Preparation photos belong to today, even when the itinerary starts later.
  const stops = new Map(
    [
      ...trip.days.flatMap((day) => day.stops),
      ...(trip.unscheduledStops ?? []),
    ].map((stop) => [stop.id, stop]),
  );
  return [{ date: today, stops: [...stops.values()] }];
}

export function getMemoryCaptureTarget(
  trips: readonly Trip[],
  today: string,
  params: { tripId?: string; day?: string; stopId?: string },
) {
  const selection = selectHome(trips, today);
  const trip = params.tripId
    ? trips.find((item) => item.id === params.tripId)
    : selection.kind === "ongoing"
      ? selection.trip
      : undefined;
  if (!trip || trip.status === "cancelled") return null;
  const availableDays = getMemoryCaptureDays(trip, today);
  const day = params.day
    ? availableDays.find((item) => item.date === params.day)
    : (availableDays.find((item) => item.date === today) ??
      availableDays.at(-1));
  if (!day || day.date > today) return null;
  const stop =
    params.stopId !== undefined
      ? day.stops.find((item) => item.id === params.stopId)
      : day.stops[0];
  if (params.stopId && !stop) return null;
  return { trip, day, stop };
}
