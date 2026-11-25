import { svgDataUri } from "@/utils/svg-data-uri";
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
  const size = theme.layout.tabBarCameraSize;
  const ring = theme.layout.tabBarCameraRingWidth;
  const diskSize = size - ring * 2;
  const animatedStyle = useAnimatedStyle(() => ({
    // Ambient motion belongs to the halo; the actual button keeps its diameter.
    transform: [{ scale: pressed.value }],
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
    pressed.set(
      withTiming(scale, {
        duration: theme.motion.shutterPressDuration,
        reduceMotion: ReduceMotion.System,
      }),
    );
  };

  const gradientUri = svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${diskSize}" height="${diskSize}" viewBox="0 0 ${diskSize} ${diskSize}"><defs><linearGradient id="shutter" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${diskSize}" y2="${diskSize}"><stop offset="0" stop-color="${theme.colors.primary}"/><stop offset="1" stop-color="${theme.colors.gradientActionEnd}"/></linearGradient></defs><rect width="${diskSize}" height="${diskSize}" fill="url(#shutter)"/></svg>`,
  );

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
          width: size,
          height: size,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.surface,
          boxShadow: [
            {
              ...theme.elevation.navigationCamera,
              color: theme.colors.navigationCameraShadow,
            },
          ],
        }}
      >
        <View
          style={[
            styles.disk,
            {
              borderRadius: theme.radius.full,
              left: ring,
              top: ring,
              width: diskSize,
              height: diskSize,
              backgroundColor: theme.colors.primary,
            },
          ]}
        >
          <Image
            accessible={false}
            pointerEvents="none"
            source={{ uri: gradientUri }}
            contentFit="fill"
            cachePolicy="memory"
            transition={0}
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
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  highlight: {
    position: "absolute",
    height: "50%",
    borderTopWidth: 1,
  },
});
