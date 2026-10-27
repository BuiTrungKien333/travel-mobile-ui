import { StyleSheet, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import type { Trip, TripStop } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import type { TripDetailsMode } from "../utils/trip-details-layout";
import { ShareTripButton } from "./trip-recap-content";
import { useOngoingCopy } from "@/features/home/i18n/ongoing-copy";
import { TripOptimizeSlider } from "./trip-optimize-slider";

export function TripDetailsActions({
  trip,
  mode,
  canOptimize,
  onOptimize,
  nextStop,
  onDirections,
  onVisited,
  onJournal,
  onInfo,
}: {
  trip: Trip;
  mode: TripDetailsMode;
  canOptimize: boolean;
  onOptimize: () => void;
  nextStop?: TripStop;
  onDirections: () => void;
  onVisited: () => void;
  onJournal: () => void;
  onInfo: () => void;
}) {
  const theme = useAppTheme();
  const insets = useScreenInsets();
  const { copy } = useTripDetailsCopy();
  const { copy: ongoingCopy } = useOngoingCopy();
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
        paddingBottom:
          insets.bottom +
          (mode === "live" ? theme.spacing.xl : theme.spacing.md),
        backgroundColor: theme.colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
      }}
    >
      {mode === "planning" ? (
        <TripOptimizeSlider onOptimize={onOptimize} />
      ) : mode === "live" && nextStop ? (
        <>
          <View style={[styles.grow, { flexGrow: 65 }]}>
            <AppButton
              variant="raised"
              size="small"
              style={{ paddingHorizontal: theme.spacing.sm }}
              accessibilityHint={copy.expandMap}
              onPress={onDirections}
              leadingIcon={
                <AppIcon
                  name="navigation"
                  size={theme.layout.iconSmall}
                  color={theme.colors.onRaisedAction}
                />
              }
            >
              {ongoingCopy.directions}
            </AppButton>
          </View>
          <AppButton
            variant="outline"
            size="small"
            style={[
              styles.grow,
              {
                flexBasis: 0,
                flexGrow: 35,
                paddingHorizontal: theme.spacing.sm,
                backgroundColor: theme.colors.glassInset,
                borderColor: theme.colors.softActionBorder,
              },
            ]}
            leadingIcon={<AppIcon name="check" size={theme.layout.iconSmall} />}
            onPress={onVisited}
          >
            {copy.visited}
          </AppButton>
        </>
      ) : mode === "live" ? (
        <AppButton
          variant="soft"
          style={styles.grow}
          onPress={onJournal}
          leadingIcon={<AppIcon name="memories" />}
        >
          {copy.memories}
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
const styles = StyleSheet.create({
  grow: { flex: 1, flexBasis: 0, minWidth: 0 },
});
