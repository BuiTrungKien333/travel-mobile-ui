import { StyleSheet, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import type { Trip } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import type { TripDetailsMode } from "../utils/trip-details-layout";
import { ShareTripButton } from "./trip-recap-content";
import { TripOptimizeSlider } from "./trip-optimize-slider";

export function TripDetailsActions({
  trip,
  mode,
  canOptimize,
  onOptimize,
  onCapture,
  onJournal,
  onInfo,
}: {
  trip: Trip;
  mode: TripDetailsMode;
  canOptimize: boolean;
  onOptimize: () => void;
  onCapture: () => void;
  onJournal: () => void;
  onInfo: () => void;
}) {
  const theme = useAppTheme();
  const insets = useScreenInsets();
  const { copy } = useTripDetailsCopy();
  if (mode === "planning" && !canOptimize) return null;
  return (
    <View
      style={{
        width: "100%",
        maxWidth: theme.layout.contentMaxWidth,
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        padding: theme.spacing.lg,
        paddingBottom: insets.bottom + theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
      }}
    >
      {mode === "planning" ? (
        <TripOptimizeSlider onOptimize={onOptimize} />
      ) : mode === "live" ? (
        <AppButton
          variant="raised"
          style={styles.grow}
          leadingIcon={
            <AppIcon
              name="camera"
              variant="light"
              color={theme.colors.onRaisedAction}
            />
          }
          onPress={onCapture}
        >
          {copy.capture}
        </AppButton>
      ) : mode === "recap" ? (
        <>
          <AppButton
            variant="gradient"
            style={styles.grow}
            leadingIcon={
              <AppIcon name="memories" color={theme.colors.onGradientAction} />
            }
            onPress={onJournal}
          >
            {copy.memories}
          </AppButton>
          <View style={styles.grow}>
            <ShareTripButton trip={trip} />
          </View>
        </>
      ) : (
        <AppButton variant="outline" style={styles.grow} onPress={onInfo}>
          {copy.overview}
        </AppButton>
      )}
    </View>
  );
}
const styles = StyleSheet.create({ grow: { flex: 1, minWidth: 0 } });
