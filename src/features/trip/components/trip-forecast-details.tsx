import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { TravelWeatherDetails } from "@/features/home/components/travel-weather-details";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { WeatherForecastResponse } from "../api/maps-types";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

type DailyForecast = WeatherForecastResponse["dailySummaries"][number];

export function TripForecastDetails({
  forecast, destination, loading = false, error = false, hasCoordinates = true,
}: {
  forecast?: DailyForecast;
  destination: string;
  loading?: boolean;
  error?: boolean;
  hasCoordinates?: boolean;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  if (loading)
    return <AppText accessibilityRole="progressbar" variant="label">{copy.weather}…</AppText>;
  if (!hasCoordinates || error || !forecast)
    return (
      <>
        <AppIcon name="cloud" size={theme.layout.weatherHeroArtworkSize} color={theme.colors.textSecondary} />
        <AppText variant="label" tone={error ? "error" : undefined} accessibilityRole={error ? "alert" : undefined}>{copy.noWeather}</AppText>
      </>
    );

  const rain = forecast.dominantCondition.includes("RAIN") || forecast.dominantCondition === "THUNDERSTORM"
    || forecast.maxPrecipitationProbability > 40 || forecast.totalRainMm > 0;
  const sunny = forecast.dominantCondition === "CLEAR_SKY" || forecast.dominantCondition === "PARTLY_CLOUDY";
  const cool = forecast.minTemperature < 20;
  const condition = rain ? "rain" : sunny ? "sun" : "cloud";
  const rainyHours = (forecast.hourlyForecasts ?? []).filter((hour) => hour.precipitationProbability > 40);
  const hours = (forecast.hourlyForecasts ?? []).map((hour) => ({
    time: hour.time.slice(11, 16),
    temperature: hour.temperature,
    rainChance: hour.precipitationProbability,
    condition: hour.condition.includes("RAIN") || hour.condition === "THUNDERSTORM" ? "rain" as const
      : hour.condition === "CLEAR_SKY" || hour.condition === "PARTLY_CLOUDY" ? "sun" as const : "cloud" as const,
  }));
  const advice: Parameters<typeof TravelWeatherDetails>[0]["advice"] = rain
    ? {
        icon: "umbrella",
        summary: rainyHours.length
          ? copy.forecastRainWindow.replace("{from}", rainyHours[0].time.slice(11, 16))
              .replace("{to}", rainyHours[rainyHours.length - 1].time.slice(11, 16))
              .replace("{chance}", String(forecast.maxPrecipitationProbability))
          : copy.forecastRainPossible,
        items: [
          { icon: "umbrella", text: cool ? copy.forecastBringRainLayer : copy.forecastBringUmbrella },
          { icon: "pin", text: copy.forecastIndoorOption },
        ],
      }
    : {
        icon: sunny ? "sun" : "cloud",
        summary: sunny ? copy.forecastSunAdvice : cool ? copy.forecastCoolAdvice : copy.forecastMildAdvice,
        items: [
          { icon: sunny ? "sun" : "walk", text: sunny ? copy.forecastSunProtection : copy.forecastOutdoorOption },
          { icon: cool ? "cloud" : "clock", text: cool ? copy.forecastBringLayer : copy.forecastFlexiblePlan },
        ],
      };
  return (
    <TravelWeatherDetails
      weather={{ temperature: Math.round((forecast.minTemperature + forecast.maxTemperature) / 2), condition, hours }}
      destination={destination}
      context={`${copy.forecastDay} · ${new Intl.DateTimeFormat(locale, { weekday: "long", day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(`${forecast.date}T12:00:00Z`))}`}
      conditionLabel={copy[condition]}
      secondary={`${forecast.minTemperature}°–${forecast.maxTemperature}°C · ${forecast.maxPrecipitationProbability}% mưa`}
      advice={advice}
      footnote={copy.forecastPreparationHint}
    />
  );
}
