import type { Trip } from "@/features/home/types/home-types";
import { ApiError } from "@/services/api/api-error";
import type { TripMutation } from "../types/trip-details-types";
import { applyTripMutation } from "../utils/trip-mutations";
import { toSaveItineraryRequest } from "./trip-adapters";

export function scheduleMutationRequest(source: Trip, mutation: TripMutation) {
  if (source.status === "cancelled") throw new ApiError("TRIP_CANCELLED", 409);
  const candidate = applyTripMutation(source, mutation);
  if (!candidate) throw new ApiError("INVALID_ITINERARY");
  const request = toSaveItineraryRequest(candidate);
  if (mutation.kind === "reorder" && mutation.expectedItineraryUpdatedAt !== undefined) {
    if (!mutation.expectedItineraryUpdatedAt) throw new ApiError("INVALID_ITINERARY");
    request.expectedUpdatedAt = mutation.expectedItineraryUpdatedAt;
  }
  const returnedToPool = (mutation.kind === "remove" && mutation.date !== null)
    || (mutation.kind === "stop" && mutation.date !== null && mutation.targetDate === null);
  if (returnedToPool && (mutation.kind === "stop" || mutation.kind === "remove")) {
    if (!request.expectedUpdatedAt) throw new ApiError("INVALID_ITINERARY");
    const stop = candidate.unscheduledStops?.find((entry) => entry.id === mutation.stopId);
    if (!stop) throw new ApiError("INVALID_ITINERARY");
    request.poolUpdates = [{ placeId: stop.id, durationMinutes: stop.durationMinutes ?? 45, note: stop.note?.trim() || null }];
  }
  return request;
}
