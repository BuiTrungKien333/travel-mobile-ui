import { View } from "react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { ongoingWeatherSnapshot } from "../data/ongoing-preview";
import { useUpcomingCardMotion } from "../hooks/use-upcoming-card-motion";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import { formatForecastDate } from "../i18n/weather-copy";
import { homeStyles } from "./home-primitives";
import { JourneyCard } from "./ongoing-trip-components";
import { TravelWeatherArt } from "./travel-weather-art";

export function OngoingWeatherDetails({ tripId, today, destination }: { tripId: string; today: string; destination: string }) {
  const theme = useAppTheme();
  const { copy, locale } = useOngoingCopy();
  const progress = useUpcomingCardMotion();
  const weather = ongoingWeatherSnapshot.tripId === tripId && ongoingWeatherSnapshot.date === today ? ongoingWeatherSnapshot : undefined;
  if (!weather) return <AppText tone="muted">{copy.weatherUnavailable}</AppText>;
  return <>
    <AppText variant="caption" tone="muted">{copy.weatherSample}</AppText>
    <JourneyCard>
      <AppText variant="caption" tone="primary">{copy.weatherSnapshot} · {weather.observedAt}</AppText>
      <View style={[homeStyles.row, { gap: theme.spacing.md }]}>
        <TravelWeatherArt condition={weather.condition} progress={progress} />
        <View style={[homeStyles.grow, { gap: theme.spacing.xs }]}>
          <AppText variant="heading">{weather.temperature}°C</AppText>
          <AppText variant="label">{destination}</AppText>
          <AppText variant="caption" tone="muted">{formatForecastDate(weather.date, locale)} · {copy.weatherCloud}</AppText>
          <AppText variant="caption" tone="muted">{copy.weatherFeelsLike} {weather.feelsLike}°C</AppText>
        </View>
      </View>
    </JourneyCard>
    <JourneyCard>
      <AppText variant="label">{copy.weatherNextHours}</AppText>
      <View style={[homeStyles.row, { gap: theme.spacing.md }]}>
        <TravelWeatherArt condition="rain" progress={progress} size={theme.layout.weatherArtworkSize} />
        <View style={[homeStyles.grow, { gap: theme.spacing.xs }]}>
          <AppText variant="label">{weather.rainStartsAt} – {weather.rainEndsAt}</AppText>
          <AppText variant="caption" tone="muted">{copy.weatherRain} · {copy.weatherChance} {weather.rainChance}%</AppText>
        </View>
      </View>
      <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
        <AppIcon name="umbrella" size={theme.layout.iconSmall} />
        <AppText variant="caption" style={homeStyles.grow}>{copy.weatherPacking}</AppText>
      </View>
    </JourneyCard>
  </>;
}
