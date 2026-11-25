import { z } from "zod";
import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/api-error";
import type {
  ForecastDay,
  WeatherCondition,
} from "@/features/home/data/weather-preview";

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

const risk = z.enum(["SAFE", "CAUTION", "HAZARDOUS"]);
const temperature = z.number().min(-100).max(70);
const chance = z.number().int().min(0).max(100);
const localTime = z.iso.datetime({ local: true });

const hour = z.object({
  time: localTime,
  temperature,
  precipitationProbability: chance,
  rainMm: z.number().nonnegative(),
  weatherCode: z.number().int(),
  condition,
  riskLevel: risk,
});

const day = z.object({
  date: z.iso.date(),
  minTemperature: temperature,
  maxTemperature: temperature,
  maxPrecipitationProbability: chance,
  totalRainMm: z.number().nonnegative(),
  dominantCondition: condition,
  highestRiskLevel: risk,
  hourlyForecasts: z.array(hour).min(1).max(24),
});

export const tripWeatherSchema = z
  .object({
    date: z.iso.date(),
    today: z.iso.date(),
    availableThrough: z.iso.date(),
    fetchedAt: z.iso.datetime({ offset: true }),
    location: z
      .object({
        placeId: z.guid(),
        name: z.string(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        basis: z.enum(["ITINERARY", "SAVED_PLACE", "DESTINATION_CATALOG"]),
      })
      .nullable(),
    forecast: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        timezone: z.literal("Asia/Ho_Chi_Minh"),
        providerName: z.literal("open-meteo"),
        dailySummaries: z.array(day).min(1).max(16),
      })
      .nullable(),
    current: z
      .object({
        time: localTime,
        temperature,
        apparentTemperature: temperature,
        humidity: chance,
        rainMm: z.number().nonnegative(),
        windSpeedKmH: z.number().nonnegative(),
        isDay: z.boolean(),
        condition,
        riskLevel: risk,
      })
      .nullable(),
    unavailableReason: z
      .enum([
        "NO_DATES",
        "NO_LOCATION",
        "OUTSIDE_FORECAST_WINDOW",
        "PAST_DATE",
        "MOCK_PROVIDER",
      ])
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      (!data.unavailableReason && (!data.forecast || !data.location)) ||
      (data.unavailableReason && (data.forecast || data.current))
    )
      ctx.addIssue({
        code: "custom",
        message: "Inconsistent weather availability",
      });
    const dates = data.forecast?.dailySummaries.map((d) => d.date) ?? [];
    if (
      new Set(dates).size !== dates.length ||
      dates.some((d) => d < data.today || d > data.availableThrough)
    )
      ctx.addIssue({
        code: "custom",
        message: "Forecast outside available dates",
      });

    for (const d of data.forecast?.dailySummaries ?? []) {
      if (
        d.minTemperature > d.maxTemperature ||
        d.hourlyForecasts.some((h) => !h.time.startsWith(`${d.date}T`))
      )
        ctx.addIssue({ code: "custom", message: "Invalid forecast day" });
    }
  });

export type TripWeather = z.infer<typeof tripWeatherSchema>;

export const weatherApi = {
  async trip(
    tripId: string,
    date?: string,
    signal?: AbortSignal,
  ): Promise<TripWeather> {
    if (
      !z.guid().safeParse(tripId).success ||
      (date !== undefined && !z.iso.date().safeParse(date).success)
    )
      throw new ApiError("INVALID_TRIP");

    const response = await apiClient.get<unknown>(
      `/api/v1/trips/${tripId}/weather`,
      { params: date ? { date } : undefined, signal, timeout: 35_000 },
    );

    const result = z
      .object({ success: z.literal(true), data: tripWeatherSchema })
      .safeParse(response.data);
    if (!result.success) throw new ApiError("INVALID_RESPONSE");

    return result.data.data;
  },
};

export function weatherIcon(condition: string): WeatherCondition {
  if (["LIGHT_RAIN", "RAINY", "HEAVY_RAIN", "THUNDERSTORM"].includes(condition))
    return "rain";
  return condition === "CLEAR_SKY" ? "sun" : "cloud";
}

export function weatherDays(data: TripWeather | undefined): ForecastDay[] {
  return (
    data?.forecast?.dailySummaries.map((d) => {
      const representative =
        d.hourlyForecasts.find((h) => h.time.slice(11, 13) === "12") ??
        d.hourlyForecasts[0];

      const peak = d.hourlyForecasts.reduce((max, h) =>
        h.precipitationProbability > max.precipitationProbability ? h : max,
      );

      return {
        date: d.date,
        low: d.minTemperature,
        high: d.maxTemperature,
        temperature: Math.round(representative.temperature),
        condition: weatherIcon(d.dominantCondition),
        hours: d.hourlyForecasts
          .filter(
            (h, i) =>
              i % 3 === 0 || (h === peak && peak.precipitationProbability > 40),
          )
          .map((h) => ({
            time: h.time.slice(11, 16),
            temperature: Math.round(h.temperature),
            rainChance: h.precipitationProbability,
            condition: weatherIcon(h.condition),
          })),
        alert:
          peak.precipitationProbability > 40
            ? {
                from: peak.time.slice(11, 16),
                to: peak.time.slice(11, 16),
                chance: peak.precipitationProbability,
              }
            : undefined,
      };
    }) ?? []
  );
}
