import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";

type AuthFooterLinkProps = {
  action: string;
  label: string;
  onPress: () => void;
};

export function AuthFooterLink({ action, label, onPress }: AuthFooterLinkProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.row, { gap: theme.spacing.xs }]}>
      <AppText tone="muted" variant="caption">
        {label}
      </AppText>
      <Pressable
        accessibilityRole="link"
        hitSlop={8}
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <AppText tone="primary" variant="link">
          {action}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.62,
  },
});
