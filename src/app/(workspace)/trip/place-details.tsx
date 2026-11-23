import { useLocalSearchParams } from "expo-router";
import { planningPlaceDetailsRouteSchema, tripStopRouteSchema } from "@/features/trip/schemas/trip-route-schema";
import { PlanningPlaceDetailsScreen } from "@/features/trip/screens/planning-place-details-screen";
import { TripStopDetailsScreen } from "@/features/trip/screens/trip-stop-details-screen";

export default function TripStopDetailsRoute() {
  const params = useLocalSearchParams();
  const planningPlace = planningPlaceDetailsRouteSchema.safeParse(params);
  if (planningPlace.success) return <PlanningPlaceDetailsScreen {...planningPlace.data} />;
  const parsed = tripStopRouteSchema.safeParse(params);
  return <TripStopDetailsScreen {...(parsed.success ? parsed.data : {})} />;
}
