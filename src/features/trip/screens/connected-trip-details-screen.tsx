import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, View } from "react-native";
import { TextAction } from "@/features/home/components/home-primitives";
import { TripDayTools } from "../components/trip-details-overview";
import Animated, { useSharedValue } from "react-native-reanimated";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { useTripQuery } from "../api/trip-queries";
import {
  useAddTripPlacesMutation,
  useTripPlacesQuery,
  useUpdateTripPlaceMutation,
} from "../api/trip-hooks";
import { ConnectedPlacePickerScreen } from "./connected-place-picker-screen";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import { toTrip, toDayStops } from "../api/trip-adapters";
import {
  useSaveItineraryDayMutation,
  useTripItineraryQuery,
  useUpdateDayScheduleMutation,
} from "../api/itinerary-hooks";
import type {
  ItineraryResponse,
  SaveItineraryDayRequest,
  UpdateDayScheduleRequest,
} from "../api/itinerary-types";
import type { TripStop, TripDay } from "@/features/home/types/home-types";
import { ApiError } from "@/services/api/api-error";
import { ConnectedStopScheduleSheet } from "../components/connected-stop-schedule-sheet";
import { TripStopRow } from "../components/trip-stop-row";
import { TripBacklogRow } from "../components/trip-backlog-row";
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
import { TripStartNode } from "../components/trip-timeline-states";
import { ConnectedDayScheduleSheet } from "../components/connected-day-schedule-sheet";
import { TripOptimizationSheet } from "../components/trip-optimization-preview";
import { usePlanningMapCollapse } from "../hooks/use-planning-map-collapse";
import { useTripTimelineScroll } from "../hooks/use-trip-timeline-scroll";
import { useTripTimelineDrag } from "../hooks/use-trip-timeline-drag";
import { useConnectedTimelineActions } from "../hooks/use-connected-timeline-actions";
import { TripUndoNotice } from "../components/trip-undo-notice";
import { reorderDayStops } from "../utils/itinerary-day-order";
import { inferredDaySchedule } from "../utils/inferred-day-schedule";
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

type ScheduleEdit =
  | { kind: "day"; date: string; day: TripDay; routeMode: RouteMode }
  | { kind: "stop"; stop: TripStop; date?: string }
  | { kind: "reorder"; date: string; stops: TripStop[] }
  | { kind: "optimize"; date: string; stops: TripStop[]; route?: DayRoute };
type ScheduleEditor = ScheduleEdit & {
  base: ItineraryResponse;
  tripVersion: number;
};

type Row =
  | { kind: "days" | "summary"; key: string }
  | { kind: "stop"; key: string; stop: TripStop; index: number };

