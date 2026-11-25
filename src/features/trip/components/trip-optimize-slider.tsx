import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

export function TripOptimizeSlider({ onOptimize }: { onOptimize: () => void }) {
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();
  const [screenReader, setScreenReader] = useState(false);
  const offset = useSharedValue(0);
  const start = useSharedValue(0);
  const maximum = useSharedValue(0);
  const completing = useSharedValue(false);
  const thumbSize = theme.layout.touchTarget;
  const inset = theme.spacing.xs + theme.spacing.xxs;
  const spring = {
    ...theme.motion.photoViewerSpring,
    reduceMotion: ReduceMotion.System,
  };
  const threshold = theme.motion.tripOptimizeSlideThreshold;

  useEffect(() => {
    // React Native Web reports true unconditionally; web uses keyboard/ARIA below.
    if (Platform.OS === "web") return () => cancelAnimation(offset);
    let mounted = true;
    // Subscribe before the initial query so a later accessibility change wins.
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      (enabled) => {
        changed = true;
        setScreenReader(enabled);
      },
    );

    void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (mounted && !changed) setScreenReader(enabled);
    });

    return () => {
      mounted = false;
      subscription.remove();
      cancelAnimation(offset);
    };
  }, [offset]);

  function complete() {
    onOptimize();
    offset.set(
      withSpring(0, spring, (finished) => {
        if (finished) completing.set(false);
      }),
    );
  }

  function activate() {
    if (completing.get()) return;
    completing.set(true);
    complete();
  }

  const drag = Gesture.Pan()
    .activeOffsetX([-theme.spacing.xs, theme.spacing.xs])
    .failOffsetY([-theme.spacing.lg, theme.spacing.lg])
    .onStart(() => {
      if (completing.get()) return;
      cancelAnimation(offset);
      start.set(offset.get());
    })
    .onUpdate((event) => {
      if (completing.get()) return;
      offset.set(
        Math.max(0, Math.min(maximum.get(), start.get() + event.translationX)),
      );
    })
    .onEnd(() => {
      if (completing.get()) return;
      if (maximum.get() > 0 && offset.get() >= maximum.get() * threshold) {
        completing.set(true);
        offset.set(
          withTiming(
            maximum.get(),
            {
              duration: theme.motion.shutterPressDuration,
              reduceMotion: ReduceMotion.System,
            },
            (finished) => {
              if (finished) scheduleOnRN(complete);
            },
          ),
        );
      } else offset.set(withSpring(0, spring));
    })
    .onFinalize((_event, success) => {
      if (!success && !completing.get()) offset.set(withSpring(0, spring));
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity:
      maximum.get() > 0 ? Math.max(0, 1 - offset.get() / maximum.get()) : 1,
  }));

  if (Platform.OS !== "web" && screenReader)
    return (
      <AppButton variant="gradient" onPress={activate} style={styles.grow}>
        {copy.optimize}
      </AppButton>
    );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy.slideOptimize}
      accessibilityHint={copy.slideOptimizeHint}
      accessibilityActions={[{ name: "activate", label: copy.optimize }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "activate") activate();
      }}
      onPress={(event) => {
        // Web keyboard/assistive clicks have detail=0; ordinary taps must slide.
        if (
          Platform.OS === "web" &&
          "detail" in event.nativeEvent &&
          event.nativeEvent.detail === 0
        )
          activate();
      }}
      onLayout={(event) => {
        cancelAnimation(offset);
        offset.set(0);
        completing.set(false);
        maximum.set(
          Math.max(0, event.nativeEvent.layout.width - thumbSize - inset * 2),
        );
      }}
      style={[
        styles.track,
        {
          padding: inset,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.softActionSurface,
          borderColor: theme.colors.softActionBorder,
          boxShadow: [
            { ...theme.elevation.glass, color: theme.colors.glassShadow },
          ],
        },
      ]}
    >
      <GlassBackdrop borderRadius={theme.radius.full} variant="navigation" />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.label,
          {
            minHeight: thumbSize,
            paddingLeft: thumbSize + theme.spacing.sm,
            paddingRight: theme.spacing.md,
          },
          labelStyle,
        ]}
      >
        <AppText variant="label" tone="primary" style={styles.centerText}>
          {copy.slideOptimize}
        </AppText>
      </Animated.View>
      <GestureDetector gesture={drag}>
        <Animated.View
          accessible={false}
          style={[
            styles.thumb,
            {
              left: inset,
              width: thumbSize,
              height: thumbSize,
              marginTop: -thumbSize / 2,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.primaryText,
              borderColor: theme.colors.glassBorder,
            },
            thumbStyle,
          ]}
        >
          <AppIcon
            name="arrow"
            size={theme.layout.iconMedium}
            color={theme.colors.onPrimary}
          />
        </Animated.View>
      </GestureDetector>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  track: { flex: 1, minWidth: 0, borderWidth: StyleSheet.hairlineWidth },
  label: { justifyContent: "center" },
  centerText: { textAlign: "center" },

  thumb: {
    position: "absolute",
    top: "50%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
