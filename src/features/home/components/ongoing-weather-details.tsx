import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAmbientMotion } from "@/hooks/use-ambient-motion";
import { ongoingWeatherSnapshot } from "../data/ongoing-preview";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import { formatForecastDate } from "../i18n/weather-copy";
import { homeStyles } from "./home-primitives";
import { TravelWeatherArt } from "./travel-weather-art";
import { TripGlassBackdrop } from "./trip-glass-backdrop";

export function OngoingWeatherDetails({
  tripId,
  today,
  destination,
}: {
  tripId: string;
  today: string;
  destination: string;
}) {
  const theme = useAppTheme();
  const { colors, spacing, radius, typography, layout } = theme;
  const { copy, locale } = useOngoingCopy();
  const progress = useAmbientMotion();
  const tilt = theme.motion.firstTripIconTilt;
  const umbrellaMotion = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${Math.sin(progress.value * Math.PI * 2) * tilt}deg` },
    ],
  }));
  const weather =
    ongoingWeatherSnapshot.tripId === tripId &&
    ongoingWeatherSnapshot.date === today
      ? ongoingWeatherSnapshot
      : undefined;
  if (!weather)
    return <AppText tone="muted">{copy.weatherUnavailable}</AppText>;

  const rainWindow = copy.weatherRainWindow
    .replace("{chance}", String(weather.rainChance))
    .replace("{from}", weather.rainStartsAt)
    .replace("{to}", weather.rainEndsAt);
  const advice = copy.weatherCompanionAdvice.replace(
    "{place}",
    weather.indoorAlternative[locale],
  );

  return (
    <>
      <View
        style={[
          styles.card,
          {
            padding: spacing.lg,
            gap: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.glassInset,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.glassClockBorder,
            boxShadow: [
              { ...theme.elevation.glass, color: colors.weatherDepthShadow },
              {
                ...theme.elevation.raisedActionHighlight,
                color: colors.glassClockBorder,
              },
            ],
          },
        ]}
      >
        <TripGlassBackdrop borderRadius={radius.md} variant="clock" />
        <View style={[homeStyles.row, { gap: spacing.sm, flexWrap: "wrap" }]}>
          <AppText variant="caption" tone="muted" style={homeStyles.grow}>
            {copy.weatherSnapshot} · {weather.observedAt}
          </AppText>
          <AppText variant="caption" tone="muted">
            {formatForecastDate(weather.date, locale)}
          </AppText>
        </View>
        <View style={[homeStyles.row, { gap: spacing.md }]}>
          <View
            style={{
              width: layout.weatherModalArtworkSize,
              height: layout.weatherModalArtworkSize,
            }}
          >
            <View
              aria-hidden
              style={[
                styles.artShadow,
                {
                  bottom: spacing.md,
                  width: layout.weatherHeroArtworkSize,
                  height: spacing.lg,
                  borderRadius: radius.full,
                  backgroundColor: colors.glassGlow,
                  boxShadow: [
                    {
                      ...theme.elevation.glass,
                      color: colors.weatherDepthShadow,
                    },
                  ],
                },
              ]}
            />
            <TravelWeatherArt
              condition={weather.condition}
              progress={progress}
              size={layout.weatherModalArtworkSize}
            />
          </View>
          <View style={[homeStyles.grow, { gap: spacing.xs }]}>
            <AppText
              variant="heading"
              accessibilityLabel={`${weather.temperature}°C`}
              style={{
                fontFamily: typography.fontFamily.medium,
                fontSize: typography.fontSize.weatherDisplay,
                lineHeight: typography.lineHeight.weatherDisplay,
              }}
            >
              {weather.temperature}°
            </AppText>
            <AppText variant="label" tone="primary">
              {destination} · {copy.weatherCloud}
            </AppText>
            <AppText variant="caption" tone="muted">
              {copy.weatherFeelsLike} {weather.feelsLike}°C
            </AppText>
          </View>
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <AppText accessibilityRole="header" variant="label">
          {copy.weatherHourly}
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xs }}
        >
          {weather.hours.map((hour) => {
            const rainy = hour.condition === "rain";
            return (
              <View
                key={hour.time}
                accessible
                accessibilityLabel={`${hour.time}, ${hour.temperature}°C, ${copy.weatherChance} ${hour.rainChance}%`}
                style={[
                  homeStyles.row,
                  styles.card,
                  {
                    flexShrink: 0,
                    minHeight: layout.touchTarget,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    gap: spacing.sm,
                    borderRadius: radius.full,
                    backgroundColor: rainy
                      ? colors.weatherAmberGlass
                      : colors.glassInset,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: rainy
                      ? colors.weatherAmberBorder
                      : colors.glassClockBorder,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  style={{ fontFamily: typography.fontFamily.semibold }}
                >
                  {hour.time}
                </AppText>
                <TravelWeatherArt
                  condition={hour.condition}
                  progress={progress}
                  size={spacing.xl}
                />
                <AppText variant="label">{hour.temperature}°</AppText>
                <AppText
                  variant="caption"
                  style={{
                    color: rainy
                      ? colors.onWarningSurface
                      : colors.textSecondary,
                  }}
                >
                  {copy.weatherRainShort} {hour.rainChance}%
                </AppText>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View
        style={[
          styles.card,
          {
            padding: spacing.lg,
            gap: spacing.md,
            borderRadius: radius.md,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.weatherAmberBorder,
            boxShadow: [
              { ...theme.elevation.glass, color: colors.glassShadow },
            ],
          },
        ]}
      >
        <TripGlassBackdrop borderRadius={radius.md} variant="clock" />
        <View
          pointerEvents="none"
          aria-hidden
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.weatherAmberGlass },
          ]}
        />
        <View style={[homeStyles.row, { gap: spacing.md }]}>
          <Animated.View
            aria-hidden
            style={[
              styles.umbrella,
              {
                width: layout.touchTarget,
                height: layout.touchTarget,
                borderRadius: radius.lg,
                backgroundColor: colors.weatherAmberGlass,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.weatherAmberBorder,
                boxShadow: [
                  {
                    ...theme.elevation.glass,
                    color: colors.weatherAmberBorder,
                  },
                ],
              },
              umbrellaMotion,
            ]}
          >
            <AppIcon
              name="umbrella"
              size={layout.iconLarge}
              color={colors.weatherUmbrellaAccent}
            />
          </Animated.View>
          <View style={[homeStyles.grow, { gap: spacing.xs }]}>
            <AppText variant="label" style={{ color: colors.onWarningSurface }}>
              {copy.weatherCompanion}
            </AppText>
            <AppText
              variant="caption"
              style={{
                color: colors.onWarningSurface,
                fontFamily: typography.fontFamily.medium,
              }}
            >
              {rainWindow}
            </AppText>
          </View>
        </View>
        <AppText>{advice}</AppText>
      </View>
      <AppText variant="caption" tone="muted">
        {copy.weatherSample}
      </AppText>
    </>
  );
}
const styles = StyleSheet.create({
  card: { overflow: "hidden", borderCurve: "continuous" },
  artShadow: { position: "absolute", alignSelf: "center" },
  umbrella: { alignItems: "center", justifyContent: "center" },
});
