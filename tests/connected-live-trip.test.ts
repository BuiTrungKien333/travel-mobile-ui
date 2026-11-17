import assert from "node:assert/strict";
import { test } from "node:test";
import type { Trip, TripStop } from "../src/features/home/types/home-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown, type: string): Node[] {
  if (Array.isArray(value)) return value.flatMap((item) => nodes(item, type));
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const item = value as Node;
  return [
    ...(item.type === type ? [item] : []),
    ...nodes(item.props.children, type),
    ...nodes(item.props.ListHeaderComponent, type),
    ...nodes(item.props.mapContent, type),
  ];
}
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
const date = "2026-11-07";
const stop = (id: string, visited = false): TripStop => ({
  id: `link-${id}`,
  tripPlaceId: `link-${id}`,
  placeId: `place-${id}`,
  itineraryItemId: `item-${id}`,
  name: { vi: id, en: id },
  kind: { vi: "", en: "" },
  time: "09:00",
  durationMinutes: 45,
  visited,
  location: { latitude: 11.94, longitude: 108.44 },
});
function fixture(
  legacy = false,
  visitedPair = false,
  recap = false,
  planning = false,
) {
  const a = stop("a", true),
    b = stop("b"),
    pool = stop("pool");
  if (legacy) {
    a.time = "08:00";
    b.time = "";
  }
  const c = stop("c", true),
    d = stop("d");
  const scheduledStops = visitedPair ? [a, b, c, d] : [a, b];
  if (visitedPair) a.location = undefined;
  const trip: Trip = {
    id: "trip",
    destination: "Đà Lạt",
    status: "planned",
    days: [{ date, stops: scheduledStops }],
    unscheduledStops: [pool],
  };
  const read = {
    trip: {
      id: "trip",
      destination: { name: "Đà Lạt" },
      status: recap ? "COMPLETED" : planning ? "PLANNING" : "ACTIVE",
      mode: recap ? "RECAP" : planning ? "PLANNING" : "LIVE",
      dayCount: 1,
      stopCount: scheduledStops.length,
      memoryCount: recap ? 7 : 0,
      version: 3,
      days: [{ date, dayNumber: 1 }],
      title: "Đà Lạt",
    },
    context: { evaluatedDate: date, serverTime: `${date}T03:00:00Z` },
  };
  const itinerary = {
    updatedAt: `${date}T02:00:00Z`,
    days: [
      {
        date,
        stops: scheduledStops.map((s, sequence) => ({
          id: s.itineraryItemId,
          placeId: s.placeId,
          sequence,
          arrivalTime: s.time ? `${date}T${s.time}:00` : null,
          durationMinutes: 45,
          note: null,
        })),
      },
    ],
  };
  const slots: unknown[] = [];
  let cursor = 0;
  const writes: unknown[] = [];
  let shows = 0;
  const directionUrls: string[] = [];
  let ready = true;
  let routeReady = false;
  let effects: (() => void)[] = [];
  const mutation = {
    isPending: false,
    reset() {},
    mutateAsync: async (input: unknown) => {
      writes.push(input);
    },
  };
  let proposal: unknown;
  const optimization = {
    ...mutation,
    get data() {
      return proposal;
    },
    mutateAsync: async () => {
      proposal = {
        order: [a.placeId, c.placeId, d.placeId, b.placeId],
        originalOrder: scheduledStops.map((stop) => stop.placeId),
        visitedOrder: [a.placeId, c.placeId],
        distanceMeters: 2000,
        durationSeconds: 1200,
        originalDistanceMeters: 18000,
        originalDurationSeconds: 7200,
      };
      return proposal;
    },
  };
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const mocks: Record<string, unknown> = {
    react: {
      useState: (initial: unknown) => {
        const i = cursor++;
        if (!(i in slots)) slots[i] = initial;
        return [
          slots[i],
          (value: unknown) => {
            slots[i] = typeof value === "function" ? value(slots[i]) : value;
          },
        ];
      },
      useRef: (initial: unknown) => {
        const i = cursor++;
        return (slots[i] ??= { current: initial });
      },
      useMemo: (fn: () => unknown) => fn(),
      useEffect(effect: () => void) {
        effects.push(effect);
      },
    },
    "react/jsx-runtime": {
      jsx: (type: unknown, props: Record<string, unknown>) => typeof type === "function" && ["ConnectedTripSchedulePanels"].includes(type.name) ? type(props) : ({ type, props }),
      jsxs: (type: unknown, props: Record<string, unknown>) => typeof type === "function" && ["ConnectedTripSchedulePanels"].includes(type.name) ? type(props) : ({ type, props }),
    },
    "react-native": { View: "View", Modal: "Modal", Linking: {
      openURL: async (url: string) => { directionUrls.push(url); },
    } },
    "react-native-gesture-handler": { Gesture: { Native: () => ({}) }, GestureDetector: "GestureDetector" },
    "react-native-reanimated": {
      __esModule: true,
      default: { FlatList: "FlatList" },
      useSharedValue: () => ({ get: () => 0, set() {} }),
    },
    "expo-router": {
      router: { canGoBack: () => true, back() {}, push() {}, replace() {} },
    },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-screen-insets": {
      useScreenInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }),
    },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/common/screen-safe-area": {
      ScreenSafeArea: "ScreenSafeArea",
    },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/features/home/components/home-primitives": { TextAction: "TextAction" },
    "../api/trip-queries": {
      useTripQuery: () => ({
        data: read,
        refetch: async () => ({ data: read }),
      }),
    },
    "../api/trip-hooks": {
      useTripPlacesQuery: () => ({
        data: ready ? [] : undefined,
        isError: false,
        refetch: async () => ({ isError: false }),
      }),
      useAddTripPlacesMutation: () => mutation,
      useUpdateTripPlaceMutation: () => mutation,
    },
    "../api/itinerary-hooks": {
      useTripItineraryQuery: () => ({ data: itinerary }),
      useSaveItineraryDayMutation: () => mutation,
      useUpdateDayScheduleMutation: () => mutation,
    },
    "../api/trip-adapters": {
      toTrip: () => trip,
      toDayStops: (base: typeof itinerary, day: string) =>
        base.days
          .find((d) => d.date === day)
          ?.stops.map(
            ({ placeId, sequence, arrivalTime, durationMinutes, note }) => ({
              placeId,
              sequence,
              arrivalTime,
              durationMinutes,
              note,
            }),
          ) ?? [],
    },
    "../api/trip-day-route": {
      useTripDayRoute: () =>
        routeReady
          ? {
              data: {
                status: "READY",
                placeIds: [a.placeId, b.placeId],
                route: {
                  distanceMeters: 1000,
                  durationSeconds: 600,
                  encodedPolyline: "line",
                  legs: [{ distanceMeters: 1000, durationSeconds: 600 }],
                },
              },
            }
          : {},
      useOptimizeDayRoute: () => optimization,
    },
    "../hooks/use-connected-timeline-actions": {
      useConnectedTimelineActions: (props: { stops: TripStop[] }) => ({
        stops: props.stops,
        pending: false,
        clear() {},
        begin() {},
        end() {},
      }),
    },
    "../hooks/use-trip-timeline-drag": {
      useTripTimelineDrag: () => ({ draggedId: null }),
    },
    "../hooks/use-trip-timeline-scroll": {
      useTripTimelineScroll: () => ({
        list: { current: null },
        jump() {},
        onScrollToIndexFailed() {},
      }),
    },
    "../hooks/use-planning-map-collapse": {
      usePlanningMapCollapse: () => ({
        hidden: false,
        show: () => {
          shows++;
        },
        onScroll() {},
        onScrollEndDrag() {},
      }),
    },
    "../hooks/use-trip-pull-refresh": { useTripPullRefresh: () => ({}) },
    "../utils/trip-mapbox": {
      tripMapPins: (stops: TripStop[]) =>
        stops
          .filter((s) => s.location)
          .map((s) => ({ id: s.id, ...s.location })),
    },
  };
  for (const [path, names] of Object.entries({
    "../components/backlog-schedule-sheet": ["BacklogScheduleSheet"],
    "../components/trip-details-overview": ["TripDayTools"],
    "./connected-place-picker-screen": ["ConnectedPlacePickerScreen"],
    "../components/connected-stop-schedule-sheet": [
      "ConnectedStopScheduleSheet",
    ],
    "../components/trip-stop-row": ["TripStopRow"],
    "../components/trip-backlog-row": ["TripBacklogRow"],
    "../components/trip-details-sheet": ["TripDetailsSheet"],
    "../components/trip-reorder": ["TripReorder"],
    "../components/trip-details-header": [
      "TripDetailsHeader",
      "DetailIconButton",
    ],
    "../components/trip-planning-map": ["TripPlanningMap"],
    "../components/trip-day-map": ["TripDayMap"],
    "../components/trip-details-actions": ["TripDetailsActions"],
    "../components/connected-trip-recap": ["ConnectedTripRecap"],
    "../components/trip-recap-card": ["TripRecapCard"],
    "../components/trip-timeline-states": ["TripTimelineTail", "TripStartNode"],
    "../components/connected-day-schedule-sheet": ["ConnectedDayScheduleSheet"],
    "../components/trip-optimization-preview": ["TripOptimizationSheet"],
    "../components/trip-undo-notice": ["TripUndoNotice"],
    "../components/trip-planning-day-selector": ["TripPlanningDaySelector"],
    "../components/connected-trip-actions": ["ConnectedTripActions"],
    "../components/trip-completion-action": ["TripCompletionAction"],
  }))
    mocks[path] = Object.fromEntries(names.map((name) => [name, name]));
  const load = tripModuleLoader(mocks);
  const { ConnectedTripDetailsScreen } = load<
    typeof import("../src/features/trip/screens/connected-trip-details-screen.tsx")
  >("src/features/trip/screens/connected-trip-details-screen.tsx");
  function render() {
    cursor = 0;
    effects = [];
    const tree = ConnectedTripDetailsScreen({ tripId: "trip" });
    effects.forEach((effect) => effect());
    return tree;
  }
  function rows() {
    const tree = render();
    const list = nodes(tree, "FlatList")[0];
    const rendered = (list.props.data as unknown[]).map((item) =>
      (list.props.renderItem as (props: unknown) => Node)({ item }),
    );
    return { tree, rendered };
  }
  return {
    render,
    rows,
    writes,
    directionUrls,
    trip,
    a,
    b,
    c,
    d,
    pool,
    routeIsReady: () => {
      routeReady = true;
    },
    get shows() {
      return shows;
    },
    notReady: () => {
      ready = false;
    },
  };
}

