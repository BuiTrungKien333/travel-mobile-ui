import { z } from "zod";

export const placeSearchResultSchema = z.object({
  providerPlaceId: z.string().nullable(),
  name: z.string().min(1),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  category: z.string().nullable(),
});
export type PlaceSearchResult = z.infer<typeof placeSearchResultSchema>;
export const placeSearchEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.array(placeSearchResultSchema),
});

const condition = z.enum([
  "CLEAR_SKY",
  "PARTLY_CLOUDY",
  "CLOUDY",
  "FOGGY",
  "LIGHT_RAIN",
  "RAINY",
  "HEAVY_RAIN",
  "THUNDERSTORM",
  "UNKNOWN",
]);
const hourlyWeatherSchema = z.object({
  time: z.iso.datetime({ local: true }),
  temperature: z.number(),
  precipitationProbability: z.number(),
  rainMm: z.number(),
  weatherCode: z.number(),
  condition,
  riskLevel: z.string(),
});
export const weatherForecastSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  providerName: z.string(),
  dailySummaries: z.array(
    z.object({
      date: z.iso.date(),
      minTemperature: z.number(),
      maxTemperature: z.number(),
      maxPrecipitationProbability: z.number(),
      totalRainMm: z.number(),
      dominantCondition: condition,
      highestRiskLevel: z.string(),
      hourlyForecasts: z.array(hourlyWeatherSchema).optional(),
    }),
  ),
});
export type WeatherForecastResponse = z.infer<typeof weatherForecastSchema>;
export const weatherEnvelopeSchema = z.object({
  success: z.literal(true),
  data: weatherForecastSchema,
});

export const routeEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    distanceMeters: z.number().finite().nonnegative(),
    durationSeconds: z.number().finite().nonnegative(),
    encodedPolyline: z.string().max(250000).nullable(),
    provider: z.string(),
  }),
});
