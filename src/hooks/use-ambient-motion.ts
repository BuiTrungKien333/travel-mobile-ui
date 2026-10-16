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
import { useAppTheme } from "./use-app-theme";

/** Decorative motion stops when hidden, backgrounded, or reduced motion is enabled. */
export function useAmbientMotion(enabled = true) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const [appActive, setAppActive] = useState(
    AppState.currentState === "active",
  );
  const progress = useSharedValue(0);
  const duration = theme.motion.tripCardAmbientDuration;
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setAppActive(state === "active"),
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!enabled || !appActive || reduceMotion) return;
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
  }, [enabled, appActive, reduceMotion, duration, progress]);
  return progress;
}
