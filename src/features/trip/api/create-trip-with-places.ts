import type { TripStop } from "@/features/home/types/home-types";
import { tripApi } from "./trip-api";
import type { CreateTripRequest } from "./trip-types";
import { matchesSavedPlace, toAddPlaceRequest } from "./place-selection";

/** Kept by the open form so a retry resumes the same creation attempt. */
export type CreateTripSession = {
  request: CreateTripRequest;
  stops: TripStop[];
  tripId?: string;
};

export type CreateTripProgress = {
  tripId: string;
  savedCount: number;
  totalCount: number;
  remainingStops: TripStop[];
};

export async function createTripWithPlaces(
  session: CreateTripSession,
  onProgress: (progress: CreateTripProgress) => void,
) {
  // Validate all selections before creating anything on the server.
  const requests = session.stops.map(toAddPlaceRequest);
  if (!session.tripId) {
    session.tripId = (await tripApi.create(session.request)).id;
    onProgress({ tripId: session.tripId, savedCount: 0, totalCount: session.stops.length, remainingStops: session.stops });
  }
  const tripId = session.tripId;
  if (!session.stops.length) return tripId;

  // Reconcile before retrying: an earlier POST may have committed even if its response was lost.
  const existing = await tripApi.listPlaces(tripId);
  function report() {
    const remainingStops = session.stops.filter((stop) => !existing.some((saved) => matchesSavedPlace(stop, saved)));
    onProgress({ tripId, savedCount: session.stops.length - remainingStops.length,
      totalCount: session.stops.length, remainingStops });
  }
  report();
  for (const [index, stop] of session.stops.entries()) {
    if (existing.some((saved) => matchesSavedPlace(stop, saved))) continue;
    existing.push(await tripApi.addPlace(tripId, requests[index]));
    report();
  }
  return tripId;
}
