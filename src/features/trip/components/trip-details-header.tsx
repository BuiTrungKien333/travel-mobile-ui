import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityState,
} from "react-native";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { Trip } from "@/features/home/types/home-types";
import { tripDuration } from "@/features/home/utils/select-home";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import type { TripDetailsMode } from "../utils/trip-details-layout";
import {
  formatTripDates,
  getTripTitle,
  getTripDisplayStatus,
} from "../utils/trip-formatters";

export function TripDetailsHeader({
  trip,
  mode,
  today,
  onBack,
  onMenu,
  hideTripInfo = false,
  titleOnly = false,
  onEdit,
  onOpenMap,
}: {
  trip: Trip;
  mode: TripDetailsMode;
  today: string;
  onBack: () => void;
  onMenu?: () => void;
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
              <View
                style={{
                  alignSelf: "flex-start",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.spacing.xs,
                  backgroundColor:
                    mode === "live"
                      ? theme.colors.successSurface
                      : theme.colors.surfaceTint,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xxs,
                  borderRadius: theme.radius.full,
                }}
              >
                {mode === "live" ? (
                  <View
                    style={{
                      width: theme.spacing.sm,
                      height: theme.spacing.sm,
                      borderRadius: theme.radius.full,
                      backgroundColor: theme.colors.success,
                    }}
                  />
                ) : null}
                <AppText
                  variant="caption"
                  style={{
                    color:
                      mode === "live"
                        ? theme.colors.onSuccessSurface
                        : theme.colors.primaryText,
                  }}
                >
                  {mode === "planning" &&
                  getTripDisplayStatus(trip, today) === "upcoming"
                    ? copy.upcoming
                    : copy[mode]}
                </AppText>
              </View>
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
      ) : onMenu ? (
        <DetailIconButton name="more" label={copy.menu} onPress={onMenu} />
      ) : null}
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
        width: theme.layout.compactTouchTarget,
        height: theme.layout.compactTouchTarget,
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
