import type { TripDay, TripStop, TravelMode } from "@/features/home/types/home-types";

type Coordinate = NonNullable<TripStop["location"]>;
export function sameCoordinate(a?: Coordinate, b?: Coordinate) {
  return !!a && !!b && a.latitude === b.latitude && a.longitude === b.longitude;
}
export function toRouteTravelMode(mode: TravelMode = "car") {
  return ({ car: "DRIVE", motorcycle: "TWO_WHEELER", walk: "WALK" } as const)[mode];
}

/** Missing coordinates leave the route unknown; never skip a visit to manufacture a complete route. */
export function routePoints(stops: TripStop[], origin?: Coordinate, returnToStart = false): Coordinate[] | null {
  if (stops.some((stop) => !stop.location) || (returnToStart && !origin)) return null;
  if (!stops.length) return [];
  const points: Coordinate[] = origin ? [origin] : [];
  for (const stop of stops) if (stop.location) points.push(stop.location);
  if (returnToStart && origin) points.push(origin);
  return points.filter((point, index) => index === 0 || !sameCoordinate(point, points[index - 1]));
}

export function dayRoutePoints(day?: TripDay) {
  if (!day || (day.startLocation && !day.startCoordinate)) return null;
  return routePoints(day.stops, day.startCoordinate, day.returnToStart);
}