type DayStops = SaveItineraryDayRequest["stops"];
const NO_STOPS: TripStop[] = [];

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
  const insets = useScreenInsets();
  const { copy } = useTripIntegrationCopy();
  const { copy: detailCopy } = useTripDetailsCopy();
  const query = useTripQuery(tripId);
  const places = useTripPlacesQuery(tripId);
  const itinerary = useTripItineraryQuery(tripId);
  const save = useSaveItineraryDayMutation(tripId ?? "");
  const daySchedule = useUpdateDayScheduleMutation(tripId ?? "");
  const completion = useUpdateDayScheduleMutation(tripId ?? "");
  const completedRevision = useRef<string | null>(null);
  const { copy: itineraryCopy, locale } = useItineraryCopy();
  const [editor, setEditor] = useState<ScheduleEditor | null>(null);
  const [saved, setSaved] = useState(false);
  const saving = useRef(false);
  const [pickerDay, setPickerDay] = useState<{
    date: string;
    dayNumber: number;
  }>();
  const addPlaces = useAddTripPlacesMutation(tripId ?? "", pickerDay?.date);
  const [pickerOpen, setPickerOpen] = useState(false);
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
  const storedSettings = itinerary.data?.days.find(
    (entry) => entry.date === activeDate,
  )?.settings;
  const routeMode = storedSettings?.travelMode ?? "DRIVE";
  const waypointKey =
    (scheduledEntries ?? [])
      .map((s) => `${s.placeId}:${s.latitude},${s.longitude}`)
      .join(";") +
    JSON.stringify({
      origin: storedSettings?.origin
        ? [storedSettings.origin.latitude, storedSettings.origin.longitude]
        : null,
      returnToStart: storedSettings?.returnToStart ?? false,
    });
  const routeQuery = useTripDayRoute({
    tripId,
    date: activeDate,
    mode: routeMode,
    waypointKey,
    enabled:
      !!read &&
      ((scheduledEntries?.length ?? 0) >= 2 ||
        (!!storedSettings?.origin && (scheduledEntries?.length ?? 0) >= 1)),
  });
  const routeResult = routeQuery.data;
  const resolvedRoute =
    routeResult?.status === "READY" &&
    routeResult.placeIds.length === scheduledEntries?.length &&
    routeResult.placeIds.every(
      (id, index) => id === scheduledEntries[index].placeId,
    )
      ? routeResult.route
      : undefined;
  const selectionKey = `${tripId ?? ""}:${activeDate ?? "pool"}`;
  const pool = trip?.unscheduledStops ?? NO_STOPS;
  const day = trip?.days.find((entry) => entry.date === activeDate);
  const sourceRows = backlog ? pool : (day?.stops ?? NO_STOPS);
  const ready =
    !!itinerary.data && !!places.data && !itinerary.isError && !places.isError;
  const canEditDay = (dayDate: string) =>
    read?.trip.mode === "PLANNING" ||
    (read?.trip.mode === "LIVE" && dayDate >= read.context.evaluatedDate);
  const timeline = useConnectedTimelineActions({
    selectionKey,
    date: activeDate,
    itinerary: itinerary.data,
    tripVersion: read?.trip.version,
    stops: sourceRows,
    editable:
      !!activeDate &&
      ready &&
      canEditDay(activeDate) &&
      !editor &&
      !pickerOpen &&
      !daySchedule.isPending &&
      !completion.isPending &&
      !modeOpen &&
      !actionsOpen,
    mutation: save,
    saving,
  });
  const rows = timeline.stops;
  const dragStops = useMemo(
    () =>
      read?.trip.mode === "LIVE" && activeDate === today
        ? rows.map((stop) => (stop.visited ? { ...stop, pinned: true } : stop))
        : rows,
    [rows, read?.trip.mode, activeDate, today],
  );
  const timelineDrag = useTripTimelineDrag({
    stops: dragStops,
    selectionKey,
    onReorder: timeline.reorder,
    onDragStart: timeline.begin,
    onDragEnd: timeline.end,
  });
  const route = timeline.pending ? undefined : resolvedRoute;
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
  const inferredSchedule = useMemo(
    () => inferredDaySchedule(itinerary.data, activeDate, read?.trip.version),
    [itinerary.data, activeDate, read?.trip.version],
  );
  const canCompleteSchedule =
    ready &&
    !!activeDate &&
    canEditDay(activeDate) &&
    !!resolvedRoute &&
    !editor &&
    !pickerOpen &&
    !modeOpen &&
    !actionsOpen &&
    !timeline.pending &&
    !timelineDrag.draggedId &&
    !save.isPending &&
    !daySchedule.isPending &&
    !completion.isPending;
  const completeSchedule = completion.mutateAsync;
  useEffect(() => {
    if (
      !canCompleteSchedule ||
      !inferredSchedule ||
      !activeDate ||
      saving.current
    )
      return;
    const revision = `${tripId}:${activeDate}:${inferredSchedule.expectedTripVersion}:${inferredSchedule.expectedUpdatedAt}`;
    if (completedRevision.current === revision) return;
    completedRevision.current = revision;
    saving.current = true;
    void completeSchedule({ date: activeDate, request: inferredSchedule })
      .catch(() => {
        // Mutation errors are shown with the existing reload action below the timeline.
      })
      .finally(() => {
        saving.current = false;
      });
  }, [
    canCompleteSchedule,
    inferredSchedule,
    activeDate,
    tripId,
    completeSchedule,
    completion.error,
  ]);
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
  const nextStop =
    read.trip.mode === "LIVE" && activeDate === read.context.evaluatedDate
      ? rows.find((stop) => !stop.visited)?.id
      : undefined;
  const editableDays = read.trip.days.filter((entry) => canEditDay(entry.date));
  const canManagePlaces =
    read.trip.mode !== "RECAP" && read.trip.mode !== "CANCELLED";
  const mutationError =
    editor?.kind === "day" || modeOpen
      ? daySchedule.error
      : (save.error ?? completion.error);
  const isConflict =
    mutationError instanceof ApiError &&
    ["TRIP_006", "TRIP_007", "TRIP_008"].includes(mutationError.code);
  const scheduleError =
    mutationError instanceof ApiError
      ? ({
          TRIP_005: itineraryCopy.invalid,
          INVALID_ITINERARY: itineraryCopy.invalid,
          TRIP_006: itineraryCopy.readOnly,
          TRIP_007: itineraryCopy.membership,
          TRIP_008: itineraryCopy.conflict,
        }[mutationError.code] ?? itineraryCopy.error)
      : mutationError
        ? itineraryCopy.error
        : undefined;

  const openEditor = (value: ScheduleEdit) => {
    if (!itinerary.data || saving.current || timelineDrag.draggedId) return;
    timeline.clear();
    save.reset();
    daySchedule.reset();
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
    if (saving.current || timelineDrag.draggedId) return;
    const result = await Promise.all([
      itinerary.refetch(),
      places.refetch(),
      query.refetch(),
    ]);
    if (result.every((entry) => !entry.isError)) {
      completedRevision.current = null;
      completion.reset();
      timeline.clear();
      save.reset();
      daySchedule.reset();
      setEditor(null);
      setModeOpen(false);
    }
  };
  const persistDay = async (
    targetDate: string,
    stops: DayStops,
    expectedVisitedPlaceIds?: readonly string[],
  ) => {
    if (!editor || saving.current || isConflict) return;
    saving.current = true;
    try {
      await save.mutateAsync({
        date: targetDate,
        request: {
          expectedTripVersion: editor.tripVersion,
          expectedUpdatedAt: editor.base.updatedAt,
          stops: stops.map((stop, sequence) => ({ ...stop, sequence })),
          ...(expectedVisitedPlaceIds
            ? { expectedVisitedPlaceIds: [...expectedVisitedPlaceIds] }
            : {}),
        },
      });
      if (expectedVisitedPlaceIds) await places.refetch();
      setDate(targetDate);
      setSaved(true);
      setEditor(null);
    } catch {
      // Mutation state keeps the editor open with an error and preserves typed values.
    } finally {
      saving.current = false;
    }
  };
  const persistSchedule = async (
    targetDate: string,
    base: ItineraryResponse,
    tripVersion: number,
    draft: Pick<UpdateDayScheduleRequest, "settings" | "durations">,
  ) => {
    if (saving.current || isConflict) return;
    saving.current = true;
    try {
      await daySchedule.mutateAsync({
        date: targetDate,
        request: {
          expectedTripVersion: tripVersion,
          expectedUpdatedAt: base.updatedAt,
          ...draft,
        },
      });
      setSaved(true);
      setEditor(null);
      setModeOpen(false);
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
  const visitedStops = rows.filter((stop) => stop.visited);
  const pendingStops = rows.filter((stop) => !stop.visited);
  const remainingCoordinates =
    visitedStops.length > 0
      ? [visitedStops[visitedStops.length - 1], ...pendingStops].every(
          (stop) => !!stop.location,
        )
      : false;
  const returnOriginReady =
    !storedSettings?.returnToStart ||
    (storedSettings.origin?.latitude != null &&
      storedSettings.origin.longitude != null);
  const canOptimize =
    !!activeDate &&
    ready &&
    canEditDay(activeDate) &&
    (visitedStops.length > 0
      ? pendingStops.length > 0 &&
        remainingCoordinates &&
        returnOriginReady &&
        pendingStops.length + 1 + (storedSettings?.returnToStart ? 1 : 0) <= 12
      : !!route &&
        rows.length >= 4 &&
        rows.length + (storedSettings?.origin ? 1 : 0) <= 12);
  const selectedPin = focus?.date === activeDate ? focus?.id : nextStop;
  const total = route
    ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(route.distanceMeters / 1000)} km · ${Math.round(route.durationSeconds / 60)} ${detailCopy.minutes}`
    : null;
  const status = routeQuery.data?.status;
  const routeMessage =
    !rows.length || (rows.length < 2 && !storedSettings?.origin) || backlog
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
    if (saving.current || timelineDrag.draggedId) return;
    timeline.clear();
    save.reset();
    setSaved(false);
    setFocus(undefined);
    setDate(nextDate);
  };
  const openPlacePicker = () => {
    if (saving.current || timelineDrag.draggedId) return;
    timeline.clear();
    setPickerDay(
      activeDate
        ? {
            date: activeDate,
            dayNumber:
              trip.days.findIndex((entry) => entry.date === activeDate) + 1,
          }
        : undefined,
    );
    setPickerOpen(true);
  };
  const showJournal = () => setJournalDate(activeDate ?? defaultDate);
  const openDirections = () => {
    if (!next || !activeDate || !pins.some((p) => p.id === next.id)) return;
    setFocus({ date: activeDate, id: next.id });
    mapScroll.show();
    setMapExpansion((value) => value + 1);
  };
  const markVisited = async (stop = next, value = true) => {
    if (
      mode !== "live" ||
      !activeDate ||
      activeDate > read.context.evaluatedDate ||
      !ready ||
      !stop?.placeId ||
      !stop.tripPlaceId ||
      visiting.current ||
      saving.current ||
      timelineDrag.draggedId
    )
      return;
    visiting.current = true;
    try {
      await visit.mutateAsync({
        placeId: stop.placeId,
        request: { visited: value },
      });
    } catch {
      /* The visit mutation exposes a retryable error in the timeline. */
    } finally {
      visiting.current = false;
    }
  };
  const requestOptimization = async () => {
    if (
      !canOptimize ||
      !activeDate ||
      optimizing.current ||
      saving.current ||
      timelineDrag.draggedId
    )
      return;
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
    visitedPlaceIds?: readonly string[],
  ) => {
    const stops = toDayStops(edit.base, edit.date);
    const placeById = new Map(
      edit.stops.map((stop) => [stop.id, stop.placeId]),
    );
    const ordered = reorderDayStops(
      stops,
      ids.flatMap((id) => {
        const placeId = placeById.get(id);
        return placeId ? [placeId] : [];
      }),
      visitedPlaceIds,
    );
    if (ordered && ids.length === stops.length)
      void persistDay(edit.date, ordered, visitedPlaceIds);
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
  const openActions = () => {
    if (saving.current || timelineDrag.draggedId) return;
    timeline.clear();
    setActionsOpen(true);
  };
  const header = (
    <TripDetailsHeader
      trip={trip}
      mode={mode}
      today={read.context.evaluatedDate}
      hideTripInfo={mode === "planning" || mode === "live"}
      onBack={back}
      onMenu={openActions}
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
          scrollEnabled={!timelineDrag.draggedId}
          removeClippedSubviews={timelineDrag.draggedId ? false : undefined}
          CellRendererComponentStyle={({ item }) => ({
            zIndex:
              item.kind === "days"
                ? 2
                : item.kind === "stop" &&
                    timelineDrag.draggedId === item.stop.id
                  ? 1
                  : 0,
          })}
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
                  origin={storedSettings?.origin}
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
                  canEdit
                  onAdd={openPlacePicker}
                  returnSummary={
                    route &&
                    routeResult?.status === "READY" &&
                    routeResult.returnLeg
                      ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(routeResult.returnLeg.distanceMeters / 1000)} km · ${Math.ceil(routeResult.returnLeg.durationSeconds / 60)} ${detailCopy.minutes}`
                      : undefined
                  }
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
                      onEdit={openActions}
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
                      backlogCount={pool.length}
                      selectedDate={activeDate}
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
                  {backlog ? (
                    <AppText accessibilityRole="header" variant="sectionTitle">
                      {detailCopy.pool} ({rows.length})
                    </AppText>
                  ) : (
                    <TripDayTools
                      trip={trip}
                      day={day}
                      today={read.context.evaluatedDate}
                      canEdit={
                        !!activeDate &&
                        ready &&
                        canEditDay(activeDate) &&
                        !save.isPending
                      }
                      editHistory={false}
                      showWeather={false}
                      reorderAtEnd={mode === "planning"}
                      showOptimize={mode === "live" && canOptimize}
                      liveLayout={mode === "live"}
                      routeMetrics={
                        route
                          ? {
                              km: route.distanceMeters / 1000,
                              minutes: Math.ceil(route.durationSeconds / 60),
                            }
                          : undefined
                      }
                      onEditDay={
                        activeDate && day && ready && canEditDay(activeDate)
                          ? () =>
                              openEditor({
                                kind: "day",
                                date: activeDate,
                                day,
                                routeMode,
                              })
                          : undefined
                      }
                      routeSummary={total ?? routeMessage ?? null}
                      transportLabel={itineraryCopy.routeModes[routeMode]}
                      transportIcon={
                        routeMode === "DRIVE"
                          ? "car"
                          : routeMode === "WALK"
                            ? "walk"
                            : "route"
                      }
                      onSheetChange={(sheet) => {
                        if (saving.current || timelineDrag.draggedId) return;
                        if (sheet.kind === "transport") {
                          daySchedule.reset();
                          timeline.clear();
                          setModeOpen(true);
                        } else if (sheet.kind === "reorder" && activeDate)
                          openEditor({
                            kind: "reorder",
                            date: activeDate,
                            stops: rows,
                          });
                        else if (sheet.kind === "optimize")
                          void requestOptimization();
                      }}
                      actions={
                        <>
                          {routeQuery.isError ? (
                            <TextAction
                              label={copy.retry}
                              onPress={() => void routeQuery.refetch()}
                            />
                          ) : null}
                          {activeDate &&
                          mode !== "live" &&
                          day &&
                          ready &&
                          canEditDay(activeDate) ? (
                            <DetailIconButton
                              name="daySchedule"
                              label={detailCopy.daySettings}
                              onPress={() =>
                                openEditor({
                                  kind: "day",
                                  date: activeDate,
                                  day,
                                  routeMode,
                                })
                              }
                            />
                          ) : null}
                        </>
                      }
                    />
                  )}
                  {backlog && canManagePlaces ? (
                    <AppButton
                      size="small"
                      variant="outline"
                      onPress={openPlacePicker}
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
                  {day?.startLocation ? (
                    <TripStartNode
                      trip={trip}
                      day={day}
                      canEdit={ready && !!activeDate && canEditDay(activeDate)}
                      live={mode === "live"}
                      onPress={() => {
                        if (activeDate && ready && canEditDay(activeDate))
                          openEditor({
                            kind: "day",
                            date: activeDate,
                            day,
                            routeMode,
                          });
                      }}
                    />
                  ) : null}
                  {timeline.pending || completion.isPending ? (
                    <AppText
                      accessibilityLiveRegion="polite"
                      variant="caption"
                      tone="muted"
                    >
                      {completion.isPending
                        ? itineraryCopy.routeLoading
                        : itineraryCopy.saving}
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
                index === 0
                  ? route && routeResult?.status === "READY"
                    ? routeResult.startLeg
                    : undefined
                  : route?.legs.length === rows.length - 1
                    ? route.legs[index - 1]
                    : undefined;
              const entry = timeline.pending
                ? undefined
                : scheduledEntries?.[index];
              const savedLeg = leg
                ? {
                    km: leg.distanceMeters / 1000,
                    minutes: Math.ceil(leg.durationSeconds / 60),
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
                    fromStart={index === 0 && !!day?.startLocation}
                    number={index + 1}
                    last={index === rows.length - 1}
                    mode={routeMode === "DRIVE" ? "car" : "walk"}
                    legIcon={routeMode === "BICYCLE" ? "route" : undefined}
                    visited={!!stop.visited}
                    next={stop.id === nextStop}
                    visitDisabled={
                      visit.isPending ||
                      timeline.pending ||
                      !!timelineDrag.draggedId
                    }
                    onVisited={
                      mode === "live" &&
                      activeDate <= read.context.evaluatedDate &&
                      ready
                        ? () => void markVisited(stop, !stop.visited)
                        : undefined
                    }
                    highlighted={selectedPin === stop.id}
                    drag={
                      timeline.canInteract &&
                      !(mode === "live" && activeDate === today && stop.visited)
                        ? timelineDrag
                        : undefined
                    }
                    onRemove={
                      timeline.canInteract &&
                      !(mode === "live" && activeDate === today && stop.visited)
                        ? () => timeline.remove(stop.id)
                        : undefined
                    }
                    onOpen={() => {
                      if (saving.current) return;
                      timeline.clear();
                      router.push({
                        pathname: "/trip/place-details",
                        params: {
                          tripId: trip.id,
                          day: activeDate,
                          stopId: stop.itineraryItemId ?? stop.id,
                        },
                      });
                    }}
                  />
                </View>
              );
            }
            return (
              <View style={{ paddingHorizontal: theme.spacing.lg }}>
                <TripBacklogRow
                  stop={stop}
                  canEdit={ready && editableDays.length > 0}
                  onPress={() => openEditor({ kind: "stop", stop })}
                />
              </View>
            );
          }}
        />
      </View>
      {timeline.canUndo ||
      ((timeline.hasFailure || completion.isError) && scheduleError) ? (
        <View
          style={{
            paddingBottom:
              mode === "planning" && !canOptimize ? insets.bottom : 0,
          }}
        >
          {timeline.canUndo ? (
            <TripUndoNotice
              key={selectionKey + (itinerary.data?.updatedAt ?? "")}
              message={itineraryCopy.saved}
              onUndo={timeline.undo}
              onDismiss={timeline.clear}
            />
          ) : (
            <View
              style={{
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.sm,
                gap: theme.spacing.xs,
              }}
            >
              <AppText accessibilityRole="alert" variant="caption" tone="error">
                {scheduleError}
              </AppText>
              <TextAction
                label={timeline.canRetry ? copy.retry : itineraryCopy.reload}
                onPress={
                  timeline.canRetry
                    ? timeline.retry
                    : () => void refreshSchedule()
                }
              />
            </View>
          )}
        </View>
      ) : null}
      {backlog ||
      ((mode === "live" || mode === "recap") && !defaultDate) ? null : (
        <TripDetailsActions
          trip={trip}
          mode={mode}
          canOptimize={canOptimize}
          onOptimize={() => void requestOptimization()}
          nextStop={ready && next?.tripPlaceId ? next : undefined}
          canDirect={ready && !!next && pins.some((pin) => pin.id === next.id)}
          onDirections={openDirections}
          onVisited={() => void markVisited()}
          visitPending={
            visit.isPending ||
            timeline.pending ||
            completion.isPending ||
            !!timelineDrag.draggedId
          }
          onJournal={showJournal}
          onInfo={openActions}
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
      {editor?.kind === "day" ? (
        <ConnectedDayScheduleSheet
          trip={trip}
          day={editor.day}
          routeMode={editor.routeMode}
          pending={daySchedule.isPending}
          preserveVisited={mode === "live" && editor.day.date === today}
          problem={scheduleError}
          onReload={isConflict ? () => void refreshSchedule() : undefined}
          onClose={closeEditor}
          onSave={async (
            draft: Pick<UpdateDayScheduleRequest, "settings" | "durations">,
          ) => {
            await persistSchedule(
              editor.date,
              editor.base,
              editor.tripVersion,
              draft,
            );
          }}
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
              ) &&
              ((proposal.originalDistanceMeters != null &&
                proposal.originalDurationSeconds != null) ||
                editor.route)
            ) {
              const before = {
                km:
                  (proposal.originalDistanceMeters ??
                    editor.route?.distanceMeters ??
                    0) / 1000,
                minutes: Math.ceil(
                  (proposal.originalDurationSeconds ??
                    editor.route?.durationSeconds ??
                    0) / 60,
                ),
              };
              const after = {
                km: proposal.distanceMeters / 1000,
                minutes: Math.ceil(proposal.durationSeconds / 60),
              };
              return (
                <TripOptimizationSheet
                  day={{
                    date: editor.date,
                    stops: editor.stops.map((stop) => ({
                      ...stop,
                      visited: proposal.visitedOrder.includes(
                        stop.placeId ?? "",
                      ),
                    })),
                  }}
                  onClose={closeEditor}
                  busy={save.isPending}
                  problem={scheduleError}
                  onReload={
                    isConflict ? () => void refreshSchedule() : undefined
                  }
                  proposal={{
                    order: ids,
                    lockedPrefixIds: ids.slice(0, proposal.visitedOrder.length),
                    comparison: {
                      before,
                      after,
                      savedKm: Math.round((before.km - after.km) * 10) / 10,
                      savedMinutes: before.minutes - after.minutes,
                    },
                  }}
                  onApply={(order) =>
                    persistOrder(editor, order, proposal.visitedOrder)
                  }
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
          onClose={() => {
            if (!saving.current) setModeOpen(false);
          }}
          dismissDisabled={daySchedule.isPending}
        >
          {scheduleError ? (
            <AppText accessibilityRole="alert" tone="error" variant="caption">
              {scheduleError}
            </AppText>
          ) : null}
          {isConflict ? (
            <TextAction
              label={itineraryCopy.reload}
              onPress={() => void refreshSchedule()}
            />
          ) : null}
          {(["DRIVE", "WALK", "BICYCLE"] as const).map((value) => (
            <AppButton
              key={value}
              variant={routeMode === value ? "soft" : "outline"}
              accessibilityState={{ selected: routeMode === value }}
              disabled={daySchedule.isPending || isConflict}
              onPress={() => {
                if (
                  !activeDate ||
                  !itinerary.data ||
                  !canEditDay(activeDate) ||
                  saving.current
                )
                  return;
                void persistSchedule(
                  activeDate,
                  itinerary.data,
                  read.trip.version,
                  {
                    settings: {
                      origin: storedSettings?.origin ?? null,
                      departureTime:
                        storedSettings?.departureTime ??
                        (rows[0]?.time || "08:30"),
                      returnToStart: storedSettings?.returnToStart ?? false,
                      travelMode: value,
                    },
                    durations: (scheduledEntries ?? []).map((stop) => ({
                      placeId: stop.placeId,
                      minutes: stop.durationMinutes,
                    })),
                  },
                ).catch(() => {
                  /* The sheet keeps the mutation error and allows retry. */
                });
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
            targetDay={pickerDay}
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
