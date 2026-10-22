import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { TripStop, TravelMode } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { getPreviewLeg, getStopImage } from "../data/trip-details-preview";
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
  const leg = previous ? getPreviewLeg(previous, stop, mode) : null;
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
  const before = previous ? minuteOfDay(previous.time) : null;
  const conflict =
    arrival !== null &&
    before !== null &&
    arrival < before + (previous?.durationMinutes ?? 45) + (leg?.minutes ?? 0);
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
              width: theme.layout.sampleStopNumberSize,
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
              width: theme.layout.sampleStopNumberSize,
              paddingTop: theme.spacing.md,
              alignSelf: "stretch",
            },
          ]}
        >
          <View
            style={{
              width: theme.layout.sampleStopNumberSize,
              height: theme.layout.sampleStopNumberSize,
              borderRadius: theme.radius.full,
              borderWidth: 1,
              borderColor: theme.colors.gradientActionStart,
              backgroundColor: theme.colors.gradientActionStart,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText
              variant="caption"
              style={{
                color: theme.colors.onGradientAction,
                fontFamily: theme.typography.fontFamily.semibold,
              }}
            >
              {number}
            </AppText>
          </View>
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
                accessibilityState={{ selected: highlighted }}
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
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor:
                      next || highlighted
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
                  <Image
                    source={getStopImage(stop.id)}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    accessible={false}
                    style={{
                      width: theme.layout.sampleStopImageSize,
                      height: theme.layout.sampleStopImageSize,
                      borderRadius: theme.radius.sm,
                    }}
                  />
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
                      {next || visited ? (
                        <View
                          style={[styles.connector, { gap: theme.spacing.xs }]}
                        >
                          {visited ? (
                            <AppIcon
                              name="check"
                              size={theme.layout.iconSmall}
                              color={theme.colors.primaryText}
                            />
                          ) : null}
                          <AppText variant="caption" tone="muted">
                            {visited ? copy.visited : copy.next}
                          </AppText>
                        </View>
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
          {onVisited ? (
            <View
              style={{ paddingTop: theme.spacing.sm, alignSelf: "flex-start" }}
            >
              <AppButton size="small" variant="soft" onPress={onVisited}>
                {visited ? copy.unvisit : copy.markVisited}
              </AppButton>
            </View>
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
