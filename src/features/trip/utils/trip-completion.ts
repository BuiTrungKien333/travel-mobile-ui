import type { TripReadDto } from "../api/trip-contract";
import type { TripPlaceResponse } from "../api/trip-types";

/** Check canonical trip membership, including places on other days/unscheduled. */
export function hasVisitedAllTripPlaces(
  read: TripReadDto,
  places: readonly Pick<TripPlaceResponse, "visited">[] | undefined,
) {
  return (
    read.trip.mode === "LIVE" &&
    read.trip.stopCount > 0 &&
    places?.length === read.trip.stopCount &&
    places.every((place) => place.visited)
  );
}
