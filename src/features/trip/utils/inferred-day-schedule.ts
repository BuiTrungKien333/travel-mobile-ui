import type {
  ItineraryResponse,
  UpdateDayScheduleRequest,
} from "../api/itinerary-types";

/** Older days may have a timed first stop without saved departure settings. */
export function inferredDaySchedule(
  itinerary: ItineraryResponse | undefined,
  date: string | undefined,
  tripVersion: number | undefined,
): UpdateDayScheduleRequest | null {
  if (!itinerary || !date || tripVersion === undefined) return null;
  const day = itinerary.days.find((entry) => entry.date === date);
  const first = day?.stops[0];
  if (
    !day ||
    day.settings ||
    !first?.arrivalTime ||
    first.arrivalTime.slice(0, 10) !== date ||
    !day.stops.slice(1).some((stop) => !stop.arrivalTime)
  )
    return null;

  return {
    expectedTripVersion: tripVersion,
    expectedUpdatedAt: itinerary.updatedAt,
    settings: {
      origin: null,
      departureTime: first.arrivalTime.slice(11, 16),
      travelMode: "DRIVE",
      returnToStart: false,
    },
    durations: day.stops.map((stop) => ({
      placeId: stop.placeId,
      minutes: stop.durationMinutes,
    })),
  };
}
