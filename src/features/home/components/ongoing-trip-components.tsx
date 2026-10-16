import { Image } from "expo-image";
import { useState, type ReactNode } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  LinearTransition,
  ReduceMotion,
} from "react-native-reanimated";

import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { captureSamples } from "../data/ongoing-preview";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import type { Memory, TripStop } from "../types/home-types";
import type { getDayProgress } from "../utils/day-progress";
import { directionsUrl } from "../utils/map-links";
import { homeStyles, TextAction } from "./home-primitives";
import { TripGlassBackdrop } from "./trip-glass-backdrop";

export function JourneyCard({ children }: { children: ReactNode }) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        {
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface,
          boxShadow: [
            { ...theme.elevation.glass, color: theme.colors.glassShadow },
          ],
        },
      ]}
    >
      <TripGlassBackdrop borderRadius={theme.radius.md} />
      {children}
    </View>
  );
}

export function NextStopCard({
  stop,
  destination,
  hasStops,
  onVisited,
  onJournal,
  onPlan,
}: {
  stop?: TripStop;
  destination: string;
  hasStops: boolean;
  onVisited: () => void;
  onJournal: () => void;
  onPlan: () => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useOngoingCopy();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(false);
  const photo = captureSamples.find((sample) => sample.id === stop?.id)?.photo;
  async function handleDirections() {
    if (!stop || opening) return;
    setOpening(true);
    setError(false);
    try {
      await Linking.openURL(directionsUrl(stop.name.vi, destination));
    } catch {
      setError(true);
    } finally {
      setOpening(false);
    }
  }
  if (!stop)
    return (
      <JourneyCard>
        <AppIcon
          name={hasStops ? "flag" : "route"}
          size={theme.layout.iconLarge}
        />
        <AppText accessibilityRole="header" variant="label">
          {hasStops ? copy.complete : copy.emptyDay}
        </AppText>
        <AppText tone="muted">
          {hasStops ? copy.completeHint : copy.emptyDayHint}
        </AppText>
        <AppButton
          variant="soft"
          size="small"
          onPress={hasStops ? onJournal : onPlan}
        >
          {hasStops ? copy.viewJournal : copy.addPlaces}
        </AppButton>
      </JourneyCard>
    );
  return (
    <JourneyCard>
      <AppText
        variant="caption"
        tone="primary"
        style={{ fontFamily: theme.typography.fontFamily.semibold }}
      >
        {copy.next}
      </AppText>
      <View
        style={[
          homeStyles.row,
          { gap: theme.spacing.md, alignItems: "flex-start" },
        ]}
      >
        <View style={[homeStyles.grow, { gap: theme.spacing.sm }]}>
          <AppText
            accessibilityRole="header"
            variant="heading"
            style={{
              fontSize: theme.typography.fontSize.xl,
              lineHeight: theme.typography.lineHeight.xl,
            }}
          >
            {stop.name[locale]}
          </AppText>
          <View style={[homeStyles.row, { gap: theme.spacing.xs }]}>
            <AppIcon name="clock" size={theme.layout.iconSmall} />
            <AppText variant="label" tone="primary">
              {stop.time}
            </AppText>
            <AppText variant="caption" tone="muted">
              {copy.plannedTime}
            </AppText>
          </View>
          <AppText variant="caption" tone="muted">
            {stop.kind[locale]}
          </AppText>
        </View>
        {photo ? (
          <Image
            accessible={false}
            source={photo}
            contentFit="cover"
            cachePolicy="memory-disk"
            style={{
              width: theme.layout.journeyThumbnailSize,
              height: theme.layout.journeyThumbnailSize,
              borderRadius: theme.radius.md,
            }}
          />
        ) : null}
      </View>
      <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
        <AppButton
          variant="soft"
          size="small"
          style={homeStyles.grow}
          loading={opening}
          onPress={handleDirections}
          accessibilityHint={copy.directionsHint}
          leadingIcon={
            <AppIcon
              name="route"
              size={theme.layout.iconSmall}
              color={theme.colors.onSoftAction}
            />
          }
        >
          {copy.directions}
        </AppButton>
        <AppButton
          variant="outline"
          size="small"
          onPress={onVisited}
          leadingIcon={<AppIcon name="check" size={theme.layout.iconSmall} />}
        >
          {copy.visited}
        </AppButton>
      </View>
      {error ? (
        <AppText accessibilityRole="alert" variant="caption" tone="error">
          {copy.directionsError}
        </AppText>
      ) : null}
    </JourneyCard>
  );
}

export function TodayTimeline({
  progress,
  onToggle,
  onFullDay,
}: {
  progress: ReturnType<typeof getDayProgress>;
  onToggle: (id: string, visited: boolean) => void;
  onFullDay: () => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useOngoingCopy();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded
    ? progress.ordered
    : progress.ordered.filter(
        (stop) =>
          stop.id === progress.visitedStops.at(-1)?.id ||
          progress.remainingStops
            .slice(0, 2)
            .some((item) => item.id === stop.id),
      );
  const visitedIds = new Set(progress.visitedStops.map((stop) => stop.id));
  return (
    <JourneyCard>
      <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
        <AppText
          accessibilityRole="header"
          variant="label"
          style={homeStyles.grow}
        >
          {copy.itinerary}
        </AppText>
        <AppText
          variant="caption"
          tone="primary"
          accessibilityLiveRegion="polite"
        >
          {progress.visitedStops.length}/{progress.ordered.length}{" "}
          {copy.visited.toLocaleLowerCase(locale)}
        </AppText>
      </View>
      <View style={{ gap: theme.spacing.xxs }}>
        {visible.map((stop) => {
          const visited = visitedIds.has(stop.id);
          const next = stop.id === progress.nextStop?.id;
          return (
            <Animated.View
              key={stop.id}
              layout={LinearTransition.duration(
                theme.motion.enterDuration,
              ).reduceMotion(ReduceMotion.System)}
            >
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: visited }}
                accessibilityLabel={`${stop.time}, ${stop.name[locale]}. ${visited ? copy.visited : next ? copy.next : copy.upcoming}`}
                accessibilityHint={visited ? copy.undoVisit : copy.markVisited}
                onPress={() => onToggle(stop.id, !visited)}
                style={({ pressed }) => [
                  homeStyles.row,
                  {
                    minHeight: theme.layout.touchTarget,
                    paddingVertical: theme.spacing.sm,
                    paddingHorizontal: theme.spacing.sm,
                    gap: theme.spacing.sm,
                    borderRadius: theme.radius.sm,
                    backgroundColor: next
                      ? theme.colors.softActionSurface
                      : undefined,
                    opacity: pressed ? theme.motion.pressOpacity : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.marker,
                    {
                      width: theme.spacing.xxl,
                      height: theme.spacing.xxl,
                      borderRadius: theme.radius.full,
                      backgroundColor: visited
                        ? theme.colors.successSurface
                        : theme.colors.glassInset,
                    },
                  ]}
                >
                  <AppIcon
                    name={visited ? "check" : next ? "pin" : "clock"}
                    size={theme.layout.iconSmall}
                    color={
                      visited
                        ? theme.colors.onSuccessSurface
                        : theme.colors.primaryText
                    }
                  />
                </View>
                <View style={[homeStyles.grow, { gap: theme.spacing.xxs }]}>
                  <AppText variant="label">{stop.name[locale]}</AppText>
                  <AppText variant="caption" tone="muted">
                    {visited ? copy.visited : next ? copy.next : copy.upcoming}
                  </AppText>
                </View>
                <AppText
                  variant="caption"
                  tone="primary"
                  style={{ fontFamily: theme.typography.fontFamily.semibold }}
                >
                  {stop.time}
                </AppText>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
      <View
        style={[
          homeStyles.row,
          { flexWrap: "wrap", justifyContent: "space-between" },
        ]}
      >
        {visible.length < progress.ordered.length || expanded ? (
          <TextAction
            label={expanded ? copy.hideVisited : copy.showVisited}
            onPress={() => setExpanded(!expanded)}
          />
        ) : null}
        <TextAction label={copy.fullDay} onPress={onFullDay} />
      </View>
    </JourneyCard>
  );
}

export function TodayJournal({
  memories,
  onOpen,
  onCapture,
}: {
  memories: Memory[];
  onOpen: () => void;
  onCapture: () => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useOngoingCopy();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
        <AppText
          accessibilityRole="header"
          variant="label"
          style={homeStyles.grow}
        >
          {copy.journal}
        </AppText>
        <TextAction label={copy.allJournal} onPress={onOpen} />
      </View>
      {memories.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.spacing.sm }}
        >
          {memories.slice(0, 4).map((memory) => (
            <Pressable
              key={memory.id}
              accessibilityRole="button"
              accessibilityLabel={`${memory.time ?? ""}, ${memory.place?.[locale] ?? memory.destination}`}
              onPress={onOpen}
              style={({ pressed }) => ({
                width: theme.layout.journalThumbnailSize,
                gap: theme.spacing.xs,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              })}
            >
              {memory.photo ? (
                <Image
                  accessible={false}
                  source={memory.photo}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  style={{
                    width: "100%",
                    height: theme.layout.journalThumbnailSize,
                    borderRadius: theme.radius.sm,
                  }}
                />
              ) : (
                <View
                  style={[
                    styles.marker,
                    {
                      height: theme.layout.journalThumbnailSize,
                      backgroundColor: theme.colors.surfaceTint,
                      borderRadius: theme.radius.sm,
                    },
                  ]}
                >
                  <AppIcon name="memories" />
                </View>
              )}
              <AppText variant="caption" tone="primary">
                {memory.time ?? copy.today}
              </AppText>
              <AppText variant="caption" tone="muted" numberOfLines={2}>
                {memory.place?.[locale] ?? memory.destination}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <JourneyCard>
          <AppText variant="label">{copy.journalEmpty}</AppText>
          <AppText variant="caption" tone="muted">
            {copy.journalEmptyHint}
          </AppText>
          <TextAction label={copy.capture} icon="camera" onPress={onCapture} />
        </JourneyCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden", borderCurve: "continuous" },
  marker: { alignItems: "center", justifyContent: "center" },
});
