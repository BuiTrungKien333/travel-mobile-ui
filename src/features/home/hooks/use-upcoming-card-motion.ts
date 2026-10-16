import { useIsFocused } from "expo-router/react-navigation";

import { useAmbientMotion } from "@/hooks/use-ambient-motion";

export function useUpcomingCardMotion() {
  const focused = useIsFocused();
  return useAmbientMotion(focused);
}
