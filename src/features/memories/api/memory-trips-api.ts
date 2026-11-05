import type { Trip } from "@/features/home/types/home-types";
import { tripApi } from "@/features/trip/api/trip-api";
import { toTrip } from "@/features/trip/api/trip-adapters";

export async function loadMemoryTrips(signal?: AbortSignal): Promise<Trip[]> {
  const trips = await tripApi.list(signal);
  return Promise.all(trips.map(async (item) => {
    const places = await tripApi.listPlaces(item.id, signal);
    const trip = toTrip(item, places);
    // Capture can attach a photo to any saved place in the selected trip.
    return { ...trip, days: trip.days.map((day) => ({ ...day, stops: trip.unscheduledStops ?? [] })) };
  }));
}
