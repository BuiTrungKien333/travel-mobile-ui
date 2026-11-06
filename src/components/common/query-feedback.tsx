import { ActivityIndicator, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";

/** Inline feedback keeps cached content and form identity mounted during refetch. */
export function QueryFeedback({ loading = false, refreshing = false, error, onRetry, retrying = false }: {
  loading?: boolean; refreshing?: boolean; error?: string | null; onRetry?: () => void; retrying?: boolean;
}) {
  const theme = useAppTheme();
  const { t } = useI18n();
  if (!loading && !refreshing && !error) return null;
  return <View style={{ padding: theme.spacing.md, gap: theme.spacing.sm, borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface, minHeight: theme.layout.touchTarget }}>
    {error ? <>
      <AppText accessibilityRole="alert" variant="caption" tone="error">{error}</AppText>
      {onRetry ? <AppButton size="small" variant="outline" loading={retrying} onPress={onRetry}>{t("common.retry")}</AppButton> : null}
    </> : <View accessibilityLiveRegion="polite" style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
      <ActivityIndicator color={theme.colors.primaryText} />
      <AppText variant="caption" tone="muted">{t(refreshing ? "common.refreshing" : "common.loading")}</AppText>
    </View>}
  </View>;
}
