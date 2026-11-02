import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { loadHomePreview } from "./helpers/load-home-preview.ts";
import type { Trip, TripStop } from "../src/features/home/types/home-types.ts";

type Element = {
  type: string | ((props: any) => Element | null);
  props: Record<string, any>;
};

/** Shallow component harness: actual event handlers/state, platform views and motion replaced. */
function uiHarness() {
  const store = loadHomePreview().createPreviewStore();
  let states: any[] = [];
  let cursor = 0;
  let locale = "en";
  let isOpen = false;
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const theme = { ...tokens, colors: new Proxy({}, { get: () => "#123456" }) };
  const load = tripModuleLoader({
    "@/constants/development": { UI_PREVIEW_ENABLED: true },
    "./connected-trips-screen": { ConnectedTripsScreen: "ConnectedTripsScreen" },
    react: {
      useState: (initial: any) => {
        const index = cursor++;
        if (!(index in states))
          states[index] = typeof initial === "function" ? initial() : initial;
        return [
          states[index],
          (value: any) => {
            states[index] =
              typeof value === "function" ? value(states[index]) : value;
          },
        ];
      },
      useMemo: (get: () => unknown) => get(),
      useDeferredValue: (value: unknown) => value,
    },
    "react-hook-form": {
      Controller: "Controller",
      useForm: () => ({
        control: {},
        reset: () => {},
        handleSubmit: () => () => {},
      }),
    },
    "react/jsx-runtime": {
      jsx: (type: Element["type"], props: Element["props"]) => ({
        type,
        props,
      }),
      jsxs: (type: Element["type"], props: Element["props"]) => ({
        type,
        props,
      }),
    },
    "react-native": {
      Keyboard: { dismiss: () => {} },
      Modal: "Modal",
      View: "View",
      Pressable: "Pressable",
      FlatList: "FlatList",
      ScrollView: "ScrollView",
      KeyboardAvoidingView: "KeyboardAvoidingView",
      TextInput: "TextInput",
      Platform: { OS: "android", select: (options: any) => options.default },
      StyleSheet: {
        create: (style: unknown) => style,
        hairlineWidth: 1,
        absoluteFill: {},
      },
    },
    "react-native-gesture-handler": {
      GestureDetector: "GestureDetector",
      GestureHandlerRootView: "GestureHandlerRootView",
    },
    "react-native-reanimated": {
      default: { View: "Animated.View" },
      __esModule: true,
    },
    "react-native-safe-area-context": {
      useSafeAreaInsets: () => ({ bottom: 24 }),
    },
    "expo-router/js-tabs": { useBottomTabBarHeight: () => 80 },
    "@/hooks/use-app-theme": { useAppTheme: () => theme },
    "@/hooks/use-i18n": { useI18n: () => ({ locale }) },
    "@/features/home/providers/trip-preview-provider": {
      useTripPreview: (select: (state: unknown) => unknown) =>
        select(store.getState()),
    },
    "@/hooks/use-screen-insets": { useScreenInsets: () => ({ bottom: 24 }) },
    "@/components/ui/app-input": { AppInput: "AppInput" },
    "@/components/common/glass-backdrop": { GlassBackdrop: "GlassBackdrop" },
    "../components/trip-details-header": {
      DetailIconButton: "DetailIconButton",
    },
    "../components/place-search-map": { PlaceSearchMap: "PlaceSearchMap" },
    "../components/place-details-content": {
      PlaceDetailsContent: "PlaceDetailsContent",
    },
    "../components/place-picker-list-items": {
      PlaceSearchResultRow: "PlaceSearchResultRow",
      PlaceTargetSelector: "PlaceTargetSelector",
    },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/components/common/screen-safe-area": {
      ScreenSafeArea: "ScreenSafeArea",
    },
    "@/features/home/components/home-header": { HomeHeader: "HomeHeader" },
    "@/features/home/components/home-primitives": {
      PreviewNotice: "PreviewNotice",
    },
    "../components/trip-card": { TripCard: "TripCard" },
    "../hooks/use-picker-sheet-motion": {
      usePickerSheetMotion: (onClose: () => void) => ({
        sheetMotion: {},
        backdropMotion: {},
        dragGesture: {},
        reduceMotion: true,
        close: (apply?: () => void) => {
          apply?.();
          onClose();
        },
      }),
    },
  });
  function render(
    component: (props: any) => Element | null,
    props: any = {},
  ): Element | null {
    const opening = props.visible ?? true;
    if (!opening || !isOpen) states = [];
    isOpen = opening;
    cursor = 0;
    const tree = component(props);
    return tree && typeof tree.type === "function"
      ? tree.type(tree.props)
      : tree;
  }
  return {
    load,
    render,
    store,
    setLocale: (value: string) => {
      locale = value;
    },
  };
}

function nodes(tree: any, type: string): Element[] {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap((child) => nodes(child, type));
  return [
    ...(tree.type === type ? [tree] : []),
    ...nodes(tree.props?.children, type),
  ];
}

