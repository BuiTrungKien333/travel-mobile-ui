import assert from "node:assert/strict";
import { test } from "node:test";
import type { TripMutation } from "../src/features/trip/types/trip-details-types.ts";
import type { TripStop } from "../src/features/home/types/home-types.ts";
import { loadHomePreview } from "./helpers/load-home-preview.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Node = { type: unknown; props: Record<string, unknown> };
function node(value: unknown): Node {
  assert.ok(value && typeof value === "object" && "props" in value);
  return value as Node;
}
function nodes(value: unknown, type: string): Node[] {
  if (Array.isArray(value)) return value.flatMap((item) => nodes(item, type));
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const item = node(value);
  return [
    ...(item.type === type ? [item] : []),
    ...nodes(item.props.children, type),
  ];
}
function call(value: unknown, ...args: unknown[]) {
  assert.equal(typeof value, "function");
  if (typeof value === "function") return value(...args);
}

function harness(scenario: "ongoing" | "upcoming" = "ongoing") {
  const store = loadHomePreview().createPreviewStore();
  store.getState().changeScenario(scenario);
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const states: unknown[] = [];
  let cursor = 0;
  let backs = 0;
  const load = tripModuleLoader({
    react: {
      useState: (initial: unknown) => {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [
          states[index],
          (next: unknown) => {
            states[index] =
              typeof next === "function" ? next(states[index]) : next;
          },
        ];
      },
    },
    "react/jsx-runtime": {
      jsx: (type: unknown, props: Record<string, unknown>) => ({ type, props }),
      jsxs: (type: unknown, props: Record<string, unknown>) => ({
        type,
        props,
      }),
    },
    "expo-router": {
      router: {
        canGoBack: () => true,
        back: () => {
          backs++;
        },
      },
    },
    "react-native": {
      View: "View",
      KeyboardAvoidingView: "KeyboardAvoidingView",
      Platform: { OS: "android" },
      StyleSheet: { create: (value: unknown) => value, hairlineWidth: 1 },
    },
    "react-native-gesture-handler": {
      GestureHandlerRootView: "GestureHandlerRootView",
    },
    "@/features/home/providers/trip-preview-provider": {
      useTripPreview: (
        selector: (state: ReturnType<typeof store.getState>) => unknown,
      ) => selector(store.getState()),
    },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-screen-insets": { useScreenInsets: () => ({ bottom: 24 }) },
    "@/components/common/screen-safe-area": {
      ScreenSafeArea: "ScreenSafeArea",
    },
    "@/components/common/glass-backdrop": { GlassBackdrop: "GlassBackdrop" },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "../components/place-details-content": {
      PlaceDetailsContent: "PlaceDetailsContent",
    },
    "../components/trip-details-forms": { StopDetailsForm: "StopDetailsForm" },
    "../components/trip-delete-alert": { TripDeleteAlert: "TripDeleteAlert" },
    "../components/trip-details-sheet": {
      TripDetailsSheet: "TripDetailsSheet",
    },
    "../components/trip-visit-card": { TripVisitCard: "TripVisitCard" },
    "../components/place-details-editorial": {
      PlaceAmenities: "PlaceAmenities",
      PlaceClassification: "PlaceClassification",
      PlaceIntroduction: "PlaceIntroduction",
    },
  });
  const { TripStopDetailsScreen } = load<
    typeof import("../src/features/trip/screens/trip-stop-details-screen.tsx")
  >("src/features/trip/screens/trip-stop-details-screen.tsx");
  const day = scenario === "ongoing" ? store.getState().today : "2026-10-24";
  const props = {
    tripId: scenario === "ongoing" ? "dalat-ongoing" : "dalat",
    day,
    stopId: "square",
  };
  function render(input = props) {
    cursor = 0;
    const root = node(TripStopDetailsScreen(input));
    return typeof root.type === "function" ? node(root.type(root.props)) : root;
  }
  return { store, render, props, backs: () => backs };
}

test("timeline place details expands its own map and toggles the shared visit state", () => {
  const h = harness();
  let tree = h.render();
  const content = nodes(tree, "PlaceDetailsContent")[0];
  const place = content.props.place as TripStop;
  assert.ok(place.address?.vi.includes("Đà Lạt"));
  assert.ok(place.location);
  const actions = nodes(tree, "AppButton");
  call(actions[0].props.onPress);
  tree = h.render();
  assert.equal(nodes(tree, "PlaceDetailsContent")[0].props.expandMapRequest, 1);
  call(nodes(tree, "AppButton")[1].props.onPress);
  assert.ok(
    h.store
      .getState()
      .visited[`${h.props.tripId}:${h.props.day}`].includes("square"),
  );
  tree = h.render();
  assert.equal(
    (
      nodes(tree, "AppButton")[1].props.accessibilityState as {
        selected: boolean;
      }
    ).selected,
    true,
  );
  call(nodes(tree, "AppButton")[1].props.onPress);
  assert.equal(
    h.store
      .getState()
      .visited[`${h.props.tripId}:${h.props.day}`].includes("square"),
    false,
  );
  assert.equal(h.backs(), 0);
});

