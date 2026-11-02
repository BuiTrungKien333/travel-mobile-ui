import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/services/api/api-error";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { mapsApi } from "./maps-api";

export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function usePlaceSearchQuery(
  query: string,
  location?: { latitude: number; longitude: number },
) {
  const owner = useProfile().data?.id;
  const normalized = useDebouncedValue(query.trim());
  return useQuery({
    queryKey: [
      "places",
      owner,
      "search",
      normalized,
      location?.latitude,
      location?.longitude,
    ],
    queryFn: ({ signal }) =>
      mapsApi.searchPlaces(
        normalized,
        location?.latitude,
        location?.longitude,
        signal,
      ),
    enabled: !!owner && normalized.length >= 2,
    staleTime: 60_000,
  });
}

export function useWeatherForecastQuery(
  latitude?: number,
  longitude?: number,
  date?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["weather", "forecast", latitude, longitude, date],
    queryFn: ({ signal }) => {
      if (latitude === undefined || longitude === undefined || !date)
        throw new ApiError("INVALID_WEATHER");
      return mapsApi.forecast(latitude, longitude, date, signal);
    },
    enabled:
      enabled && latitude !== undefined && longitude !== undefined && !!date,
    staleTime: 15 * 60_000,
  });
}

export function usePlaceRouteQuery(
  points: { latitude: number; longitude: number }[],
  enabled = true,
) {
  const owner = useProfile().data?.id;
  const pointsKey = points
    .map(({ latitude, longitude }) => `${latitude},${longitude}`)
    .join(";");
  return useQuery({
    queryKey: ["places", owner, "route", pointsKey],
    queryFn: ({ signal }) => {
      if (points.length < 2 || points.length > 25)
        throw new ApiError("INVALID_ROUTE");
      return mapsApi.route(
        {
          origin: points[0],
          destination: points[points.length - 1],
          ...(points.length > 2 ? { intermediates: points.slice(1, -1) } : {}),
          travelMode: "DRIVE",
        },
        signal,
      );
    },
    enabled: !!owner && enabled && points.length >= 2 && points.length <= 25,
    staleTime: 10 * 60_000,
  });
}
