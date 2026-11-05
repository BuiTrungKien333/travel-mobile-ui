import type { Trip } from "@/features/home/types/home-types";
import { ApiError } from "@/services/api/api-error";
import type { TripMutation } from "../types/trip-details-types";
import { updateTripDayRequestSchema } from "./trip-types";

export function toUpdateTripDayRequest(trip: Trip, mutation: Extract<TripMutation, { kind: "day" }>) {
  const day = trip.days.find((entry) => entry.date === mutation.date);
  const version = mutation.baseVersion ?? trip.serverVersion;
  if (!day || version === undefined) throw new ApiError("INVALID_RESPONSE");
  const values = { ...day, ...mutation.values };
  const durations = (mutation.durations ?? []).filter((entry) => {
    const stop = day.stops.find((stop) => stop.id === entry.stopId);
    if (!stop) throw new ApiError("INVALID_RESPONSE");
    return entry.durationMinutes !== (stop.durationMinutes ?? 45);
  });
  return updateTripDayRequestSchema.parse({
    version,
    startLocation: values.startLocation?.trim() || null,
    startTime: values.startTime || null,
    returnToStart: values.returnToStart ?? false,
    transport: { car: "CAR", motorcycle: "MOTORCYCLE", walk: "WALK" }[values.transport ?? "car"],
    durations,
    ...(durations.length ? { expectedItineraryUpdatedAt: mutation.expectedItineraryUpdatedAt } : {}),
  });
}
