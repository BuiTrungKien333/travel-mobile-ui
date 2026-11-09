import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { useEffect } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import type { TripStop } from "../types/home-types";
import { homeStyles } from "./home-primitives";
import { TripGlassBackdrop } from "./trip-glass-backdrop";

export function CheckInPrompt({
  stop,
  onCapture,
}: {
  stop: TripStop;
  onCapture: () => void;
}) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { copy, locale } = useOngoingCopy();
  const message = copy.checkInPrompt.replace("{place}", stop.name[locale]);
  const offset = useSharedValue<number>(theme.spacing.sm);
  const duration = theme.motion.enterDuration;
  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.get() }],
  }));
  useEffect(() => {
    offset.set(withTiming(0, {
      duration,
      reduceMotion: ReduceMotion.System,
    }));
    return () => cancelAnimation(offset);
  }, [duration, offset]);
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.dock,
        {
          bottom: tabBarHeight + theme.spacing.sm,
          left: insets.left + theme.spacing.lg,
          right: insets.right + theme.spacing.lg,
        },
      ]}
    >
      <Animated.View
        style={[
          { width: "100%", maxWidth: theme.layout.contentMaxWidth },
          slideStyle,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={message}
          accessibilityHint={copy.checkInCameraHint}
          onPress={onCapture}
          style={({ pressed }) => [
            homeStyles.row,
            styles.card,
            {
              minHeight: theme.layout.touchTarget,
              gap: theme.spacing.sm,
              padding: theme.spacing.md,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surfaceTint,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.glassBorder,
              boxShadow: [
                {
                  ...theme.elevation.floating,
                  color: theme.colors.glassShadow,
                },
              ],
            },
            pressed
              ? { transform: [{ scale: theme.motion.shutterPressScale }] }
              : null,
          ]}
        >
          <TripGlassBackdrop borderRadius={theme.radius.lg} />
          <AppIcon name="camera" size={theme.layout.iconMedium} />
          <AppText
            variant="caption"
            style={[
              homeStyles.grow,
              {
                color: theme.colors.primaryText,
                fontFamily: theme.typography.fontFamily.medium,
              },
            ]}
          >
            {message}
          </AppText>
          <View aria-hidden style={{ transform: [{ rotate: "90deg" }] }}>
            <AppIcon name="arrow" size={theme.layout.iconSmall} />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  dock: { position: "absolute", alignItems: "center" },
  card: { overflow: "hidden" },
});
