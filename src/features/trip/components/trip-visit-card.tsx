import { Pressable, StyleSheet, Switch, View } from "react-native";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppText } from "@/components/ui/app-text";
import { AppIcon } from "@/components/ui/app-icon";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { Trip, TripStop } from "@/features/home/types/home-types";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { visitTimeRange } from "../utils/trip-details-layout";

export function TripVisitCard({
  trip,
  stop,
  date,
  onEdit,
  onPin,
  onRemove,
}: {
  trip: Trip;
  stop: TripStop;
  date: string | null;
  onEdit?: () => void;
  onPin?: (value: boolean) => void;
  onRemove?: () => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const index = trip.days.findIndex((day) => day.date === date);
  const dateText = date
    ? new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
      }).format(new Date(`${date}T12:00:00Z`))
    : "";
  const range = visitTimeRange(stop);
  return (
    <View
      style={{
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
        borderRadius: theme.radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.softActionBorder,
        overflow: "hidden",
      }}
    >
      <GlassBackdrop borderRadius={theme.radius.lg} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
        }}
      >
        <AppText variant="label" style={{ flex: 1 }}>
          {copy.yourVisit}
        </AppText>
        {onEdit ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.editVisit}
            onPress={onEdit}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.xs,
              minHeight: theme.layout.compactTouchTarget,
              minWidth: theme.layout.compactTouchTarget,
              justifyContent: "center",
              opacity: pressed ? theme.motion.pressOpacity : 1,
            })}
          >
            <AppIcon
              name="edit"
              variant="light"
              size={theme.layout.iconSmall}
              color={theme.colors.primaryText}
            />
            <AppText variant="caption" tone="primary">
              {copy.editVisitAction}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      <AppText variant="caption" tone="muted">
        {trip.destination} ·{" "}
        {index >= 0 ? `${copy.day} ${index + 1}, ${dateText}` : copy.pool}
      </AppText>
      <View style={{ gap: theme.spacing.xs }}>
        <AppText variant="label" tone="primary">
          {copy.expectedVisit}: {range?.label ?? copy.noTime}
        </AppText>
        <AppText variant="caption" tone="muted">
          {stop.durationMinutes ?? 45} {copy.visitDurationUnit}
          {range?.nextDay ? ` · ${copy.visitNextDay}` : ""}
        </AppText>
      </View>
      {onPin || stop.pinned ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
            paddingTop: theme.spacing.sm,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.colors.softActionBorder,
          }}
        >
          <AppIcon
            name="pin"
            variant="light"
            size={theme.layout.iconSmall}
            color={theme.colors.primaryText}
          />
          <AppText variant="caption" style={{ flex: 1 }}>
            {copy.visitPin}
          </AppText>
          <Switch
            accessibilityLabel={copy.visitPin}
            disabled={!onPin}
            value={stop.pinned ?? false}
            onValueChange={onPin}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primaryText,
            }}
            thumbColor={theme.colors.surface}
          />
        </View>
      ) : null}
      {stop.note ? (
        <AppText variant="caption" tone="muted">
          {stop.note}
        </AppText>
      ) : null}
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRemove}
          style={({ pressed }) => ({
            minHeight: theme.layout.compactTouchTarget,
            justifyContent: "center",
            alignSelf: "flex-start",
            opacity: pressed ? theme.motion.pressOpacity : 1,
          })}
        >
          <View
            style={{
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.error,
              borderRadius: theme.radius.sm,
            }}
          >
            <AppText variant="caption" tone="error">
              {date ? copy.unschedule : copy.remove}
            </AppText>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
