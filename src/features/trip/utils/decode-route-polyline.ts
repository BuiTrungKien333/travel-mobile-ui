import type { PlaceCoordinate } from "./place-search";

/** Decode precision-5 provider data; malformed or excessively large routes are not drawn. */
export function decodeRoutePolyline(encoded: string): PlaceCoordinate[] {
  if (encoded.length > 250000) return [];
  const points: PlaceCoordinate[] = [];
  let cursor = 0,
    latitude = 0,
    longitude = 0;

  function delta(): number | null {
    let result = 0;
    for (let shift = 0; shift < 30 && cursor < encoded.length; shift += 5) {
      const value = encoded.charCodeAt(cursor++) - 63;
      if (value < 0 || value > 63) return null;
      result |= (value & 31) << shift;
      if (value < 32) return result & 1 ? ~(result >> 1) : result >> 1;
    }

    return null;
  }

  while (cursor < encoded.length) {
    const lat = delta(),
      lng = delta();
    if (lat === null || lng === null || points.length >= 10000) return [];
    latitude += lat;
    longitude += lng;
    const point = { latitude: latitude / 1e5, longitude: longitude / 1e5 };
    if (Math.abs(point.latitude) > 90 || Math.abs(point.longitude) > 180)
      return [];
    points.push(point);
  }

  return points;
}
