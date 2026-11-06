import { useLocalSearchParams } from "expo-router";
import { MemoriesCameraScreen } from "@/features/memories/screens/memories-camera-screen";
import { memoryCaptureRouteSchema } from "@/features/memories/schemas/memory-route-schema";

export default function QuickCaptureRoute() {
  const params = memoryCaptureRouteSchema.safeParse(useLocalSearchParams());
  return (
    <MemoriesCameraScreen {...(params.success ? params.data : {})} quick />
  );
}
