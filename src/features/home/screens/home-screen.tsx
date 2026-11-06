import { router } from "expo-router";
import { Image } from "expo-image";
import { QueryFeedback } from "@/components/common/query-feedback";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { todayCalendarDate } from "@/utils/calendar-date";
import { useTripsQuery } from "@/features/trip/api/trip-hooks";
import { useMemories } from "@/features/memories/hooks/use-memories";
import { HomePage, SectionHeading, SurfaceCard, TextAction } from "../components/home-primitives";
import { useHomeCopy } from "../i18n/home-copy";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import { HomeLiveJourney } from "../components/home-live-journey";
import { HomeHeader } from "../components/home-header";
import { CreateTripModal } from "@/features/trip/components/create-trip-modal";
import { TripStatusBadge } from "@/features/trip/components/trip-status-badge";
import { selectHomeJourney } from "../utils/home-journey";

function tripDateRange(startDate: string | null, endDate: string | null, locale: string) {
  if (!startDate || !endDate) return "";
  const date = (value: string) => new Intl.DateTimeFormat(locale, {
    day: "numeric", month: "short", timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
  return `${date(startDate)} – ${date(endDate)}`;
}

export function HomeScreen() {
  const theme = useAppTheme();
  const { copy, locale } = useHomeCopy();
  const { copy: ongoingCopy } = useOngoingCopy();
  const tripsQuery = useTripsQuery();
  const memoriesQuery = useMemories();
  const today = todayCalendarDate();
  const trips = tripsQuery.data ?? [];
  const [createVisible, setCreateVisible] = useState(false);
  const { state, trip: journey, completed: completedTrips } = selectHomeJourney(trips, today);
  const subtitles = { new: copy.newSubtitle, ongoing: copy.ongoingSubtitle, upcoming: copy.upcomingSubtitle,
    draft: copy.draftHint, completed: copy.returningSubtitle };
  const openJourney = () => {
    if (!journey) return;
    if (state === "completed") router.push({ pathname: "/memories/[tripId]", params: { tripId: journey.id } });
    else router.push({ pathname: "/trip/[tripId]", params: { tripId: journey.id, ...(state === "ongoing" ? { day: today } : {}) } });
  };
  const memoriesCount = trips.reduce((sum, trip) => sum + trip.memoryCount, 0);
  const totalPlaces = trips.reduce((sum, trip) => sum + trip.stopCount, 0);
  const recentMemories = memoriesQuery.memories.filter((memory) => memory.photo)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || (b.time ?? "").localeCompare(a.time ?? ""))
    .slice(0, 4);

  return (
    <HomePage>
      <HomeHeader />
      <View style={{ gap: theme.spacing.xs }}>
        <AppText accessibilityRole="header" variant="screenTitle">{copy.greeting}</AppText>
        <AppText tone="muted">{subtitles[state]}</AppText>
      </View>

      <QueryFeedback loading={tripsQuery.isPending || memoriesQuery.isPending}
        refreshing={tripsQuery.isRefetching || memoriesQuery.isRefetching}
        error={tripsQuery.isError ? copy.tripsLoadError : memoriesQuery.isError ? copy.memoriesLoadError : null}
        retrying={tripsQuery.isFetching || memoriesQuery.isFetching}
        onRetry={() => { void tripsQuery.refetch(); void memoriesQuery.refetch(); }} />

      {tripsQuery.data !== undefined ? (
        <SurfaceCard tinted>
          <View style={{ gap: theme.spacing.sm }}>
            {journey ? <TripStatusBadge status={state === "new" ? "draft" : state} locale={locale} /> : <AppIcon name="pin" size={theme.layout.iconLarge} color={theme.colors.primaryText} />}
            {state === "completed" ? <AppText variant="caption" tone="muted">{copy.latestJourney}</AppText> : null}
            <AppText accessibilityRole="header" variant="sectionTitle">{journey ? journey.title || journey.destination.name : copy.newTitle}</AppText>
            {journey ? <AppText variant="caption" tone="primary">{journey.destination.name}</AppText> : null}
            <AppText variant="caption" tone="muted">{journey ? tripDateRange(journey.startDate, journey.endDate, locale === "vi" ? "vi-VN" : "en-GB") || copy.newHint : copy.newHint}</AppText>
          </View>
          {journey ? (
            state === "ongoing" ? <TextAction label={copy.todayPlan} onPress={openJourney} />
              : <AppButton onPress={openJourney}>{state === "draft" ? copy.resumeDraft : state === "completed" ? copy.openAlbum : copy.plan}</AppButton>
          ) : null}
          {journey ? <TextAction label={copy.createNew} icon="plus" onPress={() => setCreateVisible(true)} />
            : <AppButton onPress={() => setCreateVisible(true)}>{copy.create}</AppButton>}
        </SurfaceCard>
      ) : null}

      {state === "ongoing" && journey ? <HomeLiveJourney tripId={journey.id} today={today} /> : null}
      {tripsQuery.data !== undefined && trips.length > 0 ? (
        <SurfaceCard tinted>
          <SectionHeading title={copy.footprint} />
          <View style={{ flexDirection: "row", justifyContent: "space-around", gap: theme.spacing.md }}>
            <HomeStat value={completedTrips.length} label={copy.statsTrips} />
            <HomeStat value={memoriesCount} label={copy.statsMemories} />
            <HomeStat value={totalPlaces} label={copy.statsPlaces} />
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.navigate("/tabs/memories")} style={{ minHeight: theme.layout.touchTarget, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <AppText tone="primary">{copy.myJourney}</AppText><AppIcon name="chevron" />
          </Pressable>
        </SurfaceCard>
      ) : null}

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeading title={ongoingCopy.recentJournal} action={ongoingCopy.allMemories} onPress={() => router.navigate("/tabs/memories")} />
        {recentMemories.length ? (
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            {recentMemories.map((memory) => {
              const photo = memory.photo;
              return photo ? <Pressable key={memory.id} accessibilityRole="button" accessibilityLabel={memory.text || copy.memories} onPress={() => memory.tripId
                ? router.push({ pathname: "/memories/photo/[memoryId]", params: { memoryId: memory.id, tripId: memory.tripId } })
                : router.push("/memories/saved-later")} style={{ flex: 1 }}><Image source={photo} contentFit="cover" style={{ width: "100%", aspectRatio: 1, borderRadius: theme.radius.md }} /></Pressable> : null;
            })}
          </View>
        ) : !memoriesQuery.isPending ? (
          <SurfaceCard><AppText tone="muted">{copy.noMemories}</AppText></SurfaceCard>
        ) : null}
      </View>
      <CreateTripModal visible={createVisible} onClose={() => setCreateVisible(false)} onCreated={(tripId) => {
        setCreateVisible(false);
        router.push({ pathname: "/trip/[tripId]", params: { tripId } });
      }} />
    </HomePage>
  );
}

function HomeStat({ value, label }: { value: number; label: string }) {
  const theme = useAppTheme();
  return <View style={{ alignItems: "center", flex: 1, gap: theme.spacing.xxs }}><AppText variant="heading" tone="primary">{value}</AppText><AppText variant="caption" tone="muted" style={{ textAlign: "center" }}>{label}</AppText></View>;
}
