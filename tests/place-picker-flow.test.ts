import assert from "node:assert/strict";
import { test } from "node:test";
import type { Trip, TripStop } from "../src/features/home/types/home-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Element = { type: string; props: Record<string, unknown> };
const date = "2026-11-20";
const remote = [0, 1].map((index) => ({ providerPlaceId: `provider-${index}`, name: `Place ${index}`,
  latitude: 16 + index, longitude: 108, address: "Street", category: null }));
const initialTrip: Trip = { id: "trip", destination: "Đà Nẵng", status: "draft",
  days: [{ date, stops: [] }, { date: "2026-11-21", stops: [] }], unscheduledStops: [] };

function picker() {
  const slots: unknown[] = [];
  let cursor = 0;
  let deferred: string | undefined;
  let customName = "";
  let generatedId = 0;
  let hardwareBack = () => false;
  const alerts: { onPress?: () => void }[][] = [];
  let closed = 0;
  const applied: { stops: TripStop[]; date: string | null }[] = [];
  const props = { destination: initialTrip.destination, trip: structuredClone(initialTrip), initialDate: date,
    initialSelected: [] as TripStop[], onClose: () => { closed++; },
    onApply: async (stops: TripStop[], target: string | null): Promise<boolean> => {
      applied.push({ stops, date: target }); return true;
    } };
  function state<T>(initial: T | (() => T)) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === "function" ? (initial as () => T)() : initial;
    return [slots[index], (value: T | ((before: T) => T)) => {
      slots[index] = typeof value === "function" ? (value as (before: T) => T)(slots[index] as T) : value;
    }];
  }
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>("src/theme/tokens.ts");
  const load = tripModuleLoader({
    react: { useState: state, useRef: (initial: unknown) => state(() => ({ current: initial }))[0],
      useMemo: (get: () => unknown) => get(), useCallback: (callback: unknown) => callback,
      useEffect: (callback: () => void) => { callback(); } },
    "react/jsx-runtime": { jsx: (type: string, elementProps: Record<string, unknown>) => ({ type, props: elementProps }),
      jsxs: (type: string, elementProps: Record<string, unknown>) => ({ type, props: elementProps }) },
    "react-native": { FlatList: "FlatList", View: "View", Pressable: "Pressable", ScrollView: "ScrollView",
      KeyboardAvoidingView: "KeyboardAvoidingView", Keyboard: { dismiss() {} },
      BackHandler: { addEventListener: (_event: string, callback: () => boolean) => { hardwareBack = callback; return { remove() {} }; } },
      Alert: { alert: (_title: string, _message: string, buttons: { onPress?: () => void }[]) => alerts.push(buttons) },
      StyleSheet: { create: (styles: unknown) => styles, hairlineWidth: 1 }, Platform: { OS: "android" } },
    "react-native-gesture-handler": { GestureHandlerRootView: "GestureHandlerRootView" },
    "react-hook-form": { Controller: "Controller", useForm: () => ({ control: {}, reset: (value: { name: string }) => { customName = value.name; },
      handleSubmit: (callback: (value: { name: string }) => void) => () => {
        if (customName.trim() && customName.trim().length <= 120) callback({ name: customName.trim() });
      } }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "en" }) },
    "@/hooks/use-screen-insets": { useScreenInsets: () => ({ bottom: 0 }) },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: new Proxy({}, { get: () => "#123456" }) }) },
    "@/utils/create-request-id": { createRequestId: () => `id-${++generatedId}` },
    "../api/maps-hooks": { useDebouncedValue: (query: string) => deferred ?? query,
      usePlaceSearchQuery: () => ({ data: remote, isFetching: false, isError: false }) },
    "@/components/ui/app-text": { AppText: "AppText" }, "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-input": { AppInput: "AppInput" }, "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/components/common/glass-backdrop": { GlassBackdrop: "GlassBackdrop" },
    "@/components/common/screen-safe-area": { ScreenSafeArea: "ScreenSafeArea" },
    "../components/trip-details-header": { DetailIconButton: "DetailIconButton" },
    "../components/place-details-content": { PlaceDetailsContent: "PlaceDetailsContent" },
    "../components/place-search-map": { PlaceSearchMap: "PlaceSearchMap" },
    "../components/place-picker-list-items": { PlaceSearchResultRow: "PlaceSearchResultRow", PlaceTargetSelector: "PlaceTargetSelector" },
  });
  const { PlacePickerScreen } = load<typeof import("../src/features/trip/screens/place-picker-screen.tsx")>("src/features/trip/screens/place-picker-screen.tsx");
  function render() {
    cursor = 0;
    const tree = PlacePickerScreen(props);
    const elements: Element[] = [];
    function visit(value: unknown) {
      if (Array.isArray(value)) { value.forEach(visit); return; }
      if (!value || typeof value !== "object" || !("props" in value)) return;
      const element = value as Element;
      elements.push(element);
      visit(element.props.children); visit(element.props.ListHeaderComponent);
      if (Array.isArray(element.props.data) && element.props.data.length === 0) visit(element.props.ListEmptyComponent);
    }
    visit(tree);
    return elements;
  }
  function find(type: string) { const element = render().find((entry) => entry.type === type); assert.ok(element, type); return element; }
  function press(label: string) {
    const element = render().find((entry) => entry.props.children === label || entry.props.label === label || entry.props.accessibilityLabel === label);
    assert.ok(element, label);
    return (element.props.onPress as () => void | Promise<void>)();
  }
  function list() { return find("FlatList").props as { data: TripStop[]; renderItem: (input: { item: TripStop }) => Element }; }
  function toggle(stop: TripStop) { (list().renderItem({ item: stop }).props.onToggle as () => void)(); }
  function search(value: string) { (find("AppInput").props.onChangeText as (value: string) => void)(value); }
  return { props, render, find, press, list, toggle, search, applied, alerts, get closed() { return closed; },
    back: () => hardwareBack(), defer: (value: string) => { deferred = value; },
    name: (value: string) => { customName = value; } };
}

