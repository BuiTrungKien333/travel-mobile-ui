import { QueryFeedback } from "@/components/common/query-feedback";
import { requiredQueryState } from "@/utils/required-query-state";
import { backOrReplace } from "@/utils/back-or-replace";
import { usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useState } from "react";
import { View } from "react-native";
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

function goBack(tripId?: string, date?: string) {
  backOrReplace(tripId ? { pathname: "/trip/[tripId]", params: { tripId, ...(date ? { day: date } : {}) } } : "/tabs/trips");
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
  const loadState = requiredQueryState([tripQuery, placesQuery, itineraryQuery]);
  const addPlaces = useAddTripPlaces(tripId ?? "");
  const [completed, setCompleted] = useState(false);
  usePreventRemove(addPlaces.isPending, () => undefined);
  useEffect(() => {
    if (completed && !addPlaces.isPending) goBack(tripId, date);
  }, [completed, addPlaces.isPending, tripId, date]);
  const trip = tripQuery.data ? toTrip(tripQuery.data, placesQuery.data ?? [], itineraryQuery.data) : undefined;
  const theme = useAppTheme();
  const { copy } = usePlaceSearchCopy();
  const { copy: detailsCopy } = useTripDetailsCopy();
  if (tripId && loadState === "loading")
    return <ScreenSafeArea style={{ flex: 1, backgroundColor: theme.colors.background }}><View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><QueryFeedback loading /><AppButton variant="outline" onPress={() => goBack(tripId, date)}>{copy.back}</AppButton></View></ScreenSafeArea>;
  if (tripId && loadState === "error")
    return <ScreenSafeArea style={{ flex: 1, backgroundColor: theme.colors.background }}><View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}><AppText accessibilityRole="alert" tone="error">{detailsCopy.itineraryLoadError}</AppText><AppButton variant="outline" onPress={() => { void tripQuery.refetch(); void placesQuery.refetch(); void itineraryQuery.refetch(); }}>{detailsCopy.retry}</AppButton><AppButton onPress={() => goBack(tripId, date)}>{copy.back}</AppButton></View></ScreenSafeArea>;
  if (!trip)
    return (
      <ScreenSafeArea
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
          <AppText>{copy.missing}</AppText>
          <AppButton onPress={() => goBack(tripId, date)}>{copy.back}</AppButton>
        </View>
      </ScreenSafeArea>
    );
  return (
    <PlacePickerScreen
      feedback={<QueryFeedback refreshing={tripQuery.isRefetching || placesQuery.isRefetching || itineraryQuery.isRefetching}
        error={tripQuery.isError || placesQuery.isError || itineraryQuery.isError ? detailsCopy.itineraryLoadError : null}
        retrying={tripQuery.isFetching || placesQuery.isFetching || itineraryQuery.isFetching}
        onRetry={() => { void tripQuery.refetch(); void placesQuery.refetch(); void itineraryQuery.refetch(); }} />}
      key={trip.id}
      trip={trip}
      destination={trip.destination}
      initialDate={date ?? null}
      onClose={() => goBack(tripId, date)}
      onApply={async (stops, targetDate) => {
        await addPlaces.mutateAsync({ stops, date: targetDate });
        setCompleted(true);
        return true;
      }}
    />
  );
}
