import { useLocalSearchParams } from "expo-router";
import { z } from "zod";
import { TripPlanningScreen } from "@/features/trip/screens/trip-planning-screen";

export default function TripPlanningRoute() {
  const params = useLocalSearchParams();
  const id = z.guid().safeParse(params.tripId);
  return <TripPlanningScreen tripId={id.success ? id.data : undefined} />;
}
