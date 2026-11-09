import { useLocalSearchParams } from "expo-router";
import { tripRouteSchema } from "@/features/trip/schemas/trip-route-schema";
import { TripPlacePickerScreen } from "@/features/trip/screens/trip-place-picker-screen";

export default function AddTripPlacesRoute() {
  const params = useLocalSearchParams();
  const parsed = tripRouteSchema.safeParse({
    tripId: params.tripId,
    day: params.day,
  });
  return (
    <TripPlacePickerScreen
      tripId={parsed.success ? parsed.data.tripId : undefined}
      date={parsed.success ? parsed.data.day : undefined}
    />
  );
}
