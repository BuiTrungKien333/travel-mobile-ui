import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { homeImages } from "../data/home-mocks";
import { useHomeAmbientMotion } from "../hooks/use-home-ambient-motion";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";

/** One visual language for starting a first trip or planning the next one. */
export function JourneyInvitationCard({
  variant,
}: {
  variant: "new" | "returning";
}) {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const returning = variant === "returning";
  const openPanel = useTripPreview((state) => state.openPanel);
  const progress = useHomeAmbientMotion();
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
            width: returning
              ? theme.layout.nextTripIconSize
              : theme.layout.firstTripIconFrameSize,
            height: returning
              ? theme.layout.nextTripIconSize
              : theme.layout.firstTripIconFrameSize,
            backgroundColor: returning ? undefined : theme.colors.surface,
            borderRadius: theme.radius.xl,
          },
        ]}
      >
        {!returning ? (
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
        ) : null}
        <Animated.View style={iconStyle}>
          {returning ? (
            <Image
              accessible={false}
              source={homeImages.nextTripNavigation}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={0}
              style={{
                width: theme.layout.nextTripIconSize,
                height: theme.layout.nextTripIconSize,
              }}
            />
          ) : (
            <AppIcon name="pin" size={theme.layout.iconLarge} />
          )}
        </Animated.View>
      </View>
      <View style={{ gap: theme.spacing.sm }}>
        <AppText
          accessibilityRole="header"
          variant="subheading"
          style={styles.centeredText}
        >
          {returning ? copy.returningTitle : copy.newTitle}
        </AppText>
        <AppText
          variant="body"
          tone={returning ? "muted" : "default"}
          style={styles.centeredText}
        >
          {returning ? copy.returningDetail : copy.newHint}
        </AppText>
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
          {returning ? copy.createNew : copy.create}
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
