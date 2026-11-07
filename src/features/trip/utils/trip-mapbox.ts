import type { TripStop } from "@/features/home/types/home-types";
import type { PlaceCoordinate } from "./place-search";

export const TRIP_MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
// Initial view around central Da Lat until the itinerary provides coordinates.
export const TRIP_MAP_DEFAULT_CENTER: [number, number] = [108.4419, 11.9404];
export const TRIP_MAP_DEFAULT_ZOOM = 13;
export const tripMapToken = /^pk\.[\w.-]+$/.test(
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "",
)
  ? process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim()
  : undefined;

export type TripMapPin = PlaceCoordinate & {
  id: string;
  number: number;
  name: string;
};
export type TripMapPosition = [number, number];
export type TripMapBounds = [TripMapPosition, TripMapPosition];
export type TripMapViewProps = {
  token: string;
  pins: TripMapPin[];
  path: TripMapPosition[];
  focusedId?: string;
  onSelect: (id: string) => void;
  onUnavailable: () => void;
};

export function tripMapPins(
  stops: TripStop[],
  locale: "vi" | "en",
): TripMapPin[] {
  return stops.flatMap((stop, index) => {
    const p = stop.location;
    if (
      !p ||
      !Number.isFinite(p.latitude) ||
      Math.abs(p.latitude) > 85.0511 ||
      !Number.isFinite(p.longitude) ||
      Math.abs(p.longitude) > 180
    )
      return [];
    return [{ ...p, id: stop.id, name: stop.name[locale], number: index + 1 }];
  });
}

export function tripMapBounds(
  pins: TripMapPin[],
  path: TripMapPosition[],
): TripMapBounds | undefined {
  if (!pins.length) return;
  const first = pins[0];
  const sw: TripMapPosition = [first.longitude, first.latitude];
  const ne: TripMapPosition = [...sw];
  for (const [lon, lat] of [
    ...pins.map((p): TripMapPosition => [p.longitude, p.latitude]),
    ...path,
  ]) {
    sw[0] = Math.min(sw[0], lon);
    sw[1] = Math.min(sw[1], lat);
    ne[0] = Math.max(ne[0], lon);
    ne[1] = Math.max(ne[1], lat);
  }
  return [sw, ne];
}

/** Fallback image keeps attribution and uses only public credentials. */
export function tripStaticMapUri(
  pins: TripMapPin[],
  polyline: string | undefined,
  token: string,
  color: string,
) {
  if (!/^pk\.[\w.-]+$/.test(token)) return;
  if (!pins.length) {
    const [longitude, latitude] = TRIP_MAP_DEFAULT_CENTER;
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${longitude},${latitude},${TRIP_MAP_DEFAULT_ZOOM}/640x420@2x?access_token=${encodeURIComponent(token)}`;
  }
  const markerColor = color.replace("#", "");
  const markers = pins
    .map(
      (p) =>
        `pin-s${p.number <= 99 ? `-${p.number}` : ""}+${markerColor}(${p.longitude.toFixed(5)},${p.latitude.toFixed(5)})`,
    )
    .join(",");
  const first = pins[0];
  const samePoint = pins.every(
    (p) => p.latitude === first.latitude && p.longitude === first.longitude,
  );
  const viewport = samePoint
    ? `${first.longitude},${first.latitude},15`
    : "auto";
  const makeUrl = (overlay: string) =>
    `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlay}/${viewport}/640x420@2x?access_token=${encodeURIComponent(token)}${viewport === "auto" ? "&padding=32" : ""}`;
  if (polyline) {
    const encoded = encodeURIComponent(polyline)
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29");
    const full = makeUrl(`path-4+${markerColor}(${encoded}),${markers}`);
    if (full.length <= 8192) return full;
  }
  const markersOnly = makeUrl(markers);
  return markersOnly.length <= 8192 ? markersOnly : undefined;
}
