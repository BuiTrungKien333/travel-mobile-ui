import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { homeImages } from "../data/home-mocks";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import { useHomeAmbientMotion } from "../hooks/use-home-ambient-motion";
import type { Trip } from "../types/home-types";
import {
  dayDistance,
  formatTripDates,
  tripDuration,
} from "../utils/select-home";
import { homeStyles } from "./home-primitives";
import { DepartureClock } from "./upcoming-trip-indicators";

export function UpcomingTripCard({ trip }: { trip: Trip }) {
  const theme = useAppTheme();
  const { copy, locale } = useHomeCopy();
  const animationProgress = useHomeAmbientMotion();
  const { today, openPanel } = useTripPreview((state) => ({
    today: state.today,
    openPanel: state.openPanel,
  }));
  const countdown = trip.startDate
    ? Math.max(0, dayDistance(today, trip.startDate))
    : null;
  const duration = tripDuration(trip);
  const dates =
    formatTripDates(trip, locale) ||
    (trip.startDate
      ? new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        }).format(new Date(`${trip.startDate}T12:00:00Z`))
      : "");
  const totalStops = trip.days.reduce(
    (count, day) => count + day.stops.length,
    0,
  );

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: theme.radius.md,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <View style={{ height: theme.layout.upcomingHeroImageHeight }}>
        <Image
          accessible={false}
          source={homeImages.upcomingPhoto}
          contentFit="cover"
          contentPosition="bottom"
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFill}
        />
        {countdown !== null ? (
          <View
            style={[
              styles.countdownPosition,
              {
                right: theme.spacing.md,
                top: theme.spacing.md,
              },
            ]}
          >
            <DepartureClock days={countdown} progress={animationProgress} />
          </View>
        ) : null}
      </View>
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.xs }}>
          <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
            <AppText
              accessibilityRole="header"
              variant="heading"
              style={{
                flex: 1,
                fontSize: theme.typography.fontSize.lg,
                lineHeight: theme.typography.lineHeight.lg,
              }}
            >
              {trip.destination}
            </AppText>
            <View
              style={{
                flexShrink: 1,
                borderRadius: theme.radius.full,
                paddingVertical: theme.spacing.xxs,
                paddingHorizontal: theme.spacing.sm,
                backgroundColor: theme.colors.stopChipSurface,
              }}
            >
              <AppText variant="caption" tone="primary">
                {totalStops} {copy.sampleStops}
              </AppText>
            </View>
          </View>
          {dates ? (
            <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
              <AppIcon
                name="calendar"
                size={theme.layout.iconSmall}
                color={theme.colors.textSecondary}
              />
              <AppText variant="caption" tone="muted">
                {dates}
                {duration > 0 ? ` · ${duration} ${copy.days}` : ""}
              </AppText>
            </View>
          ) : null}
        </View>
        {trip.status === "draft" ? (
          <AppText variant="caption" tone="muted">
            {copy.draft}
          </AppText>
        ) : null}
        <AppButton
          variant="gradient"
          size="small"
          style={{ borderRadius: theme.radius.md }}
          onPress={() => openPanel({ kind: "plan", tripId: trip.id })}
          trailingIcon={
            <AppIcon
              name="arrow"
              color={theme.colors.onGradientAction}
              size={theme.layout.iconSmall}
            />
          }
        >
          {copy.plan}
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: "continuous",
  },
  countdownPosition: { position: "absolute", maxWidth: "70%" },
});
