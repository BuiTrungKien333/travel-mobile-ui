import { router } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import { useAppTheme } from "@/hooks/use-app-theme";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import { getTripDetailsMode } from "../utils/trip-details-layout";
import { PlacePickerScreen } from "./place-picker-screen";
import { useAddTripPlaceMutation, useTripPlacesQuery, useTripQuery } from "../api/trip-hooks";
import { toTrip } from "../api/trip-adapters";

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
  const addPlace = useAddTripPlaceMutation(tripId ?? "");
  const trip = tripQuery.data ? toTrip(tripQuery.data, placesQuery.data ?? []) : undefined;
  const today = useTripPreview((state) => state.today);
  const theme = useAppTheme();
  const { copy } = usePlaceSearchCopy();
  if (tripQuery.isPending || placesQuery.isPending)
    return <ScreenSafeArea style={{ flex: 1, backgroundColor: theme.colors.background }}><View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={theme.colors.primary} /></View></ScreenSafeArea>;
  if (tripQuery.isError || placesQuery.isError)
    return <ScreenSafeArea style={{ flex: 1, backgroundColor: theme.colors.background }}><View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}><AppText accessibilityRole="alert" tone="error">Không tải được chuyến đi hoặc danh sách địa điểm.</AppText><AppButton variant="outline" onPress={() => { void tripQuery.refetch(); void placesQuery.refetch(); }}>Thử lại</AppButton><AppButton onPress={goBack}>{copy.back}</AppButton></View></ScreenSafeArea>;
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
      onApply={async (stops) => {
        if (getTripDetailsMode(trip, today) === "cancelled") return false;
        for (const [index, stop] of stops.entries()) {
          if (!stop.location) throw new Error("PLACE_COORDINATES_REQUIRED");
          await addPlace.mutateAsync({
            name: stop.name.vi,
            latitude: stop.location.latitude,
            longitude: stop.location.longitude,
            ...(stop.address?.vi ? { address: stop.address.vi } : {}),
            category: stop.kind.vi,
            ...(stop.durationMinutes ? { estimatedDuration: stop.durationMinutes } : {}),
            ...(stop.note ? { notes: stop.note } : {}),
            plannedOrder: (placesQuery.data?.length ?? 0) + index,
          });
        }
        goBack();
        return true;
      }}
    />
  );
}
