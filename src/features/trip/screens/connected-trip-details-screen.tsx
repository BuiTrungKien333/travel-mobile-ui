import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Modal, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripQuery } from "../api/trip-queries";
import {
  useAddTripPlacesMutation,
  useTripPlacesQuery,
} from "../api/trip-hooks";
import { ConnectedPlacePickerScreen } from "./connected-place-picker-screen";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
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

import { TripWeatherModal } from "@/features/home/components/connected-trip-weather";
import { useLiveWeatherCopy } from "@/features/weather/i18n/weather-copy";

function back() {
  if (router.canGoBack()) router.back();
  else router.replace("/tabs/trips");
}

export function ConnectedTripDetailsScreen({
  tripId,
  selectedDate,
  expandMap = false,
}: {
  tripId?: string;
  selectedDate?: string;
  expandMap?: boolean;
}) {
  const theme = useAppTheme();
  const { copy } = useTripIntegrationCopy();
  const { copy: detailCopy } = useTripDetailsCopy();
  const query = useTripQuery(tripId);
  const places = useTripPlacesQuery(tripId);
  const addPlaces = useAddTripPlacesMutation(tripId ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const { copy: weatherCopy } = useLiveWeatherCopy();
  const { copy: placeCopy } = usePlaceSearchCopy();
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
          expandRequest={expandMap ? 1 : 0}
          header={
            <TripDetailsHeader
              trip={trip}
              mode={mode[read.trip.mode]}
              today={read.context.evaluatedDate}
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
        <FlatList
          data={places.data ?? []}
          keyExtractor={(place) => place.id}
          renderItem={({ item }) => (
            <View
              style={{
                padding: theme.spacing.md,
                gap: theme.spacing.xs,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
              }}
            >
              <AppText variant="label">{item.place.name}</AppText>
              <AppText variant="caption" tone="muted">
                {item.place.address ?? placeCopy.addressUnavailable}
              </AppText>
            </View>
          )}
          refreshing={places.isRefetching}
          onRefresh={() => {
            void places.refetch();
            void query.refetch();
          }}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            gap: theme.spacing.lg,
          }}
          ListHeaderComponent={
            <View style={{ gap: theme.spacing.lg }}>
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
                <AppButton
                  size="small"
                  variant="outline"
                  onPress={() => setWeatherOpen(true)}
                >
                  {weatherCopy.title}
                </AppButton>
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
              <AppText variant="subheading">{placeCopy.tripPlaces}</AppText>
              <AppText variant="caption" tone="muted">
                {placeCopy.tripPlacesHint}
              </AppText>
              {read.trip.mode !== "RECAP" && read.trip.mode !== "CANCELLED" ? (
                <AppButton onPress={() => setPickerOpen(true)}>
                  {placeCopy.title}
                </AppButton>
              ) : null}
              {places.isPending ? (
                <AppText>{placeCopy.loadingPlaces}</AppText>
              ) : places.isError ? (
                <View style={{ gap: theme.spacing.sm }}>
                  <AppText accessibilityRole="alert">
                    {tripApiErrorMessage(places.error, copy)}
                  </AppText>
                  <AppButton
                    size="small"
                    variant="outline"
                    onPress={() => void places.refetch()}
                  >
                    {copy.retry}
                  </AppButton>
                </View>
              ) : !places.data.length ? (
                <AppText tone="muted">{placeCopy.tripPlacesEmpty}</AppText>
              ) : null}
              {query.isError ? (
                <AppText accessibilityRole="alert">
                  {tripApiErrorMessage(query.error, copy)}
                </AppText>
              ) : null}
            </View>
          }
        />
      </View>
      {weatherOpen ? (
        <TripWeatherModal
          tripId={trip.id}
          destination={trip.destination}
          date={activeDate ?? undefined}
          onClose={() => setWeatherOpen(false)}
        />
      ) : null}
      {pickerOpen ? (
        <Modal
          visible
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => {
            if (!addPlaces.isPending) setPickerOpen(false);
          }}
        >
          <ConnectedPlacePickerScreen
            destination={trip.destination}
            scope={{ tripId: read.trip.id }}
            onClose={() => {
              if (!addPlaces.isPending) setPickerOpen(false);
            }}
            onApply={async (stops) => {
              await addPlaces.mutateAsync(stops.map((p) => p.placeId ?? p.id));
              setPickerOpen(false);
            }}
          />
        </Modal>
      ) : null}
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
