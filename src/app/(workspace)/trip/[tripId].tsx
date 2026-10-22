import { useLocalSearchParams } from "expo-router";
import { tripRouteSchema } from "@/features/trip/schemas/trip-route-schema";
import { TripDetailsScreen } from "@/features/trip/screens/trip-details-screen";

export default function TripDetailsRoute() {
  const params = useLocalSearchParams();
  const parsed = tripRouteSchema.safeParse({
    tripId: params.tripId,
    day: params.day,
  });
  return (
    <TripDetailsScreen
      tripId={parsed.success ? parsed.data.tripId : undefined}
      selectedDate={parsed.success ? parsed.data.day : undefined}
    />
  );
}
