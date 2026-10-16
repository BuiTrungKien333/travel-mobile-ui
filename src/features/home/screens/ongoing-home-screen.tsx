import { Pressable, View } from "react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  HomePage,
  homeStyles,
  TextAction,
} from "../components/home-primitives";
import {
  NextStopCard,
  TodayJournal,
  TodayTimeline,
} from "../components/ongoing-trip-components";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import type { Trip } from "../types/home-types";
import { getDayProgress } from "../utils/day-progress";
import { tripDuration } from "../utils/select-home";

export function OngoingHomeScreen({
  trip,
  dayIndex,
}: {
  trip: Trip;
  dayIndex: number;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useOngoingCopy();
  const { today, visited, memories, setVisited, openPanel } = useTripPreview(
    (state) => ({
      today: state.today,
      visited: state.visited,
      memories: state.memories,
      setVisited: state.setVisited,
      openPanel: state.openPanel,
    }),
  );
  const stops = trip.days.find((day) => day.date === today)?.stops ?? [];
  const progress = getDayProgress(stops, visited[`${trip.id}:${today}`] ?? []);
  const todayMemories = memories.filter(
    (memory) => memory.tripId === trip.id && memory.date === today,
  );
  const dateLabel = new Intl.DateTimeFormat(
    locale === "vi" ? "vi-VN" : "en-GB",
    { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" },
  ).format(new Date(`${today}T12:00:00Z`));
  const openCamera = () =>
    openPanel({
      kind: "camera",
      tripId: trip.id,
      date: today,
      stopId: progress.nextStop?.id,
    });
  const openJournal = () =>
    openPanel({ kind: "journal", tripId: trip.id, date: today });
  const openPlan = () => openPanel({ kind: "plan", tripId: trip.id, dayIndex });

  return (
    <HomePage showHeader>
      <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
        <View style={[homeStyles.grow, { gap: theme.spacing.xs }]}>
          <AppText
            accessibilityRole="header"
            variant="heading"
            style={{
              fontSize: theme.typography.fontSize.xl,
              lineHeight: theme.typography.lineHeight.xl,
            }}
          >
            {trip.destination}
          </AppText>
          <AppText variant="caption" tone="muted">
            {copy.day} {dayIndex + 1}/{tripDuration(trip)} · {dateLabel}
          </AppText>
        </View>
        <TextAction
          label={copy.detailsShort}
          onPress={() => openPanel({ kind: "trip-details", tripId: trip.id })}
        />
      </View>
      <NextStopCard
        key={progress.nextStop?.id ?? "finished"}
        stop={progress.nextStop}
        destination={trip.destination}
        hasStops={stops.length > 0}
        onVisited={() => {
          if (progress.nextStop)
            setVisited(trip.id, today, progress.nextStop.id, true);
        }}
        onJournal={openJournal}
        onPlan={openPlan}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${copy.rain}. ${copy.weather}`}
        onPress={() => openPanel({ kind: "weather" })}
        style={({ pressed }) => [
          homeStyles.row,
          {
            gap: theme.spacing.sm,
            padding: theme.spacing.md,
            minHeight: theme.layout.touchTarget,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.warningSurface,
            opacity: pressed ? theme.motion.pressOpacity : 1,
          },
        ]}
      >
        <AppIcon
          name="umbrella"
          size={theme.layout.iconSmall}
          color={theme.colors.onWarningSurface}
        />
        <AppText
          variant="caption"
          style={[homeStyles.grow, { color: theme.colors.onWarningSurface }]}
        >
          {copy.rain}
        </AppText>
        <AppIcon
          name="chevron"
          size={theme.layout.iconSmall}
          color={theme.colors.onWarningSurface}
        />
      </Pressable>
      {stops.length ? (
        <TodayTimeline
          progress={progress}
          onToggle={(id, value) => setVisited(trip.id, today, id, value)}
          onFullDay={openPlan}
        />
      ) : null}
      <TodayJournal
        memories={todayMemories}
        onOpen={openJournal}
        onCapture={openCamera}
      />
    </HomePage>
  );
}
