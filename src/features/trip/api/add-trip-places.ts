import type { TripStop } from "@/features/home/types/home-types";
import { ApiError } from "@/services/api/api-error";
import { itineraryApi } from "./itinerary-api";
import type { SaveItineraryRequest } from "./itinerary-types";
import { matchesSavedPlace, toAddPlaceRequest } from "./place-selection";
import { tripApi } from "./trip-api";
import type { TripPlaceResponse, TripResponse } from "./trip-types";

export type AddTripPlacesInput = { stops: TripStop[]; date: string | null };

function checkTarget(trip: TripResponse, date: string | null) {
  if (trip.status === "CANCELLED") throw new ApiError("TRIP_CANCELLED", 409);
  if (date !== null && !trip.days.some((day) => day.date === date))
    throw new ApiError("TARGET_DATE_MISSING", 409);
}

export async function addTripPlaces(tripId: string, { stops, date }: AddTripPlacesInput) {
  const requests = stops.map(toAddPlaceRequest);
  const [trip, existing] = await Promise.all([tripApi.get(tripId), tripApi.listPlaces(tripId)]);
  checkTarget(trip, date);
  const selected: TripPlaceResponse[] = [];
  const baseOrder = existing.length;
  for (const [index, stop] of stops.entries()) {
    let saved = existing.find((place) => matchesSavedPlace(stop, place));
    if (!saved) {
      saved = await tripApi.addPlace(tripId, { ...requests[index], plannedOrder: baseOrder + index });
      existing.push(saved);
    }
    if (!selected.some((place) => place.placeId === saved.placeId)) selected.push(saved);
  }
  if (date === null || !selected.length) return;

  const [latestTrip, itinerary] = await Promise.all([tripApi.get(tripId), itineraryApi.get(tripId)]);
  checkTarget(latestTrip, date);
  // Copy the authoritative itinerary directly: an older place list must not drop newer visits.
  const days: SaveItineraryRequest["days"] = itinerary.days.map((day) => ({ date: day.date,
    stops: day.stops.map(({ placeId, sequence, arrivalTime, durationMinutes, note, pinned }) =>
      ({ placeId, sequence, arrivalTime, durationMinutes, note, pinned })),
  }));
  let target = days.find((day) => day.date === date);
  const missing = selected.filter((place) => {
    const scheduledDay = days.find((day) => day.stops.some((stop) => stop.placeId === place.placeId));
    if (scheduledDay && scheduledDay.date !== date) throw new ApiError("PLACE_ALREADY_SCHEDULED", 409);
    return !scheduledDay;
  });
  // A lost PUT response is already applied; do not save the same itinerary a second time.
  if (!missing.length) return;
  if (!target) { target = { date, stops: [] }; days.push(target); }
  for (const place of missing) {
    target.stops.push({ placeId: place.placeId, sequence: target.stops.length, arrivalTime: null,
      durationMinutes: place.estimatedDuration ?? 45, note: place.notes, pinned: false });
  }
  await itineraryApi.save(tripId, { days, ...(itinerary.updatedAt ? { expectedUpdatedAt: itinerary.updatedAt } : {}) });
}
