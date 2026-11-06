import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidElement, type ReactElement } from "react";
import type { Memory, Trip } from "../src/features/home/types/home-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { loadHomePreview } from "./helpers/load-home-preview.ts";

function nodes(
  node: unknown,
  type: string,
): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap((child) => nodes(child, type));
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [
    ...(node.type === type ? [node] : []),
    ...nodes(node.props.children, type),
  ];
}

function fixture() {
  const state = loadHomePreview().createPreviewStore().getState();
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  let width = 390;
  const navigation: unknown[] = [];
  const library = {
    ...state,
    isPending: false,
    isError: false,
    isRefetching: false,
    refetch: async () => {},
  };
  const load = tripModuleLoader({
    "@/constants/development": { UI_PREVIEW_ENABLED: false },
    "@/features/home/screens/memories-screen": {
      MemoriesScreen: "PreviewMemories",
    },
    react: {
      useContext: () => 120,
      useState: (value: unknown) => [value, () => {}],
    },
    "expo-router": {
      router: {
        push: (route: unknown) => navigation.push(structuredClone(route)),
        dismissTo: (route: unknown) => navigation.push(structuredClone(route)),
      },
    },
    "expo-router/js-tabs": { BottomTabBarHeightContext: {} },
    "react-native": {
      FlatList: "FlatList",
      Pressable: "Pressable",
      ScrollView: "ScrollView",
      View: "View",
      useWindowDimensions: () => ({ width }),
    },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-screen-insets": {
      useScreenInsets: () => ({ left: 0, right: 0 }),
    },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/common/screen-safe-area": {
      ScreenSafeArea: "ScreenSafeArea",
    },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/features/home/components/home-header": { HomeHeader: "HomeHeader" },
    "@/features/home/providers/trip-preview-provider": {
      useTripPreview: (select: (value: typeof state) => unknown) =>
        select(state),
    },
    "../hooks/use-memories": {
      useMemories: () => library,
      useMemoryActions: () => ({ upload: { isError: false } }),
    },
    "../components/memory-primitives": {
      MemoryPage: "MemoryPage",
      MemoryPicture: "MemoryPicture",
      MemoryEmpty: "MemoryEmpty",
      MemoryIconButton: "MemoryIconButton",
    },
    "../components/memory-load-state": { MemoryLoadState: "MemoryLoadState" },
  });
  const { MemoriesHistoryScreen } = load<
    typeof import("../src/features/memories/screens/memories-history-screen.tsx")
  >("src/features/memories/screens/memories-history-screen.tsx");
  return {
    load,
    render: MemoriesHistoryScreen,
    navigation,
    library,
    tokens,
    setWidth: (value: number) => {
      width = value;
    },
  };
}

type Album = { trip: Trip; photos: Memory[] };
type GridProps = {
  data: Album[];
  numColumns: number;
  contentContainerStyle: { paddingBottom: number };
  renderItem: (info: { item: Album }) => ReactElement<{
    onPress: () => void;
    style: (state: { pressed: boolean }) => { width: number };
  }>;
};

test("memories tab renders the album list with the shared logo header and space for tabs", () => {
  const f = fixture();
  const { default: MemoriesRoute } = f.load<
    typeof import("../src/app/(workspace)/tabs/memories.tsx")
  >("src/app/(workspace)/tabs/memories.tsx");
  const route = MemoriesRoute();
  assert.equal(route.type, f.render);
  assert.equal(route.props.embedded, true);
  const tree = f.render({ embedded: true });
  assert.equal(nodes(tree, "HomeHeader").length, 1);
  const list = nodes(tree, "FlatList")[0];
  assert.ok(isValidElement<GridProps>(list));
  assert.equal(list.props.numColumns, 3);
  assert.equal(
    list.props.contentContainerStyle.paddingBottom,
    120 + f.tokens.spacing.xl,
  );
  assert.equal(list.props.data.length, f.library.trips.length);
  assert.equal(
    new Set(list.props.data.map(({ trip }) => trip.id)).size,
    f.library.trips.length,
  );
  for (const album of list.props.data) {
    assert.ok(album.photos.every((photo) => photo.tripId === album.trip.id));
    list.props.renderItem({ item: album }).props.onPress();
    assert.deepEqual(f.navigation.at(-1), {
      pathname: "/memories/[tripId]",
      params: { tripId: album.trip.id },
    });
  }
});

test("three trip columns fit narrow phones and tablets with consistent card widths", () => {
  const f = fixture();
  for (const width of [320, 390, 768]) {
    f.setWidth(width);
    const list = nodes(f.render({ embedded: true }), "FlatList")[0];
    assert.ok(isValidElement<GridProps>(list));
    const item = list.props.data[0];
    assert.ok(item);
    const card = list.props.renderItem({ item });
    const cardWidth = card.props.style({ pressed: false }).width;
    const { spacing, layout } = f.tokens;
    assert.ok(cardWidth >= layout.touchTarget);
    assert.ok(
      Math.abs(
        cardWidth * 3 +
          spacing.md * 2 +
          spacing.lg * 2 -
          Math.min(width, layout.contentMaxWidth),
      ) < 0.001,
    );
  }
});

test("album capture opens quick capture with its trip instead of returning to the memories grid", () => {
  const f = fixture();
  const { MemoryAlbumScreen } = f.load<
    typeof import("../src/features/memories/screens/memory-album-screen.tsx")
  >("src/features/memories/screens/memory-album-screen.tsx");
  const trip = f.library.trips.find((item) => item.id === "past-dalat");
  assert.ok(trip);
  const tree = MemoryAlbumScreen({ tripId: trip.id });
  assert.ok(isValidElement<{ onPress: () => void }>(tree.props.action));
  tree.props.action.props.onPress();
  assert.deepEqual(f.navigation[0], {
    pathname: "/memories/quick-capture",
    params: { tripId: trip.id, day: trip.days.at(-1)?.date, stopId: "" },
  });
});
