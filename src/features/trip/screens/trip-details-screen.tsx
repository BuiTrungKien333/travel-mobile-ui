import { QueryFeedback } from "@/components/common/query-feedback";
import { requiredQueryState } from "@/utils/required-query-state";
import { router } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { tripDirectionsUrl } from "@/features/home/utils/map-links";
import { useOngoingCopy } from "@/features/home/i18n/ongoing-copy";
import { useTripVisit } from "../hooks/use-trip-visit";
import { reviewOptimization } from "../utils/optimization-review";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Linking, StyleSheet, View } from "react-native";
import Animated, { useSharedValue } from "react-native-reanimated";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import type { Trip, TripStop } from "@/features/home/types/home-types";
import { getDayProgress } from "@/features/home/utils/day-progress";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import { todayCalendarDate } from "@/utils/calendar-date";
import { useMemoriesQuery } from "@/features/home/api/memory-hooks";
import { layout } from "@/theme/tokens";
import {
  TripDaySelector,
  TripDayTools,
} from "../components/trip-details-overview";
import {
  TripDetailsHeader,
  DetailIconButton,
} from "../components/trip-details-header";
import { TripDetailsPanels } from "../components/trip-details-panels";
import { TripMapPreview } from "../components/trip-map-preview";
import { PlaceSearchMap } from "../components/place-search-map";
import {
  TripPlanningMap,
  type PlanningMapGeometry,
} from "../components/trip-planning-map";
import { usePlanningMapCollapse } from "../hooks/use-planning-map-collapse";
import { TripPlanningDaySelector } from "../components/trip-planning-day-selector";
import { appendTripDayRange } from "../utils/append-trip-day";
import { getPlaceMapRegion } from "../utils/place-search";
import { tripDuration } from "@/features/home/utils/select-home";
import { tripFormLimits } from "../constants/trip-form";
import { TripStopRow } from "../components/trip-stop-row";
import { TripBacklogRow } from "../components/trip-backlog-row";
import { TripRecapContent } from "../components/trip-recap-content";
import { TripDetailsActions } from "../components/trip-details-actions";
import {
  TripStartNode,
  TripTimelineEmpty,
  TripTimelineTail,
} from "../components/trip-timeline-states";
import { useTripTimelineScroll } from "../hooks/use-trip-timeline-scroll";
import { useTripTimelineDrag } from "../hooks/use-trip-timeline-drag";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { ApiError } from "@/services/api/api-error";
import { toTrip } from "../api/trip-adapters";
import { scheduleMutationRequest } from "../api/save-trip-schedule";
import { useAddTripPlaces } from "../hooks/use-add-trip-places";
import { tripApi } from "../api/trip-api";
import { toUpdateTripDayRequest } from "../api/save-trip-day";
import { tripQueryKeys } from "../api/trip-query-keys";
import { confirmDateImpact } from "../utils/confirm-date-impact";
import {
  useApplyItineraryOptimizationMutation,
  useOptimizeItineraryMutation,
  useSaveItineraryMutation,
  useTripItineraryQuery,
} from "../api/itinerary-hooks";
import {
  useDeleteTripMutation,
  useDeleteTripPlaceMutation,
  useTripPlacesQuery,
  useTripQuery,
  useUpdateTripMutation,
  useUpdateTripPlaceMutation,
  useUpdateTripDayMutation,
} from "../api/trip-hooks";
import type {
  TripMutation,
  TripDetailsSheetState,
} from "../types/trip-details-types";
import {
  getTripDetailsMode,
  getTripStartInfo,
  scheduledStops,
  tripBacklog,
  mergeScheduledOrder,
} from "../utils/trip-details-layout";

type TimelineRow =
  | { kind: "start"; key: string }
  | {
      kind: "stop";
      key: string;
      stop: TripStop;
      previous?: TripStop;
      number: number;
    }
  | { kind: "backlog"; key: string; stop: TripStop; date: string | null };
type Row =
  | TimelineRow
  | { kind: "planning-days"; key: string }
  | { kind: "summary"; key: string };

function backToTrips() {
  if (router.canGoBack()) router.back();
  else router.replace("/tabs/trips");
}

