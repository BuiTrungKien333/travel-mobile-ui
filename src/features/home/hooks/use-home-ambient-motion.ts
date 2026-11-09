import { useIsFocused } from "expo-router/react-navigation";

import {
  useAmbientMotion,
  type AmbientMotionOptions,
} from "@/hooks/use-ambient-motion";
import { useTripPreview } from "../providers/trip-preview-provider";

export function useHomeAmbientMotion(
  enabled = true,
  options?: AmbientMotionOptions,
) {
  const focused = useIsFocused();
  const panelOpen = useTripPreview((state) => state.panel !== null);
  return useAmbientMotion(focused && !panelOpen && enabled, options);
}
