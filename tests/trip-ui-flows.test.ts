import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { loadHomePreview } from "./helpers/load-home-preview.ts";
import type { TripStop } from "../src/features/home/types/home-types.ts";

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
  harness.store
    .getState()
    .mutateTrip(trip.id, {
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

test("place picker discards cancelled changes and reopening respects removals in the parent", () => {
  const harness = uiHarness();
  const { PlacePickerSheet } = harness.load<{
    PlacePickerSheet: (props: any) => Element | null;
  }>("src/features/trip/components/place-picker-sheet.tsx");
  const applied: TripStop[][] = [];
  const props = {
    visible: true,
    destination: "Đà Lạt",
    initialSelected: [],
    onApply: (stops: TripStop[]) => applied.push(stops),
    onClose: () => {},
  };
  const first = nodes(harness.render(PlacePickerSheet, props), "FlatList")[0];
  const stop = first.props.data[0];
  const row = first.props.renderItem({ item: stop });
  row.props.onPress();
  let tree = harness.render(PlacePickerSheet, props);
  assert.equal(
    nodes(tree, "FlatList")[0].props.renderItem({ item: stop }).props
      .accessibilityState.checked,
    true,
  );
  nodes(tree, "Modal")[0].props.onRequestClose();
  assert.equal(applied.length, 0);
  harness.render(PlacePickerSheet, { ...props, visible: false });
  tree = harness.render(PlacePickerSheet, {
    ...props,
    initialSelected: [stop],
  });
  assert.equal(
    nodes(tree, "FlatList")[0].props.renderItem({ item: stop }).props
      .accessibilityState.checked,
    true,
  );
  harness.render(PlacePickerSheet, { ...props, visible: false });
  tree = harness.render(PlacePickerSheet, props);
  assert.equal(
    nodes(tree, "FlatList")[0].props.renderItem({ item: stop }).props
      .accessibilityState.checked,
    false,
  );
  nodes(tree, "AppButton")[0].props.onPress();
  assert.equal(applied[0].length, 0);
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
