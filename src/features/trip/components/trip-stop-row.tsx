import { Pressable, StyleSheet, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { TripStop, TravelMode } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { usePlaceRouteQuery } from "../api/maps-hooks";
import { sameCoordinate } from "../utils/day-route";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { clockPattern } from "../schemas/trip-details-schema";
import { visitTimeRange } from "../utils/trip-details-layout";
import type { TripTimelineDrag } from "../hooks/use-trip-timeline-drag";
import {
  TripStopDragFrame,
  TripStopInteractions,
} from "./trip-stop-interactions";

function minuteOfDay(time: string) {
  if (!clockPattern.test(time)) return null;
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function TripStopRow({
  stop,
  previous,
  origin,
  departureTime,
  visited,
  next,
  mode,
  onOpen,
  onVisited,
  number,
  highlighted = false,
  fromStart = false,
  last,
  drag,
  onRemove,
}: {
  stop: TripStop;
  previous?: TripStop;
  origin?: TripStop["location"];
  departureTime?: string;
  visited: boolean;
  next: boolean;
  mode: TravelMode;
  onOpen: () => void;
  onVisited?: () => void;
  number: number;
  highlighted?: boolean;
  fromStart?: boolean;
  last: boolean;
  drag?: TripTimelineDrag;
  onRemove?: () => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const previousPoint = previous?.location ?? origin;
  const samePoint = sameCoordinate(previousPoint, stop.location);
  const legQuery = usePlaceRouteQuery(
    previousPoint && stop.location ? [previousPoint, stop.location] : [],
    !!previousPoint && !!stop.location && !samePoint,
    mode,
  );
  const leg = samePoint ? { km: 0, minutes: 0 } : legQuery.data
    ? { km: legQuery.data.distanceMeters / 1000, minutes: Math.round(legQuery.data.durationSeconds / 60) }
    : null;
  const range = visitTimeRange(stop);
  const metadata = [
    `${stop.durationMinutes ?? 45} ${copy.minutes}`,
    stop.quickInfo?.admission?.[locale] ||
      (stop.quickInfo?.closesAt
        ? `${copy.closes} ${stop.quickInfo.closesAt}`
        : undefined),
  ]
    .filter(Boolean)
    .join(" · ");
  const arrival = minuteOfDay(stop.time);
  const before = previous ? minuteOfDay(previous.time) : departureTime ? minuteOfDay(departureTime) : null;
  const conflict =
    arrival !== null &&
    before !== null &&
    arrival < before + (previous ? previous.durationMinutes ?? 45 : 0) + (leg?.minutes ?? 0);
  const markerWidth = onVisited
    ? theme.layout.compactTouchTarget
    : theme.layout.sampleStopNumberSize;
  const marker = (
    <View
      style={{
        width: theme.layout.sampleStopNumberSize,
        height: theme.layout.sampleStopNumberSize,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: visited
          ? theme.colors.success
          : onVisited && !next
            ? theme.colors.borderStrong
            : theme.colors.primaryText,
        backgroundColor: visited
          ? theme.colors.success
          : onVisited && !next
            ? theme.colors.glassInset
            : theme.colors.gradientActionStart,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {visited ? (
        <AppIcon
          name="check"
          size={theme.layout.iconSmall}
          color={theme.colors.onGradientAction}
        />
      ) : (
        <AppText
          variant="caption"
          style={{
            color:
              onVisited && !next
                ? theme.colors.textSecondary
                : theme.colors.onGradientAction,
            fontFamily: theme.typography.fontFamily.semibold,
          }}
        >
          {number}
        </AppText>
      )}
    </View>
  );
  return (
    <TripStopDragFrame id={stop.id} drag={drag}>
      {previous || fromStart ? (
        <View
          style={[
            styles.connector,
            { gap: theme.spacing.md, paddingVertical: theme.spacing.sm },
          ]}
        >
          <View
            style={{
              width: markerWidth,
              alignItems: "center",
            }}
          >
            <View
              style={{
                height: theme.spacing.xl,
                borderLeftWidth: theme.layout.tripTimelineConnectorWidth,
                borderStyle: "dashed",
                borderColor: theme.colors.borderStrong,
              }}
            />
          </View>
          <AppIcon
            name={mode}
            size={theme.layout.iconSmall}
            color={theme.colors.textSecondary}
          />
          <AppText variant="caption" tone="muted" style={styles.grow}>
            {leg
              ? `${leg.minutes} ${copy.minutes} · ${new Intl.NumberFormat(locale).format(leg.km)} km · ${copy.estimate}`
              : copy.unknownRoute}
          </AppText>
        </View>
      ) : null}
      <View style={[styles.row, { gap: theme.spacing.md }]}>
        <View
          style={[
            styles.marker,
            {
              width: markerWidth,
              paddingTop: onVisited ? theme.spacing.xxs : theme.spacing.md,
              alignSelf: "stretch",
            },
          ]}
        >
          {onVisited ? (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={`${visited ? copy.unvisit : copy.markVisited}: ${stop.name[locale]}`}
              accessibilityState={{ checked: visited }}
              aria-checked={visited}
              onPress={onVisited}
              style={({ pressed }) => ({
                width: theme.layout.compactTouchTarget,
                minHeight: theme.layout.compactTouchTarget,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? theme.motion.pressOpacity : 1,
              })}
            >
              {marker}
            </Pressable>
          ) : (
            marker
          )}
          {!last ? (
            <View
              style={{
                flex: 1,
                minHeight: theme.spacing.sm,
                marginTop: theme.spacing.sm,
                borderLeftWidth: theme.layout.tripTimelineConnectorWidth,
                borderStyle: "dashed",
                borderColor: theme.colors.borderStrong,
              }}
            />
          ) : null}
        </View>
        <View style={styles.grow}>
          <TripStopInteractions
            id={stop.id}
            pinned={!!stop.pinned}
            drag={drag}
            onRemove={onRemove}
            onOpen={onOpen}
          >
            {(handlePress) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${number}. ${stop.name[locale]}, ${range?.label || copy.noTime}${range?.nextDay ? `, ${copy.nextDay}` : ""}, ${metadata}`}
                accessibilityState={{ selected: highlighted || next }}
                accessibilityHint={
                  drag
                    ? stop.pinned
                      ? copy.pinnedHint
                      : copy.timelineGestureHint
                    : undefined
                }
                accessibilityActions={[
                  ...(onRemove
                    ? [{ name: "remove", label: copy.unschedule }]
                    : []),
                  ...(drag && !stop.pinned
                    ? [
                        { name: "moveUp", label: copy.moveUp },
                        { name: "moveDown", label: copy.moveDown },
                      ]
                    : []),
                ]}
                onAccessibilityAction={(event) => {
                  const action = event.nativeEvent.actionName;
                  if (action === "remove") onRemove?.();
                  else if (
                    drag &&
                    (action === "moveUp" || action === "moveDown")
                  ) {
                    const index = drag.slots
                      .get()
                      .findIndex((slot) => slot.id === stop.id);
                    drag.finish(
                      stop.id,
                      index + (action === "moveUp" ? -1 : 1),
                    );
                  }
                }}
                onPress={handlePress}
                style={({ pressed }) => [
                  styles.stop,
                  {
                    gap: theme.spacing.sm,
                    padding: theme.spacing.sm,
                    borderRadius: theme.radius.md,
                    backgroundColor:
                      next || highlighted
                        ? theme.colors.surfaceTint
                        : theme.colors.surface,
                    borderWidth: next ? 1 : StyleSheet.hairlineWidth,
                    borderLeftWidth: next
                      ? theme.spacing.xs
                      : StyleSheet.hairlineWidth,
                    borderColor: next
                      ? theme.colors.primaryText
                      : highlighted
                        ? theme.colors.borderStrong
                        : theme.colors.softActionBorder,
                    boxShadow: [
                      {
                        ...theme.elevation.glass,
                        color: theme.colors.glassShadow,
                      },
                    ],
                    opacity: pressed ? theme.motion.pressOpacity : 1,
                  },
                ]}
              >
                <View style={[styles.connector, { gap: theme.spacing.sm }]}>
                  <View style={{ width: theme.layout.sampleStopImageSize, height: theme.layout.sampleStopImageSize, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceTint, alignItems: "center", justifyContent: "center" }}>
                    <AppIcon name="pin" size={theme.layout.iconSmall} color={theme.colors.primaryText} />
                  </View>
                  <View style={[styles.grow, { gap: theme.spacing.xs }]}>
                    <View
                      style={[
                        styles.row,
                        { gap: theme.spacing.sm, flexWrap: "wrap" },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        tone="primary"
                        style={{
                          fontFamily: theme.typography.fontFamily.medium,
                        }}
                      >
                        {range?.label || copy.noTime}
                        {range?.nextDay ? ` (${copy.nextDay})` : ""}
                      </AppText>
                      {visited || next ? (
                        <AppText
                          variant="caption"
                          tone={next ? "primary" : "muted"}
                          style={{
                            fontFamily: next
                              ? theme.typography.fontFamily.semibold
                              : theme.typography.fontFamily.regular,
                          }}
                        >
                          {next ? copy.next : copy.visited}
                        </AppText>
                      ) : null}
                      {stop.pinned ? (
                        <AppIcon name="pin" size={theme.layout.iconSmall} />
                      ) : null}
                    </View>
                    <AppText variant="label">{stop.name[locale]}</AppText>
                    <AppText variant="caption" tone="muted">
                      {metadata}
                    </AppText>
                  </View>
                </View>
              </Pressable>
            )}
          </TripStopInteractions>
          {conflict ? (
            <AppText
              accessibilityRole="alert"
              variant="caption"
              tone="error"
              style={{ paddingTop: theme.spacing.xs }}
            >
              {copy.conflict}
            </AppText>
          ) : null}
        </View>
      </View>
    </TripStopDragFrame>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start" },
  connector: { flexDirection: "row", alignItems: "center" },
  grow: { flex: 1, minWidth: 0 },
  marker: { alignItems: "center" },
  stop: { minWidth: 0 },
});
