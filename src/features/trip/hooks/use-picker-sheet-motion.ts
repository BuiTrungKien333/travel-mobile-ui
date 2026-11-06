import { useEffect, useRef } from "react";
import { Keyboard, useWindowDimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useAppTheme } from "@/hooks/use-app-theme";

/** Mount one session per opening; apply commits only after the exit animation finishes. */
export function usePickerSheetMotion(onClose: () => void, beforeClose?: (leave: () => void) => void) {
  const theme = useAppTheme();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const closing = useSharedValue(false);
  const translateY = useSharedValue<number>(theme.layout.sheetEntryOffset);
  const commit = useRef<(() => void) | undefined>(undefined);
  const enterDuration = theme.motion.tabTransitionDuration;
  const exitDuration = theme.motion.sheetDismissDuration;
  const dismissDistance = theme.layout.sheetDismissDistance;
  const dismissVelocity = theme.motion.sheetDismissVelocity;
  const minimumSwipe = theme.spacing.md;
  const fadeDistance = theme.layout.sheetBackdropFadeDistance;

  useEffect(() => {
    translateY.set(
      withTiming(0, {
        duration: enterDuration,
        reduceMotion: ReduceMotion.System,
      }),
    );
    return () => cancelAnimation(translateY);
  }, [enterDuration, translateY]);

  function finishClose() {
    Keyboard.dismiss();
    const apply = commit.current;
    commit.current = undefined;
    apply?.();
    onClose();
  }
  function close(afterClose?: () => void) {
    if (closing.get()) return;
    closing.set(true);
    commit.current = afterClose;
    Keyboard.dismiss();
    translateY.set(
      withTiming(
        height,
        { duration: exitDuration, reduceMotion: ReduceMotion.System },
        (finished) => {
          if (finished) scheduleOnRN(finishClose);
        },
      ),
    );
  }
  function requestClose(afterClose?: () => void) {
    if (beforeClose) beforeClose(() => close(afterClose));
    else close(afterClose);
  }
  const sheetMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));
  const backdropMotion = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, 1 - translateY.get() / fadeDistance)),
  }));
  const dragGesture = Gesture.Pan()
    .activeOffsetY(theme.spacing.sm)
    .failOffsetX([-theme.spacing.lg, theme.spacing.lg])
    .onUpdate((event) => {
      if (!closing.get()) translateY.set(Math.max(0, event.translationY));
    })
    .onEnd((event) => {
      if (closing.get()) return;
      if (
        event.translationY >= dismissDistance ||
        (event.translationY > minimumSwipe &&
          event.velocityY >= dismissVelocity)
      ) {
        if (beforeClose) {
          translateY.set(withTiming(0, { duration: enterDuration, reduceMotion: ReduceMotion.System }));
          scheduleOnRN(requestClose);
          return;
        }
        closing.set(true);
        translateY.set(
          withTiming(
            height,
            { duration: exitDuration, reduceMotion: ReduceMotion.System },
            (finished) => {
              if (finished) scheduleOnRN(finishClose);
            },
          ),
        );
      } else
        translateY.set(
          withTiming(0, {
            duration: enterDuration,
            reduceMotion: ReduceMotion.System,
          }),
        );
    })
    .onFinalize((_event, success) => {
      if (!success && !closing.get())
        translateY.set(
          withTiming(0, {
            duration: enterDuration,
            reduceMotion: ReduceMotion.System,
          }),
        );
    });
  return { sheetMotion, backdropMotion, dragGesture, close: requestClose, reduceMotion };
}
