import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { StyleSheet, View } from "react-native";

import { useAppTheme } from "@/hooks/use-app-theme";

/** Static material behind independently animated foreground content. */
export function GlassBackdrop({
  borderRadius,
  variant = "default",
}: {
  borderRadius: number;
  variant?: "default" | "clock" | "navigation" | "weather" | "photo";
}) {
  const theme = useAppTheme();
  const nativeGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const navigation = variant === "navigation";
  const clock = variant === "clock";
  const weather = variant === "weather";
  const photo = variant === "photo";
  const tint = photo
    ? theme.colors.photoGlassTint
    : navigation
      ? theme.colors.navigationTint
      : weather
        ? theme.colors.weatherGlassTint
        : clock
          ? theme.colors.glassClockTint
          : theme.colors.glassTint;
  const fallback = photo
    ? theme.colors.photoGlassFallback
    : navigation
      ? theme.colors.navigationFallback
      : weather
        ? theme.colors.weatherGlassFallback
        : clock
          ? theme.colors.glassClockFallback
          : theme.colors.glassFallback;
  const style = [
    StyleSheet.absoluteFill,
    {
      borderRadius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: photo
        ? theme.colors.photoGlassBorder
        : navigation
          ? theme.colors.navigationBorder
          : clock || weather
            ? theme.colors.glassClockBorder
            : theme.colors.glassBorder,
    },
  ];

  return nativeGlass ? (
    <GlassView
      accessible={false}
      pointerEvents="none"
      glassEffectStyle={clock || navigation || weather ? "clear" : "regular"}
      colorScheme={theme.dark ? "dark" : "light"}
      tintColor={tint}
      style={style}
    />
  ) : (
    <View
      accessible={false}
      pointerEvents="none"
      style={[style, { backgroundColor: fallback }]}
    />
  );
}
