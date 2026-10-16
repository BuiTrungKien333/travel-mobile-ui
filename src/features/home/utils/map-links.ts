const MAP_DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1";

export function directionsUrl(place: string, destination: string) {
  return `${MAP_DIRECTIONS_URL}&destination=${encodeURIComponent(`${place}, ${destination}, Vietnam`)}`;
}
