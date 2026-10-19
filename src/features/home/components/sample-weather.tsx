import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useHomeAmbientMotion } from "../hooks/use-home-ambient-motion";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { sampleWeatherTemperature } from "../data/home-mocks";
import { useHomeCopy } from "../i18n/home-copy";

/** Decorative sample weather; no live forecast request. */
export function SampleWeather() {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const progress = useHomeAmbientMotion(true, {
    duration: theme.motion.weatherDriftDuration,
    reverse: true,
  });
  const drift = theme.spacing.xs;

  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.get() * 20}deg` }],
  }));
  const cloudStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -progress.get() * drift }],
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