test("picker keeps selected places and query when returning from details; leaving requires confirmation", async () => {
  const ui = picker();
  ui.search("Place");
  const place = ui.list().data[0];
  ui.toggle(place);
  (ui.list().renderItem({ item: place }).props.onPreview as () => void)();
  assert.equal((ui.find("PlaceDetailsContent").props.place as TripStop).id, place.id);
  (ui.find("PlaceDetailsContent").props.onBack as () => void)();
  assert.equal(ui.find("AppInput").props.value, "Place");
  assert.equal(ui.list().renderItem({ item: place }).props.checked, true);
  ui.back();
  assert.equal(ui.closed, 0);
  assert.equal(ui.alerts.length, 1);
  ui.alerts[0][1].onPress?.();
  assert.equal(ui.closed, 1);
  assert.equal(ui.applied.length, 0);
});

test("partial save keeps complete selection after refetch, marks saved points and permits retry", async () => {
  const ui = picker();
  ui.search("Place");
  const selected = ui.list().data;
  selected.forEach(ui.toggle);
  ui.props.onApply = async () => { throw new Error("offline"); };
  await (ui.find("AppButton").props.onPress as () => Promise<void>)();
  ui.props.trip.unscheduledStops = [{ ...selected[0], id: "server-id" }];
  assert.ok(ui.render().some((element) => element.props.accessibilityRole === "alert"));
  await ui.press("View selected places");
  assert.equal(ui.list().data.length, 2);
  assert.equal(ui.list().renderItem({ item: selected[0] }).props.alreadyAdded, true);
  ui.props.onApply = async (stops, target) => { ui.applied.push({ stops, date: target }); return true; };
  await (ui.find("AppButton").props.onPress as () => Promise<void>)();
  assert.equal(ui.applied[0].stops.length, 2);
  assert.equal(ui.applied[0].date, date);
});

test("stale search results cannot be selected and existing provider/coordinate matches are hidden across days", () => {
  const ui = picker();
  ui.search("Place");
  const [first, second] = ui.list().data;
  ui.defer("Place");
  ui.search("New query");
  assert.equal(ui.list().data.length, 0);
  ui.search("Place");
  ui.props.trip.days[1].stops = [{ ...first, id: "internal-id" }];
  ui.props.trip.unscheduledStops = [{ ...second, providerPlaceId: undefined, id: "custom-id" }];
  assert.equal(ui.list().data.length, 0);
  (ui.find("PlaceTargetSelector").props.onChange as (date: string | null) => void)(null);
  assert.equal(ui.list().data.length, 0);
});

test("rapid apply, selection changes and Android Back cannot interrupt an active save", async () => {
  const ui = picker();
  ui.search("Place");
  const place = ui.list().data[0];
  ui.toggle(place);
  let release = () => {};
  let saves = 0;
  ui.props.onApply = async () => { saves++; await new Promise<void>((resolve) => { release = resolve; }); return true; };
  const apply = ui.find("AppButton").props.onPress as () => Promise<void>;
  const pending = apply();
  await apply();
  ui.toggle(place);
  ui.search("Changed");
  ui.back();
  assert.equal(saves, 1);
  assert.equal(ui.closed, 0);
  assert.equal(ui.alerts.length, 0);
  assert.equal(ui.find("AppInput").props.value, "Place");
  assert.equal(ui.list().renderItem({ item: place }).props.checked, true);
  release();
  await pending;
});

test("a removed target day is explicit and selection can be saved to the pool instead", async () => {
  const ui = picker();
  ui.search("Place");
  ui.toggle(ui.list().data[0]);
  ui.props.trip.days = [];
  assert.equal(ui.find("AppButton").props.disabled, true);
  assert.ok(ui.render().some((element) => element.props.accessibilityRole === "alert"));
  (ui.find("PlaceTargetSelector").props.onChange as (date: string | null) => void)(null);
  await (ui.find("AppButton").props.onPress as () => Promise<void>)();
  assert.equal(ui.applied[0].date, null);
});

