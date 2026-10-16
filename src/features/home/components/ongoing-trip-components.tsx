import { Image } from "expo-image";
import { useState, type ReactNode } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
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
import { ItineraryStopList } from "./itinerary-stop-list";

export function JourneyCard({
  children,
  translucent = false,
}: {
  children: ReactNode;
  translucent?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        {
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          borderRadius: theme.radius.md,
          backgroundColor: translucent ? undefined : theme.colors.surfaceTint,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.glassBorder,
          boxShadow: [
            { ...theme.elevation.glass, color: theme.colors.glassShadow },
          ],
        },
      ]}
    >
      <TripGlassBackdrop
        borderRadius={theme.radius.md}
        variant={translucent ? "clock" : "default"}
      />
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
      <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
        <AppText
          variant="caption"
          tone="primary"
          style={[
            homeStyles.grow,
            { fontFamily: theme.typography.fontFamily.semibold },
          ]}
        >
          {copy.next}
        </AppText>
      </View>
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
              fontSize: theme.typography.fontSize.lg,
              lineHeight: theme.typography.lineHeight.lg,
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
      {stop.quickInfo ? (
        <View
          style={[homeStyles.row, { flexWrap: "wrap", gap: theme.spacing.sm }]}
        >
          {stop.quickInfo.admission ? (
            <View
              style={[
                homeStyles.row,
                {
                  gap: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  backgroundColor: theme.colors.glassInset,
                  borderRadius: theme.radius.sm,
                },
              ]}
            >
              <AppIcon name="ticket" size={theme.layout.iconSmall} />
              <AppText variant="caption" tone="primary">
                {copy.admission}: {stop.quickInfo.admission[locale]}
              </AppText>
            </View>
          ) : null}
          {stop.quickInfo.closesAt ? (
            <View
              style={[
                homeStyles.row,
                {
                  gap: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  backgroundColor: theme.colors.glassInset,
                  borderRadius: theme.radius.sm,
                },
              ]}
            >
              <AppIcon name="clock" size={theme.layout.iconSmall} />
              <AppText variant="caption" tone="primary">
                {copy.closesAt}: {stop.quickInfo.closesAt}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}
      <View
        style={[
          homeStyles.row,
          { gap: theme.spacing.sm, alignItems: "stretch" },
        ]}
      >
        <AppButton
          variant="raised"
          size="small"
          style={[
            styles.actionColumn,
            { flexGrow: 60, paddingHorizontal: theme.spacing.sm },
          ]}
          loading={opening}
          onPress={handleDirections}
          accessibilityHint={copy.directionsHint}
          leadingIcon={
            <AppIcon
              name="navigation"
              size={theme.layout.iconSmall}
              color={theme.colors.onRaisedAction}
            />
          }
        >
          {copy.directions}
        </AppButton>
        <AppButton
          variant="outline"
          size="small"
          onPress={onVisited}
          style={[
            styles.actionColumn,
            {
              flexGrow: 40,
              paddingHorizontal: theme.spacing.sm,
              backgroundColor: theme.colors.glassInset,
              borderColor: theme.colors.softActionBorder,
            },
          ]}
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
      <ItineraryStopList
        stops={visible.map((stop) => ({
          ...stop,
          image: captureSamples.find((sample) => sample.id === stop.id)?.photo,
        }))}
        live={{ visitedIds, nextStopId: progress.nextStop?.id, onToggle }}
      />
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
  actionColumn: { flex: 1, flexBasis: 0, minWidth: 0 },
  card: { overflow: "hidden", borderCurve: "continuous" },
  marker: { alignItems: "center", justifyContent: "center" },
});
