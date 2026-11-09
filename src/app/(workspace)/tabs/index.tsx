import { HomeScreen } from "@/features/home/screens/home-screen";
import { UI_PREVIEW_ENABLED } from "@/constants/development";
import { ConnectedHomeScreen } from "@/features/home/screens/connected-home-screen";
export default function TabsIndex() {
  return UI_PREVIEW_ENABLED ? <HomeScreen /> : <ConnectedHomeScreen />;
}
