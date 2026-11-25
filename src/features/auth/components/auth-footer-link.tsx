import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";

type AuthFooterLinkProps = {
  action: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function AuthFooterLink({
  action,
  label,
  onPress,
  disabled = false,
}: AuthFooterLinkProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.row,
        { minHeight: theme.layout.touchTarget, gap: theme.spacing.xs },
      ]}
    >
      <AppText tone="muted">{label}</AppText>
      <Pressable
        accessibilityRole="link"
        accessibilityState={{ disabled }}
        disabled={disabled}
        hitSlop={theme.spacing.sm}
        onPress={onPress}
        style={({ pressed }) => [
          styles.action,
          {
            minWidth: theme.layout.compactTouchTarget,
            minHeight: theme.layout.compactTouchTarget,
            paddingHorizontal: theme.spacing.xs,
            paddingVertical: theme.spacing.sm,
            opacity: pressed ? theme.motion.pressOpacity : 1,
          },
        ]}
      >
        <AppText
          numberOfLines={1}
          tone="primary"
          variant="link"
          style={[
            styles.centered,
            {
              fontSize: theme.typography.fontSize.md,
              lineHeight: theme.typography.lineHeight.md,
            },
          ]}
        >
          {action}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
  },

  action: { maxWidth: "100%", justifyContent: "center" },
  centered: { textAlign: "center", flexShrink: 0 },
});
