import { useLocalSearchParams } from "expo-router";
import { MemoryAlbumScreen } from "@/features/memories/screens/memory-album-screen";
import { memoryAlbumRouteSchema } from "@/features/memories/schemas/memory-route-schema";

export default function MemoryAlbumRoute() {
  const params = memoryAlbumRouteSchema.safeParse(useLocalSearchParams());

  return (
    <MemoryAlbumScreen
      tripId={params.success ? params.data.tripId : undefined}
    />
  );
}
