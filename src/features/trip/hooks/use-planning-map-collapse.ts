import { useEffect, useState, type RefObject } from "react";
import type { FlatList } from "react-native";
import {
  useAnimatedScrollHandler,
  useReducedMotion,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useAppTheme } from "@/hooks/use-app-theme";

/** One scroll owner: hiding the map never changes the timeline's viewport height. */
export function usePlanningMapCollapse<T>({
  enabled,
  selectionKey,
  mapHeight,
  list,
}: {
  enabled: boolean;
  selectionKey: string;
  mapHeight: number;
  list: RefObject<FlatList<T> | null>;
}) {
  const theme = useAppTheme();
  const [hidden, setHidden] = useState(false);
  const collapsed = useSharedValue(false);
  const reduceMotion = useReducedMotion();
  const hideDistance = theme.layout.tripPlanningMapAutoHideDistance;
  const restoreDistance = theme.spacing.sm;
  const restoreVelocity = theme.motion.tripMapRestoreVelocity;
  const settleDuration = theme.motion.tripMapScrollSettleDuration;
  const target = useSharedValue(-1);
  const settleUntil = useSharedValue(0);
  const previousOffset = useSharedValue(0);
  const previousTime = useSharedValue(0);
  useEffect(() => {
    collapsed.set(false);
    setHidden(false);
    target.set(-1);
    previousOffset.set(0);
    previousTime.set(0);
  }, [enabled, selectionKey, collapsed, target, previousOffset, previousTime]);

  function hide(snap: boolean) {
    setHidden(true);
    if (snap)
      list.current?.scrollToOffset({
        offset: mapHeight,
        animated: !reduceMotion,
      });
  }
  function show() {
    collapsed.set(false);
    target.set(0);
    settleUntil.set(Date.now() + settleDuration);
    setHidden(false);
    list.current?.scrollToOffset({ offset: 0, animated: !reduceMotion });
  }
  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: (event) => {
      target.set(-1);
      previousOffset.set(Math.max(0, event.contentOffset.y));
      previousTime.set(Date.now());
    },
    onScroll: (event) => {
      if (!enabled || mapHeight <= hideDistance) return;
      const offset = Math.max(0, event.contentOffset.y);
      const now = Date.now();
      const delta = offset - previousOffset.get();
      const velocity = (delta / Math.max(1, now - previousTime.get())) * 1000;
      previousOffset.set(offset);
      previousTime.set(now);
      if (target.get() >= 0) {
        if (Math.abs(offset - target.get()) <= restoreDistance) target.set(-1);
        else if (now >= settleUntil.get()) target.set(-1);
        return;
      }
      if (!collapsed.get() && offset >= hideDistance) {
        collapsed.set(true);
        if (offset < mapHeight) {
          target.set(mapHeight);
          settleUntil.set(now + settleDuration);
        }
        // Don't jump backwards when a numbered marker already navigated further down.
        scheduleOnRN(hide, offset < mapHeight);
      } else if (
        collapsed.get() &&
        (offset <= restoreDistance ||
          (delta < -restoreDistance && velocity <= -restoreVelocity))
      ) {
        collapsed.set(false);
        target.set(0);
        settleUntil.set(now + settleDuration);
        scheduleOnRN(show);
      }
    },
  });
  return { hidden, onScroll, show };
}
