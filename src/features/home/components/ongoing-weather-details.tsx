import { AppText } from "@/components/ui/app-text";
import { ongoingWeatherSnapshot } from "../data/ongoing-preview";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import { TravelWeatherDetails } from "./travel-weather-details";

export function OngoingWeatherDetails({
  tripId,
  today,
  destination,
  preview = true,
}: {
  tripId: string;
  today: string;
  destination: string;
  preview?: boolean;
}) {
  const { copy } = useOngoingCopy();
  const weather =
    preview &&
    ongoingWeatherSnapshot.tripId === tripId &&
    ongoingWeatherSnapshot.date === today
      ? ongoingWeatherSnapshot
      : undefined;
  if (!weather)
    return <AppText tone="muted">{copy.weatherUnavailable}</AppText>;

  return (
    <TravelWeatherDetails
      weather={weather}
      destination={destination}
      conditionLabel={copy.weatherCloud}
      secondary={`${copy.weatherFeelsLike} ${weather.feelsLike}°C`}
      advice={{
        icon: "umbrella",
        summary: copy.weatherRainCompact
          .replace("{chance}", String(weather.rainChance))
          .replace("{from}", weather.rainStartsAt)
          .replace("{to}", weather.rainEndsAt),
        items: [
          { icon: "umbrella", text: copy.weatherBringEssentials },
          { icon: "pin", text: copy.weatherExploreIndoors },
        ],
      }}
      footnote={copy.weatherSampleCompact.replace("{time}", weather.observedAt)}
    />
  );
}
