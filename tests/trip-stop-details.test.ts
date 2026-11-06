import assert from "node:assert/strict";
import { test } from "node:test";
import type { Trip, TripStop } from "../src/features/home/types/home-types.ts";
import type { TripMutation } from "../src/features/trip/types/trip-details-types.ts";
import type { SaveItineraryRequest } from "../src/features/trip/api/itinerary-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown, type: string): Node[] {
  if (Array.isArray(value)) return value.flatMap((item) => nodes(item, type));
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const item = value as Node;
  return [...(item.type === type ? [item] : []), ...nodes(item.props.children, type)];
}
function call(value: unknown, ...args: unknown[]) { assert.equal(typeof value, "function"); return (value as (...args: unknown[]) => unknown)(...args); }
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
const id = "40000000-0000-0000-0000-000000000001";
const date = "2026-11-06";
const stamp = "2026-11-06T01:00:00Z";
const calendar = tripModuleLoader()<typeof import("../src/utils/calendar-date.ts")>("src/utils/calendar-date.ts");

function harness(future = false, pool = false) {
  const stop: TripStop = { id, time: "11:00", durationMinutes: 45, note: "Original", pinned: false,
    name: { vi: "Visit", en: "Visit" }, kind: { vi: "Place", en: "Place" }, location: { latitude: 16, longitude: 108 } };
  let current: Trip = { id, destination: "Da Nang", status: "planned", serverVersion: 1, serverItineraryUpdatedAt: stamp,
    startDate: date, endDate: "2026-11-07", days: [{ date, stops: pool ? [] : [stop] }, { date: "2026-11-07", stops: [] }],
    unscheduledStops: pool ? [stop] : [] };
  const slots: unknown[] = [];
  let cursor = 0; let backs = 0; let writes = 0;
  let failure = false; let wait: () => Promise<void> = async () => {};
  const effects: (() => void)[] = [];
  const requests: SaveItineraryRequest[] = [];
  const patches: unknown[] = [];
  const links: string[] = [];
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>("src/theme/tokens.ts");
  function state(initial: unknown) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === "function" ? (initial as () => unknown)() : initial;
    return [slots[index], (value: unknown) => { slots[index] = value; }];
  }
  const load = tripModuleLoader({
    "./use-i18n": { useI18n: () => ({ t: (key: string) => key }) },
    react: { useState: state, useRef: (initial: unknown) => state(() => ({ current: initial }))[0],
      useEffect: (effect: () => void) => effects.push(effect) },
    "react/jsx-runtime": { jsx: (type: unknown, props: Record<string, unknown>) => ({ type, props }),
      jsxs: (type: unknown, props: Record<string, unknown>) => ({ type, props }) },
    "expo-router": { router: { canGoBack: () => true, back: () => { backs++; } } },
    "expo-router/react-navigation": { usePreventRemove() {}, useNavigation: () => ({ dispatch() {} }) },
    "react-native": { View: "View", KeyboardAvoidingView: "KeyboardAvoidingView", Platform: { OS: "android" },
      Linking: { openURL: async (url: string) => { links.push(url); } },
      StyleSheet: { create: (value: unknown) => value, hairlineWidth: 1 } },
    "react-native-gesture-handler": { GestureHandlerRootView: "GestureHandlerRootView" },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-screen-insets": { useScreenInsets: () => ({ top: 0, bottom: 0 }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/utils/calendar-date": { ...calendar, todayCalendarDate: () => future ? "2026-11-05" : date },
    "../api/trip-adapters": { toTrip: () => current,
      toSaveItineraryRequest: (candidate: Trip) => ({ expectedUpdatedAt: candidate.serverItineraryUpdatedAt,
        days: candidate.days.map((day) => ({ date: day.date, stops: day.stops.map((item, index) => ({
          placeId: item.id, sequence: index, arrivalTime: item.time ? `${day.date}T${item.time}:00` : null,
          durationMinutes: item.durationMinutes ?? 45, note: item.note ?? null, pinned: item.pinned ?? false,
        })) })) }) },
    "../api/trip-hooks": {
      useTripQuery: () => ({ data: {}, isPending: false, isError: false }),
      useTripPlacesQuery: () => ({ data: [], isPending: false, isError: false }),
      useUpdateTripPlaceMutation: () => ({ isPending: false, mutateAsync: async (request: { request: { visited: boolean } }) => {
        patches.push(request); await wait();
        current = structuredClone(current);
        [...current.days.flatMap((day) => day.stops), ...(current.unscheduledStops ?? [])].forEach((item) => { item.visited = request.request.visited; });
      } }),
      useDeleteTripPlaceMutation: () => ({ mutateAsync: async () => { await wait(); current = { ...current, unscheduledStops: [] }; } }),
    },
    "../api/itinerary-hooks": {
      useTripItineraryQuery: () => ({ data: {}, isPending: false, isError: false }),
      useSaveItineraryMutation: () => ({ mutateAsync: async (request: SaveItineraryRequest) => {
        requests.push(request); await wait();
        if (failure || request.expectedUpdatedAt !== current.serverItineraryUpdatedAt)
          throw new (load<typeof import("../src/services/api/api-error.ts")>("src/services/api/api-error.ts").ApiError)("TRIP_010", 409);
        const all = [...current.days.flatMap((day) => day.stops), ...(current.unscheduledStops ?? [])];
        const scheduled = new Set(request.days.flatMap((day) => day.stops.map((item) => item.placeId)));
        current = { ...current, serverItineraryUpdatedAt: `2026-11-06T01:01:${String(++writes).padStart(2, "0")}Z`,
          days: request.days.map((day) => ({ date: day.date, stops: day.stops.map((item) => ({
            ...all.find((entry) => entry.id === item.placeId)!, time: item.arrivalTime?.slice(11,16) ?? "",
            durationMinutes: item.durationMinutes, note: item.note ?? undefined, pinned: item.pinned,
          })) })),
          unscheduledStops: all.filter((item) => !scheduled.has(item.id)).map((item) => {
            const update = request.poolUpdates?.find((entry) => entry.placeId === item.id);
            return update ? { ...item, time: "", pinned: false, note: update.note ?? undefined, durationMinutes: update.durationMinutes } : item;
          }),
        };
      } }),
    },
    "@/components/common/screen-safe-area": { ScreenSafeArea: "ScreenSafeArea" },
    "@/components/common/glass-backdrop": { GlassBackdrop: "GlassBackdrop" },
    "@/components/ui/app-text": { AppText: "AppText" }, "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "../components/place-details-content": { PlaceDetailsContent: "PlaceDetailsContent" },
    "../components/trip-details-forms": { StopDetailsForm: "StopDetailsForm" },
    "../components/trip-delete-alert": { TripDeleteAlert: "TripDeleteAlert" },
    "../components/trip-details-sheet": { TripDetailsSheet: "TripDetailsSheet" },
    "../components/trip-visit-card": { TripVisitCard: "TripVisitCard" },
    "../components/share-place-button": { SharePlaceButton: "SharePlaceButton" },
    "../components/place-details-editorial": { PlaceAmenities: "PlaceAmenities", PlaceClassification: "PlaceClassification", PlaceIntroduction: "PlaceIntroduction" },
  });
  const { TripStopDetailsScreen } = load<typeof import("../src/features/trip/screens/trip-stop-details-screen.tsx")>("src/features/trip/screens/trip-stop-details-screen.tsx");
  const props = { tripId: id, stopId: id, day: pool ? undefined : date };
  function render(input = props) {
    cursor = 0; effects.length = 0;
    let tree = TripStopDetailsScreen(input) as Node;
    const children = Array.isArray(tree.props.children) ? tree.props.children as Node[] : [];
    const content = children.find((child) => child && typeof child.type === "function" && child.type.name === "StopDetailsContent");
    if (content) tree = content;
    if (typeof tree.type === "function") tree = tree.type(tree.props) as Node;
    effects.forEach((effect) => effect());
    return tree;
  }
  return { render, props, requests, patches, links, get current() { return current; }, get backs() { return backs; },
    fail: (value: boolean) => { failure = value; } };
}

