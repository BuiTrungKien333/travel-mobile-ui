import { HomeScreen } from "@/features/home/screens/home-screen";
import { UI_PREVIEW_ENABLED } from "@/constants/development";
import { ConnectedTripsScreen } from "@/features/trip/screens/connected-trips-screen";
export default function TabsIndex() {
  return UI_PREVIEW_ENABLED ? <HomeScreen /> : <ConnectedTripsScreen />;
}
