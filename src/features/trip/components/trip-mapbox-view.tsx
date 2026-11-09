import { useEffect } from "react";
import type { TripMapViewProps } from "../utils/trip-mapbox";

export function TripMapboxView({ onUnavailable }: TripMapViewProps) {
  useEffect(onUnavailable, [onUnavailable]);
  return null;
}
