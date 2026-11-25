import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { useAppTheme } from "@/hooks/use-app-theme";
import { homeImages } from "../data/home-mocks";
import type { WeatherCondition } from "../data/weather-preview";

export function TravelWeatherArt({
  condition,
  progress,
  size,
}: {
  condition: WeatherCondition;
  progress: SharedValue<number>;
  size?: number;
}) {
  const theme = useAppTheme();
  const artworkSize = size ?? theme.layout.weatherHeroArtworkSize;
  const ratio = artworkSize / theme.layout.weatherHeroArtworkSize;
  const drift = theme.spacing.xxs;
  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: Math.sin(progress.value * Math.PI * 4) * drift },
      { rotate: `${Math.sin(progress.value * Math.PI * 4) * 2}deg` },
    ],
  }));

  const rainStyle = useAnimatedStyle(() => {
    const phase = (progress.value * 8) % 1;

    return {
      opacity: 1 - phase,
      transform: [{ translateY: phase * drift * 2 }],
    };
  });

  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: artworkSize,
        height: artworkSize,
      }}
    >
      <Animated.View style={[styles.art, floatStyle]}>
        <Image
          source={
            condition === "sun" ? homeImages.glassSun : homeImages.rainCloud
          }
          accessible={false}
          contentFit="contain"
          cachePolicy="memory"
          style={{
            width: theme.layout.weatherGlassTileSize * ratio,
            height: theme.layout.weatherGlassTileSize * ratio,
          }}
        />
      </Animated.View>
      {condition === "rain" ? (
        <Animated.View
          style={[
            styles.drops,
            { gap: theme.spacing.xs * ratio, bottom: theme.spacing.md * ratio },
            rainStyle,
          ]}
        >
          {["left", "middle", "right"].map((id) => (
            <View
              key={id}
              style={{
                width: theme.spacing.xxs * ratio,
                height: theme.spacing.sm * ratio,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.primaryText,
                transform: [{ rotate: "20deg" }],
              }}
            />
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  art: { alignItems: "center", justifyContent: "center", flex: 1 },
  drops: { position: "absolute", alignSelf: "center", flexDirection: "row" },
});