test("planning shares the daily toolbar and opens day editing without duplicate footer controls", () => {
  const f = fixture(false, false, false, true);
  f.routeIsReady();
  const { tree, rendered } = f.rows();
  const tools = nodes(rendered, "TripDayTools")[0];
  assert.equal(tools.props.compactLayout, true);
  assert.equal(tools.props.canEdit, true);
  assert.equal(nodes(tree, "TripDetailsActions").length, 0);
  (tools.props.onEditDay as () => void)();
  assert.equal(nodes(f.render(), "ConnectedDayScheduleSheet").length, 1);
});

test("completed details reuse the map and dates with API counts, daily memories and a read-only timeline", () => {
  const f = fixture(false, false, true);
  const { tree, rendered } = f.rows();
  assert.equal(nodes(tree, "TripPlanningMap")[0].props.overlayHeader, true);
  const recap = nodes(rendered, "TripRecapCard")[0];
  assert.equal(recap.props.memoryCount, 7);
  assert.equal(recap.props.stopCount, 2);
  const journal = nodes(rendered, "ConnectedTripRecap")[0];
  assert.equal(journal.props.tripId, "trip");
  assert.equal(journal.props.date, date);
  assert.equal(journal.props.destination, "Đà Lạt");
  assert.equal(nodes(rendered, "TripDayTools").length, 0);
  assert.equal(nodes(tree, "TripTimelineTail").length, 0);
  const stops = nodes(rendered, "TripStopRow");
  assert.equal(stops.length, 2);
  for (const stop of stops) {
    assert.equal(stop.props.onVisited, undefined);
    assert.equal(stop.props.drag, undefined);
    assert.equal(stop.props.onRemove, undefined);
  }
  assert.equal(nodes(tree, "TripDetailsActions")[0].props.mode, "recap");
});

