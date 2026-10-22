import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { TravelWeatherDetails } from "@/features/home/components/travel-weather-details";
import type { ForecastDay } from "@/features/home/data/weather-preview";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

export function TripForecastDetails({
  forecast,
  destination,
}: {
  forecast?: ForecastDay;
  destination: string;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  if (!forecast)
    return (
      <>
        <AppIcon
          name="cloud"
          size={theme.layout.weatherHeroArtworkSize}
          color={theme.colors.textSecondary}
        />
        <AppText variant="label">{copy.noWeather}</AppText>
        <AppText tone="muted" variant="caption">
          {copy.weatherHint}
        </AppText>
      </>
    );
  const rainy =
    !!forecast.alert || forecast.hours.some((hour) => hour.rainChance > 40);
  const sunny = forecast.uv > 5;
  const cool = forecast.low < 20;
  const advice: Parameters<typeof TravelWeatherDetails>[0]["advice"] = rainy
    ? {
        icon: "umbrella",
        summary: forecast.alert
          ? copy.forecastRainWindow
              .replace("{from}", forecast.alert.from)
              .replace("{to}", forecast.alert.to)
              .replace("{chance}", String(forecast.alert.chance))
          : copy.forecastRainPossible,
        items: [
          {
            icon: "umbrella",
            text: cool
              ? copy.forecastBringRainLayer
              : copy.forecastBringUmbrella,
          },
          { icon: "pin", text: copy.forecastIndoorOption },
        ],
      }
    : {
        icon: sunny ? "sun" : "cloud",
        summary: sunny
          ? copy.forecastSunAdvice
          : cool
            ? copy.forecastCoolAdvice
            : copy.forecastMildAdvice,
        items: [
          {
            icon: sunny ? "sun" : "walk",
            text: sunny
              ? copy.forecastSunProtection
              : copy.forecastOutdoorOption,
          },
          {
            icon: cool ? "cloud" : "clock",
            text: cool ? copy.forecastBringLayer : copy.forecastFlexiblePlan,
          },
        ],
      };
  return (
    <TravelWeatherDetails
      weather={forecast}
      destination={destination}
      context={`${copy.forecastDay} · ${new Intl.DateTimeFormat(locale, { weekday: "long", day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(`${forecast.date}T12:00:00Z`))}`}
      conditionLabel={copy[forecast.condition]}
      secondary={`${forecast.low}°–${forecast.high}°C · UV ${forecast.uv}`}
      advice={advice}
      footnote={copy.forecastPreparationHint}
    />
  );
}
