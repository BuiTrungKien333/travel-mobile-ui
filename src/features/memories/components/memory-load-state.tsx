import { View } from "react-native";
import { QueryFeedback } from "@/components/common/query-feedback";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useMemoriesCopy } from "../i18n/memories-copy";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";

export function MemoryLoadState({ loading, error, onRetry }: {
  loading: boolean; error: boolean; onRetry: () => void;
}) {
  const theme = useAppTheme();
  const { copy } = useMemoriesCopy();
  const skipped = useTripPreview((state) => state.localPhotoIssues);
  const unowned = useTripPreview((state) => state.unownedLocalPhotos);
  const localError = useTripPreview((state) => state.localPhotoStatus === "error");
  const retryLocal = useTripPreview((state) => state.loadLocalPhotos);
  if (!loading && !error && !skipped && !unowned && !localError) return null;
  return (
    <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md, alignItems: "center" }}>
      {skipped ? <AppText accessibilityRole="alert" variant="caption" tone="muted">{copy.partialLocalPhotos}</AppText> : null}
      {unowned ? <AppText variant="caption" tone="muted">{copy.unownedLocalPhotos}</AppText> : null}
      {localError ? <>
        <AppText accessibilityRole="alert" tone="error">{copy.storageError}</AppText>
        <AppButton variant="outline" onPress={() => void retryLocal()}>{copy.retry}</AppButton>
      </> : null}
      <QueryFeedback loading={loading} error={error ? copy.loadError : null} onRetry={onRetry} />
    </View>
  );
}
