import { MemoriesScreen } from "@/features/home/screens/memories-screen";
import { UI_PREVIEW_ENABLED } from "@/constants/development";
import { MemoriesHistoryScreen } from "@/features/memories/screens/memories-history-screen";
export default function MemoriesRoute() {
  return UI_PREVIEW_ENABLED ? (
    <MemoriesScreen />
  ) : (
    <MemoriesHistoryScreen embedded />
  );
}
