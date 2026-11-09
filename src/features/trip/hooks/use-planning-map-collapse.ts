import { useEffect, useState, type RefObject } from "react";
import type { FlatList } from "react-native";
import {
  useAnimatedScrollHandler,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useAppTheme } from "@/hooks/use-app-theme";

/** One scroll owner: hiding the map never changes the timeline's viewport height. */
export function usePlanningMapCollapse<T>({
  enabled,
  selectionKey,
  mapHeight,
  list,
  resizeLock,
}: {
  enabled: boolean;
  selectionKey: string;
  mapHeight: number;
  list: RefObject<FlatList<T> | null>;
  resizeLock?: SharedValue<number>;
}) {
  const theme = useAppTheme();
  const [hidden, setHidden] = useState(false);
  const collapsed = useSharedValue(false);
  const reduceMotion = useReducedMotion();
  const hideDistance = theme.layout.tripPlanningMapAutoHideDistance;
  const restoreDistance = theme.spacing.sm;
  const intentDuration = theme.motion.tripMapScrollIntentDuration;
  const restoreTravel = theme.motion.tripMapRestoreDistance;
  const settleDuration = theme.motion.tripMapScrollSettleDuration;
  const target = useSharedValue(-1);
  const settleUntil = useSharedValue(0);
  const previousOffset = useSharedValue(0);
  const dragStart = useSharedValue(0);
  const dragOffset = useSharedValue(0);
  const dragging = useSharedValue(false);
  const offset = useSharedValue(0);
  useEffect(() => {
    collapsed.set(false);
    setHidden(false);
    target.set(-1);
    previousOffset.set(0);
    dragStart.set(0);
    dragging.set(false);
    resizeLock?.set(0);
  }, [
    enabled,
    selectionKey,
    collapsed,
    target,
    previousOffset,
    dragStart,
    dragging,
    resizeLock,
  ]);

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
      dragging.set(true);
      dragOffset.set(Math.max(0, event.contentOffset.y));
      dragStart.set(Date.now());
      previousOffset.set(Math.max(0, event.contentOffset.y));
    },
    onEndDrag: () => { dragging.set(false); },
    onScroll: (event) => {
      offset.set(Math.max(0, event.contentOffset.y));
      if (!enabled || mapHeight <= hideDistance) return;
      const y = offset.get();
      const now = Date.now();
      const delta = y - previousOffset.get();
      previousOffset.set(y);
      // Resizing the list header can emit scroll events without a scrolling gesture.
      if (resizeLock && resizeLock.get() > 0) return;
      if (target.get() >= 0) {
        if (Math.abs(y - target.get()) <= restoreDistance) target.set(-1);
        else if (now >= settleUntil.get()) target.set(-1);
        return;
      }
      const deliberate = dragging.get() && now - dragStart.get() >= intentDuration;
      if (!collapsed.get() && delta > 0 &&
        (y >= mapHeight || (deliberate && y - dragOffset.get() >= hideDistance))) {
        collapsed.set(true);
        if (y < mapHeight) {
          target.set(mapHeight);
          settleUntil.set(now + settleDuration);
        }
        // Don't jump backwards when a numbered marker already navigated further down.
        scheduleOnRN(hide, y < mapHeight);
      } else if (
        collapsed.get() &&
        deliberate &&
        (y <= restoreDistance || dragOffset.get() - y >= restoreTravel)
      ) {
        collapsed.set(false);
        target.set(0);
        settleUntil.set(now + settleDuration);
        scheduleOnRN(show);
      }
    },
  });
  return { hidden, onScroll, show, offset };
}