test("live detail can optimize B/D from C without a full historical route and applies the visited snapshot", async () => {
  const f = fixture(false, true);
  let view = f.rows();
  const tools = nodes(view.rendered, "TripDayTools")[0];
  assert.equal(tools.props.showOptimize, true);
  (tools.props.onSheetChange as (sheet: { kind: string }) => void)({
    kind: "optimize",
  });
  await flush();
  view = f.rows();
  const sheet = nodes(view.tree, "TripOptimizationSheet")[0];
  assert.ok(sheet);
  const proposal = sheet.props.proposal as {
    order: string[];
    lockedPrefixIds: string[];
    comparison: { before: { km: number }; after: { km: number } };
  };
  assert.deepEqual(Array.from(proposal.lockedPrefixIds), [f.a.id, f.c.id]);
  assert.equal(proposal.comparison.before.km, 18);
  assert.equal(proposal.comparison.after.km, 2);
  (sheet.props.onApply as (ids: string[]) => void)([
    f.a.id,
    f.c.id,
    f.d.id,
    f.b.id,
  ]);
  await flush();
  const saved = f.writes[0] as {
    request: {
      expectedVisitedPlaceIds: string[];
      stops: { placeId: string }[];
    };
  };
  assert.deepEqual(Array.from(saved.request.expectedVisitedPlaceIds), [
    f.a.placeId,
    f.c.placeId,
  ]);
  assert.deepEqual(
    Array.from(saved.request.stops, (stop) => stop.placeId),
    [f.a.placeId, f.c.placeId, f.d.placeId, f.b.placeId],
  );
  assert.equal(nodes(f.render(), "TripOptimizationSheet").length, 0);
});

