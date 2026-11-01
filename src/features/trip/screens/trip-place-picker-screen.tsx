import { router } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { todayCalendarDate } from "@/utils/calendar-date";
import type { TripStop } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import { getTripDetailsMode } from "../utils/trip-details-layout";
import { PlacePickerScreen } from "./place-picker-screen";
import { useAddTripPlaceMutation, useTripPlacesQuery, useTripQuery } from "../api/trip-hooks";
import { useSaveItineraryMutation, useTripItineraryQuery } from "../api/itinerary-hooks";
import { toSaveItineraryRequest, toTrip, toTripStop } from "../api/trip-adapters";
import { applyTripMutation } from "../utils/trip-mutations";

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/tabs/trips");
}
export function TripPlacePickerScreen({
  tripId,
  date,
}: {
  tripId?: string;
  date?: string;
}) {
  const tripQuery = useTripQuery(tripId);
  const placesQuery = useTripPlacesQuery(tripId);
  const itineraryQuery = useTripItineraryQuery(tripId);
  const addPlace = useAddTripPlaceMutation(tripId ?? "");
  const saveItinerary = useSaveItineraryMutation(tripId ?? "");
  const trip = tripQuery.data ? toTrip(tripQuery.data, placesQuery.data ?? [], itineraryQuery.data) : undefined;
  const today = todayCalendarDate();
  const theme = useAppTheme();
  const { copy } = usePlaceSearchCopy();
  const { copy: detailsCopy } = useTripDetailsCopy();
  if (tripQuery.isPending || placesQuery.isPending || itineraryQuery.isPending)
    return <ScreenSafeArea style={{ flex: 1, backgroundColor: theme.colors.background }}><View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={theme.colors.primary} /></View></ScreenSafeArea>;
  if (tripQuery.isError || placesQuery.isError || itineraryQuery.isError)
    return <ScreenSafeArea style={{ flex: 1, backgroundColor: theme.colors.background }}><View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}><AppText accessibilityRole="alert" tone="error">{detailsCopy.itineraryLoadError}</AppText><AppButton variant="outline" onPress={() => { void tripQuery.refetch(); void placesQuery.refetch(); void itineraryQuery.refetch(); }}>{detailsCopy.retry}</AppButton><AppButton onPress={goBack}>{copy.back}</AppButton></View></ScreenSafeArea>;
  if (!trip || (date && !trip.days.some((day) => day.date === date)))
    return (
      <ScreenSafeArea
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
          <AppText>{copy.missing}</AppText>
          <AppButton onPress={goBack}>{copy.back}</AppButton>
        </View>
      </ScreenSafeArea>
    );
  return (
    <PlacePickerScreen
      key={trip.id}
      trip={trip}
      destination={trip.destination}
      initialDate={date ?? null}
      onClose={goBack}
      onApply={async (stops, targetDate) => {
        if (getTripDetailsMode(trip, today) === "cancelled") return false;
        const savedStops: TripStop[] = [];
        for (const [index, stop] of stops.entries()) {
          if (!stop.location) throw new Error("PLACE_COORDINATES_REQUIRED");
          const saved = await addPlace.mutateAsync({
            ...(stop.providerPlaceId ? { providerPlaceId: stop.providerPlaceId } : {}),
            name: stop.name.vi,
            latitude: stop.location.latitude,
            longitude: stop.location.longitude,
            ...(stop.address?.vi ? { address: stop.address.vi } : {}),
            category: stop.kind.vi,
            ...(stop.durationMinutes ? { estimatedDuration: stop.durationMinutes } : {}),
            ...(stop.note ? { notes: stop.note } : {}),
            plannedOrder: (placesQuery.data?.length ?? 0) + index,
          });
          savedStops.push(toTripStop(saved));
        }
        if (targetDate !== null && savedStops.length) {
          const candidate = applyTripMutation(trip, {
            kind: "add",
            date: targetDate,
            stops: savedStops,
          });
          if (!candidate) throw new Error("INVALID_TRIP_MUTATION");
          await saveItinerary.mutateAsync(toSaveItineraryRequest(candidate));
        }
        goBack();
        return true;
      }}
    />
  );
}