test("TripsScreen displays all created trips from its actual store and opens the same mutable trip", () => {
  const harness = uiHarness();
  harness.store.getState().changeScenario("new");
  const { TripsScreen } = harness.load<{ TripsScreen: () => Element }>(
    "src/features/trip/screens/trips-screen.tsx",
  );
  assert.equal(
    nodes(harness.render(TripsScreen), "FlatList")[0].props.data.length,
    0,
  );
  for (let i = 0; i < 6; i++)
    harness.store.getState().createDraft({
      destination: "Đà Lạt",
      startDate: "2026-10-24",
      endDate: "2026-10-25",
    });
  const list = nodes(harness.render(TripsScreen), "FlatList")[0];
  assert.equal(list.props.data, harness.store.getState().trips);
  assert.equal(list.props.data.length, 6);
  const trip = list.props.data[5];
  const card = list.props.renderItem({ item: trip });
  card.props.onPress(trip);
  assert.equal(harness.store.getState().panel?.kind, "plan");
  harness.store.getState().mutateTrip(trip.id, {
    kind: "add",
    date: trip.days[0].date,
    stops: harness
      .load<
        typeof import("../src/features/trip/data/place-bank.ts")
      >("src/features/trip/data/place-bank.ts")
      .getPlacesForDestination("Đà Lạt")
      .slice(0, 1),
  });
  assert.equal(
    harness.store.getState().trips.find((item) => item.id === trip.id)?.days[0]
      .stops.length,
    1,
  );
});

test("place picker keeps draft selection through search and map confirmation, and cancels without committing", () => {
  const harness = uiHarness();
  const { PlacePickerScreen } = harness.load<{
    PlacePickerScreen: (props: {
      destination: string;
      initialSelected: TripStop[];
      onApply: (stops: TripStop[]) => void;
      onClose: () => void;
    }) => Element | null;
  }>("src/features/trip/screens/place-picker-screen.tsx");
  const applied: TripStop[][] = [];
  let closed = 0;
  const props = {
    destination: "Đà Lạt",
    initialSelected: [],
    onApply: (stops: TripStop[]) => {
      applied.push(stops);
    },
    onClose: () => {
      closed++;
    },
  };
  let tree = harness.render(PlacePickerScreen, props);
  assert.equal(nodes(tree, "Modal").length, 0);
  const first = nodes(tree, "FlatList")[0];
  const stop = first.props.data[0];
  first.props.renderItem({ item: stop }).props.onToggle();
  tree = harness.render(PlacePickerScreen, props);
  assert.equal(
    nodes(tree, "FlatList")[0].props.renderItem({ item: stop }).props.checked,
    true,
  );
  nodes(tree, "AppInput")[0].props.onChangeText("quang truong");
  tree = harness.render(PlacePickerScreen, props);
  const results = nodes(tree, "FlatList")[0];
  assert.equal(results.props.data.length, 1);
  const square = results.props.data[0];
  results.props.renderItem({ item: square }).props.onPreview();
  tree = harness.render(PlacePickerScreen, props);
  assert.equal(nodes(tree, "PlaceDetailsContent")[0].props.place.id, "square");
  assert.equal(applied.length, 0);
  nodes(tree, "AppButton")[0].props.onPress();
  tree = harness.render(PlacePickerScreen, props);
  assert.equal(
    nodes(tree, "FlatList")[0].props.renderItem({ item: square }).props.checked,
    true,
  );
  nodes(tree, "DetailIconButton")[0].props.onPress();
  assert.equal(closed, 1);
  assert.equal(applied.length, 0);
  harness.render(PlacePickerScreen, { ...props, visible: false });
  tree = harness.render(PlacePickerScreen, {
    ...props,
    initialSelected: [stop],
  });
  assert.equal(
    nodes(tree, "FlatList")[0].props.renderItem({ item: stop }).props.checked,
    true,
  );
  nodes(tree, "AppButton")[0].props.onPress();
  assert.equal(applied.length, 1);
  assert.equal(applied[0][0].id, stop.id);
  nodes(tree, "FlatList")[0].props.renderItem({ item: stop }).props.onToggle();
  tree = harness.render(PlacePickerScreen, {
    ...props,
    initialSelected: [stop],
  });
  assert.equal(nodes(tree, "AppButton")[0].props.disabled, false);
  nodes(tree, "AppButton")[0].props.onPress();
  assert.equal(applied[1].length, 0);
  harness.render(PlacePickerScreen, { ...props, visible: false });
  tree = harness.render(PlacePickerScreen, props);
  assert.equal(
    nodes(tree, "FlatList")[0].props.renderItem({ item: stop }).props.checked,
    false,
  );
  nodes(tree, "FlatList")[0].props.renderItem({ item: stop }).props.onToggle();
  const failedProps = { ...props, onApply: () => false };
  tree = harness.render(PlacePickerScreen, failedProps);
  nodes(tree, "AppButton")[0].props.onPress();
  tree = harness.render(PlacePickerScreen, failedProps);
  assert.ok(
    nodes(tree, "AppText").some(
      (node) => node.props.accessibilityRole === "alert",
    ),
  );
  assert.equal(
    nodes(tree, "FlatList")[0].props.renderItem({ item: stop }).props.checked,
    true,
  );
});

