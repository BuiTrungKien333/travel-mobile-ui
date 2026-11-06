import { router } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import { PlacePickerScreen } from "./place-picker-screen";
import { useTripPlacesQuery, useTripQuery } from "../api/trip-hooks";
import { useTripItineraryQuery } from "../api/itinerary-hooks";
import { toTrip } from "../api/trip-adapters";
import { useAddTripPlaces } from "../hooks/use-add-trip-places";

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
  const addPlaces = useAddTripPlaces(tripId ?? "");
  const [completed, setCompleted] = useState(false);
  usePreventRemove(addPlaces.isPending, () => undefined);
  useEffect(() => {
    if (completed && !addPlaces.isPending) goBack();
  }, [completed, addPlaces.isPending]);
  const trip = tripQuery.data ? toTrip(tripQuery.data, placesQuery.data ?? [], itineraryQuery.data) : undefined;
  const theme = useAppTheme();
  const { copy } = usePlaceSearchCopy();
  const { copy: detailsCopy } = useTripDetailsCopy();
  if (tripId && ((!tripQuery.data && tripQuery.isPending) || (!placesQuery.data && placesQuery.isPending) || (!itineraryQuery.data && itineraryQuery.isPending)))
    return <ScreenSafeArea style={{ flex: 1, backgroundColor: theme.colors.background }}><View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={theme.colors.primary} /></View></ScreenSafeArea>;
  if (tripId && ((!tripQuery.data && tripQuery.isError) || (!placesQuery.data && placesQuery.isError) || (!itineraryQuery.data && itineraryQuery.isError)))
    return <ScreenSafeArea style={{ flex: 1, backgroundColor: theme.colors.background }}><View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}><AppText accessibilityRole="alert" tone="error">{detailsCopy.itineraryLoadError}</AppText><AppButton variant="outline" onPress={() => { void tripQuery.refetch(); void placesQuery.refetch(); void itineraryQuery.refetch(); }}>{detailsCopy.retry}</AppButton><AppButton onPress={goBack}>{copy.back}</AppButton></View></ScreenSafeArea>;
  if (!trip)
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
        await addPlaces.mutateAsync({ stops, date: targetDate });
        setCompleted(true);
        return true;
      }}
    />
  );
}
