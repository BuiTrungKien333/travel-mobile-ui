import type { SaveItineraryDayRequest } from "../api/itinerary-types";

type DayStops = SaveItineraryDayRequest["stops"];

/** Keep the day's time slots, while duration and notes follow their place. */
export function reorderDayStops(
  stops: DayStops,
  placeIds: string[],
  visitedPlaceIds?: readonly string[],
): DayStops | null {
  if (
    placeIds.length !== stops.length ||
    new Set(placeIds).size !== stops.length
  )
    return null;
  if (visitedPlaceIds?.some((id, index) => placeIds[index] !== id)) return null;
  const byPlace = new Map(stops.map((stop) => [stop.placeId, stop]));
  const ordered: DayStops = [];
  for (const [sequence, id] of placeIds.entries()) {
    const stop = byPlace.get(id);
    if (!stop) return null;
    ordered.push({
      ...stop,
      sequence,
      arrivalTime: visitedPlaceIds
        ? stop.arrivalTime
        : stops[sequence].arrivalTime,
    });
  }

  return ordered;
}
