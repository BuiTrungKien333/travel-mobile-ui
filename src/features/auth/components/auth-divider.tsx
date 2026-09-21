import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";

export function AuthDivider() {
  const theme = useAppTheme();
  const { t } = useI18n();

  return (
    <View accessibilityRole="text" style={[styles.row, { gap: theme.spacing.md }]}>
      <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
      <AppText tone="muted" variant="caption">
        {t("common.or")}
      </AppText>
      <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
