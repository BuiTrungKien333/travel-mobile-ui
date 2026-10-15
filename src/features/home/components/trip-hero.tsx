import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { homeImages } from "../data/home-mocks";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import type { HomeSelection } from "../types/home-types";
import {
  dayDistance,
  formatTripDates,
  tripDuration,
} from "../utils/select-home";
import { Badge, homeStyles } from "./home-primitives";
import { FirstTripCard } from "./first-trip-card";

export function TripHero({ selection }: { selection: HomeSelection }) {
  const theme = useAppTheme();
  const { copy, locale } = useHomeCopy();
  const { openPanel, today } = useTripPreview((state) => ({
    openPanel: state.openPanel,
    today: state.today,
  }));

  if (selection.kind === "new") return <FirstTripCard />;

  const trip = "trip" in selection ? selection.trip : null;
  const ongoing = selection.kind === "ongoing";
  const countdown = trip?.startDate ? dayDistance(today, trip.startDate) : 0;
  const label = ongoing
    ? copy.ongoingBadge
    : trip
      ? copy.upcomingBadge
      : copy.returningBadge;
  const totalStops =
    trip?.days.reduce((count, day) => count + day.stops.length, 0) ?? 0;
  const todayStops =
    selection.kind === "ongoing"
      ? (trip?.days.find((day) => day.date === today)?.stops.length ?? 0)
      : 0;

  return (
    <View
      style={[
        styles.hero,
        {
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.heroSurface,
        },
      ]}
    >
      {!ongoing ? (
        <View style={{ height: theme.layout.heroImageHeight }}>
          <Image
            accessible={false}
            source={homeImages.forest}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <View
            style={[
              styles.imageBadge,
              {
                top: theme.spacing.lg,
                left: theme.spacing.lg,
                right: theme.spacing.lg,
              },
            ]}
          >
            <Badge label={label} icon="sparkles" dark />
          </View>
          {trip && !ongoing ? (
            <View
              style={[
                styles.countdown,
                {
                  right: theme.spacing.lg,
                  bottom: theme.spacing.md,
                  padding: theme.spacing.sm,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <AppText tone="primary" variant="label">
                {countdown === 0
                  ? copy.today
                  : `${countdown} ${copy.countdown}`}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}
      <View
        style={{
          padding: ongoing ? theme.spacing.lg : theme.spacing.xl,
          gap: ongoing ? theme.spacing.sm : theme.spacing.md,
        }}
      >
        {ongoing ? <Badge label={label} icon="route" /> : null}
        <AppText
          accessibilityRole="header"
          variant="heading"
          style={{
            color: theme.colors.onHero,
            fontSize: theme.typography.fontSize.xl,
            lineHeight: theme.typography.lineHeight.xl,
          }}
        >
          {trip ? trip.destination : copy.returningTitle}
        </AppText>
        {trip ? (
          <>
            <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
              <AppIcon
                name={ongoing ? "route" : "calendar"}
                color={theme.colors.onHeroMuted}
                size={theme.layout.iconSmall}
              />
              <AppText style={{ color: theme.colors.onHeroMuted }}>
                {selection.kind === "ongoing"
                  ? `${copy.day} ${selection.dayIndex + 1} / ${tripDuration(trip)}`
                  : `${formatTripDates(trip, locale)} · ${tripDuration(trip)} ${copy.days}`}
              </AppText>
            </View>
            <AppText
              variant="caption"
              style={{ color: theme.colors.onHeroMuted }}
            >
              {ongoing
                ? `${todayStops} ${copy.stopsToday}`
                : `${totalStops.toString().padStart(2, "0")} ${copy.placesAdded}`}
            </AppText>
          </>
        ) : (
          <AppText style={{ color: theme.colors.onHeroMuted }}>
            {copy.returningHint}
          </AppText>
        )}
        {!ongoing ? (
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppButton
              leadingIcon={
                <AppIcon
                  name={trip ? "arrow" : "plus"}
                  color={theme.colors.onPrimary}
                  size={theme.layout.iconSmall}
                />
              }
              onPress={() =>
                openPanel(
                  trip ? { kind: "plan", tripId: trip.id } : { kind: "create" },
                )
              }
            >
              {trip ? copy.plan : copy.createNew}
            </AppButton>
          </View>
        ) : null}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  hero: { overflow: "hidden", borderCurve: "continuous" },
  imageBadge: { position: "absolute" },
  countdown: { position: "absolute" },
});
