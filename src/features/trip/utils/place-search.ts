import type { TripStop } from "@/features/home/types/home-types";

export function normalizePlaceQuery(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function searchPlaces(places: TripStop[], query: string): TripStop[] {
  const normalized = normalizePlaceQuery(query);
  const words = normalized.split(/\s+/).filter(Boolean);
  if (!words.length) return places;
  return places
    .map((place) => {
      const names = normalizePlaceQuery(`${place.name.vi} ${place.name.en}`);
      const searchable = normalizePlaceQuery(
        `${names} ${place.address?.vi ?? ""} ${place.address?.en ?? ""} ${place.kind.vi} ${place.kind.en}`,
      );
      return {
        place,
        matches: words.every((word) => searchable.includes(word)),
        rank:
          normalizePlaceQuery(place.name.vi) === normalized ||
          normalizePlaceQuery(place.name.en) === normalized
            ? 0
            : names.startsWith(normalized)
              ? 1
              : 2,
      };
    })
    .filter((entry) => entry.matches)
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => entry.place);
}

export type PlaceCoordinate = NonNullable<TripStop["location"]>;
export function getPlaceMapRegion(places: TripStop[], origin?: PlaceCoordinate) {
  const points = places.flatMap((place) =>
    place.location ? [place.location] : [],
  );
  if (origin) points.push(origin);
  if (!points.length) return null;
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLat = Math.min(...latitudes),
    maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes),
    maxLng = Math.max(...longitudes);
  // Keep small clusters visible, with enough padding to focus their outermost pins.
  const span = Math.max(maxLat - minLat, maxLng - minLng, 0.02) * 1.6;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    span,
  };
}
export type PlaceMapRegion = NonNullable<ReturnType<typeof getPlaceMapRegion>>;
export function projectPlace(point: PlaceCoordinate, region: PlaceMapRegion) {
  return {
    x: 0.5 + (point.longitude - region.longitude) / region.span,
    y: 0.5 - (point.latitude - region.latitude) / region.span,
  };
}
export function unprojectPlace(
  x: number,
  y: number,
  region: PlaceMapRegion,
): PlaceCoordinate {
  return {
    latitude: region.latitude + (0.5 - y) * region.span,
    longitude: region.longitude + (x - 0.5) * region.span,
  };
}
