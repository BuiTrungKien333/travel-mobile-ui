import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { ItineraryOptimizationProposal } from "../api/itinerary-types";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { TripDetailsSheet } from "./trip-details-sheet";
import type { TripDay } from "@/features/home/types/home-types";

export function TripOptimizationSheet({
  proposal,
  loading,
  applying,
  error,
  onRetry,
  onApply,
  onClose,
  pinnedKeys = [],
  daySettings = [],
}: {
  proposal?: ItineraryOptimizationProposal;
  loading: boolean;
  applying: boolean;
  error?: string;
  onRetry: () => void;
  onApply: () => void;
  onClose: () => void;
  pinnedKeys?: string[];
  daySettings?: TripDay[];
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  return (
    <TripDetailsSheet
      title={copy.optimizeTitle}
      onClose={onClose}
      dismissible={!applying}
      heightRatio={theme.layout.tripOptimizationSheetHeightRatio}
      footer={
        <AppButton
          variant="gradient"
          disabled={!proposal || loading || applying}
          loading={applying}
          onPress={onApply}
        >
          {copy.apply}
        </AppButton>
      }
    >
      {loading ? <ActivityIndicator accessibilityLabel={copy.optimizeLoading} color={theme.colors.primary} /> : null}
      {error ? (
        <View style={{ gap: theme.spacing.sm }}>
          <AppText accessibilityRole="alert" tone="error">{error}</AppText>
          <AppButton variant="outline" disabled={loading} onPress={onRetry}>{copy.retryOptimization}</AppButton>
        </View>
      ) : null}
      {proposal ? (
        <View style={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
          <View style={[styles.summary, { backgroundColor: theme.colors.surfaceTint, borderColor: theme.colors.softActionBorder, borderRadius: theme.radius.md, padding: theme.spacing.md, gap: theme.spacing.xs }]}>
            <AppText variant="label">{copy.optimizedSummary}</AppText>
            <AppText variant="caption" tone="muted">{copy.optimizerEstimate}</AppText>
            <AppText>{copy.optimizedDistance}: {formatNumber(proposal.totalTripDistanceKm, locale)} km</AppText>
            <AppText>{copy.optimizedTravelTime}: {formatNumber(proposal.totalTripTransitMinutes, locale)} {copy.minutes}</AppText>
            {proposal.globalIssues?.length ? <AppText tone="error">{copy.optimizationIssues}: {proposal.globalIssues.length}</AppText> : null}
          </View>
          {proposal.dailySchedules.map((day, dayIndex) => (
            <View key={day.dayDate} style={{ gap: theme.spacing.sm }}>
              <AppText variant="label">{copy.day} {dayIndex + 1} · {formatDate(day.dayDate, locale)}</AppText>
              {daySettings.filter((entry) => entry.date === day.dayDate).map((settings) => (
                <View key={settings.date} style={{ gap: theme.spacing.xxs }}>
                  <AppText variant="caption" tone="muted">{copy[settings.transport ?? "car"]}{settings.startTime ? ` · ${settings.startTime}` : ""}</AppText>
                  {settings.startLocation ? <AppText variant="caption" tone="muted">{copy.startLocation}: {settings.startLocation}</AppText> : null}
                  {settings.returnToStart ? <AppText variant="caption" tone="primary">{copy.returnLabel}: {settings.startLocation}</AppText> : null}
                </View>
              ))}
              {day.scheduleItems.map((stop, index) => (
                <View key={`${day.dayDate}:${stop.placeId}`} style={[styles.stop, { borderBottomColor: theme.colors.border, gap: theme.spacing.sm, paddingVertical: theme.spacing.sm }]}>
                  <AppText variant="caption" tone="primary">{index + 1}</AppText>
                  <View style={{ flex: 1, gap: theme.spacing.xxs }}>
                    <AppText>{stop.placeName}</AppText>
                    {pinnedKeys.includes(`${day.dayDate}:${stop.placeId}`) ? <AppText variant="caption" tone="primary">{copy.pinned}</AppText> : null}
                    <AppText variant="caption" tone="muted">{formatTime(stop.arrivalTime)} · {stop.durationMinutes} {copy.minutes}</AppText>
                  </View>
                </View>
              ))}
            </View>
          ))}
          {applying ? <AppText accessibilityLiveRegion="polite" tone="muted">{copy.applyingOptimization}</AppText> : null}
        </View>
      ) : !loading && !error ? <AppText tone="muted">{copy.noOptimization}</AppText> : null}
    </TripDetailsSheet>
  );
}

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" })
    .format(new Date(`${value}T12:00:00Z`));
}

function formatTime(value: string) {
  return value.slice(11, 16);
}

const styles = StyleSheet.create({
  summary: { borderWidth: StyleSheet.hairlineWidth },
  stop: { flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth },
});
