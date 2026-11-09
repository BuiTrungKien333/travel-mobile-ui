import { svgDataUri } from "@/utils/svg-data-uri";
import { JournalAlbum } from "../components/journal-album";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import { View } from "react-native";
import { AppText } from "@/components/ui/app-text";

import { useAppTheme } from "@/hooks/use-app-theme";
import { CheckInPrompt } from "../components/check-in-prompt";
import { HomePage } from "../components/home-primitives";
import { OngoingTripHeader } from "../components/ongoing-trip-header";
import { NextStopCard } from "../components/ongoing-trip-components";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import type { Memory, Trip, TripStop } from "../types/home-types";
import { getDayProgress } from "../utils/day-progress";
import {
  getTripCoverImage,
  getSampleImage,
} from "@/features/trip/utils/trip-images";
export function OngoingHomeScreen({
  trip,
  dayIndex,
  runtime,
}: {
  trip: Trip;
  dayIndex: number;
  runtime?: {
    today: string;
    nextStop?: TripStop;
    stopCount: number;
    memories: Memory[];
    busy: boolean;
    onVisit: (stop: TripStop) => Promise<boolean>;
    onDetails: () => void;
    onWeather: () => void;
    onPlan: () => void;
    onJournal: () => void;
    onCamera: (stop?: TripStop) => void;
    onDeletePhoto: (memory: Memory) => Promise<void>;
    error?: string;
    onRefresh: () => void;
    refreshing: boolean;
    weather?: {
      temperature: number;
      condition: "sun" | "cloud" | "rain";
      label: string;
    };
  };
}) {
  const theme = useAppTheme();
  const backdropUri = svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${theme.colors.surfaceTint}"/><stop offset="1" stop-color="${theme.colors.background}"/></linearGradient></defs><rect width="100" height="100" fill="url(#sky)"/></svg>`,
  );
  const [checkedInStop, setCheckedInStop] = useState<TripStop | null>(null);
  const visiting = useRef(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const promptDuration = theme.motion.checkInPromptDuration;
  useEffect(() => {
    if (!checkedInStop) return;
    const timeout = setTimeout(() => setCheckedInStop(null), promptDuration);
    return () => clearTimeout(timeout);
  }, [checkedInStop, promptDuration]);
  const { locale } = useOngoingCopy();
  const {
    today: previewToday,
    visited,
    memories,
    setVisited,
    openPanel,
  } = useTripPreview((state) => ({
    today: state.today,
    visited: state.visited,
    memories: state.memories,
    setVisited: state.setVisited,
    openPanel: state.openPanel,
  }));
  const today = runtime?.today ?? previewToday;
  const stops = trip.days.find((day) => day.date === today)?.stops ?? [];
  const progress = runtime
    ? { nextStop: runtime.nextStop }
    : getDayProgress(stops, visited[`${trip.id}:${today}`] ?? []);
  const todayMemories =
    runtime?.memories ??
    memories.filter(
      (memory) => memory.tripId === trip.id && memory.date === today,
    );
  const dateLabel = new Intl.DateTimeFormat(
    locale === "vi" ? "vi-VN" : "en-GB",
    { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" },
  ).format(new Date(`${today}T12:00:00Z`));
  const openCamera = () =>
    runtime
      ? runtime.onCamera()
      : openPanel({
          kind: "camera",
          tripId: trip.id,
          date: today,
          stopId:
            visited[`${trip.id}:${today}`]?.at(-1) ?? progress.nextStop?.id,
        });
  const openJournal = () =>
    runtime
      ? runtime.onJournal()
      : openPanel({ kind: "journal", tripId: trip.id, date: today });
  const openPlan = () =>
    runtime
      ? runtime.onPlan()
      : openPanel({ kind: "plan", tripId: trip.id, dayIndex });
  const handleVisit = async (id: string, value: boolean) => {
    if (runtime) {
      if (visiting.current || runtime.busy || !runtime.nextStop) return;
      visiting.current = true;
      const stop = runtime.nextStop;
      try {
        if (await runtime.onVisit(stop)) setCheckedInStop(stop);
      } finally {
        visiting.current = false;
      }
      return;
    }
    setVisited(trip.id, today, id, value);
    if (value) setCheckedInStop(stops.find((stop) => stop.id === id) ?? null);
    else if (checkedInStop?.id === id) setCheckedInStop(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <HomePage
        showHeader
        onRefresh={runtime?.onRefresh}
        refreshing={runtime?.refreshing}
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
          liveWeather={runtime?.weather}
          preview={!runtime}
          trip={trip}
          dayIndex={dayIndex}
          dateLabel={dateLabel}
          today={today}
          onDetails={
            runtime?.onDetails ??
            (() => openPanel({ kind: "trip-details", tripId: trip.id }))
          }
          onWeather={
            runtime?.onWeather ??
            (() => openPanel({ kind: "current-weather", tripId: trip.id }))
          }
        />
        <NextStopCard
          key={progress.nextStop?.id ?? "finished"}
          cover={
            <Image
              accessible={false}
              source={
                coverFailed ? getSampleImage(trip.id) : getTripCoverImage(trip)
              }
              onError={() => setCoverFailed(true)}
              contentFit="cover"
              cachePolicy="memory-disk"
              style={{
                width: "100%",
                height: theme.layout.upcomingHeroImageHeight,
              }}
            />
          }
          stop={progress.nextStop}
          onDirections={() =>
            router.push({
              pathname: "/trip/[tripId]",
              params: { tripId: trip.id, day: today, map: "expanded" },
            })
          }
          hasStops={runtime ? runtime.stopCount > 0 : stops.length > 0}
          busy={runtime?.busy}
          onVisited={() => {
            if (progress.nextStop) void handleVisit(progress.nextStop.id, true);
          }}
          onJournal={openJournal}
          onPlan={openPlan}
        />
        {runtime?.error ? (
          <AppText accessibilityRole="alert">{runtime.error}</AppText>
        ) : null}
        <JournalAlbum
          memories={todayMemories}
          onOpen={openJournal}
          onDeletePhoto={runtime?.onDeletePhoto}
        />
      </HomePage>
      {checkedInStop ? (
        <CheckInPrompt
          key={checkedInStop.id}
          stop={checkedInStop}
          onCapture={() => {
            if (runtime) {
              runtime.onCamera(checkedInStop);
              setCheckedInStop(null);
              return;
            }
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
