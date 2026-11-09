import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { ongoingWeatherSnapshot } from "../data/ongoing-preview";
import { useHomeAmbientMotion } from "../hooks/use-home-ambient-motion";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import type { Trip } from "../types/home-types";
import { tripDuration } from "../utils/select-home";
import { homeStyles } from "./home-primitives";
import { TravelWeatherArt } from "./travel-weather-art";
import { TripGlassBackdrop } from "./trip-glass-backdrop";

export function OngoingTripHeader({
  trip,
  dayIndex,
  dateLabel,
  today,
  onDetails,
  onWeather,
  preview = true,
  liveWeather,
}: {
  trip: Trip;
  dayIndex: number;
  dateLabel: string;
  today: string;
  onDetails: () => void;
  onWeather: () => void;
  preview?: boolean;
  liveWeather?: {
    temperature: number;
    condition: "sun" | "cloud" | "rain";
    label: string;
  };
}) {
  const theme = useAppTheme();
  const { copy } = useOngoingCopy();
  const progress = useHomeAmbientMotion();
  const minimumOpacity = theme.motion.liveBadgeMinimumOpacity;
  const pulseStyle = useAnimatedStyle(() => ({
    opacity:
      minimumOpacity +
      ((1 - minimumOpacity) * (1 + Math.cos(progress.value * Math.PI * 4))) / 2,
  }));
  const weather =
    liveWeather ??
    (preview &&
    ongoingWeatherSnapshot.tripId === trip.id &&
    ongoingWeatherSnapshot.date === today
      ? ongoingWeatherSnapshot
      : undefined);
  const weatherLabel = liveWeather?.label ?? copy.weatherCloudShort;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <View
        style={[
          homeStyles.row,
          styles.badge,
          {
            gap: theme.spacing.xs,
            paddingVertical: theme.spacing.xxs,
            paddingHorizontal: theme.spacing.sm,
            borderRadius: theme.radius.full,
            borderWidth: 1,
            borderColor: theme.colors.success,
          },
        ]}
      >
        <TripGlassBackdrop borderRadius={theme.radius.full} variant="clock" />
        <Animated.View
          aria-hidden
          style={[
            {
              width: theme.spacing.xs + theme.spacing.xxs,
              height: theme.spacing.xs + theme.spacing.xxs,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.success,
            },
            pulseStyle,
          ]}
        />
        <AppText
          variant="caption"
          style={{
            color: theme.colors.onSuccessSurface,
            flexShrink: 1,
            fontSize: theme.typography.fontSize.xs,
            lineHeight: theme.typography.lineHeight.xs,
            fontFamily: theme.typography.fontFamily.semibold,
          }}
        >
          {copy.liveBadge}
        </AppText>
      </View>
      <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
        <AppText
          accessibilityRole="header"
          variant="title"
          style={[
            homeStyles.grow,
            {
              fontSize: theme.typography.fontSize.xl,
              lineHeight: theme.typography.lineHeight.xl,
            },
          ]}
        >
          {trip.destination}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${copy.weatherNow}${weather ? `, ${weather.temperature}°C, ${weatherLabel}` : ""}`}
          accessibilityHint={
            preview
              ? copy.weatherSampleHint
              : weather
                ? copy.weatherNow
                : copy.weatherUnavailable
          }
          onPress={onWeather}
          style={({ pressed }) => [
            homeStyles.row,
            styles.weather,
            {
              minHeight: theme.layout.compactTouchTarget,
              gap: theme.spacing.xs,
              paddingVertical: theme.spacing.xxs,
              paddingHorizontal: theme.spacing.sm,
              borderRadius: theme.radius.full,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.glassClockBorder,
              boxShadow: [
                { ...theme.elevation.glass, color: theme.colors.glassShadow },
              ],
              transform: [
                { scale: pressed ? theme.motion.shutterPressScale : 1 },
              ],
            },
          ]}
        >
          <TripGlassBackdrop borderRadius={theme.radius.full} variant="clock" />
          <TravelWeatherArt
            condition={weather?.condition ?? "cloud"}
            progress={progress}
            size={theme.layout.ongoingHeaderWeatherArtworkSize}
          />
          <AppText
            variant="caption"
            tone="primary"
            style={{ fontFamily: theme.typography.fontFamily.semibold }}
          >
            {weather ? `${weather.temperature}°C` : "—"}
          </AppText>
          <AppText variant="caption" tone="muted" style={{ flexShrink: 1 }}>
            {weather ? weatherLabel : copy.weather}
          </AppText>
          <AppIcon name="chevron" size={theme.spacing.md} />
        </Pressable>
      </View>
      <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
        <AppText variant="caption" tone="muted" style={homeStyles.grow}>
          {copy.day} {dayIndex + 1}/{tripDuration(trip)} · {dateLabel}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.details}
          onPress={onDetails}
          style={({ pressed }) => [
            homeStyles.row,
            styles.details,
            {
              minHeight: theme.layout.compactTouchTarget,
              minWidth: theme.layout.compactTouchTarget,
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.xs,
              gap: theme.spacing.xs,
              opacity: pressed ? theme.motion.pressOpacity : 1,
            },
          ]}
        >
          <AppText
            variant="caption"
            tone="primary"
            style={{
              fontFamily: theme.typography.fontFamily.semibold,
              fontSize: theme.typography.fontSize.md,
              lineHeight: theme.typography.lineHeight.md,
            }}
          >
            {copy.detailsShort}
          </AppText>
          <View style={styles.externalArrow}>
            <AppIcon name="arrow" size={theme.layout.iconMedium} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", maxWidth: "100%", overflow: "hidden" },
  weather: { overflow: "hidden", flexShrink: 1 },
  details: { flexShrink: 0 },
  externalArrow: { transform: [{ rotate: "-45deg" }] },
});
