import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Modal, View } from "react-native";
import Animated, { useSharedValue } from "react-native-reanimated";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripQuery } from "../api/trip-queries";
import {
  useAddTripPlacesMutation,
  useTripPlacesQuery,
  useUpdateTripPlaceMutation,
} from "../api/trip-hooks";
import { ConnectedPlacePickerScreen } from "./connected-place-picker-screen";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import { toTrip } from "../api/trip-adapters";
import {
  useSaveItineraryDayMutation,
  useTripItineraryQuery,
} from "../api/itinerary-hooks";
import type {
  ItineraryResponse,
  SaveItineraryDayRequest,
} from "../api/itinerary-types";
import type { TripStop } from "@/features/home/types/home-types";
import { ApiError } from "@/services/api/api-error";
import { ConnectedStopScheduleSheet } from "../components/connected-stop-schedule-sheet";
import { TripStopRow } from "../components/trip-stop-row";
import { TripDetailsSheet } from "../components/trip-details-sheet";
import { TripReorder } from "../components/trip-reorder";
import { useItineraryCopy } from "../i18n/itinerary-copy";
import {
  TripDetailsHeader,
  DetailIconButton,
} from "../components/trip-details-header";
import {
  TripPlanningMap,
  type PlanningMapGeometry,
} from "../components/trip-planning-map";
import { TripDayMap } from "../components/trip-day-map";
import { TripDetailsActions } from "../components/trip-details-actions";
import { ConnectedTripRecap } from "../components/connected-trip-recap";
import { TripTimelineTail } from "../components/trip-timeline-states";
import { TripOptimizationSheet } from "../components/trip-optimization-preview";
import { usePlanningMapCollapse } from "../hooks/use-planning-map-collapse";
import { useTripTimelineScroll } from "../hooks/use-trip-timeline-scroll";
import {
  useTripDayRoute,
  useOptimizeDayRoute,
  type RouteMode,
  type DayRoute,
} from "../api/trip-day-route";
import { tripMapPins } from "../utils/trip-mapbox";
import { TripPlanningDaySelector } from "../components/trip-planning-day-selector";
import { ConnectedTripActions } from "../components/connected-trip-actions";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import {
  tripApiErrorMessage,
  useTripIntegrationCopy,
} from "../i18n/trip-integration-copy";

import { TripWeatherModal } from "@/features/home/components/connected-trip-weather";
import { useLiveWeatherCopy } from "@/features/weather/i18n/weather-copy";

type ScheduleEdit =
  | { kind: "stop"; stop: TripStop; date?: string }
  | { kind: "reorder"; date: string; stops: TripStop[] }
  | { kind: "optimize"; date: string; stops: TripStop[]; route: DayRoute };
type ScheduleEditor = ScheduleEdit & {
  base: ItineraryResponse;
  tripVersion: number;
};

type Row =
  | { kind: "days" | "summary"; key: string }
  | { kind: "stop"; key: string; stop: TripStop; index: number };

type DayStops = SaveItineraryDayRequest["stops"];
const NO_STOPS: TripStop[] = [];

function toDayStops(base: ItineraryResponse, date: string): DayStops {
  return (base.days.find((day) => day.date === date)?.stops ?? []).map(
    (stop) => ({
      placeId: stop.placeId,
      sequence: stop.sequence,
      arrivalTime: stop.arrivalTime,
      durationMinutes: stop.durationMinutes,
      note: stop.note,
    }),
  );
}

function back() {
  if (router.canGoBack()) router.back();
  else router.replace("/tabs/trips");
}