export function TripDetailsScreen({
  tripId,
  selectedDate,
  expandMap = false,
}: {
  tripId?: string;
  selectedDate?: string;
  expandMap?: boolean;
}) {
  const tripQuery = useTripQuery(tripId);
  const [deleted, setDeleted] = useState(false);
  useEffect(() => { if (deleted) backToTrips(); }, [deleted]);
  const placesQuery = useTripPlacesQuery(tripId);
  const itineraryQuery = useTripItineraryQuery(tripId);
  const loadState = requiredQueryState([tripQuery, placesQuery, itineraryQuery]);
  const { copy } = useTripDetailsCopy();
  const theme = useAppTheme();
  if (tripId && loadState === "loading")
    return <ScreenSafeArea style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><QueryFeedback loading /><AppButton variant="outline" onPress={backToTrips}>{copy.back}</AppButton></View>
    </ScreenSafeArea>;
  if (tripId && loadState === "error")
    return <ScreenSafeArea style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <DetailIconButton name="back" label={copy.back} onPress={backToTrips} />
        <AppText accessibilityRole="alert" tone="error">{copy.itineraryLoadError}</AppText>
        <AppButton variant="outline" onPress={() => { void tripQuery.refetch(); void placesQuery.refetch(); void itineraryQuery.refetch(); }}>{copy.retry}</AppButton>
      </View>
    </ScreenSafeArea>;
  const trip = tripQuery.data ? toTrip(tripQuery.data, placesQuery.data ?? [], itineraryQuery.data) : undefined;
  if (!trip)
    return (
      <ScreenSafeArea
        style={[styles.fill, { backgroundColor: theme.colors.background }]}
      >
        <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
          <DetailIconButton
            name="back"
            label={copy.back}
            onPress={backToTrips}
          />
          <AppText variant="heading">{copy.notFound}</AppText>
          <AppText tone="muted">{copy.notFoundHint}</AppText>
          <AppButton
            variant="gradient"
            onPress={() => router.replace("/tabs/trips")}
          >
            {copy.allTrips}
          </AppButton>
        </View>
      </ScreenSafeArea>
    );
  return (
    <TripDetailsContent
      feedback={<QueryFeedback refreshing={tripQuery.isRefetching || placesQuery.isRefetching || itineraryQuery.isRefetching}
        error={tripQuery.isError || placesQuery.isError || itineraryQuery.isError ? copy.itineraryLoadError : null}
        retrying={tripQuery.isFetching || placesQuery.isFetching || itineraryQuery.isFetching}
        onRetry={() => { void tripQuery.refetch(); void placesQuery.refetch(); void itineraryQuery.refetch(); }} />}
      key={trip.id}
      trip={trip}
      selectedDate={selectedDate}
      expandMap={expandMap}
      onDeleted={() => setDeleted(true)}
    />
  );
}

