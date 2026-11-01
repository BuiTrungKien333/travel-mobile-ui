import { useLocalSearchParams } from "expo-router";
import { tripCameraRouteSchema } from "@/features/trip/schemas/trip-route-schema";
import { TripCameraScreen } from "@/features/camera/screens/trip-camera-screen";

export default function TripCameraRoute() {
  const params = useLocalSearchParams();
  const parsed = tripCameraRouteSchema.safeParse(params);
  return <TripCameraScreen {...(parsed.success ? parsed.data : {})} />;
}
