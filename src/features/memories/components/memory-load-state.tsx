import { ActivityIndicator, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useMemoriesCopy } from "../i18n/memories-copy";

export function MemoryLoadState({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const theme = useAppTheme();
  const { copy } = useMemoriesCopy();
  if (!loading && !error) return null;
  return (
    <View
      style={{
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
        alignItems: "center",
      }}
    >
      {loading ? (
        <ActivityIndicator
          color={theme.colors.primaryText}
          accessibilityLabel={copy.loading}
        />
      ) : (
        <>
          <AppText accessibilityRole="alert" tone="error">
            {copy.loadError}
          </AppText>
          <AppButton onPress={onRetry}>{copy.retry}</AppButton>
        </>
      )}
    </View>
  );
}
