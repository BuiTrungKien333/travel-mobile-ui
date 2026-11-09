import type { ReactNode } from "react";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { useAppTheme } from "@/hooks/use-app-theme";
import { navigationBarShape } from "./navigation-bar-shape";

// SVG 1.1 decoders may not accept rgba() paint; keep alpha in an SVG attribute.
function svgPaint(value: string) {
  const match =
    /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/.exec(value);
  return match
    ? {
        color: `rgb(${match[1]},${match[2]},${match[3]})`,
        opacity: Number(match[4]),
      }
    : { color: value, opacity: 1 };
}

/** Shared notch/material asset; shadows use View instead of SVG filter support. */
export function NavigationBarSurface({
  width,
  height,
  renderBackdrop,
}: {
  width: number;
  height: number;
  renderBackdrop?: (path: string) => ReactNode;
}) {
  const theme = useAppTheme();
  if (width <= 0 || height <= 0) return null;
  const path = navigationBarShape({
    width,
    height,
    cameraSize: theme.layout.tabBarCameraSize,
    cameraRise: theme.layout.tabBarCameraRise,
    padding: theme.layout.tabBarPadding,
    gap: theme.layout.tabBarNotchGap,
    shoulder: theme.layout.tabBarNotchShoulder,
  });
  const fill = svgPaint(theme.colors.navigationSurface);
  const border = svgPaint(theme.colors.navigationBorder);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><path d="${path}" fill="${fill.color}" fill-opacity="${fill.opacity}" stroke="${border.color}" stroke-opacity="${border.opacity}" stroke-width="1"/></svg>`;
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.surface, { width, height }]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: height / 2,
            boxShadow: [
              {
                ...theme.elevation.floating,
                color: theme.colors.navigationShadow,
              },
            ],
          },
        ]}
      />
      {renderBackdrop?.(path)}
      <Image
        accessible={false}
        source={{
          uri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
        }}
        contentFit="fill"
        cachePolicy="memory"
        transition={0}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { position: "absolute", left: 0, top: 0 },
});
