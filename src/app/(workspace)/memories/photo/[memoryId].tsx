import { useLocalSearchParams } from "expo-router";
import { MemoryDetailScreen } from "@/features/memories/screens/memory-detail-screen";
import { memoryPhotoRouteSchema } from "@/features/memories/schemas/memory-route-schema";

export default function MemoryPhotoRoute() {
  const params = memoryPhotoRouteSchema.safeParse(useLocalSearchParams());
  return <MemoryDetailScreen {...(params.success ? params.data : {})} />;
}
