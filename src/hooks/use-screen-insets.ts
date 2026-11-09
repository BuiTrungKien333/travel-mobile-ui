import { Platform, StatusBar } from "react-native";
import {
  useSafeAreaFrame,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

/** Screen/modal insets; Android's measured status bar covers temporarily missing top insets. */
export function useScreenInsets() {
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  const statusBarOverlap =
    Platform.OS === "android"
      ? Math.max(0, (StatusBar.currentHeight ?? 0) - frame.y)
      : 0;

  return { ...insets, top: Math.max(insets.top, statusBarOverlap) };
}
