import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityState,
} from "react-native";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { TripStatusBadge } from "./trip-status-badge";
import { AppText } from "@/components/ui/app-text";
import type { Trip } from "@/features/home/types/home-types";
import { tripDuration } from "@/features/home/utils/select-home";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import type { TripDetailsMode } from "../utils/trip-details-layout";
import { formatTripDates, getTripTitle } from "../utils/trip-formatters";

export function TripDetailsHeader({
  trip,
  mode,
  onBack,
  onMenu,
  hideTripInfo = false,
  titleOnly = false,
  onEdit,
  onOpenMap,
}: {
  trip: Trip;
  mode: TripDetailsMode;
  onBack: () => void;
  onMenu: () => void;
  hideTripInfo?: boolean;
  titleOnly?: boolean;
  onEdit?: () => void;
  onOpenMap?: () => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const days = tripDuration(trip);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacing.sm,
        paddingTop:
          hideTripInfo || titleOnly ? theme.spacing.xxl : theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: titleOnly ? StyleSheet.hairlineWidth : 0,
        borderBottomColor: theme.colors.border,
      }}
    >
      <DetailIconButton name="back" label={copy.back} onPress={onBack} />
      {!hideTripInfo ? (
        <View
          style={{
            flex: 1,
            minWidth: 0,
            gap: theme.spacing.xs,
            paddingTop: titleOnly ? theme.spacing.none : theme.spacing.xs,
            minHeight: titleOnly ? theme.layout.compactTouchTarget : undefined,
            justifyContent: titleOnly ? "center" : undefined,
          }}
        >
          <AppText
            accessibilityRole="header"
            variant="label"
            style={
              titleOnly
                ? {
                    fontSize: theme.typography.fontSize.md,
                    lineHeight: theme.typography.lineHeight.md,
                  }
                : undefined
            }
          >
            {getTripTitle(trip, locale)}
          </AppText>
          {!titleOnly ? (
            <>
              <AppText variant="caption" tone="muted">
                {formatTripDates(trip, locale)}
                {days > 0
                  ? ` · ${days} ${days === 1 ? copy.day.toLowerCase() : copy.daysUnit}`
                  : ""}
              </AppText>
              <TripStatusBadge status={mode === "live" ? "ongoing" : mode === "recap" ? "completed" : mode === "cancelled" ? "cancelled" : trip.status === "draft" ? "draft" : "upcoming"} locale={locale} />
            </>
          ) : null}
        </View>
      ) : null}
      {onEdit && onOpenMap ? (
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.none,
            marginRight: -theme.spacing.sm,
          }}
        >
          <DetailIconButton
            compact
            name="edit"
            label={copy.edit}
            onPress={onEdit}
          />
          <DetailIconButton
            compact
            name="map"
            label={copy.reopenMap}
            onPress={onOpenMap}
          />
        </View>
      ) : (
        <DetailIconButton name="more" label={copy.menu} onPress={onMenu} />
      )}
    </View>
  );
}

export function DetailIconButton({
  name,
  label,
  onPress,
  accessibilityState,
  compact = false,
}: {
  name: AppIconName;
  label: string;
  onPress: () => void;
  accessibilityState?: AccessibilityState;
  compact?: boolean;
}) {
  const theme = useAppTheme();
  const surfaceSize = compact
    ? theme.layout.compactIconButtonSurfaceSize
    : theme.layout.compactTouchTarget;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={accessibilityState}
      onPress={onPress}
      style={({ pressed }) => ({
        width: theme.layout.touchTarget,
        height: theme.layout.touchTarget,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: theme.radius.full,
        opacity: pressed ? theme.motion.pressOpacity : 1,
      })}
    >
      <View
        style={{
          width: surfaceSize,
          height: surfaceSize,
          borderRadius: theme.radius.full,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <GlassBackdrop borderRadius={theme.radius.full} />
        <AppIcon
          name={name}
          variant={name === "back" || compact ? "light" : undefined}
          size={compact ? theme.layout.iconSmall : theme.layout.iconMedium}
          color={theme.colors.primaryText}
        />
      </View>
    </Pressable>
  );
}
