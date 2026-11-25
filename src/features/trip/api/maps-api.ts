import { ApiError } from "@/services/api/api-error";
import { apiClient } from "@/services/api/client";
import {
  placeSearchEnvelopeSchema,
  weatherEnvelopeSchema,
  routeEnvelopeSchema,
  type PlaceSearchResult,
  type WeatherForecastResponse,
} from "./maps-types";

function parse<T>(
  schema: {
    safeParse(value: unknown): { success: boolean; data?: { data: T } };
  },
  value: unknown,
): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success || !parsed.data) throw new ApiError("INVALID_RESPONSE");
  return parsed.data.data;
}

export const mapsApi = {
  async searchPlaces(
    query: string,
    latitude?: number,
    longitude?: number,
    signal?: AbortSignal,
  ): Promise<PlaceSearchResult[]> {
    const response = await apiClient.get<unknown>("/api/v1/places/search", {
      params: {
        query,
        ...(latitude !== undefined && longitude !== undefined
          ? { latitude, longitude }
          : {}),
      },
      signal,
    });

    return parse(placeSearchEnvelopeSchema, response.data);
  },
  async forecast(
    latitude: number,
    longitude: number,
    date: string,
    signal?: AbortSignal,
  ): Promise<WeatherForecastResponse> {
    const response = await apiClient.get<unknown>(
      "/api/v1/public/weather/forecast",
      {
        params: {
          latitude,
          longitude,
          startDate: date,
          endDate: date,
          includeHourly: true,
        },
        signal,
      },
    );

    return parse(weatherEnvelopeSchema, response.data);
  },
  async route(
    request: {
      origin: { latitude: number; longitude: number };
      destination: { latitude: number; longitude: number };
      intermediates?: { latitude: number; longitude: number }[];
      travelMode?: "DRIVE" | "WALK" | "BICYCLE" | "TWO_WHEELER";
    },
    signal?: AbortSignal,
  ) {
    const response = await apiClient.post<unknown>("/api/v1/routes", request, {
      signal,
    });
    return parse(routeEnvelopeSchema, response.data);
  },
};
