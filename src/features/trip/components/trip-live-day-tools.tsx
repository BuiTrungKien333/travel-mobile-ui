import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TripDay } from "@/features/home/types/home-types";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import type { TripDetailsSheetState } from "../types/trip-details-types";

export function TripLiveDayTools({
  day,
  canEdit,
  canOptimize,
  routeSummary,
  routeMetrics,
  transportLabel,
  transportIcon,
  onSheetChange,
  onEditDay,
  actions,
}: {
  day?: TripDay;
  canEdit: boolean;
  canOptimize: boolean;
  routeSummary: string;
  routeMetrics?: { km: number; minutes: number };
  transportLabel?: string;
  transportIcon?: "car" | "walk" | "route";
  onSheetChange: (sheet: TripDetailsSheetState) => void;
  onEditDay?: () => void;
  actions?: ReactNode;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const summary = routeMetrics
    ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(routeMetrics.km)} km (${routeMetrics.minutes} ${copy.minutes})`
    : routeSummary;
  return (
    <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.lg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
        }}
      >
        <AppText variant="body" style={{ flex: 1, minWidth: 0 }}>
          <AppText
            variant="label"
            style={{ fontFamily: theme.typography.fontFamily.bold }}
          >
            {day?.stops.length ?? 0} {copy.places}
          </AppText>
          <AppText variant="body" tone="muted">{` · ${summary}`}</AppText>
        </AppText>
        {day ? (
          <ToolbarPill
            label={transportLabel ?? copy[day.transport ?? "car"]}
            accessibilityLabel={`${copy.transport}: ${transportLabel ?? copy[day.transport ?? "car"]}`}
            icon={transportIcon ?? day.transport ?? "car"}
            disabled={!canEdit}
            onPress={() => onSheetChange({ kind: "transport" })}
            trailing={
              <View style={{ transform: [{ rotate: "90deg" }] }}>
                <AppIcon name="chevron" size={theme.layout.iconSmall} />
              </View>
            }
          />
        ) : null}
      </View>
      {day ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            alignSelf: "flex-end",
            width: "100%",
            maxWidth: theme.layout.tripLiveToolbarMaxWidth,
            gap: theme.spacing.sm,
          }}
        >
          <ToolbarPill
            equalWidth
            label={copy.optimizeShort}
            accessibilityLabel={copy.optimize}
            icon="sparkles"
            accent
            disabled={!canOptimize}
            onPress={() => onSheetChange({ kind: "optimize" })}
          />
          <ToolbarPill
            equalWidth
            label={copy.reorder}
            disabled={!canEdit || day.stops.length < 2}
            onPress={() => onSheetChange({ kind: "reorder" })}
          />
          <ToolbarPill
            equalWidth
            label={copy.editScheduleShort}
            accessibilityLabel={copy.daySettings}
            icon="daySchedule"
            disabled={!canEdit || !onEditDay}
            onPress={() => onEditDay?.()}
          />
        </View>
      ) : null}
      {day && day.stops.length > 0 && day.stops.some((stop) => !stop.time) ? (
        <AppText
          variant="caption"
          tone="muted"
          accessibilityLiveRegion="polite"
        >
          {day.stops[0]?.time || day.startTime
            ? copy.timelineIncomplete
            : copy.timelineChooseDeparture}
        </AppText>
      ) : null}
      {actions}
    </View>
  );
}

function ToolbarPill({
  label,
  accessibilityLabel,
  icon,
  trailing,
  accent = false,
  equalWidth = false,
  disabled = false,
  onPress,
}: {
  label: string;
  accessibilityLabel?: string;
  icon?: AppIconName;
  trailing?: ReactNode;
  accent?: boolean;
  equalWidth?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const color = accent ? theme.colors.onPrimary : theme.colors.primaryText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        flex: equalWidth ? 1 : undefined,
        flexBasis: equalWidth ? 0 : undefined,
        alignItems: "center",
        justifyContent: "center",
        minHeight: theme.layout.compactTouchTarget,
        minWidth: equalWidth ? 0 : theme.layout.compactTouchTarget,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        gap: theme.spacing.xs,
        borderRadius: theme.radius.full,
        overflow: "hidden",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: accent ? theme.colors.primary : theme.colors.border,
        backgroundColor: accent
          ? theme.colors.primary
          : theme.colors.glassInset,
        opacity: disabled
          ? theme.motion.pressOpacity
          : pressed
            ? theme.motion.pressOpacity
            : 1,
      })}
    >
      <GlassBackdrop borderRadius={theme.radius.full} />
      {icon ? (
        <AppIcon
          name={icon}
          variant="light"
          size={theme.layout.iconSmall}
          color={color}
        />
      ) : null}
      <AppText
        variant="label"
        style={{ color, fontFamily: theme.typography.fontFamily.semibold, flexShrink: 1, textAlign: "center" }}
      >
        {label}
      </AppText>
      {trailing}
    </Pressable>
  );
}
