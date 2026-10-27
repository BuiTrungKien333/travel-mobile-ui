import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppIcon } from "@/components/ui/app-icon";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import type { TripDay } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { getOptimizationComparison } from "../utils/trip-optimization-preview";
import { suggestedDayOrder } from "../data/trip-details-preview";
import {
  useTripTimelineDrag,
  type TripTimelineDrag,
} from "../hooks/use-trip-timeline-drag";
import { TripDetailsSheet } from "./trip-details-sheet";
import { TripReorderList } from "./trip-reorder";

export function TripOptimizationSheet({
  day,
  onApply,
  onClose,
}: {
  day?: TripDay;
  onApply: (ids: string[]) => void;
  onClose: () => void;
}) {
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();
  const [order, setOrder] = useState(() =>
    day ? suggestedDayOrder(day) : null,
  );
  const byId = new Map(day?.stops.map((stop) => [stop.id, stop]));
  const stops = (order ?? []).flatMap((id) => {
    const stop = byId.get(id);
    return stop ? [stop] : [];
  });
  const drag = useTripTimelineDrag({
    stops,
    selectionKey: day?.date ?? "",
    onReorder: setOrder,
  });
  const dragging = drag.draggedId !== null;
  const changed =
    !!day &&
    !!order &&
    day.stops.some((stop, index) => stop.id !== order[index]);
  return (
    <TripDetailsSheet
      title={copy.optimizeTitle}
      onClose={onClose}
      heightRatio={theme.layout.tripOptimizationSheetHeightRatio}
      scrollEnabled={!dragging}
      footer={
        <AppButton
          variant="gradient"
          disabled={!changed || dragging}
          onPress={() => {
            if (order && changed && !dragging) onApply(order);
          }}
        >
          {copy.apply}
        </AppButton>
      }
    >
      <TripOptimizationPreview
        day={day}
        order={order}
        stops={stops}
        drag={drag}
      />
    </TripDetailsSheet>
  );
}

function TripOptimizationPreview({
  day,
  order,
  stops,
  drag,
}: {
  day?: TripDay;
  order: string[] | null;
  stops: TripDay["stops"];
  drag: TripTimelineDrag;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  if (!day || !order)
    return <AppText tone="muted">{copy.noOptimization}</AppText>;
  const changed = day.stops.some((stop, index) => stop.id !== order[index]);
  const comparison = getOptimizationComparison(day, order);
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const distanceTextStyle = {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
  };
  let savings = "";
  if (comparison) {
    const km = format.format(Math.abs(comparison.savedKm));
    const minutes = format.format(Math.abs(comparison.savedMinutes));
    if (comparison.savedKm === 0 && comparison.savedMinutes === 0)
      savings = copy.optimizationNoChange;
    else if (comparison.savedKm >= 0 && comparison.savedMinutes >= 0)
      savings = `${copy.optimizationSaved} ${km} km – ${minutes} ${copy.minutes}`;
    else if (comparison.savedKm <= 0 && comparison.savedMinutes <= 0)
      savings = `${copy.optimizationAdded} ${km} km – ${minutes} ${copy.minutes}`;
    else
      savings = `${comparison.savedKm > 0 ? copy.optimizationSaved : copy.optimizationAdded} ${km} km – ${comparison.savedMinutes > 0 ? copy.optimizationSaved : copy.optimizationAdded} ${minutes} ${copy.minutes}`;
  }
  const byId = new Map(day.stops.map((stop) => [stop.id, stop]));
  const sections = [
    { title: copy.after, ids: order, suggested: true },
    {
      title: copy.before,
      ids: day.stops.map((stop) => stop.id),
      suggested: false,
    },
  ];
  return (
    <>
      <View
        style={[
          styles.row,
          {
            gap: theme.spacing.md,
            padding: theme.spacing.md,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.softActionBorder,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surfaceTint,
            overflow: "hidden",
          },
        ]}
      >
        <GlassBackdrop borderRadius={theme.radius.md} />
        <AppIcon
          name="pin"
          size={theme.layout.iconMedium}
          color={theme.colors.primaryText}
        />
        <View style={{ flex: 1, minWidth: 0, gap: theme.spacing.xs }}>
          {comparison ? (
            <>
              <AppText
                variant="label"
                style={[
                  distanceTextStyle,
                  { fontSize: theme.typography.fontSize.previousDistance },
                ]}
              >
                {format.format(comparison.before.km)} km →{" "}
                <AppText
                  variant="label"
                  tone="primary"
                  style={distanceTextStyle}
                >
                  {format.format(comparison.after.km)} km
                </AppText>
              </AppText>
              <AppText variant="caption" tone="muted">
                ({savings})
              </AppText>
            </>
          ) : (
            <AppText variant="caption" tone="muted">
              {copy.optimizationMissingTravel}
            </AppText>
          )}
        </View>
      </View>
      {sections.map((section) => (
        <View key={section.title} style={{ gap: theme.spacing.sm }}>
          <AppText
            variant="label"
            tone={section.suggested ? "primary" : "default"}
          >
            {section.title}
          </AppText>
          {section.suggested ? (
            <>
              <AppText variant="caption" tone="muted">
                {copy.optimizationDragHint}
              </AppText>
              <View
                style={{
                  borderRadius: theme.radius.md,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.colors.softActionBorder,
                  paddingHorizontal: theme.spacing.md,
                }}
              >
                <TripReorderList
                  stops={stops}
                  slotTimes={day.stops.map((stop) => stop.time)}
                  drag={drag}
                  variant="compact"
                />
              </View>
            </>
          ) : (
            <View
              style={{
                borderRadius: theme.radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: section.suggested
                  ? theme.colors.softActionBorder
                  : theme.colors.border,
                backgroundColor: section.suggested
                  ? theme.colors.glassFallback
                  : theme.colors.surface,
                paddingHorizontal: theme.spacing.md,
              }}
            >
              {section.ids.map((id, index) => {
                const stop = byId.get(id);
                if (!stop) return null;
                return (
                  <View
                    key={id}
                    style={[
                      styles.row,
                      {
                        gap: theme.spacing.sm,
                        paddingVertical: theme.spacing.md,
                        borderBottomWidth:
                          index < section.ids.length - 1
                            ? StyleSheet.hairlineWidth
                            : 0,
                        borderBottomColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View
                      style={{
                        width: theme.layout.sampleStopNumberSize,
                        height: theme.layout.sampleStopNumberSize,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: theme.radius.full,
                        backgroundColor: section.suggested
                          ? theme.colors.surfaceTint
                          : theme.colors.glassInset,
                      }}
                    >
                      <AppText
                        variant="caption"
                        tone={section.suggested ? "primary" : "muted"}
                      >
                        {index + 1}
                      </AppText>
                    </View>
                    <AppText style={{ flex: 1 }}>{stop.name[locale]}</AppText>
                    {stop.pinned ? (
                      <View accessible accessibilityLabel={copy.pinned}>
                        <AppIcon
                          name="pin"
                          size={theme.layout.iconSmall}
                          color={theme.colors.primaryText}
                        />
                      </View>
                    ) : null}
                    <AppText variant="caption" tone="muted">
                      {day.stops[index].time || copy.noTime}
                    </AppText>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ))}
      {!changed ? (
        <AppText variant="caption" tone="muted">
          {copy.alreadyGood}
        </AppText>
      ) : null}
      <AppText variant="caption" tone="muted">
        {copy.optimizeHint}
      </AppText>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
});