test("directions open coordinates and a rapid check-in writes once before the shared server state refreshes", async () => {
  const h = harness(); let tree = h.render();
  call(nodes(tree, "AppButton")[0].props.onPress);
  const visit = nodes(tree, "AppButton")[1].props.onPress;
  call(visit); call(visit); await flush();
  assert.equal(h.patches.length, 1); assert.ok(h.links[0].includes("16%2C108"));
  tree = h.render();
  assert.equal((nodes(tree, "AppButton")[1].props.accessibilityState as { selected: boolean }).selected, true);
  assert.equal(h.backs, 0);
});

test("cancel keeps saved fields, a rejected edit keeps the form, and a retry closes it only after success", async () => {
  const h = harness(); let tree = h.render();
  call(nodes(tree, "TripVisitCard")[0].props.onEdit); tree = h.render();
  call(nodes(tree, "TripDetailsSheet")[0].props.onClose); tree = h.render();
  assert.equal(h.requests.length, 0); assert.equal(nodes(tree, "StopDetailsForm").length, 0);
  call(nodes(tree, "TripVisitCard")[0].props.onEdit); tree = h.render();
  const mutation: TripMutation = { kind: "stop", date, stopId: id, targetDate: date, values: { time: "12:15", note: "Edited", durationMinutes: 60 } };
  h.fail(true); call(nodes(tree, "StopDetailsForm")[0].props.onCommit, mutation); await flush();
  tree = h.render(); assert.equal(nodes(tree, "StopDetailsForm").length, 1);
  assert.equal(h.current.days[0].stops[0].note, "Original");
  h.fail(false); call(nodes(tree, "StopDetailsForm")[0].props.onCommit, mutation); await flush();
  tree = h.render(); assert.equal(nodes(tree, "StopDetailsForm").length, 0);
  assert.equal(h.current.days[0].stops[0].time, "12:15"); assert.equal(h.backs, 0);
});