export function ConnectedTripDetailsScreen({
  tripId,
  selectedDate,
  expandMap = false,
}: {
  tripId?: string;
  selectedDate?: string;
  expandMap?: boolean;
}) {
  const theme = useAppTheme();
  const { copy } = useTripIntegrationCopy();
  const { copy: detailCopy } = useTripDetailsCopy();
  const query = useTripQuery(tripId);
  const places = useTripPlacesQuery(tripId);
  const itinerary = useTripItineraryQuery(tripId);
  const save = useSaveItineraryDayMutation(tripId ?? "");
  const { copy: itineraryCopy, locale } = useItineraryCopy();
  const [editor, setEditor] = useState<ScheduleEditor | null>(null);
  const [saved, setSaved] = useState(false);
  const saving = useRef(false);
  const addPlaces = useAddTripPlacesMutation(tripId ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const { copy: weatherCopy } = useLiveWeatherCopy();
  const { copy: placeCopy } = usePlaceSearchCopy();
  const [date, setDate] = useState<string | null | undefined>(selectedDate);
  const [viewport, setViewport] = useState(0);
  const resizeLock = useSharedValue(0);
  const read = query.data;
  const trip = useMemo(
    () => (read ? toTrip(read.trip, places.data, itinerary.data) : undefined),
    [read, places.data, itinerary.data],
  );
  const [actionsOpen, setActionsOpen] = useState(false);
  const [journalDate, setJournalDate] = useState<string>();
  const [mapGeometry, setMapGeometry] = useState<PlanningMapGeometry>({
    height: 0,
    headerHeight: 0,
  });
  const [selectorHeight, setSelectorHeight] = useState<number>(
    theme.layout.touchTarget,
  );
  const [mapExpansion, setMapExpansion] = useState(expandMap ? 1 : 0);
  const [focus, setFocus] = useState<{ date: string; id: string }>();
  const [routeMode, setRouteMode] = useState<RouteMode>("DRIVE");
  const [modeOpen, setModeOpen] = useState(false);
  const visit = useUpdateTripPlaceMutation(tripId ?? "");
  const visiting = useRef(false);
  const optimize = useOptimizeDayRoute(tripId ?? "");
  const optimizing = useRef(false);
  const tripDays = read?.trip.days ?? [];
  const today = read?.context.evaluatedDate;
  const defaultDate =
    tripDays.find((day) => day.date === today)?.date ?? tripDays[0]?.date;
  const activeDate =
    date === null
      ? undefined
      : tripDays.some((day) => day.date === date)
        ? date
        : defaultDate;
  const backlog = !activeDate;
  const scheduledEntries = itinerary.data?.days.find(
    (day) => day.date === activeDate,
  )?.stops;
  const waypointKey = (scheduledEntries ?? [])
    .map((s) => `${s.placeId}:${s.latitude},${s.longitude}`)
    .join(";");
  const routeQuery = useTripDayRoute({
    tripId,
    date: activeDate,
    mode: routeMode,
    waypointKey,
    enabled: !!read && (scheduledEntries?.length ?? 0) >= 2,
  });
  const routeResult = routeQuery.data;
  const route =
    routeResult?.status === "READY" &&
    routeResult.placeIds.length === scheduledEntries?.length &&
    routeResult.placeIds.every(
      (id, index) => id === scheduledEntries[index].placeId,
    )
      ? routeResult.route
      : undefined;
  const selectionKey = `${tripId ?? ""}:${activeDate ?? "pool"}`;
  const { list, jump, onScrollToIndexFailed } = useTripTimelineScroll<Row>(
    selectionKey,
    selectorHeight,
  );
  const mapScroll = usePlanningMapCollapse({
    enabled: !!read,
    selectionKey,
    list,
    mapHeight: mapGeometry.height,
    resizeLock,
  });
  if (!read || !trip)
    return (
      <ScreenSafeArea
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
          <DetailIconButton
            name="back"
            label={detailCopy.back}
            onPress={back}
          />
          <AppText accessibilityRole={query.isError ? "alert" : undefined}>
            {query.isError
              ? tripApiErrorMessage(query.error, copy)
              : tripId
                ? copy.loading
                : copy.missing}
          </AppText>
          {query.isError ? (
            <AppButton
              size="small"
              onPress={() => {
                void query.refetch();
              }}
            >
              {copy.retry}
            </AppButton>
          ) : null}
        </View>
      </ScreenSafeArea>
    );
  const pool = trip.unscheduledStops ?? NO_STOPS;
  const day = trip.days.find((entry) => entry.date === activeDate);
  const rows = backlog ? pool : (day?.stops ?? NO_STOPS);
  const nextStop =
    read.trip.mode === "LIVE" && activeDate === read.context.evaluatedDate
      ? rows.find((stop) => !stop.visited)?.id
      : undefined;
  const canEditDay = (dayDate: string) =>
    read.trip.mode === "PLANNING" ||
    (read.trip.mode === "LIVE" && dayDate >= read.context.evaluatedDate);
  const editableDays = read.trip.days.filter((entry) => canEditDay(entry.date));
  const canManagePlaces =
    read.trip.mode !== "RECAP" && read.trip.mode !== "CANCELLED";
  const ready =
    !!itinerary.data && !!places.data && !itinerary.isError && !places.isError;
  const isConflict =
    save.error instanceof ApiError &&
    ["TRIP_007", "TRIP_008"].includes(save.error.code);
  const scheduleError =
    save.error instanceof ApiError
      ? ({
          TRIP_005: itineraryCopy.invalid,
          INVALID_ITINERARY: itineraryCopy.invalid,
          TRIP_006: itineraryCopy.readOnly,
          TRIP_007: itineraryCopy.membership,
          TRIP_008: itineraryCopy.conflict,
        }[save.error.code] ?? itineraryCopy.error)
      : save.error
        ? itineraryCopy.error
        : undefined;

  const openEditor = (value: ScheduleEdit) => {
    if (!itinerary.data) return;
    save.reset();
    setSaved(false);
    setEditor({
      ...value,
      base: itinerary.data,
      tripVersion: read.trip.version,
    });
  };
  const closeEditor = () => {
    if (!saving.current && !optimizing.current) setEditor(null);
  };
  const refreshSchedule = async () => {
    const result = await Promise.all([
      itinerary.refetch(),
      places.refetch(),
      query.refetch(),
    ]);
    if (result.every((entry) => !entry.isError)) {
      save.reset();
      setEditor(null);
    }
  };
  const persistDay = async (targetDate: string, stops: DayStops) => {
    if (!editor || saving.current || isConflict) return;
    saving.current = true;
    try {
      await save.mutateAsync({
        date: targetDate,
        request: {
          expectedTripVersion: editor.tripVersion,
          expectedUpdatedAt: editor.base.updatedAt,
          stops: stops.map((stop, sequence) => ({ ...stop, sequence })),
        },
      });
      setDate(targetDate);
      setSaved(true);
      setEditor(null);
    } catch {
      // Mutation state keeps the editor open with an error and preserves typed values.
    } finally {
      saving.current = false;
    }
  };
  const mode = {
    PLANNING: "planning",
    LIVE: "live",
    RECAP: "recap",
    CANCELLED: "cancelled",
  }[read.trip.mode] as "planning" | "live" | "recap" | "cancelled";
  const next = rows.find((stop) => stop.id === nextStop);
  const mapStops = backlog ? NO_STOPS : rows;
  const pins = tripMapPins(mapStops, locale);
  const canOptimize =
    !!activeDate &&
    ready &&
    canEditDay(activeDate) &&
    !!route &&
    rows.length >= 4 &&
    rows.length <= 12 &&
    rows.every((stop) => !stop.visited);
  const selectedPin = focus?.date === activeDate ? focus?.id : undefined;
  const total = route
    ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(route.distanceMeters / 1000)} km · ${Math.round(route.durationSeconds / 60)} ${detailCopy.minutes}`
    : null;
  const status = routeQuery.data?.status;
  const routeMessage =
    rows.length < 2 || backlog
      ? null
      : routeQuery.isFetching
        ? itineraryCopy.routeLoading
        : status === "MISSING_COORDINATES"
          ? itineraryCopy.routeMissingCoordinates
          : status === "TOO_MANY_STOPS"
            ? itineraryCopy.routeTooMany
            : status === "NOT_CONFIGURED"
              ? itineraryCopy.routeNotConfigured
              : !route
                ? itineraryCopy.routeUnavailable
                : null;
  const selectDate = (nextDate: string | null) => {
    setFocus(undefined);
    setDate(nextDate);
  };
  const showJournal = () => setJournalDate(activeDate ?? defaultDate);
  const openDirections = () => {
    if (!next || !activeDate || !pins.some((p) => p.id === next.id)) return;
    setFocus({ date: activeDate, id: next.id });
    mapScroll.show();
    setMapExpansion((value) => value + 1);
  };
  const markVisited = async () => {
    if (!next?.placeId || !next.tripPlaceId || visiting.current) return;
    visiting.current = true;
    try {
      await visit.mutateAsync({
        placeId: next.placeId,
        request: { visited: true },
      });
    } catch {
      /* The visit mutation exposes a retryable error in the timeline. */
    } finally {
      visiting.current = false;
    }
  };
  const requestOptimization = async () => {
    if (!canOptimize || !activeDate || !route || optimizing.current) return;
    optimizing.current = true;
    optimize.reset();
    openEditor({ kind: "optimize", date: activeDate, stops: rows, route });
    try {
      await optimize.mutateAsync({ date: activeDate, mode: routeMode });
    } catch {
      /* Keep the sheet open with the provider error. */
    } finally {
      optimizing.current = false;
    }
  };
  const persistOrder = (
    edit: Extract<ScheduleEditor, { kind: "reorder" | "optimize" }>,
    ids: string[],
  ) => {
    const stops = toDayStops(edit.base, edit.date);
    const placeById = new Map(
      edit.stops.map((stop) => [stop.id, stop.placeId]),
    );
    const byPlace = new Map(stops.map((stop) => [stop.placeId, stop]));
    const ordered = ids.flatMap((id, index) => {
      const placeId = placeById.get(id);
      const stop = placeId ? byPlace.get(placeId) : undefined;
      return stop
        ? [{ ...stop, arrivalTime: stops[index]?.arrivalTime ?? null }]
        : [];
    });
    if (ordered.length === stops.length && new Set(ids).size === stops.length)
      void persistDay(edit.date, ordered);
  };
  const listRows: Row[] = [
    { kind: "days", key: "days" },
    { kind: "summary", key: "summary" },
    ...(ready
      ? rows.map(
          (stop, index): Row => ({ kind: "stop", key: stop.id, stop, index }),
        )
      : []),
  ];
  const header = (
    <TripDetailsHeader
      trip={trip}
      mode={mode}
      today={read.context.evaluatedDate}
      hideTripInfo={mode === "planning" || mode === "live"}
      onBack={back}
      onMenu={() => setActionsOpen(true)}
    />
  );
  return (
    <ScreenSafeArea
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <View
        style={{ flex: 1 }}
        onLayout={(event) => setViewport(event.nativeEvent.layout.height)}
      >
        <Animated.FlatList
          ref={list}
          data={listRows}
          keyExtractor={(row) => row.key}
          onScroll={mapScroll.onScroll}
          scrollEventThrottle={16}
          onScrollToIndexFailed={onScrollToIndexFailed}
          stickyHeaderIndices={[1]}
          refreshing={places.isRefetching || itinerary.isRefetching}
          onRefresh={() => {
            void refreshSchedule();
            if (activeDate && rows.length >= 2) void routeQuery.refetch();
          }}
          contentContainerStyle={{
            minHeight: viewport + mapGeometry.height,
            paddingBottom: theme.spacing.xl,
          }}
          ListHeaderComponent={
            <TripPlanningMap
              expandRequest={mapExpansion}
              header={header}
              viewportHeight={viewport}
              selectorHeight={selectorHeight}
              resizeLock={resizeLock}
              onGeometryChange={setMapGeometry}
              collapsedByScroll={mapScroll.hidden}
              showStart={false}
              showLocationControl={false}
              overlayHeader={mode === "planning" || mode === "live"}
              mapContent={
                <TripDayMap
                  key={selectionKey}
                  stops={mapStops}
                  polyline={route?.encodedPolyline}
                  focusedId={selectedPin}
                  onSelect={(id) => {
                    const index = rows.findIndex((stop) => stop.id === id);
                    if (activeDate && index >= 0 && ready) {
                      setFocus({ date: activeDate, id });
                      jump(index + 2);
                    }
                  }}
                />
              }
            />
          }
          ListFooterComponent={
            canManagePlaces &&
            !backlog &&
            activeDate &&
            canEditDay(activeDate) &&
            ready ? (
              <View style={{ paddingHorizontal: theme.spacing.lg }}>
                <TripTimelineTail
                  trip={trip}
                  day={day}
                  empty={!rows.length}
                  backlogCount={pool.length}
                  onBacklog={() => selectDate(null)}
                  canEdit
                  onAdd={() => setPickerOpen(true)}
                />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            if (item.kind === "days")
              return (
                <View
                  style={{
                    backgroundColor: theme.colors.surface,
                    paddingHorizontal: theme.spacing.lg,
                  }}
                >
                  {mapScroll.hidden ? (
                    <TripDetailsHeader
                      trip={trip}
                      mode={mode}
                      today={read.context.evaluatedDate}
                      titleOnly
                      onBack={back}
                      onEdit={() => setActionsOpen(true)}
                      onOpenMap={mapScroll.show}
                    />
                  ) : null}
                  <View
                    onLayout={(event) =>
                      setSelectorHeight(event.nativeEvent.layout.height)
                    }
                  >
                    <TripPlanningDaySelector
                      trip={trip}
                      selectedDate={activeDate}
                      backlog={backlog}
                      backlogCount={
                        ready
                          ? pool.length
                          : read.trip.readiness.unscheduledCount
                      }
                      onSelect={selectDate}
                      addDayDisabled
                    />
                  </View>
                </View>
              );
            if (item.kind === "summary")
              return (
                <View
                  style={{ gap: theme.spacing.sm, padding: theme.spacing.lg }}
                >
                  {mode === "recap" && activeDate ? (
                    <ConnectedTripRecap
                      key={selectionKey}
                      tripId={trip.id}
                      date={activeDate}
                      onJournal={showJournal}
                    />
                  ) : null}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: theme.spacing.sm,
                    }}
                  >
                    <AppText
                      accessibilityRole="header"
                      variant="sectionTitle"
                      style={{ flex: 1 }}
                    >
                      {backlog
                        ? detailCopy.pool
                        : `${rows.length} ${detailCopy.places}`}
                    </AppText>
                    {!backlog && rows.length > 1 ? (
                      <AppButton
                        size="small"
                        variant="soft"
                        onPress={() => setModeOpen(true)}
                      >
                        {itineraryCopy.routeModes[routeMode]}
                      </AppButton>
                    ) : null}
                    {activeDate &&
                    canEditDay(activeDate) &&
                    rows.length > 1 &&
                    ready ? (
                      <AppButton
                        size="small"
                        variant="outline"
                        onPress={() =>
                          openEditor({
                            kind: "reorder",
                            date: activeDate,
                            stops: rows,
                          })
                        }
                      >
                        {detailCopy.reorder}
                      </AppButton>
                    ) : null}
                    {mode === "live" && canOptimize ? (
                      <DetailIconButton
                        compact
                        name="sparkles"
                        label={detailCopy.optimize}
                        onPress={() => void requestOptimization()}
                      />
                    ) : null}
                  </View>
                  {total ? (
                    <AppText variant="caption" tone="muted">
                      {total} · Mapbox
                    </AppText>
                  ) : null}
                  {routeMessage ? (
                    <AppText variant="caption" tone="muted">
                      {routeMessage}
                    </AppText>
                  ) : null}
                  {routeQuery.isError ? (
                    <AppButton
                      size="small"
                      variant="outline"
                      onPress={() => void routeQuery.refetch()}
                    >
                      {copy.retry}
                    </AppButton>
                  ) : null}
                  {(mode === "planning" || mode === "live") && activeDate ? (
                    <AppButton
                      size="small"
                      variant="outline"
                      onPress={() => setWeatherOpen(true)}
                    >
                      {weatherCopy.title}
                    </AppButton>
                  ) : null}
                  {mode === "live" &&
                  tripId &&
                  activeDate &&
                  activeDate === today &&
                  ready ? (
                    <AppButton
                      size="small"
                      variant="outline"
                      onPress={() =>
                        router.push({
                          pathname: "/memories/quick-capture",
                          params: {
                            tripId,
                            day: activeDate,
                            stopId: next?.tripPlaceId ?? "",
                          },
                        })
                      }
                    >
                      {itineraryCopy.capture}
                    </AppButton>
                  ) : null}
                  {backlog && canManagePlaces ? (
                    <AppButton
                      size="small"
                      variant="outline"
                      onPress={() => setPickerOpen(true)}
                    >
                      {placeCopy.title}
                    </AppButton>
                  ) : null}
                  {saved ? (
                    <AppText
                      accessibilityLiveRegion="polite"
                      variant="caption"
                      tone="primary"
                    >
                      {itineraryCopy.saved}
                    </AppText>
                  ) : null}
                  {visit.isError ? (
                    <AppText accessibilityRole="alert" tone="error">
                      {itineraryCopy.visitFailed}
                    </AppText>
                  ) : null}
                  {places.isError || itinerary.isError || query.isError ? (
                    <>
                      <AppText accessibilityRole="alert">
                        {itineraryCopy.error}
                      </AppText>
                      <AppButton
                        size="small"
                        variant="outline"
                        onPress={() => void refreshSchedule()}
                      >
                        {copy.retry}
                      </AppButton>
                    </>
                  ) : !ready ? (
                    <AppText accessibilityLiveRegion="polite">
                      {placeCopy.loadingPlaces}
                    </AppText>
                  ) : !trip.days.length ? (
                    <AppText tone="muted">{itineraryCopy.noTripDates}</AppText>
                  ) : !rows.length ? (
                    <AppText tone="muted">
                      {backlog
                        ? detailCopy.poolEmpty
                        : itineraryCopy.noDayStops}
                    </AppText>
                  ) : null}
                </View>
              );
            if (item.kind !== "stop") return null;
            const { stop, index } = item;
            if (activeDate) {
              const leg =
                route?.legs.length === rows.length - 1
                  ? route.legs[index - 1]
                  : undefined;
              const entry = scheduledEntries?.[index];
              const savedLeg = leg
                ? {
                    km: leg.distanceMeters / 1000,
                    minutes: Math.round(leg.durationSeconds / 60),
                  }
                : routeMode === "DRIVE" &&
                    entry?.distanceFromPreviousKm != null &&
                    entry.travelMinutesFromPrevious != null
                  ? {
                      km: entry.distanceFromPreviousKm,
                      minutes: entry.travelMinutesFromPrevious,
                    }
                  : undefined;
              return (
                <View style={{ paddingHorizontal: theme.spacing.lg }}>
                  <TripStopRow
                    preview={false}
                    savedLeg={savedLeg}
                    stop={stop}
                    previous={rows[index - 1]}
                    number={index + 1}
                    last={index === rows.length - 1}
                    mode={routeMode === "DRIVE" ? "car" : "walk"}
                    legIcon={routeMode === "BICYCLE" ? "route" : undefined}
                    visited={!!stop.visited}
                    next={stop.id === nextStop}
                    highlighted={selectedPin === stop.id}
                    onOpen={() =>
                      openEditor({ kind: "stop", date: activeDate, stop })
                    }
                  />
                </View>
              );
            }
            return (
              <View
                style={{
                  marginHorizontal: theme.spacing.lg,
                  marginBottom: theme.spacing.sm,
                  padding: theme.spacing.md,
                  gap: theme.spacing.xs,
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                }}
              >
                <AppText variant="label">{stop.name[locale]}</AppText>
                <AppText variant="caption" tone="muted">
                  {stop.address?.[locale] ?? placeCopy.addressUnavailable}
                </AppText>
                {editableDays.length ? (
                  <AppButton
                    size="small"
                    variant="soft"
                    onPress={() => openEditor({ kind: "stop", stop })}
                  >
                    {itineraryCopy.schedule}
                  </AppButton>
                ) : null}
              </View>
            );
          }}
        />
      </View>
      {(mode === "live" || mode === "recap") && !defaultDate ? null : (
        <TripDetailsActions
          trip={trip}
          mode={mode}
          canOptimize={canOptimize}
          onOptimize={() => void requestOptimization()}
          nextStop={next?.tripPlaceId ? next : undefined}
          canDirect={!!next && pins.some((pin) => pin.id === next.id)}
          onDirections={openDirections}
          onVisited={() => void markVisited()}
          visitPending={visit.isPending}
          onJournal={showJournal}
          onInfo={() => setActionsOpen(true)}
        />
      )}
      {editor?.kind === "stop" ? (
        <ConnectedStopScheduleSheet
          stop={editor.stop}
          date={editor.date}
          days={editableDays}
          editable={
            ready &&
            (editor.date ? canEditDay(editor.date) : editableDays.length > 0)
          }
          pending={save.isPending}
          problem={scheduleError}
          onReload={isConflict ? () => void refreshSchedule() : undefined}
          onClose={closeEditor}
          onSave={async (draft) => {
            const placeId = editor.stop.placeId;
            if (!placeId) return;
            const stops = toDayStops(editor.base, draft.date);
            const index = stops.findIndex((stop) => stop.placeId === placeId);
            const previous = stops[index];
            const arrivalTime =
              previous?.arrivalTime &&
              previous.arrivalTime.slice(11, 16) === draft.time
                ? previous.arrivalTime
                : draft.time
                  ? `${draft.date}T${draft.time}:00`
                  : null;
            const stop = {
              placeId,
              sequence: index < 0 ? stops.length : index,
              arrivalTime,
              durationMinutes: Number(draft.duration),
              note: draft.note || null,
            };
            if (index < 0) stops.push(stop);
            else stops[index] = stop;
            await persistDay(draft.date, stops);
          }}
          onRemove={
            editor.date && ready && canEditDay(editor.date)
              ? () => {
                  const targetDate = editor.date;
                  if (targetDate)
                    void persistDay(
                      targetDate,
                      toDayStops(editor.base, targetDate).filter(
                        (stop) => stop.placeId !== editor.stop.placeId,
                      ),
                    );
                }
              : undefined
          }
        />
      ) : null}
      {editor?.kind === "reorder" ? (
        <TripDetailsSheet
          title={detailCopy.reorder}
          onClose={closeEditor}
          dismissDisabled={save.isPending}
        >
          {scheduleError ? (
            <AppText accessibilityRole="alert" tone="error">
              {scheduleError}
            </AppText>
          ) : null}
          {isConflict ? (
            <AppButton
              size="small"
              variant="outline"
              onPress={() => void refreshSchedule()}
            >
              {itineraryCopy.reload}
            </AppButton>
          ) : null}
          <TripReorder
            stops={editor.stops}
            pending={save.isPending || isConflict}
            onApply={(ids) => persistOrder(editor, ids)}
          />
        </TripDetailsSheet>
      ) : null}
      {editor?.kind === "optimize"
        ? (() => {
            const proposal = optimize.data;
            const ids =
              proposal?.order.flatMap(
                (placeId) =>
                  editor.stops.find((stop) => stop.placeId === placeId)?.id ??
                  [],
              ) ?? [];
            if (
              proposal &&
              ids.length === editor.stops.length &&
              proposal.originalOrder.length === editor.stops.length &&
              proposal.originalOrder.every(
                (id, index) => id === editor.stops[index].placeId,
              )
            ) {
              const before = {
                km: editor.route.distanceMeters / 1000,
                minutes: Math.round(editor.route.durationSeconds / 60),
              };
              const after = {
                km: proposal.distanceMeters / 1000,
                minutes: Math.round(proposal.durationSeconds / 60),
              };
              return (
                <TripOptimizationSheet
                  day={{ date: editor.date, stops: editor.stops }}
                  onClose={closeEditor}
                  busy={save.isPending}
                  problem={scheduleError}
                  onReload={
                    isConflict ? () => void refreshSchedule() : undefined
                  }
                  proposal={{
                    order: ids,
                    comparison: {
                      before,
                      after,
                      savedKm: Math.round((before.km - after.km) * 10) / 10,
                      savedMinutes: before.minutes - after.minutes,
                    },
                  }}
                  onApply={(order) => persistOrder(editor, order)}
                />
              );
            }
            return (
              <TripDetailsSheet
                title={detailCopy.optimizeTitle}
                onClose={closeEditor}
                dismissDisabled={optimize.isPending}
              >
                <AppText accessibilityLiveRegion="polite">
                  {optimize.isPending
                    ? itineraryCopy.optimizeLoading
                    : itineraryCopy.optimizeUnavailable}
                </AppText>
              </TripDetailsSheet>
            );
          })()
        : null}
      {modeOpen ? (
        <TripDetailsSheet
          title={detailCopy.transport}
          onClose={() => setModeOpen(false)}
        >
          {(["DRIVE", "WALK", "BICYCLE"] as const).map((value) => (
            <AppButton
              key={value}
              variant={routeMode === value ? "soft" : "outline"}
              accessibilityState={{ selected: routeMode === value }}
              onPress={() => {
                setRouteMode(value);
                setModeOpen(false);
              }}
            >
              {itineraryCopy.routeModes[value]}
            </AppButton>
          ))}
        </TripDetailsSheet>
      ) : null}
      {journalDate ? (
        <TripDetailsSheet
          title={detailCopy.dayMemories}
          onClose={() => setJournalDate(undefined)}
        >
          <ConnectedTripRecap tripId={trip.id} date={journalDate} />
        </TripDetailsSheet>
      ) : null}
      {weatherOpen ? (
        <TripWeatherModal
          tripId={trip.id}
          destination={trip.destination}
          date={activeDate ?? undefined}
          onClose={() => setWeatherOpen(false)}
        />
      ) : null}
      {pickerOpen ? (
        <Modal
          visible
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => {
            if (!addPlaces.isPending) setPickerOpen(false);
          }}
        >
          <ConnectedPlacePickerScreen
            destination={trip.destination}
            scope={{ tripId: read.trip.id }}
            onClose={() => {
              if (!addPlaces.isPending) setPickerOpen(false);
            }}
            onApply={async (stops) => {
              await addPlaces.mutateAsync(stops.map((p) => p.placeId ?? p.id));
              setPickerOpen(false);
            }}
          />
        </Modal>
      ) : null}
      {actionsOpen ? (
        <ConnectedTripActions
          read={read}
          onClose={() => setActionsOpen(false)}
          onReload={async () => {
            const result = await query.refetch();
            return result.isError ? undefined : result.data;
          }}
          onDeleted={() => router.replace("/tabs/trips")}
        />
      ) : null}
    </ScreenSafeArea>
  );
}
