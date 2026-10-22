import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { TripStop } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

export function TripReorder({
  stops,
  onApply,
}: {
  stops: TripStop[];
  onApply: (ids: string[]) => void;
}) {
  const [order, setOrder] = useState(stops);
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();
  const changed = order.some((stop, index) => stop.id !== stops[index]?.id);
  function move(id: string, steps: number) {
    setOrder((current) => {
      const from = current.findIndex((stop) => stop.id === id);
      const to = Math.max(0, Math.min(current.length - 1, from + steps));
      if (
        from < 0 ||
        current[from].pinned ||
        current
          .slice(Math.min(from, to), Math.max(from, to) + 1)
          .some((stop) => stop.pinned)
      )
        return current;
      const updated = [...current];
      updated.splice(to, 0, ...updated.splice(from, 1));
      return updated;
    });
  }
  return (
    <>
      <View style={{ gap: theme.spacing.xs }}>
        <View style={styles.row}>
          <AppText variant="label" style={styles.grow}>
            {order.length} {copy.places}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !changed }}
            disabled={!changed}
            onPress={() => setOrder(stops)}
            style={({ pressed }) => ({
              minHeight: theme.layout.compactTouchTarget,
              minWidth: theme.layout.compactTouchTarget,
              paddingHorizontal: theme.spacing.sm,
              justifyContent: "center",
              opacity: pressed ? theme.motion.pressOpacity : 1,
            })}
          >
            <AppText
              variant="caption"
              style={{
                color: changed
                  ? theme.colors.primaryText
                  : theme.colors.textDisabled,
              }}
            >
              {copy.reorderReset}
            </AppText>
          </Pressable>
        </View>
        <AppText variant="caption" tone="muted">
          {copy.reorderHint}
        </AppText>
      </View>
      <View style={{ gap: theme.spacing.sm }}>
        {order.map((stop, index) => (
          <ReorderRow
            key={stop.id}
            stop={stop}
            number={index + 1}
            total={order.length}
            time={stops[index]?.time ?? ""}
            canUp={index > 0 && !order[index - 1].pinned}
            canDown={index < order.length - 1 && !order[index + 1].pinned}
            onMove={(steps) => move(stop.id, steps)}
          />
        ))}
      </View>
      <AppButton
        variant="gradient"
        disabled={!changed}
        onPress={() => onApply(order.map((stop) => stop.id))}
      >
        {copy.apply}
      </AppButton>
    </>
  );
}
function ReorderRow({
  stop,
  number,
  total,
  time,
  canUp,
  canDown,
  onMove,
}: {
  stop: TripStop;
  number: number;
  total: number;
  time: string;
  canUp: boolean;
  canDown: boolean;
  onMove: (steps: number) => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const offset = useSharedValue(0);
  const height = useSharedValue<number>(
    theme.layout.touchTarget + theme.spacing.lg,
  );
  const moving = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.get() }],
    zIndex: offset.get() === 0 ? 0 : 1,
  }));
  const spring = theme.motion.photoViewerZoomSpring;
  const pan = Gesture.Pan()
    .enabled(!stop.pinned)
    .activeOffsetY([-theme.spacing.sm, theme.spacing.sm])
    .onUpdate((event) => {
      offset.set(event.translationY);
    })
    .onEnd((event) => {
      const steps = Math.round(event.translationY / height.get());
      offset.set(0);
      if (steps) scheduleOnRN(onMove, steps);
    })
    .onFinalize(() => {
      offset.set(
        withSpring(0, { ...spring, reduceMotion: ReduceMotion.System }),
      );
    });
  return (
    <Animated.View
      layout={LinearTransition.duration(
        theme.motion.tabTransitionDuration,
      ).reduceMotion(ReduceMotion.System)}
      onLayout={(event) =>
        height.set(event.nativeEvent.layout.height + theme.spacing.sm)
      }
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
          backgroundColor: theme.colors.glassFallback,
          padding: theme.spacing.sm,
          borderRadius: theme.radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.softActionBorder,
        },
        moving,
      ]}
    >
      <GestureDetector gesture={pan}>
        <View
          collapsable={false}
          accessible
          accessibilityRole="adjustable"
          accessibilityValue={{ min: 1, max: total, now: number }}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={number}
          accessibilityLabel={`${number}. ${stop.name[locale]}`}
          accessibilityHint={stop.pinned ? copy.pinnedHint : copy.reorderHint}
          accessibilityState={{
            disabled: !!stop.pinned || (!canUp && !canDown),
          }}
          accessibilityActions={
            stop.pinned
              ? []
              : [
                  ...(canUp
                    ? [{ name: "decrement" as const, label: copy.moveUp }]
                    : []),
                  ...(canDown
                    ? [{ name: "increment" as const, label: copy.moveDown }]
                    : []),
                ]
          }
          onAccessibilityAction={({ nativeEvent }) => {
            if (stop.pinned) return;
            if (nativeEvent.actionName === "decrement" && canUp) onMove(-1);
            if (nativeEvent.actionName === "increment" && canDown) onMove(1);
          }}
          style={{
            minHeight: theme.layout.touchTarget,
            width: theme.layout.compactTouchTarget,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: theme.layout.compactIconButtonSurfaceSize,
              height: theme.layout.compactIconButtonSurfaceSize,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.surfaceTint,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.softActionBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText variant="label" tone="primary">
              {number}
            </AppText>
          </View>
        </View>
      </GestureDetector>
      <View style={{ flex: 1, minWidth: 0, gap: theme.spacing.xs }}>
        <AppText variant="label">{stop.name[locale]}</AppText>
        <View style={[styles.row, { flexWrap: "wrap", gap: theme.spacing.sm }]}>
          <AppText variant="caption" tone="muted">
            {time || copy.noTime}
          </AppText>
          {stop.pinned ? (
            <View style={[styles.row, { gap: theme.spacing.xxs }]}>
              <AppIcon
                name="pin"
                size={theme.layout.iconSmall}
                color={theme.colors.primaryText}
              />
              <AppText variant="caption" tone="primary">
                {copy.pinned}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
      <View
        style={[
          styles.row,
          {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.softActionBorder,
            borderRadius: theme.radius.sm,
            overflow: "hidden",
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        {(
          [
            [-1, "up", canUp],
            [1, "down", canDown],
          ] as const
        ).map(([step, name, allowed]) => (
          <Pressable
            key={name}
            accessibilityRole="button"
            accessibilityLabel={`${step < 0 ? copy.moveUp : copy.moveDown}: ${stop.name[locale]}`}
            disabled={!allowed || stop.pinned}
            accessibilityState={{ disabled: !allowed || stop.pinned }}
            onPress={() => onMove(step)}
            style={({ pressed }) => ({
              width: theme.layout.compactTouchTarget,
              height: theme.layout.compactTouchTarget,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? theme.colors.surfaceTint : undefined,
            })}
          >
            <AppIcon
              name={name}
              size={theme.layout.iconSmall}
              color={
                allowed && !stop.pinned
                  ? theme.colors.primaryText
                  : theme.colors.textDisabled
              }
            />
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  grow: { flex: 1 },
});
