import { useLocalSearchParams } from "expo-router";
import { tripStopRouteSchema } from "@/features/trip/schemas/trip-route-schema";
import { TripStopDetailsScreen } from "@/features/trip/screens/trip-stop-details-screen";

export default function TripStopDetailsRoute() {
  const params = useLocalSearchParams();
  const parsed = tripStopRouteSchema.safeParse(params);
  return <TripStopDetailsScreen {...(parsed.success ? parsed.data : {})} />;
}
