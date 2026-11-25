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
  variant?:
    | "default"
    | "clock"
    | "navigation"
    | "weather"
    | "photo"
    | "camera"
    | "camera-overlay"
    | "camera-navigation";
}) {
  const theme = useAppTheme();
  const nativeGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const navigation = variant === "navigation";
  const clock = variant === "clock";
  const weather = variant === "weather";
  const photo = variant === "photo";
  const cameraNavigation = variant === "camera-navigation";
  const cameraOverlay = variant === "camera-overlay";
  const camera = variant === "camera" || cameraNavigation || cameraOverlay;
  const tint = camera
    ? cameraNavigation
      ? theme.colors.cameraNavigationSurface
      : cameraOverlay
        ? theme.colors.cameraOverlaySurface
        : theme.colors.cameraControlSurface
    : photo
      ? theme.colors.photoGlassTint
      : navigation
        ? theme.colors.navigationTint
        : weather
          ? theme.colors.weatherGlassTint
          : clock
            ? theme.colors.glassClockTint
            : theme.colors.glassTint;

  const fallback = camera
    ? cameraNavigation
      ? theme.colors.cameraNavigationSurface
      : cameraOverlay
        ? theme.colors.cameraOverlaySurface
        : theme.colors.cameraControlSurface
    : photo
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
      borderColor: camera
        ? theme.colors.cameraGlassBorder
        : photo
          ? theme.colors.photoGlassBorder
          : navigation
            ? theme.colors.navigationBorder
            : clock || weather
              ? theme.colors.glassClockBorder
              : theme.colors.glassBorder,
    },
  ];

  if (variant === "camera") {
    return (
      <View
        accessible={false}
        pointerEvents="none"
        style={[style, { overflow: "hidden", backgroundColor: fallback }]}
      >
        {nativeGlass ? (
          <GlassView
            accessible={false}
            pointerEvents="none"
            glassEffectStyle="clear"
            colorScheme="dark"
            tintColor={tint}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {/* Keep the dark material consistent even when native glass adds highlights. */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: fallback, borderRadius },
          ]}
        />
        <View
          style={{
            position: "absolute",
            top: 0,
            left: theme.spacing.md,
            right: theme.spacing.md,
            height: StyleSheet.hairlineWidth,
            backgroundColor: theme.colors.cameraGlassBorder,
          }}
        />
      </View>
    );
  }

  return nativeGlass ? (
    <GlassView
      accessible={false}
      pointerEvents="none"
      glassEffectStyle={
        clock || navigation || weather || camera ? "clear" : "regular"
      }
      colorScheme={camera || theme.dark ? "dark" : "light"}
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
