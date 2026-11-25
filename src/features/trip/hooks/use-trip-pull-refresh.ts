import { Gesture } from "react-native-gesture-handler";
import { useSharedValue, type SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useAppTheme } from "@/hooks/use-app-theme";

/** Refresh is an intentional pull held briefly, separate from map pan/resize. */
export function useTripPullRefresh({
  scrollGesture,
  offset,
  mapHeight,
  enabled,
  onRefresh,
}: {
  scrollGesture: ReturnType<typeof Gesture.Native>;
  offset: SharedValue<number>;
  mapHeight: number;
  enabled: boolean;
  onRefresh: () => void;
}) {
  const theme = useAppTheme();
  const beganAt = useSharedValue(0);
  const eligible = useSharedValue(false);
  const hold = theme.motion.tripPullRefreshHoldDuration;
  const distance = theme.motion.tripPullRefreshDistance;

  return Gesture.Pan()
    .simultaneousWithExternalGesture(scrollGesture)
    .maxPointers(1)
    .activeOffsetY(theme.spacing.md)
    .failOffsetX([-theme.spacing.lg, theme.spacing.lg])
    .onBegin((event) => {
      beganAt.set(Date.now());
      // A pull on the map belongs to Mapbox, not to the list's refresh action.
      eligible.set(enabled && offset.get() <= 1 && event.y > mapHeight);
    })
    .onEnd((event) => {
      if (
        eligible.get() &&
        event.translationY >= distance &&
        Date.now() - beganAt.get() >= hold
      )
        scheduleOnRN(onRefresh);
    })
    .onFinalize(() => eligible.set(false));
}
