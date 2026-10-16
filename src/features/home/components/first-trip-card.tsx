import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { homeImages } from "../data/home-mocks";
import { useUpcomingCardMotion } from "../hooks/use-upcoming-card-motion";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";

export function FirstTripCard() {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const openPanel = useTripPreview((state) => state.openPanel);
  const progress = useUpcomingCardMotion();
  const drift = theme.spacing.xs;
  const tilt = theme.motion.firstTripIconTilt;
  const iconStyle = useAnimatedStyle(() => {
    const wave = Math.sin(progress.value * Math.PI * 4);
    return {
      transform: [
        { translateY: -wave * drift },
        { rotate: `${wave * tilt}deg` },
      ],
    };
  });
  const shadowStyle = useAnimatedStyle(() => {
    const wave = Math.sin(progress.value * Math.PI * 4);
    return {
      opacity: 0.6 - wave * 0.2,
      transform: [{ scaleX: 1 - wave * 0.15 }],
    };
  });

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceTint,
          borderRadius: theme.radius.xxl,
          padding: theme.spacing.xl,
          gap: theme.spacing.md,
        },
      ]}
    >
      <Image
        accessible={false}
        source={homeImages.firstTripLandscape}
        contentFit="cover"
        cachePolicy="memory"
        style={[styles.landscape, { height: theme.layout.heroImageHeight }]}
      />
      <View
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.iconFrame,
          {
            width: theme.layout.firstTripIconFrameSize,
            height: theme.layout.firstTripIconFrameSize,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.xl,
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.iconShadow,
            {
              width: theme.spacing.xl,
              height: theme.spacing.xs,
              bottom: theme.spacing.sm,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.glassShadow,
            },
            shadowStyle,
          ]}
        />
        <Animated.View style={iconStyle}>
          <AppIcon name="pin" size={theme.layout.iconLarge} />
        </Animated.View>
      </View>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText
          accessibilityRole="header"
          variant="heading"
          style={[
            styles.centeredText,
            {
              fontSize: theme.typography.fontSize.xl,
              lineHeight: theme.typography.lineHeight.xl,
            },
          ]}
        >
          {copy.newTitle}
        </AppText>
        <View style={{ gap: theme.spacing.xs }}>
          <AppText style={styles.centeredText}>{copy.newHint}</AppText>
          <AppText variant="caption" tone="muted" style={styles.centeredText}>
            {copy.newDetail}
          </AppText>
        </View>
      </View>
      <View style={{ marginTop: theme.spacing.sm }}>
        <AppButton
          variant="raised"
          onPress={() => openPanel({ kind: "create" })}
          trailingIcon={
            <AppIcon
              name="arrow"
              color={theme.colors.onRaisedAction}
              size={theme.layout.iconSmall}
            />
          }
        >
          {copy.create}
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden", borderCurve: "continuous" },
  landscape: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    pointerEvents: "none",
  },
  iconFrame: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  iconShadow: { position: "absolute" },
  centeredText: { textAlign: "center" },
});
