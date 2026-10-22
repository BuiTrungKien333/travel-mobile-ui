import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { AppIcon } from "@/components/ui/app-icon";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TripTimelineDrag } from "../hooks/use-trip-timeline-drag";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { timelineDropTarget } from "../utils/timeline-reorder";

export function TripStopInteractions({
  id,
  pinned,
  drag,
  onRemove,
  onOpen,
  children,
}: {
  id: string;
  pinned: boolean;
  drag?: TripTimelineDrag;
  onRemove?: () => void;
  onOpen: () => void;
  children: (onPress: () => void) => ReactNode;
}) {
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();
  const [revealed, setRevealed] = useState(false);
  const x = useSharedValue(0);
  const start = useSharedValue(0);
  const suppressTap = useSharedValue(0);
  // An input debounce, not visible motion: keep it even with Reduce Motion enabled.
  const pressDuration = theme.motion.shutterPressDuration;
  const width = theme.layout.tripTimelineDeleteWidth;
  const spring = {
    ...theme.motion.photoViewerSpring,
    reduceMotion: ReduceMotion.System,
  };
  const swipe = Gesture.Pan()
    .enabled(!!onRemove)
    .activeOffsetX([-theme.spacing.sm, theme.spacing.sm])
    .failOffsetY([-theme.spacing.sm, theme.spacing.sm])
    .onStart(() => {
      suppressTap.set(1);
      start.set(x.get());
    })
    .onUpdate((event) => {
      x.set(Math.max(-width, Math.min(0, start.get() + event.translationX)));
    })
    .onEnd(() => {
      const open = x.get() < -width / 2;
      x.set(withSpring(open ? -width : 0, spring));
      if (drag) drag.openSwipe.set(open ? id : null);
      scheduleOnRN(setRevealed, open);
    })
    .onFinalize((_event, success) => {
      suppressTap.set(
        withTiming(0, {
          duration: pressDuration,
          reduceMotion: ReduceMotion.Never,
        }),
      );
      if (!success)
        x.set(withSpring(drag?.active.get() === id ? 0 : start.get(), spring));
    });
  const reorder = Gesture.Pan()
    .enabled(!!drag && !pinned)
    .activateAfterLongPress(theme.motion.tripTimelineHoldDuration)
    .activeOffsetY([-theme.spacing.xs, theme.spacing.xs])
    .failOffsetX([-theme.spacing.md, theme.spacing.md])
    .onStart(() => {
      if (!drag) return;
      suppressTap.set(1);
      const index = drag.slots.get().findIndex((slot) => slot.id === id);
      if (index < 0) return;
      x.set(0);
      drag.openSwipe.set(null);
      drag.from.set(index);
      drag.target.set(index);
      drag.offset.set(0);
      drag.active.set(id);
      scheduleOnRN(setRevealed, false);
      scheduleOnRN(drag.begin, id);
    })
    .onUpdate((event) => {
      if (!drag || drag.active.get() !== id) return;
      const slots = drag.slots.get();
      const source = drag.from.get();
      let low = source;
      let high = source;
      while (low > 0 && !slots[low - 1].pinned) low--;
      while (high < slots.length - 1 && !slots[high + 1].pinned) high++;
      let min = 0;
      let max = 0;
      for (let index = low; index < source; index++) min -= slots[index].height;
      for (let index = source + 1; index <= high; index++)
        max += slots[index].height;
      const delta = Math.max(min, Math.min(max, event.translationY));
      drag.offset.set(delta);
      drag.target.set(timelineDropTarget(slots, source, delta));
    })
    .onEnd(() => {
      if (drag && drag.active.get() === id)
        scheduleOnRN(drag.finish, id, drag.target.get());
    })
    .onFinalize((_event, success) => {
      suppressTap.set(
        withTiming(0, {
          duration: pressDuration,
          reduceMotion: ReduceMotion.Never,
        }),
      );
      if (drag && !success && drag.active.get() === id)
        scheduleOnRN(drag.reset);
    });
  useAnimatedReaction(
    () => drag?.openSwipe.get(),
    (open, previous) => {
      if (open !== previous && open !== id) {
        x.set(withSpring(0, spring));
        scheduleOnRN(setRevealed, false);
      }
    },
  );
  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
  }));
  const draggingStyle = useAnimatedStyle(() => ({
    opacity: drag?.active.get() === id ? theme.motion.pressOpacity : 1,
  }));
  return (
    <View style={{ borderRadius: theme.radius.md, overflow: "hidden" }}>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.unschedule}
          accessibilityElementsHidden={!revealed}
          importantForAccessibility={revealed ? "yes" : "no-hide-descendants"}
          aria-hidden={!revealed}
          disabled={!revealed}
          onPress={() => {
            x.set(0);
            setRevealed(false);
            onRemove();
          }}
          style={[
            styles.remove,
            {
              width,
              minHeight: theme.layout.touchTarget,
            },
          ]}
        >
          <View
            pointerEvents="none"
            style={{
              width: theme.layout.compactIconButtonSurfaceSize,
              height: theme.layout.compactIconButtonSurfaceSize,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.radius.md,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.error,
              backgroundColor: theme.colors.surface,
            }}
          >
            <AppIcon
              name="trash"
              size={theme.layout.iconSmall}
              color={theme.colors.error}
            />
          </View>
        </Pressable>
      ) : null}
      <GestureDetector gesture={Gesture.Race(swipe, reorder)}>
        <Animated.View style={[swipeStyle, draggingStyle]}>
          {children(() => {
            if (suppressTap.get() > 0 || drag?.active.get() === id) return;
            if (x.get() < 0) {
              x.set(withSpring(0, spring));
              setRevealed(false);
              if (drag) drag.openSwipe.set(null);
              return;
            }
            onOpen();
          })}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export function TripStopDragFrame({
  id,
  drag,
  children,
}: {
  id: string;
  drag?: TripTimelineDrag;
  children: ReactNode;
}) {
  const theme = useAppTheme();
  const motion = useAnimatedStyle(() => {
    if (!drag) return {};
    const active = drag.active.get();
    const index = drag.slots.get().findIndex((slot) => slot.id === id);
    const from = drag.from.get();
    const to = drag.target.get();
    let shift = 0;
    if (active && index >= 0 && active !== id) {
      const height = drag.slots.get()[from]?.height ?? 0;
      if (from < index && index <= to) shift = -height;
      if (to <= index && index < from) shift = height;
    }
    return {
      transform: [
        {
          translateY:
            active === id
              ? drag.offset.get()
              : active
                ? withTiming(shift, {
                    duration: theme.motion.shutterPressDuration,
                    reduceMotion: ReduceMotion.System,
                  })
                : 0,
        },
      ],
    };
  });
  return (
    <Animated.View
      onLayout={(event) => drag?.measure(id, event.nativeEvent.layout.height)}
      style={[
        { position: "relative", zIndex: drag?.draggedId === id ? 1 : 0 },
        motion,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  remove: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