function TripDetailsContent({
  trip,
  selectedDate,
  expandMap,
  onDeleted,
  feedback,
}: {
  trip: Trip;
  selectedDate?: string;
  expandMap: boolean;
  onDeleted: () => void;
  feedback?: ReactNode;
}) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const visit = useTripVisit(trip);
  const { copy: ongoingCopy } = useOngoingCopy();
  const insets = useScreenInsets();
  const { copy } = useTripDetailsCopy();
  const updateTrip = useUpdateTripMutation(trip.id);
  const updateTripDay = useUpdateTripDayMutation(trip.id);
  const itineraryQuery = useTripItineraryQuery(trip.id);
  const addPlacesMutation = useAddTripPlaces(trip.id);
  const updatePlaceMutation = useUpdateTripPlaceMutation(trip.id);
  const removePlaceMutation = useDeleteTripPlaceMutation(trip.id);
  const deleteTripMutation = useDeleteTripMutation();
  const saveItineraryMutation = useSaveItineraryMutation(trip.id);
  const optimizeItineraryMutation = useOptimizeItineraryMutation(trip.id);
  const applyItineraryOptimizationMutation = useApplyItineraryOptimizationMutation(trip.id);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const commitInFlight = useRef(false);
  const [committing, setCommitting] = useState(false);
  usePreventRemove(committing || visit.isPending || applyItineraryOptimizationMutation.isPending, () => undefined);
  const today = todayCalendarDate();
  const panelOpen = useTripPreview((state) => state.panel !== null);
  const memoriesQuery = useMemoriesQuery(trip.id);
  const [backlog, setBacklog] = useState(() => !selectedDate && !trip.days.some((entry) => entry.stops.length)
    && (trip.unscheduledStops?.length ?? 0) > 0);
  const [sheet, setSheet] = useState<TripDetailsSheetState | null>(null);
  const [optimizationApplyError, setOptimizationApplyError] = useState<string | null>(null);
  const optimizeInFlight = useRef(false);
  const applyInFlight = useRef(false);
  const [editHistory, setEditHistory] = useState(false);
  const [highlight, setHighlight] = useState<{
    date: string;
    id: string;
  } | null>(null);
  const [availableHeight, setAvailableHeight] = useState(0);
  const mapResizeLock = useSharedValue(0);
  const mapExpandRequest = expandMap ? 1 : 0;
  const [planningMapGeometry, setPlanningMapGeometry] =
    useState<PlanningMapGeometry>({
      height: theme.layout.tripMapMinimumHeight,
      headerHeight:
        theme.layout.compactTouchTarget + theme.spacing.xxl + theme.spacing.sm,
    });
  const [selectorHeight, setSelectorHeight] = useState<number>(
    theme.layout.touchTarget,
  );
  const mode = getTripDetailsMode(trip, today);
  const mapFirstLayout = mode === "planning" || mode === "live";
  const canEdit = mode === "planning" || mode === "live" || editHistory;
  const defaultDay =
    trip.days.find((day) => day.date === today) ?? trip.days[0];
  const day =
    trip.days.find((item) => item.date === selectedDate) ?? defaultDay;
  const isLiveToday = mode === "live" && day?.date === today;
  const startInfo = getTripStartInfo(day, mode === "live");
  const timedStops = scheduledStops(day);
  const hasStartNode = !!startInfo && (timedStops.length > 0 || canEdit);
  const canOptimize = trip.days.reduce((total, item) => total + item.stops.length, 0) > 1 && !backlog;
  const timedDay = day ? { ...day, stops: timedStops } : undefined;
  const unscheduled = tripBacklog(trip);
  const selectionKey = backlog ? "backlog" : (day?.date ?? "no-date");
  const timelineDrag = useTripTimelineDrag({
    stops: timedStops,
    selectionKey,
    onReorder: (ids) => {
      if (day && canEdit)
        commit({
          kind: "reorder",
          date: day.date,
          ids: mergeScheduledOrder(day, ids),
        });
    },
  });
  const { list, jump, onScrollToIndexFailed, rememberOffset } = useTripTimelineScroll<Row>(
    selectionKey,
    mapFirstLayout
      ? planningMapGeometry.headerHeight + selectorHeight + theme.spacing.lg
      : 0,
  );
  const progress = getDayProgress(
    timedStops,
    timedStops.filter((stop) => stop.visited).map((stop) => stop.id),
  );
  const dayMemories = memoriesQuery.data?.content ?? [];
  const optimizationError = optimizeItineraryMutation.isError
    ? (optimizeItineraryMutation.error instanceof ApiError && optimizeItineraryMutation.error.code === "TRIP_015" ? copy.originSelectRequired
      : optimizeItineraryMutation.error instanceof ApiError && optimizeItineraryMutation.error.code === "TRIP_014"
      ? copy.pinOptimizationConflict : copy.optimizationError)
    : optimizationApplyError ?? undefined;

  function openOptimization() {
    if (optimizeInFlight.current || applyInFlight.current) return;
    optimizeInFlight.current = true;
    setSheet({ kind: "optimize" });
    setOptimizationApplyError(null);
    applyItineraryOptimizationMutation.reset();
    optimizeItineraryMutation.reset();
    void optimizeItineraryMutation.mutateAsync().catch(() => undefined).finally(() => { optimizeInFlight.current = false; });
  }

  function applyOptimization() {
    const result = optimizeItineraryMutation.data;
    if (!result || applyInFlight.current || optimizeInFlight.current || applyItineraryOptimizationMutation.isPending) return;
    if (!reviewOptimization(result.proposal, trip.days).valid) { setOptimizationApplyError(copy.optimizationInvalid); return; }
    applyInFlight.current = true;
    setOptimizationApplyError(null);
    void applyItineraryOptimizationMutation.mutateAsync({
      expectedUpdatedAt: result.sourceUpdatedAt,
      proposal: result.proposal,
    }).then(() => {
      optimizeItineraryMutation.reset();
      setSheet(null);
    }).catch((error: unknown) => {
      setOptimizationApplyError(
        error instanceof ApiError && error.code === "TRIP_014" ? copy.pinOptimizationConflict
        : error instanceof ApiError && (error.status === 409 || error.code === "TRIP_008")
          ? copy.optimizationConflict
          : copy.optimizationApplyError,
      );
    }).finally(() => { applyInFlight.current = false; });
  }

  const mapHeight = availableHeight
    ? Math.min(
        theme.layout.tripMapPreviewHeight,
        availableHeight * theme.layout.tripMapHeightRatio,
      )
    : theme.layout.tripMapMinimumHeight;
  const showMap =
    !backlog &&
    !!day &&
    (mode === "planning" || mode === "live" || editHistory);
  const planningScroll = usePlanningMapCollapse<Row>({
    enabled: mapFirstLayout && showMap,
    selectionKey,
    mapHeight: planningMapGeometry.height,
    list,
    resizeLock: mapResizeLock,
  });
  const rows: TimelineRow[] = backlog
    ? unscheduled.map((entry) => ({ ...entry, kind: "backlog" }))
    : day
      ? [
          ...(hasStartNode
            ? [{ kind: "start", key: "start" } satisfies TimelineRow]
            : []),
          ...timedStops.map(
            (stop, index): TimelineRow => ({
              kind: "stop",
              key: stop.id,
              stop,
              previous: timedStops[index - 1],
              number: index + 1,
            }),
          ),
        ]
      : [];
  const listRows: Row[] = mapFirstLayout
    ? [
        { kind: "planning-days", key: "planning-days" },
        { kind: "summary", key: "summary" },
        ...rows,
      ]
    : rows;

  function commit(mutation: TripMutation) {
    if (commitInFlight.current) return false;
    commitInFlight.current = true;
    setCommitting(true);
    setCommitError(null);
    setSavedNotice(false);
    const perform = async () => {
      if (mutation.kind === "info") {
        const version = mutation.baseVersion ?? trip.serverVersion;
        if (version === undefined) throw new ApiError("INVALID_RESPONSE");
        const dates = mutation.dateRange;
        const impact = dates ? await tripApi.previewDates(trip.id, { ...dates, version }) : undefined;
        if (impact?.requiresAcknowledgement && !await confirmDateImpact(copy, impact.movedToPoolCount)) return false;
        await updateTrip.mutateAsync({
          version,
          title: mutation.values.title,
          ...(mutation.values.destination && mutation.values.destination !== trip.destination
            ? { destination: { name: mutation.values.destination } } : {}),
          ...dates,
          ...(impact?.requiresAcknowledgement ? { acknowledgeDateImpact: true } : {}),
          preferences: mutation.values.preferences,
          budget: mutation.values.budget ?? null,
          accommodation: mutation.values.accommodation ?? null,
          notes: mutation.values.notes ?? null,
        });
      } else if (mutation.kind === "dates") {
        const version = mutation.baseVersion ?? trip.serverVersion;
        if (version === undefined) throw new ApiError("INVALID_RESPONSE");
        const dates = { startDate: mutation.startDate, endDate: mutation.endDate, version };
        const impact = await tripApi.previewDates(trip.id, dates);
        if (impact.requiresAcknowledgement && !await confirmDateImpact(copy, impact.movedToPoolCount)) return false;
        await updateTrip.mutateAsync({ ...dates, acknowledgeDateImpact: impact.requiresAcknowledgement });
      } else if (mutation.kind === "add") {
        await addPlacesMutation.mutateAsync({ stops: mutation.stops, date: mutation.date });
        if (mutation.date === null) setBacklog(true);
      } else if (mutation.kind === "remove") {
        if (mutation.date === null) {
          await removePlaceMutation.mutateAsync(mutation.stopId);
        } else {
          await saveItineraryMutation.mutateAsync(scheduleMutationRequest(trip, mutation));
        }
      } else if (mutation.kind === "reorder") {
        await saveItineraryMutation.mutateAsync(scheduleMutationRequest(trip, mutation));
      } else if (mutation.kind === "stop") {
        if (mutation.date !== null || mutation.targetDate !== null) {
          await saveItineraryMutation.mutateAsync(scheduleMutationRequest(trip, mutation));
        } else {
          await updatePlaceMutation.mutateAsync({
            placeId: mutation.stopId,
            request: {
              ...(mutation.values.durationMinutes ? { estimatedDuration: mutation.values.durationMinutes } : {}),
              ...(mutation.values.note !== undefined ? { notes: mutation.values.note } : {}),
            },
          });
        }
      } else if (mutation.kind === "day") {
        await updateTripDay.mutateAsync({ date: mutation.date, request: toUpdateTripDayRequest(trip, mutation) });
      } else {
        throw new Error("INVALID_TRIP_MUTATION");
      }
    };
    void perform().then((saved) => { if (saved !== false) { setSheet(null); setSavedNotice(true); } }).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 409) void queryClient.invalidateQueries({ queryKey: tripQueryKeys.all });
      setCommitError(error instanceof ApiError && error.status === 409 ? (mutation.kind === "day" ? copy.daySettingsConflict : copy.versionConflict)
        : error instanceof Error && error.message === "PLACE_COORDINATES_REQUIRED"
        ? "Địa điểm cần có tọa độ để lưu lên máy chủ."
        : error instanceof Error && error.message === "ITINERARY_SAVE_FAILED"
          ? copy.itinerarySaveError
          : "Không lưu được thay đổi. Hãy thử lại.");
    }).finally(() => {
      commitInFlight.current = false;
      setCommitting(false);
    });
    return true;
  }
  function openStop(stop: TripStop, date: string | null = day?.date ?? null) {
    router.push({
      pathname: "/trip/place-details",
      params: {
        tripId: trip.id,
        stopId: stop.id,
        ...(date ? { day: date } : {}),
      },
    });
  }
  function openJournal() {
    router.push({ pathname: "/memories/[tripId]", params: { tripId: trip.id } });
  }
  function addPlace() {
    openPlacePicker(backlog ? null : (day?.date ?? null));
  }
  function openPlacePicker(date: string | null) {
    router.push({
      pathname: "/trip/add-places",
      params: { tripId: trip.id, ...(date ? { day: date } : {}) },
    });
  }
  function selectDate(date: string | null) {
    setSavedNotice(false);
    setBacklog(date === null);
    if (date) router.setParams({ day: date });
  }
  function addDay() {
    const range = appendTripDayRange(trip);
    if (!range) {
      setSheet({ kind: "dates" });
      return;
    }
    if (commit({ kind: "dates", ...range })) selectDate(range.endDate);
  }
  function selectStop(stop: TripStop) {
    if (!day) return;
    setHighlight({ date: day.date, id: stop.id });
    const index = listRows.findIndex(
      (row) => row.kind === "stop" && row.stop.id === stop.id,
    );
    if (index >= 0) jump(index);
  }
  function movePlace(index: number, offset: -1 | 1) {
    const destinationIndex = index + offset;
    const current = unscheduled[index];
    const neighbor = unscheduled[destinationIndex];
    if (!current || !neighbor) return;
    void Promise.all([
      updatePlaceMutation.mutateAsync({ placeId: current.stop.id, request: { plannedOrder: destinationIndex } }),
      updatePlaceMutation.mutateAsync({ placeId: neighbor.stop.id, request: { plannedOrder: index } }),
    ]).catch(() => setCommitError("Không đổi được thứ tự địa điểm."));
  }
  const header = (
    <TripDetailsHeader
      trip={trip}
      mode={mode}
      hideTripInfo={mapFirstLayout}
      onBack={() => { if (!commitInFlight.current && !applyInFlight.current && !visit.isPending) backToTrips(); }}
      onMenu={() => setSheet({ kind: "menu" })}
    />
  );

  function renderTimelineRow({ item }: { item: TimelineRow }) {
    if (item.kind === "backlog") {
      const index = unscheduled.findIndex((entry) => entry.stop.id === item.stop.id);
      return (
        <TripBacklogRow
          stop={item.stop}
          canEdit={canEdit}
          onPress={() => openStop(item.stop, item.date)}
          onMoveUp={index > 0 ? () => movePlace(index, -1) : undefined}
          onMoveDown={index >= 0 && index < unscheduled.length - 1 ? () => movePlace(index, 1) : undefined}
        />
      );
    }
    if (item.kind === "start")
      return (
        <TripStartNode
          trip={trip}
          day={day}
          canEdit={canEdit}
          live={mode === "live"}
          markerWidth={
            isLiveToday ? theme.layout.compactTouchTarget : undefined
          }
          onPress={() => setSheet({ kind: "day" })}
        />
      );
    return (
      <TripStopRow
        stop={item.stop}
        previous={item.previous}
        number={item.number}
        last={item.number === timedStops.length}
        fromStart={item.number === 1 && hasStartNode}
        origin={item.number === 1 ? day?.startCoordinate : undefined}
        departureTime={item.number === 1 ? day?.startTime : undefined}
        highlighted={
          highlight?.date === day?.date && highlight?.id === item.stop.id
        }
        mode={day?.transport ?? "car"}
        visited={progress.visitedStops.some((stop) => stop.id === item.stop.id)}
        next={
          mode === "live" &&
          day?.date === today &&
          progress.nextStop?.id === item.stop.id
        }
        onOpen={() => openStop(item.stop)}
        drag={mode === "planning" || editHistory ? timelineDrag : undefined}
        onRemove={
          canEdit && day
            ? () =>
                commit({ kind: "remove", date: day.date, stopId: item.stop.id })
            : undefined
        }
        onVisited={
          mode === "live" && day?.date === today && !visit.isPending
            ? () => {
                setCommitError(null);
                void visit.setVisited(item.stop.id, today, !item.stop.visited).catch(() => setCommitError(ongoingCopy.visitError));
              }
            : undefined
        }
      />
    );
  }

  const listHeader = (
    <View>
      {backlog ? (
        <View
          style={{ gap: theme.spacing.xs, paddingBottom: theme.spacing.lg }}
        >
          <AppText variant="label">
            {copy.pool} ({unscheduled.length})
          </AppText>
          <AppText variant="caption" tone="muted">
            {canEdit ? copy.backlogArrival : copy.backlogSaved}
          </AppText>
          {canEdit ? (
            <AppButton size="small" variant="soft" onPress={addPlace}>
              {copy.add}
            </AppButton>
          ) : null}
        </View>
      ) : (
        <>
          {mode === "recap" && !editHistory ? (
            <TripRecapContent memories={dayMemories} />
          ) : null}
          {mode === "recap" ? (
            <AppText
              variant="label"
              style={{ paddingBottom: theme.spacing.md }}
            >
              {copy.itinerary}
            </AppText>
          ) : null}
          {mode !== "recap" || timedStops.length || editHistory ? (
            <TripDayTools
              trip={trip}
              day={timedDay}
              today={today}
              canEdit={canEdit && (mode === "planning" || editHistory)}
              editHistory={editHistory}
              showWeather={false}
              showOptimize={mode === "live" && canOptimize}
              reorderAtEnd={mode === "planning"}
              onSheetChange={(next) => next.kind === "optimize" ? openOptimization() : setSheet(next)}
            />
          ) : null}
          {editHistory ? (
            <AppButton size="small" variant="soft" onPress={addPlace}>
              {copy.add}
            </AppButton>
          ) : null}
        </>
      )}
    </View>
  );

  const planningMapRegion = getPlaceMapRegion(timedStops, day?.startCoordinate);
  const planningHeader = showMap ? (
    <TripPlanningMap
      header={header}
      viewportHeight={availableHeight}
      selectorHeight={selectorHeight}
      stops={timedStops}
      selectedId={
        highlight?.date === day?.date
          ? highlight.id
          : mode === "live" && day?.date === today
            ? progress.nextStop?.id
            : undefined
      }
      startLabel={startInfo?.location || copy.chooseStart}
      showStart={mode !== "live" || !!startInfo}
      onSelect={selectStop}
      onStart={() => jump(2)}
      onGeometryChange={setPlanningMapGeometry}
      resizeLock={mapResizeLock}
      collapsedByScroll={planningScroll.hidden}
      expandRequest={mapExpandRequest}
      mapContent={planningMapRegion ? <PlaceSearchMap places={timedStops} region={planningMapRegion} custom={false} fitContainer
        showRoute={!day?.startLocation || !!day.startCoordinate} origin={day?.startCoordinate} originLabel={day?.startLocation}
        returnToStart={day?.returnToStart} travelMode={day?.transport} /> : undefined}
    />
  ) : (
    <View style={{ paddingHorizontal: theme.spacing.lg }}>{header}</View>
  );

  function renderRow({ item }: { item: Row }) {
    if (item.kind === "planning-days")
      return (
        <View
          style={{
            backgroundColor: theme.colors.surface,
            paddingHorizontal: theme.spacing.lg,
          }}
        >
          {planningScroll.hidden ? (
            <TripDetailsHeader
              trip={trip}
              mode={mode}
              titleOnly
              onBack={() => { if (!commitInFlight.current && !applyInFlight.current && !visit.isPending) backToTrips(); }}
              onMenu={() => setSheet({ kind: "menu" })}
              onEdit={() => setSheet({ kind: "info" })}
              onOpenMap={planningScroll.show}
            />
          ) : null}
          <View
            onLayout={(event) =>
              setSelectorHeight(event.nativeEvent.layout.height)
            }
          >
            <TripPlanningDaySelector
              trip={trip}
              selectedDate={day?.date}
              backlog={backlog}
              backlogCount={unscheduled.length}
              onSelect={selectDate}
              onAddDay={mode === "planning" ? addDay : undefined}
              addDayDisabled={tripDuration(trip) >= tripFormLimits.days}
            />
          </View>
        </View>
      );
    if (item.kind === "summary")
      return (
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.lg,
          }}
        >
          {listHeader}
          {!rows.length ? (
            <TripTimelineEmpty
              backlog={backlog}
              canSetDates={!day && canEdit}
              onDates={() => setSheet({ kind: "dates" })}
            />
          ) : null}
        </View>
      );
    return (
      <View
        style={{
          paddingHorizontal: mapFirstLayout ? theme.spacing.lg : 0,
        }}
      >
        {renderTimelineRow({ item })}
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <ScreenSafeArea edges={["top", "left", "right"]} style={styles.fill}>
        {feedback}
        {savedNotice ? <AppText accessibilityLiveRegion="polite" variant="caption" tone="primary"
          style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm }}>{copy.changesSaved}</AppText> : null}
        <View
          aria-hidden={panelOpen || sheet !== null}
          accessibilityElementsHidden={panelOpen || sheet !== null}
          importantForAccessibility={
            panelOpen || sheet !== null ? "no-hide-descendants" : "auto"
          }
          style={styles.fill}
        >
          {!mapFirstLayout ? (
            <View
              style={[styles.frame, { paddingHorizontal: theme.spacing.lg }]}
            >
              {header}
              <TripDaySelector
                trip={trip}
                selectedDate={day?.date}
                backlog={backlog}
                backlogCount={unscheduled.length}
                onSelect={selectDate}
              />
            </View>
          ) : null}
          <View
            style={[styles.frame, styles.fill, { minHeight: 0 }]}
            onLayout={(event) =>
              setAvailableHeight(event.nativeEvent.layout.height)
            }
          >
            {!mapFirstLayout && showMap ? (
              <View
                style={{
                  paddingHorizontal: theme.spacing.lg,
                  paddingBottom: theme.spacing.sm,
                }}
              >
                <TripMapPreview
                  stops={timedStops}
                  height={mapHeight}
                  selectedId={
                    highlight?.date === day?.date
                      ? highlight.id
                      : progress.nextStop?.id
                  }
                  startLabel={
                    day?.startLocation || copy.chooseStart
                  }
                  onStart={() => jump(0)}
                  onSelect={selectStop}
                />
              </View>
            ) : null}
            <View
              style={[
                styles.fill,
                {
                  minHeight: 0,
                  backgroundColor: theme.colors.surface,
                  borderTopLeftRadius: theme.radius.lg,
                  borderTopRightRadius: theme.radius.lg,
                },
              ]}
            >
              <Animated.FlatList<Row>
                key={selectionKey}
                ref={list}
                data={listRows}
                keyExtractor={(item) => item.key}
                renderItem={renderRow}
                onScrollToIndexFailed={onScrollToIndexFailed}
                onScrollEndDrag={rememberOffset}
                onMomentumScrollEnd={rememberOffset}
                initialNumToRender={8}
                scrollEnabled={!timelineDrag.draggedId}
                removeClippedSubviews={
                  timelineDrag.draggedId ? false : undefined
                }
                CellRendererComponentStyle={({ item }) => ({
                  zIndex:
                    item.kind === "planning-days"
                      ? 2
                      : item.kind === "stop" &&
                          timelineDrag.draggedId === item.stop.id
                        ? 1
                        : 0,
                })}
                ListHeaderComponent={
                  mapFirstLayout ? planningHeader : listHeader
                }
                stickyHeaderIndices={mapFirstLayout ? [1] : undefined}
                onScroll={mapFirstLayout ? planningScroll.onScroll : undefined}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                style={styles.fill}
                contentContainerStyle={{
                  padding: mapFirstLayout ? 0 : theme.spacing.lg,
                  paddingBottom:
                    theme.spacing.xxl +
                    (mode === "planning" && !canOptimize ? insets.bottom : 0),
                  minHeight:
                    mapFirstLayout && showMap
                      ? availableHeight + planningMapGeometry.height
                      : undefined,
                }}
                ListEmptyComponent={
                  backlog || !day ? (
                    <TripTimelineEmpty
                      backlog={backlog}
                      canSetDates={!day && canEdit}
                      onDates={() => setSheet({ kind: "dates" })}
                    />
                  ) : null
                }
                ListFooterComponent={
                  !backlog ? (
                    <View
                      style={{
                        paddingHorizontal: mapFirstLayout
                          ? theme.spacing.lg
                          : 0,
                      }}
                    >
                      <TripTimelineTail
                        trip={trip}
                        day={day}
                        canEdit={canEdit}
                        empty={!timedStops.length}
                        backlogCount={unscheduled.length}
                        onBacklog={() => selectDate(null)}
                        onAdd={() => day && openPlacePicker(day.date)}
                      />
                    </View>
                  ) : null
                }
              />
            </View>
          </View>
          {commitError && !sheet ? <AppText accessibilityRole="alert" tone="error" style={{ paddingHorizontal: theme.spacing.lg }}>{commitError}</AppText> : null}
          <TripDetailsActions
            trip={trip}
            mode={mode}
            canOptimize={canOptimize}
            onOptimize={openOptimization}
            nextStop={isLiveToday && !backlog ? progress.nextStop : undefined}
            visiting={visit.isPending}
            onDirections={() => {
              setCommitError(null);
              if (progress.nextStop && day) void Linking.openURL(tripDirectionsUrl(progress.nextStop, trip.destination, day.transport))
                .catch(() => setCommitError(ongoingCopy.directionsError));
            }}
            onVisited={() => {
              setCommitError(null);
              if (isLiveToday && !backlog && progress.nextStop)
                void visit.setVisited(progress.nextStop.id, today, true)
                  .catch(() => setCommitError(ongoingCopy.visitError));
            }}
            onJournal={openJournal}
            onInfo={() => setSheet({ kind: "info" })}
          />
        </View>
      </ScreenSafeArea>
      {sheet ? (
        <TripDetailsPanels
          key={sheet.kind}
          trip={trip}
          day={backlog ? undefined : day}
          today={today}
          canEdit={canEdit}
          sheet={sheet}
          onSheetChange={(next) => { if (!committing) { setCommitError(null); setSheet(next); } }}
          onCommit={commit}
          saving={committing}
          saveError={commitError}
          itineraryUpdatedAt={itineraryQuery.data?.updatedAt}
          onEditHistory={() => setEditHistory(true)}
          onJournal={openJournal}
          onDelete={() => {
            if (trip.serverVersion === undefined || commitInFlight.current) return;
            commitInFlight.current = true;
            setCommitError(null);
            setCommitting(true);
            let removed = false;
            void deleteTripMutation.mutateAsync({ tripId: trip.id, version: trip.serverVersion })
              .then(() => { removed = true; })
              .catch(() => setCommitError(copy.deleteError))
              .finally(() => { commitInFlight.current = false; setCommitting(false); if (removed) onDeleted(); });
          }}
          optimization={optimizeItineraryMutation.data}
          optimizing={optimizeItineraryMutation.isPending}
          applyingOptimization={applyItineraryOptimizationMutation.isPending}
          optimizationError={optimizationError}
          onRetryOptimization={openOptimization}
          onApplyOptimization={applyOptimization}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  frame: {
    width: "100%",
    maxWidth: layout.contentMaxWidth,
    alignSelf: "center",
  },
});
