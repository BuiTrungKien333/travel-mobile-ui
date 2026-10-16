import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { ongoingWeatherSnapshot } from "../data/ongoing-preview";
import { useUpcomingCardMotion } from "../hooks/use-upcoming-card-motion";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import type { Trip } from "../types/home-types";
import { tripDuration } from "../utils/select-home";
import { homeStyles, TextAction } from "./home-primitives";
import { TravelWeatherArt } from "./travel-weather-art";
import { TripGlassBackdrop } from "./trip-glass-backdrop";

export function OngoingTripHeader({ trip, dayIndex, dateLabel, today, onDetails, onWeather }: {
  trip: Trip; dayIndex: number; dateLabel: string; today: string;
  onDetails: () => void; onWeather: () => void;
}) {
  const theme = useAppTheme();
  const { copy } = useOngoingCopy();
  const progress = useUpcomingCardMotion();
  const minimumOpacity = theme.motion.liveBadgeMinimumOpacity;
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: minimumOpacity + (1 - minimumOpacity) * (1 + Math.cos(progress.value * Math.PI * 4)) / 2,
  }));
  const weather = ongoingWeatherSnapshot.tripId === trip.id && ongoingWeatherSnapshot.date === today ? ongoingWeatherSnapshot : undefined;
  return <View style={[homeStyles.row, { gap: theme.spacing.md, alignItems: "flex-start" }]}>
    <View style={[homeStyles.grow, { gap: theme.spacing.xs }]}>
      <View style={[homeStyles.row, { gap: theme.spacing.sm, flexWrap: "wrap" }]}>
        <AppText accessibilityRole="header" variant="heading" style={{ fontSize: theme.typography.fontSize.xl, lineHeight: theme.typography.lineHeight.xl }}>{trip.destination}</AppText>
        <View style={[homeStyles.row, { gap: theme.spacing.xs, paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm, backgroundColor: theme.colors.successSurface, borderRadius: theme.radius.full }]}>
          <Animated.View aria-hidden style={[{ width: theme.spacing.xs, height: theme.spacing.xs, borderRadius: theme.radius.full, backgroundColor: theme.colors.success }, pulseStyle]} />
          <AppText variant="caption" style={{ color: theme.colors.onSuccessSurface, fontFamily: theme.typography.fontFamily.semibold }}>{copy.liveBadge}</AppText>
        </View>
      </View>
      <AppText variant="caption" tone="muted">{copy.day} {dayIndex + 1}/{tripDuration(trip)} · {dateLabel}</AppText>
      <TextAction compact label={copy.detailsShort} onPress={onDetails} />
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={`${copy.weatherNow}${weather ? `, ${weather.temperature}°C, ${copy.weatherCloud}` : ""}`} accessibilityHint={copy.weatherSampleHint} onPress={onWeather}
      style={({ pressed }) => [styles.weather, { minWidth: theme.layout.firstTripIconFrameSize, minHeight: theme.layout.touchTarget, padding: theme.spacing.xs, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surfaceTint, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.glassBorder, opacity: pressed ? theme.motion.pressOpacity : 1 }]}>
      <TripGlassBackdrop borderRadius={theme.radius.lg} />
      <TravelWeatherArt condition={weather?.condition ?? "cloud"} progress={progress} size={theme.layout.weatherArtworkSize} />
      {weather ? <AppText variant="caption" tone="primary" style={{ fontFamily: theme.typography.fontFamily.semibold }}>{weather.temperature}°</AppText> : <AppIcon name="chevron" size={theme.layout.iconSmall} />}
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({ weather: { overflow: "hidden", alignItems: "center", justifyContent: "center", flexShrink: 0 } });
