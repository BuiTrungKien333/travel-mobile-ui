import { router } from "expo-router";
import { View } from "react-native";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import { useAppTheme } from "@/hooks/use-app-theme";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import { getTripDetailsMode } from "../utils/trip-details-layout";
import { PlacePickerScreen } from "./place-picker-screen";

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
  const trip = useTripPreview((state) =>
    state.trips.find((entry) => entry.id === tripId),
  );
  const today = useTripPreview((state) => state.today);
  const mutateTrip = useTripPreview((state) => state.mutateTrip);
  const theme = useAppTheme();
  const { copy } = usePlaceSearchCopy();
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
      onApply={(stops, targetDate) => {
        if (getTripDetailsMode(trip, today) === "cancelled") return false;
        const success = mutateTrip(trip.id, {
          kind: "add",
          date: targetDate,
          stops,
        });
        if (success) goBack();
        return success;
      }}
    />
  );
}