test("editing opens a separate modal and saving refreshes the visit card without leaving the place", () => {
  const h = harness();
  let tree = h.render();
  assert.equal(nodes(tree, "StopDetailsForm").length, 0);
  call(nodes(tree, "TripVisitCard")[0].props.onEdit);
  tree = h.render();
  assert.equal(nodes(tree, "TripDetailsSheet").length, 1);
  const mutation: TripMutation = {
    kind: "stop",
    date: h.props.day,
    stopId: "square",
    targetDate: h.props.day,
    values: {
      time: "12:15",
      durationMinutes: 60,
      pinned: true,
      note: "Mang theo nước",
    },
  };
  assert.equal(
    call(nodes(tree, "StopDetailsForm")[0].props.onCommit, mutation),
    true,
  );
  const stop = h.store
    .getState()
    .trips.find((trip) => trip.id === h.props.tripId)
    ?.days.find((day) => day.date === h.props.day)
    ?.stops.find((entry) => entry.id === "square");
  assert.equal(stop?.time, "12:15");
  assert.equal(stop?.note, "Mang theo nước");
  assert.equal(stop?.durationMinutes, 60);
  assert.equal(stop?.pinned, true);
  tree = h.render();
  assert.equal(nodes(tree, "TripDetailsSheet").length, 0);
  assert.equal(
    (nodes(tree, "TripVisitCard")[0].props.stop as TripStop).time,
    "12:15",
  );
  assert.equal(h.backs(), 0);
});

test("removing a scheduled stop requires confirmation and keeps it in the unscheduled pool", () => {
  const h = harness();
  let tree = h.render();
  call(nodes(tree, "TripVisitCard")[0].props.onRemove);
  tree = h.render();
  call(nodes(tree, "TripDeleteAlert")[0].props.onCancel);
  tree = h.render();
  assert.equal(nodes(tree, "TripDeleteAlert").length, 0);
  assert.equal(h.backs(), 0);
  call(nodes(tree, "TripVisitCard")[0].props.onRemove);
  tree = h.render();
  call(nodes(tree, "TripDeleteAlert")[0].props.onConfirm);
  const trip = h.store
    .getState()
    .trips.find((entry) => entry.id === h.props.tripId);
  assert.equal(
    trip?.days
      .find((entry) => entry.date === h.props.day)
      ?.stops.some((entry) => entry.id === "square"),
    false,
  );
  assert.ok(trip?.unscheduledStops?.some((entry) => entry.id === "square"));
  assert.equal(h.backs(), 1);
});

test("pinning updates the itinerary immediately; closing the edit modal leaves saved fields unchanged", () => {
  const h = harness();
  let tree = h.render();
  call(nodes(tree, "TripVisitCard")[0].props.onPin, true);
  tree = h.render();
  assert.equal(
    (nodes(tree, "TripVisitCard")[0].props.stop as TripStop).pinned,
    true,
  );
  call(nodes(tree, "TripVisitCard")[0].props.onEdit);
  tree = h.render();
  call(nodes(tree, "TripDetailsSheet")[0].props.onClose);
  tree = h.render();
  assert.equal(nodes(tree, "StopDetailsForm").length, 0);
  const stop = nodes(tree, "TripVisitCard")[0].props.stop as TripStop;
  assert.equal(stop.time, "11:00");
  assert.equal(stop.pinned, true);
  assert.equal(h.backs(), 0);
});

test("future visits are disabled and invalid stop links show a recoverable empty state", () => {
  const h = harness("upcoming");
  const tree = h.render();
  assert.equal(nodes(tree, "AppButton")[1].props.disabled, true);
  call(nodes(tree, "AppButton")[1].props.onPress);
  assert.equal(
    h.store
      .getState()
      .visited[`${h.props.tripId}:${h.props.day}`]?.includes("square") ?? false,
    false,
  );
  const missing = h.render({ ...h.props, stopId: "does-not-exist" });
  assert.equal(nodes(missing, "PlaceDetailsContent").length, 0);
  call(nodes(missing, "AppButton")[0].props.onPress);
  assert.equal(h.backs(), 1);
});
