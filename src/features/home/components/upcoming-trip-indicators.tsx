import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useHomeCopy } from "../i18n/home-copy";

import { TripGlassBackdrop } from "./trip-glass-backdrop";

export function DepartureClock({
  days,
  progress,
}: {
  days: number;
  progress: SharedValue<number>;
}) {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const label =
    days === 0
      ? copy.departureTodayShort
      : days === 1
        ? copy.departureTomorrowShort
        : copy.departureDaysShort.replace("{count}", String(days));
  const minuteStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 360}deg` }],
  }));

  return (
    <View
      accessible
      accessibilityLabel={
        days === 0
          ? copy.departureToday
          : days === 1
            ? copy.departureTomorrow
            : copy.departureCountdown.replace("{count}", String(days))
      }
      style={[
        styles.clockGroup,
        {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          gap: theme.spacing.xs,
          borderRadius: theme.radius.sm,
          boxShadow: [
            { ...theme.elevation.glass, color: theme.colors.glassShadow },
          ],
        },
      ]}
    >
      <TripGlassBackdrop borderRadius={theme.radius.sm} variant="clock" />
      <View
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.dial,
          {
            width: theme.layout.countdownClockSize,
            height: theme.layout.countdownClockSize,
            borderRadius: theme.radius.full,
            borderColor: theme.colors.text,
            backgroundColor: theme.colors.glassClockInset,
          },
        ]}
      >
        <View style={[StyleSheet.absoluteFill, styles.hourRotation]}>
          <View
            style={[
              styles.hand,
              {
                width: theme.spacing.xxs,
                height: theme.spacing.xs,
                backgroundColor: theme.colors.text,
              },
            ]}
          />
        </View>
        <Animated.View style={[StyleSheet.absoluteFill, minuteStyle]}>
          <View
            style={[
              styles.hand,
              {
                width: theme.spacing.xxs,
                height: theme.spacing.sm,
                backgroundColor: theme.colors.text,
              },
            ]}
          />
        </Animated.View>
        <View
          style={{
            width: theme.spacing.xxs,
            height: theme.spacing.xxs,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.text,
          }}
        />
      </View>
      <AppText
        variant="caption"
        style={{
          fontFamily: theme.typography.fontFamily.semibold,
          flexShrink: 1,
        }}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  clockGroup: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  dial: {
    flexShrink: 0,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  hand: { position: "absolute", left: "50%", bottom: "50%" },
  hourRotation: { transform: [{ rotate: "-50deg" }] },
});
