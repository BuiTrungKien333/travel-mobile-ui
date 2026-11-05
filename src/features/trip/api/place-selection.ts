import type { TripStop } from "@/features/home/types/home-types";
import { ApiError } from "@/services/api/api-error";
import { addTripPlaceRequestSchema, type TripPlaceResponse } from "./trip-types";

type PlaceIdentity = Pick<TripStop, "id" | "providerPlaceId" | "name" | "location">;

export function samePlace(left: PlaceIdentity, right: PlaceIdentity) {
  if (left.id === right.id) return true;
  if (left.providerPlaceId && right.providerPlaceId)
    return left.providerPlaceId === right.providerPlaceId;
  return !!left.location && !!right.location && left.name.vi.trim() === right.name.vi.trim()
    && left.location.latitude === right.location.latitude
    && left.location.longitude === right.location.longitude;
}

export function matchesSavedPlace(stop: TripStop, saved: TripPlaceResponse) {
  return samePlace(stop, { id: saved.placeId, providerPlaceId: saved.place.providerPlaceId ?? undefined,
    name: { vi: saved.place.name, en: saved.place.name },
    ...(saved.place.latitude !== null && saved.place.longitude !== null
      ? { location: { latitude: saved.place.latitude, longitude: saved.place.longitude } } : {}),
  });
}

export function toAddPlaceRequest(stop: TripStop, plannedOrder: number) {
  if (!stop.location) throw new ApiError("INVALID_PLACES");
  return addTripPlaceRequestSchema.parse({
    providerPlaceId: stop.providerPlaceId, name: stop.name.vi,
    latitude: stop.location.latitude, longitude: stop.location.longitude,
    address: stop.address?.vi, category: stop.kind.vi, estimatedDuration: stop.durationMinutes,
    notes: stop.note, plannedOrder,
  });
}
