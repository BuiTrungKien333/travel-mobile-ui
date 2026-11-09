import type { TripStop, TravelMode } from "../types/home-types";
const MAP_DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1";

export function directionsUrl(place: string, destination: string) {
  return `${MAP_DIRECTIONS_URL}&destination=${encodeURIComponent(`${place}, ${destination}, Vietnam`)}`;
}

export function tripDirectionsUrl(
  stop: TripStop,
  destination: string,
  mode: TravelMode | "bicycle" = "car",
) {
  const target = stop.location
    ? `${stop.location.latitude},${stop.location.longitude}`
    : `${stop.name.vi}, ${destination}, Vietnam`;
  const travelmode =
    mode === "walk"
      ? "walking"
      : mode === "bicycle"
        ? "bicycling"
      : mode === "motorcycle"
        ? "two-wheeler"
        : "driving";
  return `${MAP_DIRECTIONS_URL}&destination=${encodeURIComponent(target)}&travelmode=${travelmode}&dir_action=navigate`;
}
