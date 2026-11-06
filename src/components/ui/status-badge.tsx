import { View } from "react-native";
import { AppIcon, type AppIconName } from "./app-icon";
import { AppText } from "./app-text";
import { useAppTheme } from "@/hooks/use-app-theme";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "error";

/** Non-interactive status: always includes words, wraps at larger text sizes. */
export function StatusBadge({ label, tone = "neutral", icon }: { label: string; tone?: StatusTone; icon?: AppIconName }) {
  const theme = useAppTheme();
  const colors = {
    neutral: [theme.colors.surfaceVariant, theme.colors.textSecondary],
    info: [theme.colors.surfaceTint, theme.colors.primaryText],
    success: [theme.colors.successSurface, theme.colors.onSuccessSurface],
    warning: [theme.colors.warningSurface, theme.colors.onWarningSurface],
    error: [theme.colors.errorSurface, theme.colors.onErrorSurface],
  }[tone];
  return <View accessible accessibilityLabel={label} style={{
    alignSelf: "flex-start", maxWidth: "100%", flexDirection: "row", alignItems: "center",
    gap: theme.spacing.xs, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md, backgroundColor: colors[0],
  }}>
    {icon ? <AppIcon name={icon} size={theme.layout.iconSmall} color={colors[1]} /> : null}
    <AppText variant="caption" style={{ color: colors[1], fontFamily: theme.typography.fontFamily.medium }}>{label}</AppText>
  </View>;
}