test("moving to another day retains details and displays the saved visit at its new date", async () => {
  const h = harness(); call(nodes(h.render(), "TripVisitCard")[0].props.onEdit);
  call(nodes(h.render(), "StopDetailsForm")[0].props.onCommit, { kind: "stop", date, stopId: id, targetDate: "2026-11-07",
    values: { time: "10:30", note: "Moved", durationMinutes: 60, pinned: false } });
  await flush(); const tree = h.render();
  assert.equal(nodes(tree, "PlaceDetailsContent").length, 1);
  assert.equal(nodes(tree, "TripVisitCard")[0].props.date, "2026-11-07");
  assert.equal(h.current.days.find((day) => day.date === date)?.stops.length ?? 0, 0);
  assert.equal(h.current.days.find((day) => day.date === "2026-11-07")?.stops[0].note, "Moved");
});

test("returning a scheduled visit to the pool uses one atomic itinerary write and navigates after success", async () => {
  const h = harness(); call(nodes(h.render(), "TripVisitCard")[0].props.onRemove);
  call(nodes(h.render(), "TripDeleteAlert")[0].props.onConfirm); await flush(); h.render();
  assert.equal(h.requests.length, 1); assert.equal(h.patches.length, 0);
  assert.equal(h.requests[0].poolUpdates?.[0].note, "Original");
  assert.equal(h.current.unscheduledStops?.[0].id, id); assert.equal(h.backs, 1);
});

test("deleting a pool place still navigates after the refreshed query no longer contains that place", async () => {
  const h = harness(false, true); call(nodes(h.render(), "TripVisitCard")[0].props.onRemove);
  call(nodes(h.render(), "TripDeleteAlert")[0].props.onConfirm); await flush(); h.render();
  assert.equal(h.current.unscheduledStops?.length, 0); assert.equal(h.backs, 1);
});

test("future visits cannot be checked in and invalid stop links have a recoverable Back action", () => {
  const h = harness(true); let tree = h.render();
  assert.equal(nodes(tree, "AppButton")[1].props.disabled, true);
  call(nodes(tree, "AppButton")[1].props.onPress); assert.equal(h.patches.length, 0);
  tree = h.render({ ...h.props, stopId: "missing" });
  assert.equal(nodes(tree, "PlaceDetailsContent").length, 0);
  call(nodes(tree, "AppButton")[0].props.onPress); assert.equal(h.backs, 1);
});
