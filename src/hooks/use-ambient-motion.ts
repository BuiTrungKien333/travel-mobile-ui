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
export type AmbientMotionOptions = { duration?: number; reverse?: boolean };

export function useAmbientMotion(
  enabled = true,
  options?: AmbientMotionOptions,
) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const [appActive, setAppActive] = useState(
    AppState.currentState === "active",
  );
  const progress = useSharedValue(0);
  const duration = options?.duration ?? theme.motion.tripCardAmbientDuration;
  const reverse = options?.reverse ?? false;
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setAppActive(state === "active"),
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!enabled || !appActive || reduceMotion) return;
    progress.set(
      withRepeat(
        withTiming(1, {
          duration,
          easing: reverse ? Easing.inOut(Easing.sin) : Easing.linear,
          reduceMotion: ReduceMotion.System,
        }),
        -1,
        reverse,
      ),
    );

    return () => {
      cancelAnimation(progress);
      progress.set(0);
    };
  }, [enabled, appActive, reduceMotion, duration, reverse, progress]);

  return progress;
}
