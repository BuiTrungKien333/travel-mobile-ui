import { Platform, StyleSheet, View } from "react-native";

import { useAppTheme } from "@/hooks/use-app-theme";
import { GlassBackdrop } from "./glass-backdrop";

/** Android has no liquid-glass blur: an opaque surface keeps scrolling text hidden. */
export function NavigationBarSurface({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const theme = useAppTheme();
  if (width <= 0 || height <= 0) return null;
  const borderRadius = height / 2;
  const solid = Platform.OS === "android";

  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.surface,
        {
          width,
          height,
          borderRadius,
          backgroundColor: solid ? theme.colors.surface : undefined,
          borderWidth: solid ? StyleSheet.hairlineWidth : 0,
          borderColor: theme.colors.border,
          boxShadow: [
            {
              ...theme.elevation.floating,
              color: theme.colors.navigationShadow,
            },
          ],
        },
      ]}
    >
      {solid ? null : (
        <GlassBackdrop borderRadius={borderRadius} variant="navigation" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { position: "absolute", left: 0, top: 0 },
});
