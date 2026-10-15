import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  EnterSection,
  HomePage,
  homeStyles,
  PreviewNotice,
  SectionHeading,
  SurfaceCard,
  TextAction,
} from "../components/home-primitives";
import { TripHero } from "../components/trip-hero";
import { TripTimeline } from "../components/trip-timeline";
import { ExampleItineraryCard } from "../components/example-itinerary-card";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import { isPastTrip, selectHome } from "../utils/select-home";

// logo.png has a 307px transparent left inset in its 2172px canvas.
const logoLeftInsetRatio = 307 / 2172;

export function HomeScreen() {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const { trips, today, openPanel } = useTripPreview((state) => ({
    trips: state.trips,
    today: state.today,
    openPanel: state.openPanel,
  }));
  const selection = selectHome(trips, today);
  const trip = "trip" in selection ? selection.trip : null;
  const emptyDayIndex =
    trip?.days.findIndex((day) => day.stops.length === 0) ?? -1;
  const hasHistory = trips.some((item) => isPastTrip(item, today));
  const provinces = new Set(
    trips
      .filter((item) => isPastTrip(item, today))
      .map((item) => item.destination),
  ).size;
  const visitedPlaces = new Set(
    trips
      .filter((item) => isPastTrip(item, today))
      .flatMap((item) =>
        item.days.flatMap((day) =>
          day.stops.map((stop) => `${item.destination}:${stop.id}`),
        ),
      ),
  ).size;
  const subtitles = {
    new: copy.newSubtitle,
    upcoming: copy.upcomingSubtitle,
    ongoing: copy.ongoingSubtitle,
    returning: copy.returningSubtitle,
  };
  return (
    <HomePage>
      <View style={[homeStyles.row, { gap: theme.spacing.md }]}>
        <View style={homeStyles.grow}>
          <Image
            accessible
            accessibilityLabel="WeGo"
            source={require("@/assets/images/logo.png")}
            contentFit="contain"
            cachePolicy="memory-disk"
            style={{
              width: theme.layout.headerLogoWidth,
              height: theme.layout.headerLogoHeight,
              marginLeft: -theme.layout.headerLogoWidth * logoLeftInsetRatio,
              maxWidth: "100%",
            }}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.preview}
          onPress={() => openPanel({ kind: "scenarios" })}
          style={({ pressed }) => [
            styles.avatar,
            {
              minWidth: theme.layout.touchTarget,
              minHeight: theme.layout.touchTarget,
              opacity: pressed ? theme.motion.pressOpacity : 1,
            },
          ]}
        >
          <AppIcon name="tune" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.profile}
          onPress={() => router.push("/tabs/profile")}
          style={({ pressed }) => [
            styles.avatar,
            {
              minWidth: theme.layout.touchTarget,
              minHeight: theme.layout.touchTarget,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.surfaceTint,
              opacity: pressed ? theme.motion.pressOpacity : 1,
            },
          ]}
        >
          <AppIcon name="person" size={theme.layout.iconLarge} />
        </Pressable>
      </View>
      <View style={{ gap: theme.spacing.xs }}>
        <AppText
          accessibilityRole="header"
          variant="heading"
          style={{
            fontSize: theme.typography.fontSize.xl,
            lineHeight: theme.typography.lineHeight.xl,
          }}
        >
          {copy.greeting}
        </AppText>
        <AppText tone="muted">{subtitles[selection.kind]}</AppText>
      </View>
      <EnterSection key={selection.kind}>
        <View style={{ gap: theme.spacing.sm }}>
          <SectionHeading
            title={copy.yourTrip}
            variant="eyebrow"
            action={selection.kind === "new" ? undefined : copy.all}
            onPress={() => router.push("/tabs/trips")}
          />
          <TripHero selection={selection} />
        </View>
        {selection.kind === "upcoming" &&
        trip &&
        (emptyDayIndex >= 0 || trip.status === "draft") ? (
          <SurfaceCard>
            <AppText variant="caption" tone="muted">
              {copy.complete}
            </AppText>
            <View style={[homeStyles.row, { gap: theme.spacing.md }]}>
              <View
                style={[
                  styles.iconTile,
                  {
                    backgroundColor: theme.colors.surfaceTint,
                    padding: theme.spacing.md,
                    borderRadius: theme.radius.lg,
                  },
                ]}
              >
                <AppIcon name="pin" />
              </View>
              <View style={homeStyles.grow}>
                <AppText variant="label">
                  {emptyDayIndex >= 0
                    ? `${copy.day} ${emptyDayIndex + 1} ${copy.missingDay}`
                    : copy.draftHint}
                </AppText>
                <TextAction
                  label={emptyDayIndex >= 0 ? copy.addPlace : copy.finishDraft}
                  onPress={() =>
                    openPanel({
                      kind: "plan",
                      tripId: trip.id,
                      dayIndex: Math.max(0, emptyDayIndex),
                    })
                  }
                />
              </View>
            </View>
          </SurfaceCard>
        ) : null}
        {selection.kind === "ongoing" ? (
          <>
            <View
              style={[
                styles.weather,
                {
                  padding: theme.spacing.lg,
                  borderRadius: theme.radius.xl,
                  backgroundColor: theme.colors.warningSurface,
                  gap: theme.spacing.md,
                },
              ]}
            >
              <AppIcon name="rain" color={theme.colors.onWarningSurface} />
              <View style={homeStyles.grow}>
                <AppText
                  variant="label"
                  style={{ color: theme.colors.onWarningSurface }}
                >
                  {copy.rainTitle}
                </AppText>
                <AppText
                  variant="caption"
                  style={{ color: theme.colors.onWarningSurface }}
                >
                  {copy.rainHint}
                </AppText>
                <TextAction
                  label={copy.rainAction}
                  onPress={() => openPanel({ kind: "weather" })}
                />
              </View>
            </View>
            <SurfaceCard>
              <SectionHeading title={copy.nextStops} />
              <AppButton
                onPress={() =>
                  openPanel({
                    kind: "plan",
                    tripId: selection.trip.id,
                    dayIndex: selection.dayIndex,
                  })
                }
                leadingIcon={
                  <AppIcon
                    name="route"
                    color={theme.colors.onPrimary}
                    size={theme.layout.iconSmall}
                  />
                }
              >
                {copy.todayPlan}
              </AppButton>
              <TripTimeline
                stops={
                  selection.trip.days
                    .find((day) => day.date === today)
                    ?.stops.slice(0, 2) ?? []
                }
              />
              <AppButton
                variant="outline"
                leadingIcon={<AppIcon name="camera" />}
                onPress={() =>
                  openPanel({
                    kind: "moment",
                    destination: selection.trip.destination,
                  })
                }
              >
                {copy.capture}
              </AppButton>
            </SurfaceCard>
          </>
        ) : null}
        {selection.kind === "new" ? (
          <View style={{ gap: theme.spacing.sm }}>
            <SectionHeading title={copy.example} variant="eyebrow" />
            <ExampleItineraryCard />
          </View>
        ) : null}
        {hasHistory && selection.kind !== "ongoing" ? (
          <SurfaceCard>
            <SectionHeading title={copy.footprint} />
            <View style={[homeStyles.row, { gap: theme.spacing.lg }]}>
              <View style={homeStyles.grow}>
                <AppText variant="heading" tone="primary">
                  {provinces.toString().padStart(2, "0")}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {copy.provinces}
                </AppText>
              </View>
              <View
                style={[
                  homeStyles.grow,
                  {
                    borderLeftWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.border,
                    paddingLeft: theme.spacing.lg,
                  },
                ]}
              >
                <AppText variant="heading" tone="primary">
                  {visitedPlaces.toString().padStart(2, "0")}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {copy.places}
                </AppText>
              </View>
            </View>
            <View
              style={{
                borderTopWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.border,
              }}
            >
              <TextAction
                label={copy.myJourney}
                onPress={() => router.push("/tabs/memories")}
              />
            </View>
          </SurfaceCard>
        ) : null}
      </EnterSection>
      <PreviewNotice />
    </HomePage>
  );
}
const styles = StyleSheet.create({
  avatar: { alignItems: "center", justifyContent: "center" },
  iconTile: { alignItems: "center", justifyContent: "center" },
  weather: { flexDirection: "row", alignItems: "flex-start" },
});
