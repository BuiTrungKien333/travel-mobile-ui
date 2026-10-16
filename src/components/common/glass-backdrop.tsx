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
  variant?: "default" | "clock" | "navigation";
}) {
  const theme = useAppTheme();
  const nativeGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const navigation = variant === "navigation";
  const clock = variant === "clock";
  const tint = navigation
    ? theme.colors.navigationTint
    : clock
      ? theme.colors.glassClockTint
      : theme.colors.glassTint;
  const fallback = navigation
    ? theme.colors.navigationFallback
    : clock
      ? theme.colors.glassClockFallback
      : theme.colors.glassFallback;
  const style = [
    StyleSheet.absoluteFill,
    {
      borderRadius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: navigation
        ? theme.colors.navigationBorder
        : clock
          ? theme.colors.glassClockBorder
          : theme.colors.glassBorder,
    },
  ];

  return nativeGlass ? (
    <GlassView
      accessible={false}
      pointerEvents="none"
      glassEffectStyle={clock || navigation ? "clear" : "regular"}
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
