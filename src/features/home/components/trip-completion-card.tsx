import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useUpcomingCardMotion } from "../hooks/use-upcoming-card-motion";
import { useHomeCopy } from "../i18n/home-copy";
import { homeStyles } from "./home-primitives";
import { TripGlassBackdrop } from "./trip-glass-backdrop";

export function TripCompletionCard({
  title,
  action,
  onPress,
}: {
  title: string;
  action: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const progress = useUpcomingCardMotion();
  const drift = theme.spacing.xxs;
  const pulseStyle = useAnimatedStyle(() => {
    // Four gentle pulses during the shared twelve-second ambient cycle.
    const phase = (progress.value * 4) % 1;
    return {
      opacity: (1 - phase) * 0.3,
      transform: [{ scale: 1 + phase * 0.35 }],
    };
  });
  const pinStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -Math.sin(progress.value * Math.PI * 8) * drift },
    ],
  }));

  return (
    <View
      style={[
        styles.card,
        {
          padding: theme.spacing.md,
          gap: theme.spacing.md,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceTint,
          boxShadow: [
            { ...theme.elevation.glass, color: theme.colors.glassShadow },
          ],
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.accent,
          {
            width: theme.spacing.section * 2,
            height: theme.spacing.section * 2,
            top: -theme.spacing.xl,
            left: -theme.spacing.xl,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.glassGlow,
          },
        ]}
      />
      <TripGlassBackdrop borderRadius={theme.radius.md} />
      <View style={[homeStyles.row, { gap: theme.spacing.md }]}>
        <View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.pinFrame,
            {
              width: theme.spacing.section,
              height: theme.spacing.section,
            },
          ]}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: theme.radius.full,
                borderWidth: theme.spacing.xxs,
                borderColor: theme.colors.primary,
              },
              pulseStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.pinFrame,
              {
                width: theme.spacing.xxxl,
                height: theme.spacing.xxxl,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.glassInset,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.glassBorder,
                boxShadow: [
                  { ...theme.elevation.glass, color: theme.colors.glassShadow },
                ],
              },
              pinStyle,
            ]}
          >
            <AppIcon
              name="pin"
              size={theme.layout.iconMedium}
              color={theme.colors.primaryText}
            />
          </Animated.View>
        </View>
        <View style={[homeStyles.grow, { gap: theme.spacing.xs }]}>
          <AppText
            variant="caption"
            tone="muted"
            style={{ fontFamily: theme.typography.fontFamily.semibold }}
          >
            {copy.complete}
          </AppText>
          <AppText accessibilityRole="header" variant="label">
            {title}
          </AppText>
        </View>
      </View>
      <AppButton
        variant="soft"
        size="small"
        onPress={onPress}
        leadingIcon={
          <AppIcon
            name="plus"
            size={theme.layout.iconSmall}
            color={theme.colors.onSoftAction}
          />
        }
      >
        {action}
      </AppButton>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden", borderCurve: "continuous" },
  accent: { position: "absolute" },
  pinFrame: { alignItems: "center", justifyContent: "center", flexShrink: 0 },
});
