import { MemoriesScreen } from "@/features/home/screens/memories-screen";
import { UI_PREVIEW_ENABLED } from "@/constants/development";
import { TripIntegrationUnavailableScreen } from "@/features/trip/screens/trip-integration-unavailable-screen";
export default function MemoriesRoute() {
  return UI_PREVIEW_ENABLED ? <MemoriesScreen /> : <TripIntegrationUnavailableScreen />;
}
