import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Animated, {
  LinearTransition,
  ReduceMotion,
} from "react-native-reanimated";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { useAppTheme } from "@/hooks/use-app-theme";
import { sampleItineraryDate, sampleItineraryStops } from "../data/home-mocks";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import type { TripStop } from "../types/home-types";
import { homeStyles, TextAction } from "./home-primitives";
import { SampleWeather } from "./sample-weather";

export function ExampleItineraryCard() {
  const theme = useAppTheme();
  const { copy, locale } = useHomeCopy();
  const openPanel = useTripPreview((state) => state.openPanel);
  const departureDate = new Intl.DateTimeFormat(
    locale === "vi" ? "vi-VN" : "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(new Date(`${sampleItineraryDate}T12:00:00Z`));

  return (
    <View
      style={[
        styles.card,
        {
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xs,
          gap: theme.spacing.lg,
          borderRadius: theme.radius.md,
          borderColor: theme.colors.glassBorder,
          backgroundColor: theme.colors.surfaceTint,
          boxShadow: [
            { ...theme.elevation.glass, color: theme.colors.glassShadow },
          ],
        },
      ]}
    >
      <View
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[
          styles.coolGlow,
          {
            width: theme.layout.heroImageHeight,
            height: theme.layout.heroImageHeight,
            top: -theme.spacing.section,
            right: -theme.spacing.xl,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.glassGlow,
          },
        ]}
      />
      <View
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[
          styles.warmGlow,
          {
            width: theme.layout.upcomingHeroImageHeight,
            height: theme.layout.upcomingHeroImageHeight,
            bottom: -theme.spacing.xxl,
            left: -theme.spacing.section,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.warningSurface,
          },
        ]}
      />
      <GlassBackdrop borderRadius={theme.radius.md} />
      <View style={{ gap: theme.spacing.sm }}>
        <View style={[homeStyles.row, { gap: theme.spacing.md }]}>
          <View style={[homeStyles.grow, { gap: theme.spacing.sm }]}>
            <AppText
              accessibilityRole="header"
              variant="heading"
              tone="primary"
              style={{
                fontFamily: theme.typography.fontFamily.semibold,
                fontSize: theme.typography.fontSize.lg,
                lineHeight: theme.typography.lineHeight.lg,
              }}
            >
              {copy.exampleTitle}
            </AppText>
            <View style={[homeStyles.row, { gap: theme.spacing.xs }]}>
              <AppIcon
                name="calendar"
                size={theme.layout.iconSmall}
                color={theme.colors.textSecondary}
              />
              <AppText variant="caption" tone="muted">
                {departureDate}
              </AppText>
            </View>
          </View>
          <View
            style={{
              padding: theme.spacing.xs,
              backgroundColor: theme.colors.glassInset,
              borderRadius: theme.radius.sm,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.glassBorder,
            }}
          >
            <SampleWeather />
          </View>
        </View>
        <View
          style={[homeStyles.row, { gap: theme.spacing.md, flexWrap: "wrap" }]}
        >
          <View
            style={[
              homeStyles.row,
              { gap: theme.spacing.xs },
              { marginBottom: 10 },
            ]}
          >
            <AppIcon
              name="clock"
              size={theme.layout.iconSmall}
              color={theme.colors.textSecondary}
            />
            <AppText variant="caption" tone="muted">
              {copy.sampleDay} {"   "} | {"   "} {sampleItineraryStops.length}{" "}
              {copy.sampleStops}
            </AppText>
          </View>
        </View>
      </View>
      <SampleStopList stops={sampleItineraryStops} />
      <View
        style={{
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.glassBorder,
          backgroundColor: theme.colors.glassInset,
          paddingHorizontal: theme.spacing.lg,
          marginHorizontal: -theme.spacing.lg,
          marginBottom: -theme.spacing.xs,
        }}
      >
        <View style={styles.action}>
          <TextAction
            compact
            label={copy.trySample}
            icon="arrow"
            onPress={() => openPanel({ kind: "sample" })}
          />
        </View>
      </View>
    </View>
  );
}

export function SampleStopList({
  stops,
}: {
  stops: readonly (TripStop & { image: number })[];
}) {
  const theme = useAppTheme();
  const { locale } = useHomeCopy();

  return (
    <View>
      {stops.map((stop, index) => (
        <Animated.View
          key={stop.id}
          layout={LinearTransition.duration(
            theme.motion.enterDuration,
          ).reduceMotion(ReduceMotion.System)}
          style={[
            styles.stop,
            {
              gap: theme.spacing.md,
              marginBottom: index < stops.length - 1 ? theme.spacing.lg : 0,
            },
          ]}
        >
          <View style={{ width: theme.layout.sampleStopNumberSize }}>
            {index < stops.length - 1 ? (
              <View
                style={[
                  styles.connector,
                  {
                    top: theme.layout.sampleStopNumberSize + theme.spacing.xs,
                    bottom: -theme.spacing.md,
                    backgroundColor: theme.colors.glassGlow,
                  },
                ]}
              />
            ) : null}
            <View
              style={[
                styles.number,
                {
                  minHeight: theme.layout.sampleStopNumberSize,
                  backgroundColor: theme.colors.softActionSurface,
                  borderRadius: theme.radius.sm,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.colors.glassBorder,
                },
              ]}
            >
              <AppText
                variant="caption"
                tone="primary"
                style={{ fontFamily: theme.typography.fontFamily.semibold }}
              >
                {index + 1}
              </AppText>
            </View>
          </View>
          <View
            style={[
              homeStyles.row,
              homeStyles.grow,
              {
                gap: theme.spacing.sm,
                padding: theme.spacing.xs,
                backgroundColor: theme.colors.glassInset,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.glassBorder,
                borderRadius: theme.radius.sm,
              },
            ]}
          >
            <View style={[homeStyles.grow, { gap: theme.spacing.xs }]}>
              <AppText variant="caption" tone="primary">
                {stop.time}
              </AppText>
              <AppText
                variant="label"
                style={{ fontFamily: theme.typography.fontFamily.semibold }}
              >
                {stop.name[locale]}
              </AppText>
              <AppText variant="caption" tone="muted">
                {stop.kind[locale]}
              </AppText>
            </View>
            <View
              style={[
                styles.photo,
                {
                  width: theme.layout.sampleStopImageSize,
                  height: theme.layout.sampleStopImageSize,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.surfaceVariant,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.colors.glassBorder,
                },
              ]}
            >
              <AppIcon name="pin" color={theme.colors.textSecondary} />
              <Image
                accessible={false}
                source={stop.image}
                contentFit="cover"
                cachePolicy="memory-disk"
                style={StyleSheet.absoluteFill}
              />
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  coolGlow: { position: "absolute" },
  warmGlow: { position: "absolute", opacity: 0.35 },
  stop: { flexDirection: "row", alignItems: "stretch" },
  number: { alignItems: "center", justifyContent: "center" },
  connector: {
    position: "absolute",
    left: "50%",
    width: StyleSheet.hairlineWidth,
  },
  photo: {
    flexShrink: 0,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  action: { alignItems: "flex-end" },
});
