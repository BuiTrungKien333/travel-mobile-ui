import { router } from "expo-router";
import { useState } from "react";
import { Linking, ActivityIndicator, View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripQuery, useTripPlacesQuery } from "@/features/trip/api/trip-hooks";
import { useTripItineraryQuery } from "@/features/trip/api/itinerary-hooks";
import { toTrip } from "@/features/trip/api/trip-adapters";
import { useTripVisit } from "@/features/trip/hooks/use-trip-visit";
import { getDayProgress } from "../utils/day-progress";
import { tripDirectionsUrl } from "../utils/map-links";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import { useHomeCopy } from "../i18n/home-copy";
import { NextStopCard } from "./ongoing-trip-components";
import type { Trip } from "../types/home-types";

export function HomeLiveJourney({ tripId, today }: { tripId: string; today: string }) {
  const trip = useTripQuery(tripId);
  const places = useTripPlacesQuery(tripId);
  const itinerary = useTripItineraryQuery(tripId);
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  if (!trip.data || !places.data || !itinerary.data) return <View style={{ gap: theme.spacing.sm }}>
    {trip.isError || places.isError || itinerary.isError ? <>
      <AppText accessibilityRole="alert" tone="error">{copy.memoriesLoadError}</AppText>
      <AppButton variant="outline" onPress={() => { void trip.refetch(); void places.refetch(); void itinerary.refetch(); }}>{copy.retry}</AppButton>
    </> : <ActivityIndicator color={theme.colors.primary} />}
  </View>;
  return <LiveJourney trip={toTrip(trip.data, places.data, itinerary.data)} today={today} />;
}

function LiveJourney({ trip, today }: { trip: Trip; today: string }) {
  const day = trip.days.find((entry) => entry.date === today);
  const visit = useTripVisit(trip);
  const { copy } = useOngoingCopy();
  const [error, setError] = useState<string | null>(null);
  const progress = getDayProgress(day?.stops ?? [], (day?.stops ?? []).filter((stop) => stop.visited).map((stop) => stop.id));
  if (trip.status === "cancelled" || !day) return null;
  const openPlan = () => router.push({ pathname: "/trip/[tripId]", params: { tripId: trip.id, day: today } });
  return <View>
    <NextStopCard stop={progress.nextStop} hasStops={day.stops.length > 0} busy={visit.isPending}
      onDirections={() => {
        if (progress.nextStop) void Linking.openURL(tripDirectionsUrl(progress.nextStop, trip.destination, day.transport))
          .catch(() => setError(copy.directionsError));
      }}
      onVisited={() => {
        if (!progress.nextStop) return;
        setError(null);
        void visit.setVisited(progress.nextStop.id, today, true).catch(() => setError(copy.visitError));
      }} onPlan={openPlan} onJournal={() => router.push({ pathname: "/memories/[tripId]", params: { tripId: trip.id } })} />
    {error ? <AppText accessibilityRole="alert" tone="error">{error}</AppText> : null}
  </View>;
}
