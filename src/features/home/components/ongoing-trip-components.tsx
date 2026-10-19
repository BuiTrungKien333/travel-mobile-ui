import { Image } from "expo-image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
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
import { JournalPhotoViewer } from "./journal-photo-viewer";
import { useTripPreview } from "../providers/trip-preview-provider";
import type { PhotoSelection } from "../utils/photo-viewer-geometry";

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

const JOURNAL_PREVIEW_LIMIT = 6;

export function TodayJournal({
  memories,
  onOpen,
  onCapture,
  variant = "today",
}: {
  memories: Memory[];
  onOpen: () => void;
  onCapture?: () => void;
  variant?: "today" | "recent";
}) {
  const theme = useAppTheme();
  const { copy } = useOngoingCopy();
  const [selection, setSelection] = useState<PhotoSelection | null>(null);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const photoReaders = useRef(new Map<string, () => PhotoSelection | null>());
  const registerPhoto = useCallback(
    (id: string, read: () => PhotoSelection | null) => {
      photoReaders.current.set(id, read);
      return () => {
        photoReaders.current.delete(id);
      };
    },
    [],
  );
  const getSelection = useCallback(
    (id: string) => photoReaders.current.get(id)?.() ?? null,
    [],
  );
  const removeMemory = useTripPreview((state) => state.removeMemory);
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
        <AppText
          accessibilityRole="header"
          variant="label"
          style={homeStyles.grow}
        >
          {variant === "recent" ? copy.recentJournal : copy.journal}
        </AppText>
        <TextAction
          label={variant === "recent" ? copy.allMemories : copy.allJournal}
          onPress={onOpen}
        />
      </View>
      {memories.length ? (
        <View style={{ gap: theme.spacing.xs }}>
          {Array.from(
            {
              length: Math.ceil(
                Math.min(memories.length, JOURNAL_PREVIEW_LIMIT) / 2,
              ),
            },
            (_, row) => {
              const pair = memories.slice(row * 2, row * 2 + 2);
              return (
                <View
                  key={pair[0].id}
                  style={[
                    homeStyles.row,
                    { alignItems: "stretch", gap: theme.spacing.xs },
                  ]}
                >
                  {pair.map((memory) => (
                    <JournalAlbumPhoto
                      key={memory.id}
                      memory={memory}
                      hidden={activePhotoId === memory.id}
                      registerPhoto={registerPhoto}
                      onOpen={(photo) => {
                        setActivePhotoId(photo.id);
                        setSelection(photo);
                      }}
                    />
                  ))}
                  {pair.length === 1 ? (
                    <View style={styles.actionColumn} />
                  ) : null}
                </View>
              );
            },
          )}
        </View>
      ) : (
        <JourneyCard>
          <AppText variant="label">
            {variant === "recent" ? copy.recentEmpty : copy.journalEmpty}
          </AppText>
          <AppText variant="caption" tone="muted">
            {variant === "recent"
              ? copy.recentEmptyHint
              : copy.journalEmptyHint}
          </AppText>
          {onCapture ? (
            <TextAction
              label={copy.capture}
              icon="camera"
              onPress={onCapture}
            />
          ) : null}
        </JourneyCard>
      )}
      {selection ? (
        <JournalPhotoViewer
          key={selection.id}
          memories={memories.slice(0, JOURNAL_PREVIEW_LIMIT)}
          selection={selection}
          getSelection={getSelection}
          onActiveChange={setActivePhotoId}
          onClose={() => {
            setSelection(null);
            setActivePhotoId(null);
          }}
          onDelete={removeMemory}
        />
      ) : null}
    </View>
  );
}

function JournalAlbumPhoto({
  memory,
  hidden,
  onOpen,
  registerPhoto,
}: {
  memory: Memory;
  hidden: boolean;
  onOpen: (selection: PhotoSelection) => void;
  registerPhoto: (id: string, read: () => PhotoSelection | null) => () => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useOngoingCopy();
  const [imageFailed, setImageFailed] = useState(false);
  const frame = useRef<ComponentRef<typeof View>>(null);
  const [photoInfo, setPhotoInfo] = useState<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);
  const readSelection = useCallback((): PhotoSelection | null => {
    const rect = frame.current?.getBoundingClientRect();
    if (!photoInfo || !rect || rect.width <= 0 || rect.height <= 0) return null;
    return {
      id: memory.id,
      uri: photoInfo.uri,
      size: { width: photoInfo.width, height: photoInfo.height },
      origin: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    };
  }, [memory.id, photoInfo]);
  useEffect(
    () => registerPhoto(memory.id, readSelection),
    [registerPhoto, memory.id, readSelection],
  );
  const unavailable = !memory.photo || imageFailed;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        memory.place?.[locale] ?? memory.destination,
        memory.time,
        unavailable ? copy.photoUnavailable : undefined,
      ]
        .filter(Boolean)
        .join(", ")}
      accessibilityHint={copy.viewJournal}
      accessibilityState={{
        busy: !photoInfo && !unavailable,
        disabled: !photoInfo,
      }}
      disabled={!photoInfo}
      onPress={() => {
        const photo = readSelection();
        if (photo) onOpen(photo);
      }}
      style={({ pressed }) => [
        styles.actionColumn,
        {
          padding: theme.spacing.none,
          borderRadius: theme.radius.none,
          backgroundColor: theme.colors.journalFrameSurface,
          borderWidth: theme.layout.journalFrameBorderWidth,
          borderColor: theme.colors.journalFrameBorder,
          boxShadow: [
            {
              ...theme.elevation.glass,
              color: theme.colors.journalFrameShadow,
            },
          ],
          opacity: hidden ? 0 : pressed ? theme.motion.pressOpacity : 1,
        },
      ]}
    >
      <View
        ref={frame}
        collapsable={false}
        style={[
          styles.marker,
          {
            width: "100%",
            aspectRatio: theme.layout.journalPhotoAspectRatio,
            backgroundColor: theme.colors.surfaceTint,
          },
        ]}
      >
        {unavailable ? (
          <AppIcon name="memories" size={theme.layout.iconLarge} />
        ) : (
          <Image
            accessible={false}
            source={memory.photo}
            contentFit="cover"
            cachePolicy="memory-disk"
            onError={() => setImageFailed(true)}
            onLoad={(event) => {
              const { url, width, height } = event.source;
              if (width > 0 && height > 0)
                setPhotoInfo({ uri: url, width, height });
            }}
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: theme.radius.none },
            ]}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionColumn: { flex: 1, flexBasis: 0, minWidth: 0 },
  card: { overflow: "hidden", borderCurve: "continuous" },
  marker: { alignItems: "center", justifyContent: "center" },
});
