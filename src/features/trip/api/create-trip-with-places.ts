import type { TripStop } from "@/features/home/types/home-types";
import { ApiError } from "@/services/api/api-error";
import { tripApi } from "./trip-api";
import { addTripPlaceRequestSchema, type CreateTripRequest, type TripPlaceResponse } from "./trip-types";

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

function matches(stop: TripStop, saved: TripPlaceResponse) {
  if (stop.providerPlaceId && saved.place.providerPlaceId)
    return stop.providerPlaceId === saved.place.providerPlaceId;
  return stop.name.vi.trim() === saved.place.name.trim()
    && stop.location?.latitude === saved.place.latitude
    && stop.location?.longitude === saved.place.longitude;
}

export async function createTripWithPlaces(
  session: CreateTripSession,
  onProgress: (progress: CreateTripProgress) => void,
) {
  // Validate all selections before creating anything on the server.
  const requests = session.stops.map((stop, index) => {
    if (!stop.location) throw new ApiError("INVALID_PLACES");
    return addTripPlaceRequestSchema.parse({
      providerPlaceId: stop.providerPlaceId,
      name: stop.name.vi,
      latitude: stop.location.latitude,
      longitude: stop.location.longitude,
      address: stop.address?.vi,
      category: stop.kind.vi,
      estimatedDuration: stop.durationMinutes,
      notes: stop.note,
      plannedOrder: index,
    });
  });
  if (!session.tripId) {
    session.tripId = (await tripApi.create(session.request)).id;
    onProgress({ tripId: session.tripId, savedCount: 0, totalCount: session.stops.length, remainingStops: session.stops });
  }
  const tripId = session.tripId;
  if (!session.stops.length) return tripId;

  // Reconcile before retrying: an earlier POST may have committed even if its response was lost.
  const existing = await tripApi.listPlaces(tripId);
  function report() {
    const remainingStops = session.stops.filter((stop) => !existing.some((saved) => matches(stop, saved)));
    onProgress({ tripId, savedCount: session.stops.length - remainingStops.length,
      totalCount: session.stops.length, remainingStops });
  }
  report();
  for (const [index, stop] of session.stops.entries()) {
    if (existing.some((saved) => matches(stop, saved))) continue;
    existing.push(await tripApi.addPlace(tripId, requests[index]));
    report();
  }
  return tripId;
}
