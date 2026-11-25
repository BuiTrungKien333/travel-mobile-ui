import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { useAppTheme } from "@/hooks/use-app-theme";

export function JourneyCard({
  children,
  cover,
  variant = "default",
}: {
  children: ReactNode;
  cover?: ReactNode;
  variant?: "default" | "neutral";
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          padding: cover ? theme.spacing.none : theme.spacing.lg,
          gap: cover ? theme.spacing.none : theme.spacing.md,
          borderRadius: theme.radius.md,
          backgroundColor:
            variant === "neutral"
              ? theme.colors.surface
              : theme.colors.surfaceTint,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor:
            variant === "neutral"
              ? theme.colors.border
              : theme.colors.glassBorder,
          boxShadow:
            variant === "neutral"
              ? undefined
              : [{ ...theme.elevation.glass, color: theme.colors.glassShadow }],
        },
      ]}
    >
      <GlassBackdrop borderRadius={theme.radius.md} />
      {cover}
      {cover ? (
        <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
          {children}
        </View>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden", borderCurve: "continuous" },
});
