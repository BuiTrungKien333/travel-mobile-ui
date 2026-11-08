import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAmbientMotion } from "@/hooks/use-ambient-motion";
import type { ForecastHour, WeatherCondition } from "../data/weather-preview";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import { homeStyles } from "./home-primitives";
import { TravelWeatherArt } from "./travel-weather-art";
import { TripGlassBackdrop } from "./trip-glass-backdrop";

export function TravelWeatherDetails({
  weather,
  destination,
  conditionLabel,
  secondary,
  context,
  advice,
  footnote,
  restrained = false,
}: {
  weather: {
    temperature: number;
    condition: WeatherCondition;
    hours: readonly ForecastHour[];
  };
  destination: string;
  conditionLabel: string;
  secondary: string;
  context?: string;
  advice: {
    icon: "umbrella" | "sun" | "cloud";
    summary: string;
    items: readonly { icon: AppIconName; text: string }[];
  };
  footnote: string;
  restrained?: boolean;
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
  return (
    <>
      <View
        style={[
          styles.card,
          {
            padding: spacing.md,
            gap: spacing.xs,
            borderRadius: radius.lg,
            backgroundColor: restrained
              ? colors.surface
              : colors.weatherGlassSurface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: restrained ? colors.border : colors.glassClockBorder,
            boxShadow: restrained
              ? undefined
              : [
                  {
                    ...theme.elevation.glass,
                    color: colors.weatherDepthShadow,
                  },
                  {
                    ...theme.elevation.raisedActionHighlight,
                    color: colors.glassClockBorder,
                  },
                ],
          },
        ]}
      >
        <TripGlassBackdrop
          borderRadius={radius.lg}
          variant={restrained ? "default" : "weather"}
        />
        {context ? (
          <AppText variant="caption" tone="muted">
            {context}
          </AppText>
        ) : null}
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
                  backgroundColor: restrained ? undefined : colors.glassGlow,
                  boxShadow: restrained
                    ? undefined
                    : [
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
              {destination} · {conditionLabel}
            </AppText>
            <AppText variant="caption" tone="muted">
              {secondary}
            </AppText>
          </View>
        </View>
      </View>

      <View style={{ gap: spacing.xs }}>
        <AppText accessibilityRole="header" variant="label">
          {copy.weatherHourly}
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, marginHorizontal: -spacing.xs }}
          contentContainerStyle={{
            flexGrow: 1,
            gap: spacing.sm,
            padding: spacing.xs,
            alignItems: "stretch",
          }}
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
                    minWidth: layout.weatherModalHourMinWidth,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.md,
                    gap: spacing.xs,
                    borderRadius: radius.lg,
                    backgroundColor: restrained
                      ? rainy
                        ? colors.surfaceTint
                        : colors.surfaceVariant
                      : rainy
                        ? colors.weatherRainSurface
                        : colors.weatherGlassSurface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: restrained
                      ? colors.border
                      : colors.glassClockBorder,
                    boxShadow: restrained
                      ? undefined
                      : [
                          {
                            ...theme.elevation.glass,
                            color: colors.glassShadow,
                          },
                        ],
                  },
                ]}
              >
                {!restrained ? (
                  <TripGlassBackdrop
                    borderRadius={radius.lg}
                    variant="weather"
                  />
                ) : null}
                {rainy && !restrained ? (
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
        </ScrollView>
      </View>

      <View
        style={[
          styles.card,
          {
            padding: spacing.md,
            gap: spacing.md,
            borderRadius: radius.lg,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: restrained
              ? colors.softActionBorder
              : colors.glassClockBorder,
            backgroundColor: restrained ? colors.surface : undefined,
            boxShadow: restrained
              ? undefined
              : [
                  { ...theme.elevation.glass, color: colors.glassShadow },
                  {
                    ...theme.elevation.raisedActionHighlight,
                    color: colors.glassClockBorder,
                  },
                ],
          },
        ]}
      >
        <TripGlassBackdrop
          borderRadius={radius.lg}
          variant={restrained ? "default" : "weather"}
        />
        <View
          pointerEvents="none"
          aria-hidden
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: restrained
                ? undefined
                : colors.weatherAmberGlass,
            },
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
                backgroundColor: restrained
                  ? colors.surfaceTint
                  : colors.glassInset,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: restrained
                  ? colors.softActionBorder
                  : colors.glassClockBorder,
                boxShadow: restrained
                  ? undefined
                  : [
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
              name={advice.icon}
              size={layout.iconLarge}
              color={
                restrained ? colors.primaryText : colors.weatherUmbrellaAccent
              }
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
                color={
                  restrained ? colors.primaryText : colors.weatherUmbrellaAccent
                }
              />
            </View>
            <AppText
              variant="body"
              style={{
                color: restrained ? colors.text : colors.weatherRainText,
              }}
            >
              {advice.summary}
            </AppText>
          </View>
        </View>
        <View
          style={[homeStyles.row, { alignItems: "stretch", gap: spacing.sm }]}
        >
          {advice.items.map(({ icon, text }) => (
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
                  backgroundColor: restrained
                    ? colors.surfaceVariant
                    : colors.glassInset,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: restrained
                    ? colors.border
                    : colors.glassClockBorder,
                },
              ]}
            >
              <AppIcon
                name={icon}
                size={layout.iconSmall}
                color={colors.primaryText}
              />
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
        {footnote}
      </AppText>
    </>
  );
}
const styles = StyleSheet.create({
  card: { overflow: "hidden", borderCurve: "continuous" },
  hourColumn: { flexGrow: 1, alignItems: "center" },
  artShadow: { position: "absolute", alignSelf: "center" },
  adviceIcon: { alignItems: "center", justifyContent: "center" },
});
