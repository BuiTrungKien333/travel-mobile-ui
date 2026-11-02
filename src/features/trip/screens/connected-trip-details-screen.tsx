import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripQuery } from "../api/trip-queries";
import { tripViewModel } from "../api/trip-contract";
import {
  TripDetailsHeader,
  DetailIconButton,
} from "../components/trip-details-header";
import { TripPlanningMap } from "../components/trip-planning-map";
import { TripPlanningDaySelector } from "../components/trip-planning-day-selector";
import { ConnectedTripActions } from "../components/connected-trip-actions";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import {
  tripApiErrorMessage,
  useTripIntegrationCopy,
} from "../i18n/trip-integration-copy";

function back() {
  if (router.canGoBack()) router.back();
  else router.replace("/tabs/trips");
}

export function ConnectedTripDetailsScreen({
  tripId,
  selectedDate,
}: {
  tripId?: string;
  selectedDate?: string;
}) {
  const theme = useAppTheme();
  const { copy } = useTripIntegrationCopy();
  const { copy: detailCopy } = useTripDetailsCopy();
  const query = useTripQuery(tripId);
  const [date, setDate] = useState<string | null | undefined>(selectedDate);
  const [viewport, setViewport] = useState(0);
  const resizeLock = useSharedValue(0);
  const read = query.data;
  const [actionsOpen, setActionsOpen] = useState(false);
  if (!read)
    return (
      <ScreenSafeArea
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
          <DetailIconButton
            name="back"
            label={detailCopy.back}
            onPress={back}
          />
          <AppText accessibilityRole={query.isError ? "alert" : undefined}>
            {query.isError
              ? tripApiErrorMessage(query.error, copy)
              : tripId
                ? copy.loading
                : copy.missing}
          </AppText>
          {query.isError ? (
            <AppButton
              size="small"
              onPress={() => {
                void query.refetch();
              }}
            >
              {copy.retry}
            </AppButton>
          ) : null}
        </View>
      </ScreenSafeArea>
    );
  const trip = tripViewModel(read.trip, read.trip);
  const activeDate =
    date === undefined
      ? (trip.days.find((day) => day.date === read.context.evaluatedDate)
          ?.date ?? trip.days[0]?.date)
      : date;
  const mode = {
    PLANNING: "planning",
    LIVE: "live",
    RECAP: "recap",
    CANCELLED: "cancelled",
  } as const;
  return (
    <ScreenSafeArea
      edges={["top", "left", "right", "bottom"]}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <View
        style={{ flex: 1 }}
        onLayout={(event) => setViewport(event.nativeEvent.layout.height)}
      >
        <TripPlanningMap
          header={
            <TripDetailsHeader
              trip={trip}
              mode={mode[read.trip.mode]}
              titleOnly
              onBack={back}
              onMenu={() => setActionsOpen(true)}
            />
          }
          viewportHeight={viewport}
          selectorHeight={theme.layout.touchTarget}
          resizeLock={resizeLock}
          showStart={false}
          showLocationControl={false}
          mapContent={
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                padding: theme.spacing.xl,
                backgroundColor: theme.colors.surfaceTint,
              }}
            >
              <AppText variant="caption" tone="muted">
                {copy.unavailable}
              </AppText>
            </View>
          }
        />
        <TripPlanningDaySelector
          trip={trip}
          selectedDate={activeDate ?? undefined}
          backlog={date === null}
          backlogCount={read.trip.readiness.unscheduledCount}
          onSelect={setDate}
          addDayDisabled
        />
        <ScrollView
          contentContainerStyle={{
            padding: theme.spacing.lg,
            gap: theme.spacing.lg,
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: theme.radius.md,
              padding: theme.spacing.lg,
              gap: theme.spacing.sm,
            }}
          >
            <AppText variant="label">{trip.title}</AppText>
            <AppText tone="muted">{trip.destination}</AppText>
            <AppText variant="caption">
              {read.trip.startDate} – {read.trip.endDate}
            </AppText>
            {read.trip.budget ? (
              <>
                <AppText variant="caption" tone="muted">
                  {copy.budget}
                </AppText>
                <AppText>
                  {read.trip.budget.amount.toLocaleString()}{" "}
                  {read.trip.budget.currency}
                </AppText>
              </>
            ) : null}
            {read.trip.accommodation ? (
              <>
                <AppText variant="caption" tone="muted">
                  {copy.accommodation}
                </AppText>
                <AppText>{read.trip.accommodation}</AppText>
              </>
            ) : null}
            <AppText variant="caption" tone="muted">
              {copy.notes}
            </AppText>
            <AppText>{read.trip.notes || copy.noNotes}</AppText>
          </View>
          <AppText variant="caption" tone="muted">
            {copy.pending}
          </AppText>
          {query.isError ? (
            <AppText accessibilityRole="alert">
              {tripApiErrorMessage(query.error, copy)}
            </AppText>
          ) : null}
        </ScrollView>
      </View>
      {actionsOpen ? (
        <ConnectedTripActions
          read={read}
          onClose={() => setActionsOpen(false)}
          onReload={async () => {
            const result = await query.refetch();
            return result.isError ? undefined : result.data;
          }}
          onDeleted={() => router.replace("/tabs/trips")}
        />
      ) : null}
    </ScreenSafeArea>
  );
}
