import { Pressable, StyleSheet, View } from "react-native";

import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useHomeCopy } from "../i18n/home-copy";
import { homeStyles } from "./home-primitives";
import { TripGlassBackdrop } from "./trip-glass-backdrop";

export function FootprintCard({
  provinces,
  visitedPlaces,
  onPress,
}: {
  provinces: number;
  visitedPlaces: number;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();

  return (
    <View
      style={[
        styles.card,
        {
          padding: theme.spacing.lg,
          gap: theme.spacing.lg,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceTint,
          boxShadow: [
            { ...theme.elevation.glass, color: theme.colors.glassShadow },
          ],
        },
      ]}
    >
      <TripGlassBackdrop borderRadius={theme.radius.md} />
      <View
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[
          styles.watermark,
          { right: -theme.spacing.lg, top: -theme.spacing.md },
        ]}
      >
        <AppIcon
          name="map"
          variant="outline"
          size={theme.layout.footprintWatermarkSize}
          color={theme.colors.primaryText}
        />
      </View>
      <AppText
        accessibilityRole="header"
        variant="label"
        style={{
          fontSize: theme.typography.fontSize.md,
          lineHeight: theme.typography.lineHeight.md,
          fontFamily: theme.typography.fontFamily.semibold,
        }}
      >
        {copy.footprint}
      </AppText>
      <View style={[homeStyles.row, { gap: theme.spacing.md }]}>
        <AchievementStat
          count={provinces}
          label={copy.provinces}
          icon="map"
          tone="teal"
        />
        <View
          aria-hidden
          style={[
            styles.divider,
            {
              width: theme.spacing.xxs,
              borderRadius: theme.radius.full,
              borderColor: theme.colors.glassBorder,
              backgroundColor: theme.colors.glassGlow,
            },
          ]}
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.colors.glassInset },
            ]}
          />
        </View>
        <AchievementStat
          count={visitedPlaces}
          label={copy.places}
          icon="pin"
          tone="warm"
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.myJourney}
        onPress={onPress}
        style={({ pressed }) => [
          homeStyles.row,
          {
            gap: theme.spacing.sm,
            minHeight: theme.layout.touchTarget,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            borderRadius: theme.radius.sm,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.glassBorder,
            backgroundColor: pressed
              ? theme.colors.softActionSurface
              : theme.colors.glassInset,
            opacity: pressed ? theme.motion.pressOpacity : 1,
          },
        ]}
      >
        <AppIcon name="memories" size={theme.layout.iconSmall} />
        <AppText
          variant="link"
          tone="primary"
          style={[
            homeStyles.grow,
            { fontFamily: theme.typography.fontFamily.semibold },
          ]}
        >
          {copy.myJourney}
        </AppText>
        <AppIcon name="arrow" size={theme.layout.iconSmall} />
      </Pressable>
    </View>
  );
}

function AchievementStat({
  count,
  label,
  icon,
  tone,
}: {
  count: number;
  label: string;
  icon: AppIconName;
  tone: "teal" | "warm";
}) {
  const theme = useAppTheme();
  const warm = tone === "warm";
  const color = warm
    ? theme.colors.onWarningSurface
    : theme.colors.onSoftAction;

  return (
    <View
      accessible
      accessibilityLabel={`${count} ${label}`}
      style={[styles.stat, { gap: theme.spacing.sm }]}
    >
      <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
        <View
          style={[
            styles.medal,
            {
              width: theme.spacing.section,
              height: theme.spacing.section,
              padding: theme.spacing.xs,
              borderRadius: theme.radius.full,
              borderColor: warm
                ? theme.colors.achievementWarmSurface
                : theme.colors.glassBorder,
              backgroundColor: theme.colors.glassInset,
              boxShadow: [
                { ...theme.elevation.glass, color: theme.colors.glassShadow },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.medalCenter,
              {
                borderRadius: theme.radius.full,
                backgroundColor: warm
                  ? theme.colors.achievementWarmSurface
                  : theme.colors.softActionSurface,
              },
            ]}
          >
            <AppIcon name={icon} size={theme.layout.iconMedium} color={color} />
          </View>
        </View>
        <AppText
          variant="heading"
          style={{
            color,
            fontSize: theme.typography.fontSize.xl,
            lineHeight: theme.typography.lineHeight.xl,
            fontFamily: theme.typography.fontFamily.semibold,
            fontVariant: ["tabular-nums"],
          }}
        >
          {count.toString().padStart(2, "0")}
        </AppText>
      </View>
      <AppText
        variant="caption"
        tone="muted"
        style={{ alignSelf: "stretch", textAlign: "center" }}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden", borderCurve: "continuous" },
  watermark: {
    position: "absolute",
    opacity: 0.06,
    transform: [{ rotate: "-12deg" }],
  },
  stat: { flex: 1, minWidth: 0, alignItems: "center" },
  medal: {
    flexShrink: 0,
    borderWidth: StyleSheet.hairlineWidth,
  },
  medalCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  divider: {
    alignSelf: "stretch",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
