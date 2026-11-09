import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useHomeAmbientMotion } from "../hooks/use-home-ambient-motion";
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
  const progress = useHomeAmbientMotion();
  const drift = theme.spacing.xxs;
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
      <TripGlassBackdrop borderRadius={theme.radius.md} />
      <View style={[homeStyles.row, { gap: theme.spacing.md }]}>
        <Animated.View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.pinFrame,
            {
              width: theme.spacing.xxxl,
              height: theme.spacing.xxxl,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.glassInset,
            },
            pinStyle,
          ]}
        >
          <AppIcon
            name="pinAdd"
            variant="light"
            size={theme.layout.iconLarge}
            color={theme.colors.primaryText}
          />
        </Animated.View>
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
  pinFrame: { alignItems: "center", justifyContent: "center", flexShrink: 0 },
});
