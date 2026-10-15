import { useIsFocused } from "expo-router/react-navigation";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useAppTheme } from "@/hooks/use-app-theme";

/** One UI-thread loop drives the card's decorative clock and weather. */
export function useUpcomingCardMotion() {
  const theme = useAppTheme();
  const focused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const [appActive, setAppActive] = useState(
    AppState.currentState === "active",
  );
  const progress = useSharedValue(0);
  const duration = theme.motion.tripCardAmbientDuration;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setAppActive(state === "active");
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!focused || !appActive || reduceMotion) return;
    progress.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.System,
      }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(progress);
      progress.value = 0;
    };
  }, [focused, appActive, reduceMotion, duration, progress]);

  return progress;
}
