import { router } from "expo-router";
import { View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  EnterSection,
  HomePage,
  PreviewNotice,
} from "../components/home-primitives";
import { TripHero } from "../components/trip-hero";
import { TripCompletionCard } from "../components/trip-completion-card";
import { FootprintCard } from "../components/footprint-card";
import { JournalAlbum } from "../components/journal-album";
import { TravelWeatherDashboard } from "../components/travel-weather-dashboard";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import { isPastTrip, selectHome } from "../utils/select-home";
import { OngoingHomeScreen } from "./ongoing-home-screen";
import { NewUserHomeScreen } from "./new-user-home-screen";

export function HomeScreen() {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const { trips, today, memories, openPanel } = useTripPreview((state) => ({
    trips: state.trips,
    today: state.today,
    memories: state.memories,
    openPanel: state.openPanel,
  }));
  const selection = selectHome(trips, today);
  if (selection.kind === "new") return <NewUserHomeScreen preview />;
  if (selection.kind === "ongoing") {
    return (
      <OngoingHomeScreen
        key={selection.trip.id}
        trip={selection.trip}
        dayIndex={selection.dayIndex}
      />
    );
  }
  const trip = "trip" in selection ? selection.trip : null;
  const emptyDayIndex =
    trip?.days.findIndex((day) => day.stops.length === 0) ?? -1;
  const pastTrips = trips.filter((item) => isPastTrip(item, today));
  const hasHistory = pastTrips.length > 0;
  const recentMemories = memories
    .filter((memory) => memory.photo)
    .sort(
      (a, b) =>
        (b.date ?? "").localeCompare(a.date ?? "") ||
        (b.time ?? "").localeCompare(a.time ?? ""),
    );
  const provinces = new Set(pastTrips.map((item) => item.destination)).size;
  const visitedPlaces = new Set(
    pastTrips.flatMap((item) =>
      item.days.flatMap((day) =>
        day.stops.map((stop) => `${item.destination}:${stop.id}`),
      ),
    ),
  ).size;

  const subtitles = {
    upcoming: copy.upcomingSubtitle,
    ongoing: copy.ongoingSubtitle,
    returning: copy.returningSubtitle,
  };

  return (
    <HomePage showHeader>
      <View style={{ gap: theme.spacing.xs }}>
        <AppText
          accessibilityRole="header"
          variant="title"
          style={{
            fontSize: theme.typography.fontSize.xl,
            lineHeight: theme.typography.lineHeight.xl,
          }}
        >
          {copy.greeting}
        </AppText>
        <AppText tone="muted">{subtitles[selection.kind]}</AppText>
      </View>
      <EnterSection key={selection.kind} animated={false}>
        <TripHero selection={selection} />
        {selection.kind === "upcoming" ? (
          <TravelWeatherDashboard
            key={selection.trip.id}
            trip={selection.trip}
          />
        ) : null}
        {selection.kind === "upcoming" &&
        trip &&
        (emptyDayIndex >= 0 || trip.status === "draft") ? (
          <TripCompletionCard
            title={
              emptyDayIndex >= 0
                ? `${copy.day} ${emptyDayIndex + 1} ${copy.missingDay}`
                : copy.draftHint
            }
            action={emptyDayIndex >= 0 ? copy.addPlace : copy.finishDraft}
            onPress={() =>
              openPanel({
                kind: "plan",
                tripId: trip.id,
                dayIndex: Math.max(0, emptyDayIndex),
              })
            }
          />
        ) : null}
        {hasHistory ? (
          <FootprintCard
            provinces={provinces}
            visitedPlaces={visitedPlaces}
            onPress={() => router.push("/tabs/memories")}
          />
        ) : null}
        {selection.kind === "returning" || selection.kind === "upcoming" ? (
          <JournalAlbum
            variant="recent"
            memories={recentMemories}
            onOpen={() => router.push("/tabs/memories")}
          />
        ) : null}
        <View style={{ paddingTop: theme.spacing.sm }}>
          <PreviewNotice />
        </View>
      </EnterSection>
    </HomePage>
  );
}
