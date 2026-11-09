import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { tripViewModel } from "@/features/trip/api/trip-contract";
import {
  tripApiErrorMessage,
  useTripIntegrationCopy,
} from "@/features/trip/i18n/trip-integration-copy";
import { useMemoryActions } from "@/features/memories/hooks/use-memories";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useHomeDashboard, useHomeActions } from "../api/home-queries";
import { homeMemories, homeNextStop } from "../api/home-api";
import { HomePage } from "../components/home-primitives";
import { UpcomingTripCard } from "../components/upcoming-trip-card";
import { JourneyInvitationCard } from "../components/journey-invitation-card";
import { TripCompletionCard } from "../components/trip-completion-card";
import { FootprintCard } from "../components/footprint-card";
import { JournalAlbum } from "../components/journal-album";
import { TripRecapCard } from "@/features/trip/components/trip-recap-card";
import { TravelWeatherDashboard } from "../components/travel-weather-dashboard";
import {
  TripWeatherModal,
  WeatherQueryStatus,
} from "../components/connected-trip-weather";
import { useTripWeather } from "@/features/weather/api/weather-queries";
import { weatherDays, weatherIcon } from "@/features/weather/api/weather-api";
import { useLiveWeatherCopy } from "@/features/weather/i18n/weather-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import { useHomeCopy } from "../i18n/home-copy";
import type { Memory, TripStop } from "../types/home-types";
import { NewUserHomeScreen } from "./new-user-home-screen";
import { OngoingHomeScreen } from "./ongoing-home-screen";

