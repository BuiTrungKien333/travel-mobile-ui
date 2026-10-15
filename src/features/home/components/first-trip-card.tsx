import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { homeImages } from "../data/home-mocks";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";

export function FirstTripCard() {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const openPanel = useTripPreview((state) => state.openPanel);

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
        <AppIcon name="pin" size={theme.layout.iconLarge} />
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
        <AppButton variant="hero" onPress={() => openPanel({ kind: "create" })}>
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
  centeredText: { textAlign: "center" },
});
