import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { useAppTheme } from "@/hooks/use-app-theme";
import { useWeatherCopy } from "../i18n/weather-copy";

export function PackingProgress({
  progress,
  packed,
  total,
}: {
  progress: SharedValue<number>;
  packed: number;
  total: number;
}) {
  const theme = useAppTheme();
  const { copy } = useWeatherCopy();
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={copy.packing}
      accessibilityValue={{
        min: 0,
        max: total || 1,
        now: packed,
        text: `${packed}/${total} ${copy.packed}`,
      }}
      style={[
        styles.track,
        {
          height: theme.spacing.xs,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.stopChipSurface,
        },
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.fill,
          {
            backgroundColor: theme.colors.primaryText,
            borderRadius: theme.radius.full,
          },
          fillStyle,
        ]}
      />
    </View>
  );
}

const particleIds = Array.from({ length: 12 }, (_, index) => index);

export function PackingConfetti({
  progress,
}: {
  progress: SharedValue<number>;
}) {
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.burst}
    >
      {particleIds.map((index) => (
        <ConfettiParticle key={index} index={index} progress={progress} />
      ))}
    </View>
  );
}

function ConfettiParticle({
  index,
  progress,
}: {
  index: number;
  progress: SharedValue<number>;
}) {
  const theme = useAppTheme();
  const angle = (index / particleIds.length) * Math.PI * 2;
  const distance =
    theme.layout.packingBurstDistance * (0.75 + (index % 3) * 0.12);
  const gravity = theme.spacing.section;
  const colors = [
    theme.colors.primary,
    theme.colors.weatherSun,
    theme.colors.softActionPressed,
    theme.colors.primaryText,
  ];
  const animatedStyle = useAnimatedStyle(() => {
    const phase = progress.value;
    return {
      opacity: phase > 0 && phase < 1 ? Math.sin(phase * Math.PI) : 0,
      transform: [
        { translateX: Math.cos(angle) * distance * phase },
        {
          translateY:
            Math.sin(angle) * distance * phase + gravity * phase * phase,
        },
        { rotate: `${index * 30 + phase * 180}deg` },
        { scale: 1 - phase * 0.4 },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: theme.spacing.xs,
          height: theme.spacing.sm,
          borderRadius: theme.spacing.xxs,
          backgroundColor: colors[index % colors.length],
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  track: { overflow: "hidden" },
  fill: { transformOrigin: "left center" },
  burst: { position: "absolute", left: "50%", top: "50%" },
  particle: { position: "absolute" },
});