/** Server selects one trip across the whole account; shared cards preserve the Home design. */
export function ConnectedHomeScreen() {
  const query = useHomeDashboard();
  const actions = useHomeActions();
  const memoryActions = useMemoryActions();
  const owner = useProfile().data?.id;
  const local = useTripPreview((state) => state.memories);
  const theme = useAppTheme();
  const { copy: errors } = useTripIntegrationCopy();
  const { copy } = useHomeCopy();
  const [weatherTripId, setWeatherTripId] = useState<string>();
  const data = query.data;
  const weatherDate =
    data?.state === "LIVE" ? data.context.evaluatedDate : undefined;
  const weather = useTripWeather(
    data && ["LIVE", "UPCOMING", "PLANNING"].includes(data.state)
      ? data.selectedTrip?.trip.id
      : undefined,
    weatherDate,
  );
  const { copy: weatherCopy } = useLiveWeatherCopy();
  const error = query.isError
    ? tripApiErrorMessage(query.error, errors)
    : actions.visit.isError
      ? tripApiErrorMessage(actions.visit.error, errors)
      : undefined;
  const refresh = () => {
    if (!actions.visit.isPending) actions.visit.reset();
    if (
      data?.selectedTrip &&
      ["LIVE", "UPCOMING", "PLANNING"].includes(data.state)
    ) {
      void weather.refetch();
    }
    void query.refetch();
  };
  const notice = error ? (
    <View style={{ gap: theme.spacing.sm }}>
      <AppText accessibilityRole="alert">{error}</AppText>
      <AppButton size="small" variant="outline" onPress={refresh}>
        {errors.retry}
      </AppButton>
    </View>
  ) : null;
  if (!data)
    return (
      <HomePage showHeader>
        {notice ?? (
          <AppText accessibilityLiveRegion="polite">
            {copy.dashboardLoading}
          </AppText>
        )}
      </HomePage>
    );
  if (data.selectedTrip === null)
    return (
      <NewUserHomeScreen
        onRefresh={refresh}
        refreshing={query.isRefetching}
        notice={notice}
      />
    );
  const read = data.selectedTrip;
  const trip = tripViewModel(read.trip, read.trip);
  const memories = homeMemories(data, local, owner ?? "");
  const plan = () =>
    router.push({ pathname: "/trip/[tripId]", params: { tripId: trip.id } });
  const journal = () => router.push("/tabs/memories");
  const tripJournal = () =>
    router.push({
      pathname: "/memories/[tripId]",
      params: { tripId: trip.id },
    });
  const camera = (stop?: TripStop) =>
    router.navigate({
      pathname: "/trip/camera",
      params: {
        tripId: trip.id,
        day: data.context.evaluatedDate,
        stopId: stop?.tripPlaceId ?? stop?.id ?? "",
      },
    });
  const remove = async (memory: Memory) => {
    if (memory.local) await memoryActions.remove.mutateAsync(memory);
    else await actions.removePhoto.mutateAsync(memory.id);
  };
  const weatherSheet =
    weatherTripId === trip.id ? (
      <TripWeatherModal
        tripId={trip.id}
        destination={trip.destination}
        date={weatherDate}
        onClose={() => setWeatherTripId(undefined)}
      />
    ) : null;
  if (data.state === "LIVE")
    return (
      <>
        <OngoingHomeScreen
          key={trip.id}
          trip={trip}
          dayIndex={data.dayIndex ?? 0}
          runtime={{
            today: data.context.evaluatedDate,
            nextStop: homeNextStop(data.nextStop),
            stopCount: data.todayStopCount,
            memories,
            busy: actions.visit.isPending,
            error,
            onRefresh: refresh,
            refreshing: query.isRefetching,
            onDetails: plan,
            onWeather: () => setWeatherTripId(trip.id),
            weather: weather.data?.current
              ? {
                  temperature: Math.round(weather.data.current.temperature),
                  condition: weatherIcon(weather.data.current.condition),
                  label: weatherCopy.conditions[weather.data.current.condition],
                }
              : undefined,
            onPlan: plan,
            onJournal: tripJournal,
            onCamera: camera,
            onDeletePhoto: remove,
            onVisit: async (stop) => {
              if (!stop.placeId) return false;
              try {
                await actions.visit.mutateAsync({
                  tripId: trip.id,
                  placeId: stop.placeId,
                });
                return true;
              } catch {
                return false;
              }
            },
          }}
        />
        {weatherSheet}
      </>
    );
  const preparing = data.state === "UPCOMING" || data.state === "PLANNING";
  const completion = data.firstEmptyDay;
  return (
    <>
      <HomePage showHeader onRefresh={refresh} refreshing={query.isRefetching}>
        <View style={{ gap: theme.spacing.xs }}>
          <AppText
            accessibilityRole="header"
            variant="title"
            style={{
              fontSize: preparing
                ? theme.typography.fontSize.xl
                : theme.typography.fontSize.lg,
              lineHeight: preparing
                ? theme.typography.lineHeight.xl
                : theme.typography.lineHeight.lg,
            }}
          >
            {copy.greeting}
          </AppText>
          <AppText tone="muted">
            {preparing
              ? data.state === "PLANNING"
                ? copy.planningSubtitle
                : copy.upcomingSubtitle
              : copy.returningSubtitle}
          </AppText>
        </View>
        {notice}
        {preparing ? (
          <>
            <UpcomingTripCard
              trip={trip}
              evaluatedDate={data.context.evaluatedDate}
              onPlan={plan}
            />
            <TravelWeatherDashboard
              key={trip.id}
              trip={trip}
              live
              forecastDays={weatherDays(weather.data)}
              onOpen={() => setWeatherTripId(trip.id)}
              locationName={weather.data?.location?.name}
              notice={<WeatherQueryStatus query={weather} />}
            />
            {completion ||
            !read.trip.readiness.hasDates ||
            read.trip.readiness.unscheduledCount > 0 ? (
              <TripCompletionCard
                title={
                  completion
                    ? `${copy.day} ${completion} ${copy.missingDay}`
                    : !read.trip.readiness.hasDates
                      ? copy.chooseTripDates
                      : `${read.trip.readiness.unscheduledCount} ${copy.unscheduledPlaces}`
                }
                action={completion ? copy.addPlace : copy.plan}
                onPress={plan}
              />
            ) : null}
          </>
        ) : (
          <>
            <JourneyInvitationCard variant="returning" />
            <TripRecapCard
              key={trip.id}
              trip={trip}
              dayCount={read.trip.dayCount}
              stopCount={read.trip.stopCount}
              memoryCount={read.trip.memoryCount}
              showCover
              onOpen={plan}
            />
          </>
        )}
        {data.footprint.hasHistory || !preparing ? (
          <FootprintCard
            provinces={data.footprint.provinces}
            visitedPlaces={data.footprint.places}
            onPress={journal}
          />
        ) : null}
        <JournalAlbum
          variant="recent"
          memories={memories}
          onOpen={journal}
          onDeletePhoto={remove}
        />
      </HomePage>
      {weatherSheet}
    </>
  );
}
