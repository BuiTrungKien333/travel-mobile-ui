import type { TripStop } from "@/features/home/types/home-types";

/** Load only on demand: an older native build can still open the itinerary screen. */
export async function currentTripPosition(name: string): Promise<TripStop> {
  const location = await import("expo-location");
  const permission = await location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error("LOCATION_PERMISSION_REQUIRED");
  const position = await location.getCurrentPositionAsync({
    accuracy: location.Accuracy.Balanced,
  });

  return {
    id: "current-origin",
    name: { vi: name, en: name },
    time: "",
    kind: { vi: "", en: "" },
    location: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    },
  };
}
