import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mapsApi } from "./maps-api";

export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function usePlaceSearchQuery(query: string, location?: { latitude: number; longitude: number }) {
  const normalized = query.trim();
  return useQuery({
    queryKey: ["places", "search", normalized, location?.latitude, location?.longitude],
    queryFn: ({ signal }) => mapsApi.searchPlaces(normalized, location?.latitude, location?.longitude, signal),
    enabled: normalized.length >= 2,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useWeatherForecastQuery(latitude?: number, longitude?: number, date?: string, enabled = true) {
  return useQuery({
    queryKey: ["weather", "forecast", latitude, longitude, date],
    queryFn: ({ signal }) => mapsApi.forecast(latitude!, longitude!, date!, signal),
    enabled: enabled && latitude !== undefined && longitude !== undefined && !!date,
    staleTime: 15 * 60_000,
    retry: 1,
  });
}

export function usePlaceRouteQuery(points: { latitude: number; longitude: number }[], enabled = true) {
  const pointsKey = points.map(({ latitude, longitude }) => `${latitude},${longitude}`).join(";");
  return useQuery({
    queryKey: ["places", "route", pointsKey],
    queryFn: ({ signal }) => mapsApi.route({
      origin: points[0],
      destination: points[points.length - 1],
      ...(points.length > 2 ? { intermediates: points.slice(1, -1) } : {}),
      travelMode: "DRIVE",
    }, signal),
    enabled: enabled && points.length >= 2 && points.length <= 25,
    staleTime: 10 * 60_000,
    retry: 1,
  });
}
