import { useIsFocused } from "expo-router/react-navigation";
import { useEffect, useState } from "react";
import { AppState, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { sampleWeatherTemperature } from "../data/home-mocks";
import { useHomeCopy } from "../i18n/home-copy";

/** Decorative sample weather; no live forecast request. */
export function SampleWeather() {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const focused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const [appActive, setAppActive] = useState(
    AppState.currentState === "active",
  );
  const progress = useSharedValue(0);
  const duration = theme.motion.weatherDriftDuration;
  const drift = theme.spacing.xs;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setAppActive(state === "active");
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!focused || !appActive || reduceMotion) return;
    progress.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.sin),
        reduceMotion: ReduceMotion.System,
      }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(progress);
      progress.value = 0;
    };
  }, [focused, appActive, reduceMotion, duration, progress]);

  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 20}deg` }],
  }));
  const cloudStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -progress.value * drift }],
  }));

  return (
    <View
      accessible
      accessibilityLabel={`${copy.sampleWeatherLabel}: ${copy.sampleWeather}, ${sampleWeatherTemperature}°C`}
      style={[styles.weather, { gap: theme.spacing.xs }]}
    >
      <View
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: theme.layout.weatherArtworkSize,
          height: theme.layout.weatherArtworkSize,
        }}
      >
        <Animated.View style={[styles.sun, sunStyle]}>
          <AppIcon
            name="sun"
            size={theme.layout.iconLarge}
            color={theme.colors.weatherSun}
          />
        </Animated.View>
        <Animated.View style={[styles.cloud, cloudStyle]}>
          <AppIcon
            name="cloud"
            size={theme.layout.iconLarge}
            color={theme.colors.weatherCloud}
          />
        </Animated.View>
      </View>
      <AppText variant="caption" tone="muted" style={styles.centeredText}>
        {sampleWeatherTemperature}° · {copy.sampleWeather}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  weather: { alignItems: "center", flexShrink: 1 },
  sun: { position: "absolute", top: 0, left: 0 },
  cloud: { position: "absolute", bottom: 0, right: 0 },
  centeredText: { textAlign: "center" },
});
