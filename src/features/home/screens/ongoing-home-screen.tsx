import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { View } from "react-native";

import { useAppTheme } from "@/hooks/use-app-theme";
import { CheckInPrompt } from "../components/check-in-prompt";
import { HomePage } from "../components/home-primitives";
import { OngoingTripHeader } from "../components/ongoing-trip-header";
import {
  NextStopCard,
  TodayJournal,
  TodayTimeline,
} from "../components/ongoing-trip-components";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import type { Trip, TripStop } from "../types/home-types";
import { getDayProgress } from "../utils/day-progress";
export function OngoingHomeScreen({
  trip,
  dayIndex,
}: {
  trip: Trip;
  dayIndex: number;
}) {
  const theme = useAppTheme();
  const backdropUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${theme.colors.surfaceTint}"/><stop offset="1" stop-color="${theme.colors.background}"/></linearGradient></defs><rect width="100" height="100" fill="url(#sky)"/></svg>`,
  )}`;
  const [checkedInStop, setCheckedInStop] = useState<TripStop | null>(null);
  const promptDuration = theme.motion.checkInPromptDuration;
  useEffect(() => {
    if (!checkedInStop) return;
    const timeout = setTimeout(() => setCheckedInStop(null), promptDuration);
    return () => clearTimeout(timeout);
  }, [checkedInStop, promptDuration]);
  const { locale } = useOngoingCopy();
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
      stopId: visited[`${trip.id}:${today}`]?.at(-1) ?? progress.nextStop?.id,
    });
  const openJournal = () =>
    openPanel({ kind: "journal", tripId: trip.id, date: today });
  const openPlan = () => openPanel({ kind: "plan", tripId: trip.id, dayIndex });
  const handleVisit = (id: string, value: boolean) => {
    setVisited(trip.id, today, id, value);
    if (value) setCheckedInStop(stops.find((stop) => stop.id === id) ?? null);
    else if (checkedInStop?.id === id) setCheckedInStop(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <HomePage
        showHeader
        backdrop={
          <Image
            accessible={false}
            source={{ uri: backdropUri }}
            contentFit="fill"
            cachePolicy="memory"
            style={{ width: "100%", height: theme.layout.heroImageHeight * 2 }}
          />
        }
      >
        <OngoingTripHeader
          trip={trip}
          dayIndex={dayIndex}
          dateLabel={dateLabel}
          today={today}
          onDetails={() => openPanel({ kind: "trip-details", tripId: trip.id })}
          onWeather={() =>
            openPanel({ kind: "current-weather", tripId: trip.id })
          }
        />
        <NextStopCard
          key={progress.nextStop?.id ?? "finished"}
          stop={progress.nextStop}
          destination={trip.destination}
          hasStops={stops.length > 0}
          onVisited={() => {
            if (progress.nextStop) handleVisit(progress.nextStop.id, true);
          }}
          onJournal={openJournal}
          onPlan={openPlan}
        />
        {stops.length ? (
          <TodayTimeline
            progress={progress}
            onToggle={handleVisit}
            onFullDay={openPlan}
          />
        ) : null}
        <TodayJournal
          memories={todayMemories}
          onOpen={openJournal}
          onCapture={openCamera}
        />
      </HomePage>
      {checkedInStop ? (
        <CheckInPrompt
          key={checkedInStop.id}
          stop={checkedInStop}
          onCapture={() => {
            openPanel({
              kind: "camera",
              tripId: trip.id,
              date: today,
              stopId: checkedInStop.id,
            });
            setCheckedInStop(null);
          }}
        />
      ) : null}
    </View>
  );
}
