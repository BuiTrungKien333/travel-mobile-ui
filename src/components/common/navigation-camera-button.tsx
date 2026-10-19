import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { AppIcon } from "@/components/ui/app-icon";
import { useAmbientMotion } from "@/hooks/use-ambient-motion";
import { useAppTheme } from "@/hooks/use-app-theme";
import { GlassBackdrop } from "./glass-backdrop";

export function NavigationCameraButton({
  onPress,
  accessibilityLabel,
  animationEnabled = true,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  animationEnabled?: boolean;
}) {
  const theme = useAppTheme();
  const progress = useAmbientMotion(animationEnabled);
  const pressed = useSharedValue(1);
  const pulseScale = theme.motion.shutterPulseScale;
  const glowOpacity = theme.motion.shutterGlowOpacity;
  const glowVariation = theme.motion.shutterGlowVariation;
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale:
          pressed.value *
          (1 + Math.sin(progress.value * Math.PI * 4) * pulseScale),
      },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity:
      glowOpacity +
      (1 - Math.cos(progress.value * Math.PI * 4)) * glowVariation,
    transform: [
      { scale: 1 + (1 - Math.cos(progress.value * Math.PI * 4)) * pulseScale },
    ],
  }));
  const setPressScale = (scale: number) => {
    pressed.value = withTiming(scale, {
      duration: theme.motion.shutterPressDuration,
      reduceMotion: ReduceMotion.System,
    });
  };
  const gradientUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><defs><linearGradient id="shutter" x2="1" y2="1"><stop stop-color="${theme.colors.primary}"/><stop offset="1" stop-color="${theme.colors.gradientActionEnd}"/></linearGradient></defs><rect width="64" height="64" fill="url(#shutter)"/></svg>`,
  )}`;
  return (
    <Animated.View style={animatedStyle}>
      <Animated.View
        pointerEvents="none"
        aria-hidden
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.glassGlow,
            boxShadow: [
              { ...theme.elevation.glass, color: theme.colors.primary },
            ],
          },
          glowStyle,
        ]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onPressIn={() => setPressScale(theme.motion.shutterPressScale)}
        onPressOut={() => setPressScale(1)}
        style={{
          width: theme.layout.tabBarCameraSize,
          height: theme.layout.tabBarCameraSize,
          padding: theme.spacing.xxs,
          borderRadius: theme.radius.full,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.navigationBorder,
          boxShadow: [
            {
              ...theme.elevation.navigationCamera,
              color: theme.colors.navigationCameraShadow,
            },
          ],
        }}
      >
        <GlassBackdrop borderRadius={theme.radius.full} variant="navigation" />
        <View
          style={[
            styles.disk,
            {
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.gradientActionEnd,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.raisedActionHighlight,
            },
          ]}
        >
          <Image
            accessible={false}
            source={{ uri: gradientUri }}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
          />
          <View
            pointerEvents="none"
            style={[
              styles.highlight,
              {
                borderRadius: theme.radius.full,
                borderColor: theme.colors.raisedActionHighlight,
                top: theme.spacing.xxs,
                left: theme.spacing.sm,
                right: theme.spacing.sm,
              },
            ]}
          />
          <AppIcon
            name="camera"
            variant="light"
            size={theme.layout.iconLarge}
            color={theme.colors.onGradientAction}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  disk: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  highlight: {
    position: "absolute",
    height: "50%",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
