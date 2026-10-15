import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Animated, {
  LinearTransition,
  ReduceMotion,
} from "react-native-reanimated";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
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
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <View style={{ gap: theme.spacing.sm }}>
        <View style={[homeStyles.row, { gap: theme.spacing.md }]}>
          <View style={[homeStyles.grow, { gap: theme.spacing.sm }]}>
            <AppText
              accessibilityRole="header"
              variant="heading"
              style={{
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
          <SampleWeather />
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
          borderColor: theme.colors.border,
          paddingTop: theme.spacing.xs,
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
                    backgroundColor: theme.colors.border,
                  },
                ]}
              />
            ) : null}
            <View
              style={[
                styles.number,
                {
                  minHeight: theme.layout.sampleStopNumberSize,
                  backgroundColor: theme.colors.surfaceTint,
                  borderRadius: theme.radius.sm,
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
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderCurve: "continuous" },
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
