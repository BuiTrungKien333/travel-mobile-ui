import { router } from "expo-router";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { todayCalendarDate } from "@/utils/calendar-date";
import { useTripsQuery } from "@/features/trip/api/trip-hooks";
import { useMemories } from "@/features/memories/hooks/use-memories";
import { HomePage, SectionHeading, SurfaceCard } from "../components/home-primitives";
import { useHomeCopy } from "../i18n/home-copy";
import { useOngoingCopy } from "../i18n/ongoing-copy";

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
  const currentTrip = trips
    .filter((trip) => trip.status === "ACTIVE" || (trip.status !== "CANCELLED" && trip.status !== "COMPLETED" && trip.startDate && trip.endDate && trip.startDate <= today && trip.endDate >= today))
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))[0];
  const nextTrip = trips
    .filter((trip) => trip.status !== "CANCELLED" && trip.status !== "COMPLETED" && trip.startDate && trip.startDate >= today)
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))[0];
  const journey = currentTrip ?? nextTrip;
  const completedTrips = trips.filter((trip) => trip.status === "COMPLETED" || (!!trip.endDate && trip.endDate < today));
  const memoriesCount = trips.reduce((sum, trip) => sum + trip.memoryCount, 0);
  const totalPlaces = trips.reduce((sum, trip) => sum + trip.stopCount, 0);
  const recentMemories = memoriesQuery.memories.filter((memory) => memory.photo)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || (b.time ?? "").localeCompare(a.time ?? ""))
    .slice(0, 4);

  return (
    <HomePage>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Image accessible accessibilityLabel="Wego" source={require("@/assets/images/logo.png")} contentFit="contain" style={{ width: theme.layout.headerLogoWidth, height: theme.layout.headerLogoHeight }} />
      </View>
      <View style={{ gap: theme.spacing.xs }}>
        <AppText accessibilityRole="header" variant="heading" style={{ fontSize: theme.typography.fontSize.xl }}>{copy.greeting}</AppText>
        <AppText tone="muted">{copy.returningSubtitle}</AppText>
      </View>

      {(tripsQuery.isPending || memoriesQuery.isPending) ? (
        <SurfaceCard><ActivityIndicator color={theme.colors.primary} /></SurfaceCard>
      ) : null}
      {(tripsQuery.isError || memoriesQuery.isError) ? (
        <SurfaceCard>
          <AppText tone="error">{copy.memoriesLoadError}</AppText>
          <AppButton variant="outline" onPress={() => { void tripsQuery.refetch(); void memoriesQuery.refetch(); }}>{copy.retry}</AppButton>
        </SurfaceCard>
      ) : null}

      {!tripsQuery.isPending && !tripsQuery.isError ? (
        <SurfaceCard tinted>
          <View style={{ alignItems: "center", gap: theme.spacing.sm }}>
            <AppIcon name={journey ? "map" : "pin"} size={theme.layout.iconLarge} color={theme.colors.primary} />
            <AppText accessibilityRole="header" variant="label">{journey ? journey.destination.name : copy.returningTitle}</AppText>
            <AppText tone="muted">{journey ? tripDateRange(journey.startDate, journey.endDate, locale === "vi" ? "vi-VN" : "en-GB") : copy.newHint}</AppText>
          </View>
          {journey ? (
            <AppButton variant="gradient" onPress={() => router.push({ pathname: "/trip/[tripId]", params: { tripId: journey.id } })}>{copy.plan}</AppButton>
          ) : null}
          <AppButton variant={journey ? "outline" : "gradient"} onPress={() => router.navigate("/tabs/trips")}>{copy.createNew}</AppButton>
        </SurfaceCard>
      ) : null}

      {!tripsQuery.isPending && !tripsQuery.isError && trips.length > 0 ? (
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
        {memoriesQuery.isError ? null : recentMemories.length ? (
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
    </HomePage>
  );
}

function HomeStat({ value, label }: { value: number; label: string }) {
  const theme = useAppTheme();
  return <View style={{ alignItems: "center", flex: 1, gap: theme.spacing.xxs }}><AppText variant="heading" tone="primary">{value}</AppText><AppText variant="caption" tone="muted" style={{ textAlign: "center" }}>{label}</AppText></View>;
}
