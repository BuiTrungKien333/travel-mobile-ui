import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAmbientMotion } from "@/hooks/use-ambient-motion";
import { ongoingWeatherSnapshot } from "../data/ongoing-preview";
import { useOngoingCopy } from "../i18n/ongoing-copy";
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
  const { copy } = useOngoingCopy();
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

  const rainWindow = copy.weatherRainCompact
    .replace("{chance}", String(weather.rainChance))
    .replace("{from}", weather.rainStartsAt)
    .replace("{to}", weather.rainEndsAt);

  return (
    <>
      <View
        style={[
          styles.card,
          {
            padding: spacing.md,
            gap: spacing.xs,
            borderRadius: radius.lg,
            backgroundColor: colors.weatherGlassSurface,
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
        <TripGlassBackdrop borderRadius={radius.lg} variant="weather" />
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
                fontSize: typography.fontSize.display,
                lineHeight: typography.lineHeight.display,
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

      <View style={{ gap: spacing.xs }}>
        <AppText accessibilityRole="header" variant="label">
          {copy.weatherHourly}
        </AppText>
        <View
          style={[homeStyles.row, { alignItems: "stretch", gap: spacing.sm }]}
        >
          {weather.hours.map((hour) => {
            const rainy = hour.condition === "rain";
            return (
              <View
                key={hour.time}
                accessible
                accessibilityLabel={`${hour.time}, ${hour.temperature}°C, ${copy.weatherChance} ${hour.rainChance}%`}
                style={[
                  styles.card,
                  styles.hourColumn,
                  {
                    paddingHorizontal: spacing.xs,
                    paddingVertical: spacing.sm,
                    gap: spacing.xs,
                    borderRadius: radius.lg,
                    backgroundColor: rainy
                      ? colors.weatherRainSurface
                      : colors.weatherGlassSurface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.glassClockBorder,
                    boxShadow: [
                      { ...theme.elevation.glass, color: colors.glassShadow },
                    ],
                  },
                ]}
              >
                <TripGlassBackdrop borderRadius={radius.lg} variant="weather" />
                {rainy ? (
                  <View
                    aria-hidden
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      { backgroundColor: colors.weatherRainSurface },
                    ]}
                  />
                ) : null}
                <AppText
                  variant="caption"
                  style={{ fontFamily: typography.fontFamily.semibold }}
                >
                  {hour.time}
                </AppText>
                <TravelWeatherArt
                  condition={hour.condition}
                  progress={progress}
                  size={layout.iconLarge}
                />
                <AppText
                  variant="label"
                  style={{
                    fontSize: typography.fontSize.lg,
                    lineHeight: typography.lineHeight.lg,
                  }}
                >
                  {hour.temperature}°
                </AppText>
                <AppText
                  variant="caption"
                  style={{
                    color: colors.weatherRainText,
                    fontFamily: typography.fontFamily.medium,
                  }}
                >
                  {hour.rainChance}%
                </AppText>
              </View>
            );
          })}
        </View>
      </View>

      <View
        style={[
          styles.card,
          {
            padding: spacing.md,
            gap: spacing.md,
            borderRadius: radius.lg,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.glassClockBorder,
            boxShadow: [
              { ...theme.elevation.glass, color: colors.glassShadow },
              {
                ...theme.elevation.raisedActionHighlight,
                color: colors.glassClockBorder,
              },
            ],
          },
        ]}
      >
        <TripGlassBackdrop borderRadius={radius.lg} variant="weather" />
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
              styles.adviceIcon,
              {
                width: layout.weatherArtworkSize,
                height: layout.weatherArtworkSize,
                borderRadius: radius.md,
                backgroundColor: colors.glassInset,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.glassClockBorder,
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
            <View style={[homeStyles.row, { gap: spacing.xs }]}>
              <AppText
                accessibilityRole="header"
                variant="caption"
                tone="primary"
                style={{ fontFamily: typography.fontFamily.semibold }}
              >
                {copy.weatherCompanion}
              </AppText>
              <AppIcon
                name="sparkles"
                size={spacing.md}
                color={colors.weatherUmbrellaAccent}
              />
            </View>
            <AppText variant="label" style={{ color: colors.weatherRainText }}>
              {rainWindow}
            </AppText>
          </View>
        </View>
        <View
          style={[homeStyles.row, { alignItems: "stretch", gap: spacing.sm }]}
        >
          {(
            [
              {
                icon: "umbrella",
                text: copy.weatherBringEssentials,
                tint: colors.weatherUmbrellaAccent,
              },
              {
                icon: "pin",
                text: copy.weatherExploreIndoors,
                tint: colors.primaryText,
              },
            ] as const
          ).map(({ icon, text, tint }) => (
            <View
              key={icon}
              style={[
                homeStyles.row,
                homeStyles.grow,
                {
                  flexBasis: 0,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.sm,
                  gap: spacing.xs,
                  borderRadius: radius.md,
                  backgroundColor: colors.glassInset,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.glassClockBorder,
                },
              ]}
            >
              <AppIcon name={icon} size={layout.iconSmall} color={tint} />
              <AppText
                variant="caption"
                style={{ fontFamily: typography.fontFamily.medium }}
              >
                {text}
              </AppText>
            </View>
          ))}
        </View>
      </View>
      <AppText variant="caption" tone="muted">
        {copy.weatherSampleCompact.replace("{time}", weather.observedAt)}
      </AppText>
    </>
  );
}
const styles = StyleSheet.create({
  card: { overflow: "hidden", borderCurve: "continuous" },
  hourColumn: { flex: 1, minWidth: 0, alignItems: "center" },
  artShadow: { position: "absolute", alignSelf: "center" },
  adviceIcon: { alignItems: "center", justifyContent: "center" },
});
