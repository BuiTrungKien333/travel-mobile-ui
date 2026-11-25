import { Pressable, StyleSheet, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import type { Trip, TripDay } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { getTripStartInfo } from "../utils/trip-details-layout";

export function TripStartNode({
  trip,
  day,
  canEdit,
  onPress,
  live = false,
  markerWidth,
}: {
  trip: Trip;
  day?: TripDay;
  canEdit: boolean;
  onPress: () => void;
  live?: boolean;
  markerWidth?: number;
}) {
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();
  const start = getTripStartInfo(trip, day, live);
  if (!start) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy.daySettings}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        minHeight: theme.layout.touchTarget,
        paddingVertical: theme.spacing.sm,
        opacity: pressed ? theme.motion.pressOpacity : 1,
      })}
    >
      <View
        style={{
          width: markerWidth ?? theme.layout.sampleStopNumberSize,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: theme.layout.sampleStopNumberSize,
            height: theme.layout.sampleStopNumberSize,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.surfaceTint,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppText variant="caption" tone="primary">
            S
          </AppText>
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        {start.time || !live ? (
          <AppText variant="label" tone="primary">
            {start.time || copy.noTime}
          </AppText>
        ) : null}
        <AppText variant="body">{start.location || copy.chooseStart}</AppText>
      </View>
      <AppIcon
        name={canEdit ? "edit" : "info"}
        size={theme.layout.iconSmall}
        color={theme.colors.textSecondary}
      />
    </Pressable>
  );
}

export function TripTimelineEmpty({
  backlog,
  canSetDates,
  onDates,
}: {
  backlog: boolean;
  canSetDates: boolean;
  onDates: () => void;
}) {
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();

  return (
    <View
      style={{
        gap: theme.spacing.md,
        alignItems: "center",
        padding: theme.spacing.xl,
      }}
    >
      <AppIcon
        name={backlog ? "check" : "calendar"}
        size={theme.layout.iconLarge}
      />
      <AppText variant="body" tone="muted">
        {backlog ? copy.poolEmpty : copy.noDates}
      </AppText>
      {canSetDates ? (
        <AppButton variant="soft" onPress={onDates}>
          {copy.dates}
        </AppButton>
      ) : null}
    </View>
  );
}

export function TripTimelineTail({
  trip,
  day,
  empty,
  canEdit,
  onAdd,
  returnSummary,
}: {
  trip: Trip;
  day?: TripDay;
  empty: boolean;
  canEdit: boolean;
  onAdd: () => void;
  returnSummary?: string;
}) {
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();

  return (
    <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.lg }}>
      {day && empty ? (
        <View style={{ gap: theme.spacing.sm }}>
          <AppText variant="label">
            {canEdit ? copy.empty : copy.historyEmpty}
          </AppText>
          {canEdit ? (
            <AppText variant="caption" tone="muted">
              {copy.emptyHint}
            </AppText>
          ) : null}
        </View>
      ) : null}
      {day?.returnToStart ? (
        <AppText variant="caption" tone="muted">
          {copy.returnLabel}:{" "}
          {day.startLocation || trip.accommodation || copy.unknownRoute}
          {returnSummary ? ` · ${returnSummary}` : ""}
        </AppText>
      ) : null}
      {day && canEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.add}
          onPress={onAdd}
          style={({ pressed }) => ({
            alignSelf: "center",
            alignItems: "center",
            justifyContent: "center",
            minWidth: theme.layout.touchTarget,
            minHeight: theme.layout.touchTarget,
            gap: theme.spacing.xs,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            opacity: pressed ? theme.motion.pressOpacity : 1,
          })}
        >
          <View
            style={{
              width: theme.layout.touchTarget,
              height: theme.layout.touchTarget,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.surfaceTint,
              boxShadow: [
                { ...theme.elevation.glass, color: theme.colors.glassShadow },
              ],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GlassBackdrop borderRadius={theme.radius.full} />
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: theme.radius.full,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.colors.softActionBorder,
                },
              ]}
            />
            <AppIcon
              name="plus"
              size={theme.typography.fontSize.display}
              color={theme.colors.primaryText}
            />
          </View>
          <AppText variant="caption" tone="primary">
            {copy.add}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
