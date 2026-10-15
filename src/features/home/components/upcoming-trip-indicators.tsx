import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useHomeCopy } from "../i18n/home-copy";
import { homeImages } from "../data/home-mocks";
import type { LocalizedText } from "../types/home-types";
import { homeStyles } from "./home-primitives";
import { TripGlassBackdrop } from "./trip-glass-backdrop";

export function DepartureClock({
  days,
  progress,
}: {
  days: number;
  progress: SharedValue<number>;
}) {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const label =
    days === 0
      ? copy.departureTodayShort
      : days === 1
        ? copy.departureTomorrowShort
        : copy.departureDaysShort.replace("{count}", String(days));
  const minuteStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 360}deg` }],
  }));

  return (
    <View
      accessible
      accessibilityLabel={
        days === 0
          ? copy.departureToday
          : days === 1
            ? copy.departureTomorrow
            : copy.departureCountdown.replace("{count}", String(days))
      }
      style={[
        styles.clockGroup,
        {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          gap: theme.spacing.xs,
          borderRadius: theme.radius.sm,
          boxShadow: [
            { ...theme.elevation.glass, color: theme.colors.glassShadow },
          ],
        },
      ]}
    >
      <TripGlassBackdrop borderRadius={theme.radius.sm} variant="clock" />
      <View
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.dial,
          {
            width: theme.layout.countdownClockSize,
            height: theme.layout.countdownClockSize,
            borderRadius: theme.radius.full,
            borderColor: theme.colors.text,
            backgroundColor: theme.colors.glassClockInset,
          },
        ]}
      >
        <View style={[StyleSheet.absoluteFill, styles.hourRotation]}>
          <View
            style={[
              styles.hand,
              {
                width: theme.spacing.xxs,
                height: theme.spacing.xs,
                backgroundColor: theme.colors.text,
              },
            ]}
          />
        </View>
        <Animated.View style={[StyleSheet.absoluteFill, minuteStyle]}>
          <View
            style={[
              styles.hand,
              {
                width: theme.spacing.xxs,
                height: theme.spacing.sm,
                backgroundColor: theme.colors.text,
              },
            ]}
          />
        </Animated.View>
        <View
          style={{
            width: theme.spacing.xxs,
            height: theme.spacing.xxs,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.text,
          }}
        />
      </View>
      <AppText
        variant="caption"
        style={{
          fontFamily: theme.typography.fontFamily.semibold,
          flexShrink: 1,
        }}
      >
        {label}
      </AppText>
    </View>
  );
}

export function TripWeatherSummary({
  weather,
  progress,
}: {
  weather: {
    low: number;
    high: number;
    summary: LocalizedText;
    packingHint: LocalizedText;
  };
  progress: SharedValue<number>;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useHomeCopy();
  const drift = theme.spacing.xxs;
  const cloudStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.cos(progress.value * Math.PI * 4) * drift },
      { translateY: Math.sin(progress.value * Math.PI * 4) * drift },
      { rotate: `${Math.sin(progress.value * Math.PI * 4) * 2}deg` },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 0.7 + Math.sin(progress.value * Math.PI * 4) * 0.15,
    transform: [{ scaleX: 1 + Math.sin(progress.value * Math.PI * 4) * 0.08 }],
  }));
  const umbrellaStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${Math.sin(progress.value * Math.PI * 2) * 5}deg` }],
  }));

  return (
    <View
      accessible
      accessibilityLabel={`${copy.illustrativeForecast}: ${weather.low}–${weather.high}°C, ${weather.summary[locale]}. ${weather.packingHint[locale]}`}
      style={[
        homeStyles.row,
        {
          gap: theme.spacing.md,
          padding: theme.spacing.sm,
          flexWrap: "wrap",
          rowGap: theme.spacing.sm,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: theme.radius.md,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceTint,
          overflow: "hidden",
        },
      ]}
    >
      <View
        style={[
          styles.glow,
          {
            width: theme.layout.weatherGlassTileSize,
            height: theme.layout.weatherGlassTileSize,
            top: -theme.spacing.lg,
            left: -theme.spacing.lg,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.glassGlow,
          },
        ]}
      />
      <TripGlassBackdrop borderRadius={theme.radius.md} />
      <View
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.weatherTile,
          {
            width: theme.layout.weatherGlassTileSize,
            height: theme.layout.weatherGlassTileSize,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.floorShadow,
            {
              width: theme.spacing.xxxl,
              height: theme.spacing.xs,
              bottom: theme.spacing.xxs,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.weatherDepthShadow,
            },
            shadowStyle,
          ]}
        />
        <Animated.View style={[styles.cloud, cloudStyle]}>
          <Image
            accessible={false}
            source={homeImages.rainCloud}
            contentFit="contain"
            cachePolicy="memory"
            style={{
              width: theme.layout.weatherCloudImageWidth,
              height: theme.layout.weatherCloudImageHeight,
            }}
          />
        </Animated.View>
        <View
          style={[
            styles.rain,
            { gap: theme.spacing.xs, bottom: theme.spacing.lg },
          ]}
        >
          {[0, 1 / 3, 2 / 3].map((offset) => (
            <RainDrop key={offset} offset={offset} progress={progress} />
          ))}
        </View>
      </View>
      <View
        style={[
          homeStyles.grow,
          {
            gap: theme.spacing.xxs,
            minWidth: theme.layout.weatherSummaryMinWidth,
          },
        ]}
      >
        <AppText variant="label" tone="primary">
          {weather.low}–{weather.high}°C
        </AppText>
        <AppText variant="caption" tone="muted">
          {weather.summary[locale]}
        </AppText>
      </View>
      <View
        style={[
          styles.packing,
          {
            gap: theme.spacing.sm,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.sm,
            borderRadius: theme.radius.sm,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.glassBorder,
            backgroundColor: theme.colors.packingSurface,
          },
        ]}
      >
        <Animated.View style={umbrellaStyle}>
          <AppIcon
            name="umbrella"
            size={theme.layout.iconSmall}
            color={theme.colors.primaryText}
          />
        </Animated.View>
        <AppText variant="caption" tone="muted" style={homeStyles.grow}>
          {copy.packingPrompt}{" "}
          <AppText
            variant="caption"
            tone="primary"
            style={{ fontFamily: theme.typography.fontFamily.medium }}
          >
            {weather.packingHint[locale]}
          </AppText>
        </AppText>
      </View>
    </View>
  );
}

function RainDrop({
  progress,
  offset,
}: {
  progress: SharedValue<number>;
  offset: number;
}) {
  const theme = useAppTheme();
  const distance = theme.spacing.md;
  const animatedStyle = useAnimatedStyle(() => {
    const phase = (progress.value * 6 + offset) % 1;
    return {
      opacity: 0.25 + (1 - phase) * 0.75,
      transform: [
        { translateY: phase * distance },
        { rotate: "20deg" },
        { scale: 0.85 + phase * 0.15 },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        {
          width: theme.spacing.xxs,
          height: theme.spacing.sm,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.primaryText,
          borderRightWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.glassBorder,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  clockGroup: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  weatherTile: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  glow: { position: "absolute" },
  floorShadow: { position: "absolute", alignSelf: "center" },
  dial: {
    flexShrink: 0,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  hand: { position: "absolute", left: "50%", bottom: "50%" },
  hourRotation: { transform: [{ rotate: "-50deg" }] },
  cloud: { position: "absolute", top: 0, alignSelf: "center" },
  rain: { position: "absolute", alignSelf: "center", flexDirection: "row" },
  packing: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
});
