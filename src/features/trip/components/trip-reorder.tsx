import { useState, type KeyboardEvent } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { TripStop } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import {
  useTripTimelineDrag,
  type TripTimelineDrag,
} from "../hooks/use-trip-timeline-drag";
import { timelineDropTarget } from "../utils/timeline-reorder";
import { TripStopDragFrame } from "./trip-stop-interactions";

export function TripReorder({
  stops,
  onApply,
  pending = false,
}: {
  stops: TripStop[];
  onApply: (ids: string[]) => void;
  pending?: boolean;
}) {
  const [order, setOrder] = useState(stops);
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();
  const changed = order.some((stop, index) => stop.id !== stops[index]?.id);
  const drag = useTripTimelineDrag({
    stops: order,
    selectionKey: "manual-reorder",
    onReorder: (ids) => {
      const byId = new Map(order.map((stop) => [stop.id, stop]));
      setOrder(
        ids.flatMap((id) => {
          const stop = byId.get(id);
          return stop ? [stop] : [];
        }),
      );
    },
  });
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
            disabled={!changed || drag.draggedId !== null}
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
      <TripReorderList
        stops={order}
        slotTimes={stops.map((stop) => stop.time)}
        drag={drag}
      />
      <AppButton
        variant="gradient"
        disabled={pending || !changed || drag.draggedId !== null}
        onPress={() => onApply(order.map((stop) => stop.id))}
      >
        {copy.apply}
      </AppButton>
    </>
  );
}
export function TripReorderList({
  stops,
  slotTimes,
  drag,
  variant = "default",
}: {
  stops: TripStop[];
  slotTimes: string[];
  drag: TripTimelineDrag;
  variant?: "default" | "compact";
}) {
  const theme = useAppTheme();
  return (
    <View>
      {stops.map((stop, index) => (
        <TripStopDragFrame key={stop.id} id={stop.id} drag={drag}>
          <View
            style={{
              paddingBottom:
                variant === "default" && index < stops.length - 1
                  ? theme.spacing.sm
                  : 0,
              borderBottomWidth:
                variant === "compact" && index < stops.length - 1
                  ? StyleSheet.hairlineWidth
                  : 0,
              borderBottomColor: theme.colors.border,
            }}
          >
            <ReorderRow
              stop={stop}
              number={index + 1}
              total={stops.length}
              time={slotTimes[index] ?? ""}
              drag={drag}
              variant={variant}
              canUp={index > 0 && !stops[index - 1].pinned}
              canDown={index < stops.length - 1 && !stops[index + 1].pinned}
              onMove={(steps) => {
                if (drag.draggedId === null)
                  drag.finish(
                    stop.id,
                    Math.max(0, Math.min(stops.length - 1, index + steps)),
                  );
              }}
            />
          </View>
        </TripStopDragFrame>
      ))}
    </View>
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
  drag,
  variant,
}: {
  stop: TripStop;
  number: number;
  total: number;
  time: string;
  canUp: boolean;
  canDown: boolean;
  onMove: (steps: number) => void;
  drag: TripTimelineDrag;
  variant: "default" | "compact";
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const compact = variant === "compact";
  const keyboardProps =
    Platform.OS === "web"
      ? {
          onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
            if (stop.pinned || drag.draggedId !== null) return;
            const direction =
              event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
            if (direction && (direction < 0 ? canUp : canDown)) {
              event.preventDefault();
              onMove(direction);
            }
          },
        }
      : {};
  const pan = Gesture.Pan()
    .enabled(
      !stop.pinned && (drag.draggedId === null || drag.draggedId === stop.id),
    )
    .activeOffsetY([-theme.spacing.sm, theme.spacing.sm])
    .failOffsetX([-theme.spacing.sm, theme.spacing.sm])
    .onStart(() => {
      const index = drag.slots.get().findIndex((slot) => slot.id === stop.id);
      drag.from.set(index);
      drag.target.set(index);
      drag.offset.set(0);
      drag.active.set(stop.id);
      scheduleOnRN(drag.begin, stop.id);
    })
    .onUpdate((event) => {
      drag.offset.set(event.translationY);
      drag.target.set(
        timelineDropTarget(
          drag.slots.get(),
          drag.from.get(),
          event.translationY,
        ),
      );
    })
    .onEnd(() => {
      scheduleOnRN(drag.finish, stop.id, drag.target.get());
    })
    .onFinalize((_event, success) => {
      if (!success && drag.active.get() === stop.id) scheduleOnRN(drag.reset);
    });
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
          backgroundColor: compact ? undefined : theme.colors.glassFallback,
          padding: compact ? theme.spacing.none : theme.spacing.sm,
          borderRadius: compact ? theme.radius.none : theme.radius.md,
          borderWidth: compact ? 0 : StyleSheet.hairlineWidth,
          borderColor: theme.colors.softActionBorder,
        },
      ]}
    >
      <GestureDetector gesture={pan}>
        <View
          {...keyboardProps}
          collapsable={false}
          accessible
          accessibilityRole="adjustable"
          accessibilityValue={{ min: 1, max: total, now: number }}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={number}
          accessibilityLabel={`${number}. ${stop.name[locale]}`}
          accessibilityHint={
            stop.pinned
              ? stop.visited
                ? copy.visited
                : copy.pinnedHint
              : compact
                ? copy.optimizationDragHint
                : copy.reorderHint
          }
          aria-disabled={!!stop.pinned || (!canUp && !canDown)}
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
              width: compact
                ? theme.layout.sampleStopNumberSize
                : theme.layout.compactIconButtonSurfaceSize,
              height: compact
                ? theme.layout.sampleStopNumberSize
                : theme.layout.compactIconButtonSurfaceSize,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.surfaceTint,
              borderWidth: compact ? 0 : StyleSheet.hairlineWidth,
              borderColor: theme.colors.softActionBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {stop.visited ? (
              <AppIcon
                name="check"
                size={theme.layout.iconSmall}
                color={theme.colors.success}
              />
            ) : (
              <AppText variant="label" tone="primary">
                {number}
              </AppText>
            )}
          </View>
        </View>
      </GestureDetector>
      <View
        style={{
          flex: 1,
          minWidth: 0,
          gap: theme.spacing.xs,
          ...(compact
            ? ({ flexDirection: "row", alignItems: "center" } as const)
            : {}),
        }}
      >
        <AppText variant="label" style={compact ? { flex: 1 } : undefined}>
          {stop.name[locale]}
        </AppText>
        <View style={[styles.row, { flexWrap: "wrap", gap: theme.spacing.sm }]}>
          <AppText variant="caption" tone="muted">
            {time || copy.noTime}
          </AppText>
          {stop.visited ? (
            <AppText variant="caption" tone="muted">
              {copy.visited}
            </AppText>
          ) : stop.pinned ? (
            <View
              accessible
              accessibilityLabel={copy.pinned}
              style={[styles.row, { gap: theme.spacing.xxs }]}
            >
              <AppIcon
                name="pin"
                size={theme.layout.iconSmall}
                color={theme.colors.primaryText}
              />
              {!compact ? (
                <AppText variant="caption" tone="primary">
                  {copy.pinned}
                </AppText>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
      {!compact ? (
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
              disabled={!allowed || stop.pinned || drag.draggedId !== null}
              accessibilityState={{
                disabled: !allowed || stop.pinned || drag.draggedId !== null,
              }}
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  grow: { flex: 1 },
});