test("custom pins need a name and keep unique IDs after removing an earlier selection", async () => {
  const ui = picker();
  async function custom(name: string, latitude: number) {
    await ui.press("Choose a location on the map");
    (ui.find("PlaceSearchMap").props.onMove as (point: { latitude: number; longitude: number }) => void)({ latitude, longitude: 108 });
    ui.name(name);
    await ui.press("Choose this place");
  }
  await custom("", 16);
  assert.ok(ui.find("PlaceSearchMap"));
  ui.name("First"); await ui.press("Choose this place");
  await custom("Second", 17);
  await ui.press("View selected places");
  ui.toggle(ui.list().data[0]);
  await ui.press("All places");
  await custom("Third", 18);
  await ui.press("View selected places");
  const selected = ui.list().data;
  assert.deepEqual(Array.from(selected, (place) => place.name.vi), ["Second", "Third"]);
  assert.equal(new Set(selected.map((place) => place.id)).size, 2);
});

function routeHarness() {
  let completed = false;
  let effect = () => {};
  let blocked = false;
  let navigations = 0;
  let invalidations = 0;
  let save: () => Promise<void> = async () => {};
  const query = { data: {}, isPending: false, isError: false };
  const mutation = { isPending: false, mutateAsync: async (_input: unknown) => {} };
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>("src/theme/tokens.ts");
  const load = tripModuleLoader({
    react: { useState: () => [completed, (value: boolean) => { completed = value; }],
      useEffect: (callback: () => void) => { effect = callback; } },
    "react/jsx-runtime": { jsx: (type: string, props: Record<string, unknown>, key: unknown) => ({ type, props, key }) },
    "expo-router": { router: { canGoBack: () => true, back: () => { assert.equal(blocked, false); navigations++; } } },
    "expo-router/react-navigation": { usePreventRemove: (value: boolean) => { blocked = value; } },
    "react-native": { ActivityIndicator: "ActivityIndicator", View: "View" },
    "@/components/common/screen-safe-area": { ScreenSafeArea: "ScreenSafeArea" },
    "@/components/ui/app-text": { AppText: "AppText" }, "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "en" }) },
    "../api/trip-hooks": { useTripQuery: () => query, useTripPlacesQuery: () => query },
    "../api/itinerary-hooks": { useTripItineraryQuery: () => query },
    "../api/trip-adapters": { toTrip: () => initialTrip },
    "./place-picker-screen": { PlacePickerScreen: "PlacePickerScreen" },
    "../api/add-trip-places": { addTripPlaces: async () => { await save(); } },
    "@tanstack/react-query": {
      useQueryClient: () => ({ invalidateQueries: async () => { invalidations++; } }),
      useMutation: (options: { retry: boolean; networkMode: string; mutationFn: (input: unknown) => Promise<void>; onSettled: () => Promise<void> }) => {
        assert.equal(options.retry, false); assert.equal(options.networkMode, "always");
        mutation.mutateAsync = async (input) => {
          mutation.isPending = true;
          try { await options.mutationFn(input); }
          finally { await options.onSettled(); mutation.isPending = false; }
        };
        return mutation;
      },
    },
  });
  const { TripPlacePickerScreen } = load<typeof import("../src/features/trip/screens/trip-place-picker-screen.tsx")>("src/features/trip/screens/trip-place-picker-screen.tsx");
  return { render: () => { const result = TripPlacePickerScreen({ tripId: "trip", date }) as Element; effect(); return result; },
    query, setSave: (callback: () => Promise<void>) => { save = callback; },
    get blocked() { return blocked; }, get navigations() { return navigations; }, get invalidations() { return invalidations; } };
}

test("route blocks removal while saving and navigates only after the mutation and cache refresh settle", async () => {
  const ui = routeHarness();
  let release = () => {};
  ui.setSave(() => new Promise<void>((resolve) => { release = resolve; }));
  const tree = ui.render();
  const pending = (tree.props.onApply as (stops: TripStop[], date: string | null) => Promise<boolean>)([], date);
  ui.render();
  assert.equal(ui.blocked, true);
  assert.equal(ui.navigations, 0);
  release(); await pending;
  assert.equal(ui.invalidations, 1);
  assert.equal(ui.navigations, 0);
  ui.render();
  assert.equal(ui.blocked, false);
  assert.equal(ui.navigations, 1);
});

test("a failed save refreshes cache while background query errors retain the mounted selection screen", async () => {
  const ui = routeHarness();
  const tree = ui.render();
  ui.setSave(async () => { throw new Error("offline"); });
  await assert.rejects((tree.props.onApply as (stops: TripStop[], date: string | null) => Promise<boolean>)([], date), /offline/);
  ui.query.isError = true;
  const retry = ui.render();
  assert.equal(retry.type, "PlacePickerScreen");
  assert.equal(ui.invalidations, 1);
  assert.equal(ui.navigations, 0);
});