test("an address checkbox opens naming preview instead of adding an unnamed stop", () => {
  const harness = uiHarness();
  const { PlacePickerScreen } = harness.load<{
    PlacePickerScreen: (props: Record<string, unknown>) => Element | null;
  }>("src/features/trip/screens/place-picker-screen.tsx");
  let applied = false;
  const props = {
    destination: "Đà Lạt",
    onApply: () => {
      applied = true;
    },
    onClose: () => {},
  };
  let tree = harness.render(PlacePickerScreen, props);
  nodes(tree, "AppInput")[0].props.onChangeText("100/25 quang trung go vap");
  tree = harness.render(PlacePickerScreen, props);
  const list = nodes(tree, "FlatList")[0];
  assert.equal(list.props.data.length, 1);
  const address = list.props.data[0];
  list.props.renderItem({ item: address }).props.onToggle();
  tree = harness.render(PlacePickerScreen, props);
  const preview = nodes(tree, "PlaceDetailsContent")[0];
  assert.equal(preview.props.place.locationType, "address");
  assert.equal(preview.props.nameInput.type, "Controller");
  assert.equal(preview.props.region.latitude, address.location.latitude);
  preview.props.onBack();
  tree = harness.render(PlacePickerScreen, props);
  assert.equal(nodes(tree, "AppButton")[0].props.disabled, true);
  assert.equal(
    nodes(tree, "AppInput")[0].props.value,
    "100/25 quang trung go vap",
  );
  assert.equal(applied, false);
});

test("place search hides places saved anywhere in the trip, including search results after changing day", () => {
  const harness = uiHarness();
  const { PlacePickerScreen } = harness.load<{
    PlacePickerScreen: (props: Record<string, unknown>) => Element | null;
  }>("src/features/trip/screens/place-picker-screen.tsx");
  const { getPlaceSearchPreview } = harness.load<
    typeof import("../src/features/trip/data/place-search-preview.ts")
  >("src/features/trip/data/place-search-preview.ts");
  const places = getPlaceSearchPreview("Đà Lạt");
  const trip: Trip = {
    id: "trip",
    destination: "Đà Lạt",
    status: "planned",
    days: [
      { date: "2026-10-24", stops: [places[0]] },
      { date: "2026-10-25", stops: [places[1]] },
    ],
    unscheduledStops: [places[2]],
  };
  const props = {
    trip,
    destination: trip.destination,
    initialDate: trip.days[0].date,
    onApply: () => {},
    onClose: () => {},
  };
  let tree = harness.render(PlacePickerScreen, props);
  const list = nodes(tree, "FlatList")[0];
  assert.equal(list.props.data.length, places.length - 3);
  for (const place of places.slice(0, 3))
    assert.equal(
      list.props.data.some((item: TripStop) => item.id === place.id),
      false,
    );
  nodes(tree, "PlaceTargetSelector")[0].props.onChange(trip.days[1].date);
  tree = harness.render(PlacePickerScreen, props);
  assert.equal(nodes(tree, "FlatList")[0].props.data.length, places.length - 3);
  nodes(tree, "AppInput")[0].props.onChangeText("ho xuan huong");
  tree = harness.render(PlacePickerScreen, props);
  assert.equal(nodes(tree, "FlatList")[0].props.data.length, 0);
});

test("calendar uses localized labels, announces selection and applies a single-day range", () => {
  const harness = uiHarness();
  const { DateRangeSheet } = harness.load<{
    DateRangeSheet: (props: any) => Element | null;
  }>("src/features/trip/components/date-range-sheet.tsx");
  const applied: string[][] = [];
  const props = {
    visible: true,
    startDate: "",
    endDate: "",
    today: "2026-10-21",
    onApply: (start: string, end: string) => applied.push([start, end]),
    onClose: () => {},
  };
  let tree = harness.render(DateRangeSheet, props);
  const tomorrow = nodes(tree, "Pressable").find((node) =>
    node.props.accessibilityLabel?.includes("October 22, 2026"),
  );
  assert.ok(tomorrow);
  tomorrow.props.onPress();
  tree = harness.render(DateRangeSheet, props);
  assert.equal(
    nodes(tree, "Pressable").find((node) =>
      node.props.accessibilityLabel?.includes("October 22, 2026"),
    )?.props.accessibilityState.selected,
    true,
  );
  nodes(tree, "AppButton")[0].props.onPress();
  assert.deepEqual(applied, [["2026-10-22", "2026-10-22"]]);
});