test("a legacy day with only its first arrival is completed once when route data becomes ready", async () => {
  const f = fixture(true);
  f.render();
  assert.equal(f.writes.length, 0);
  f.routeIsReady();
  f.render();
  await flush();
  assert.equal(f.writes.length, 1);
  const saved = f.writes[0] as {
    date: string;
    request: {
      expectedTripVersion: number;
      settings: { origin: unknown; departureTime: string };
      durations: { minutes: number }[];
    };
  };
  assert.equal(saved.date, date);
  assert.equal(saved.request.settings.origin, null);
  assert.equal(saved.request.settings.departureTime, "08:00");
  assert.equal(saved.request.expectedTripVersion, 3);
  assert.ok(
    saved.request.durations.every((duration) => duration.minutes === 45),
  );
  f.render();
  await flush();
  assert.equal(f.writes.length, 1);
});

test("live detail reuses the map/date/timeline layout, highlights the next stop and persists Place UUID on check", async () => {
  const f = fixture();
  const { tree, rendered } = f.rows();
  assert.equal(nodes(tree, "TripPlanningMap").length, 1);
  const map = nodes(tree, "TripDayMap")[0];
  assert.equal(map.props.focusedId, f.b.id);
  const row = nodes(rendered, "TripStopRow").find(
    (node) => (node.props.stop as TripStop).id === f.b.id,
  );
  assert.ok(row);
  (row.props.onVisited as () => void)();
  await flush();
  assert.equal(
    JSON.stringify(f.writes),
    JSON.stringify([{ placeId: f.b.placeId, request: { visited: true } }]),
  );
  const actions = nodes(f.render(), "TripDetailsActions")[0];
  (actions.props.onDirections as () => void)();
  assert.equal(f.shows, 0);
  const route = new URL(f.directionUrls[0]);
  assert.equal(route.searchParams.get("destination"), "11.94,108.44");
  assert.equal(route.searchParams.get("origin"), null, "Maps uses current GPS rather than a saved trip origin");
  assert.equal(route.searchParams.get("dir_action"), "navigate");
  assert.equal(nodes(rendered, "NextStopCard").length, 0);
});

test("backlog is selectable after date changes and can save a recovered place into a valid day", async () => {
  const f = fixture();
  let { rendered } = f.rows();
  const selector = nodes(rendered, "TripPlanningDaySelector")[0];
  assert.equal(selector.props.backlogCount, 1);
  (selector.props.onSelect as (date: null) => void)(null);
  ({ rendered } = f.rows());
  const pool = nodes(rendered, "TripBacklogRow")[0];
  assert.ok(pool);
  assert.equal(nodes(f.render(), "TripDetailsActions").length, 0);
  (pool.props.onPress as () => void)();
  const sheet = nodes(f.render(), "ConnectedStopScheduleSheet")[0];
  assert.ok(sheet);
  await (sheet.props.onSave as (draft: unknown) => Promise<void>)({
    date,
    time: "11:00",
    duration: "60",
    note: "Keep this",
  });
  const saved = f.writes[0] as {
    date: string;
    request: {
      expectedTripVersion: number;
      stops: { placeId: string; durationMinutes: number }[];
    };
  };
  assert.equal(saved.date, date);
  assert.equal(saved.request.expectedTripVersion, 3);
  assert.equal(saved.request.stops.length, 3);
  assert.equal(saved.request.stops[2].placeId, f.pool.placeId);
  assert.equal(saved.request.stops[2].durationMinutes, 60);
});

test("live actions cannot mutate or navigate an incomplete itinerary", () => {
  const f = fixture();
  f.notReady();
  const { tree, rendered } = f.rows();
  const actions = nodes(tree, "TripDetailsActions")[0];
  assert.equal(actions.props.nextStop, undefined);
  assert.equal(actions.props.canDirect, false);
  assert.ok(
    nodes(rendered, "TripStopRow").every(
      (row) => row.props.onVisited === undefined,
    ),
  );
});
