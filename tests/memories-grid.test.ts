import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidElement, type ReactElement } from "react";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { loadHomePreview } from "./helpers/load-home-preview.ts";
import type { MemoryAlbum } from "../src/features/memories/utils/memory-library.ts";
import type { Memory } from "../src/features/home/types/home-types.ts";

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
  let cursor = 0;
  const states: unknown[] = [];
  const navigation: unknown[] = [];
  let includePlaces: boolean | undefined;
  const removed: unknown[] = [];
  const gallery = {
    opened: null as null | { selection: unknown; memories: Memory[] },
    activePhotoId: null,
    registerPhoto: () => () => {},
    getSelection: () => null,
    setActivePhotoId: () => {},
    openPhoto(selection: unknown, memories: Memory[]) {
      gallery.opened = { selection, memories };
    },
    closePhoto() {
      gallery.opened = null;
    },
  };
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
      useState: (initial: unknown) => {
        const i = cursor++;
        if (!(i in states)) states[i] = initial;
        return [
          states[i],
          (value: unknown) => {
            states[i] = value;
          },
        ];
      },
      useMemo: (read: () => unknown) => read(),
      useCallback: (callback: unknown) => callback,
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
      SectionList: "SectionList",
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
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/features/home/components/home-header": { HomeHeader: "HomeHeader" },
    "@/features/home/providers/trip-preview-provider": {
      useTripPreview: (select: (value: typeof state) => unknown) =>
        select(state),
    },
    "@/features/home/hooks/use-journal-photo-gallery": {
      useJournalPhotoGallery: () => gallery,
    },
    "@/features/home/components/journal-photo-viewer": {
      JournalPhotoViewer: "Viewer",
    },
    "@/features/home/components/journal-photo-thumbnail": {
      JournalPhotoThumbnail: "Thumbnail",
    },
    "../hooks/use-memories": {
      useMemories: (places?: boolean) => {
        includePlaces = places;
        return library;
      },
      useMemoryActions: () => ({
        upload: { isError: false },
        remove: {
          mutateAsync: async (value: unknown) => {
            removed.push(value);
          },
        },
      }),
    },
    "../components/memory-primitives": {
      MemoryPage: "MemoryPage",
      MemoryEmpty: "MemoryEmpty",
      MemoryIconButton: "MemoryIconButton",
    },
    "../components/memory-load-state": { MemoryLoadState: "MemoryLoadState" },
    "../components/memory-library-switcher": {
      MemoryLibrarySwitcher: "Switcher",
    },
    "../components/memory-library-album": { MemoryLibraryAlbum: "Album" },
    "../components/memory-library-photo-row": { MemoryLibraryPhotoRow: "Row" },
  });
  const { MemoriesHistoryScreen } = load<
    typeof import("../src/features/memories/screens/memories-history-screen.tsx")
  >("src/features/memories/screens/memories-history-screen.tsx");
  return {
    render() {
      cursor = 0;
      return MemoriesHistoryScreen({ embedded: true });
    },
    load,
    navigation,
    library,
    tokens,
    gallery,
    removed,
    setWidth(value: number) {
      width = value;
    },
    get includePlaces() {
      return includePlaces;
    },
    switchMode(mode: string) {
      (
        nodes(this.render(), "Switcher")[0].props.onChange as (
          value: string,
        ) => void
      )(mode);
    },
  };
}

test("photos default to virtualized trip sections without the logo header and retain tab safe area", () => {
  const f = fixture();
  const tree = f.render();
  assert.equal(nodes(tree, "HomeHeader").length, 0);
  assert.equal(f.includePlaces, false);
  const list = nodes(tree, "SectionList")[0];
  assert.ok(list);
  assert.equal(list.props.windowSize, 5);
  assert.equal(list.props.stickySectionHeadersEnabled, false);
  assert.equal(
    (list.props.contentContainerStyle as { paddingBottom: number })
      .paddingBottom,
    120 + f.tokens.spacing.xl,
  );
  const sections = list.props.sections as (MemoryAlbum & {
    data: Memory[][];
  })[];
  assert.equal(sections.length, f.library.trips.length);
  sections.forEach((section) => {
    assert.ok(section.data.every((row) => row.length > 0 && row.length <= 3));
    assert.ok(
      section.photos.every((photo) => photo.tripId === section.trip.id),
    );
  });
});

test("three square columns and 1px gaps fit 320px phones through tablet widths", () => {
  const f = fixture();
  for (const width of [320, 390, 768]) {
    f.setWidth(width);
    const list = nodes(f.render(), "SectionList")[0];
    const section = (list.props.sections as { data: Memory[][] }[])[0];
    const row = (
      list.props.renderItem as (
        value: unknown,
      ) => ReactElement<{ size: number }>
    )({ item: section.data[0] });
    assert.equal(f.tokens.layout.memoryGridGap, 1);
    assert.ok(
      Math.abs(
        row.props.size * 3 +
          2 -
          Math.min(width, f.tokens.layout.contentMaxWidth),
      ) < 0.001,
    );
  }
});

test("sample photos are never substituted for pending or failed server requests", () => {
  const f = fixture();
  f.library.isPending = true;
  assert.equal(
    (nodes(f.render(), "SectionList")[0].props.sections as unknown[]).length,
    0,
  );
  f.library.isPending = false;
  f.library.isError = true;
  assert.equal(
    (nodes(f.render(), "SectionList")[0].props.sections as unknown[]).length,
    0,
  );
  f.library.isError = false;
  assert.ok(
    (nodes(f.render(), "SectionList")[0].props.sections as unknown[]).length >
      0,
  );
});

test("album switch shows a vertical list, opens the selected trip and retains Xem sau", () => {
  const f = fixture();
  f.switchMode("albums");
  const tree = f.render();
  assert.equal(nodes(tree, "SectionList").length, 0);
  const list = nodes(tree, "FlatList")[0];
  const album = (list.props.data as MemoryAlbum[])[0];
  const card = (
    list.props.renderItem as (
      value: unknown,
    ) => ReactElement<{ onOpen: () => void }>
  )({ item: album });
  card.props.onOpen();
  assert.deepEqual(f.navigation.at(-1), {
    pathname: "/memories/[tripId]",
    params: { tripId: album.trip.id },
  });
  (nodes(tree, "Switcher")[0].props.onLater as () => void)();
  assert.equal(f.navigation.at(-1), "/memories/saved-later");
});

test("thumbnail selection reuses the original viewer core and keeps samples undeletable", () => {
  const f = fixture();
  const list = nodes(f.render(), "SectionList")[0];
  const row = (
    list.props.renderItem as (
      value: unknown,
    ) => ReactElement<{ onOpen: (selection: unknown) => void }>
  )({ item: [] });
  const selection = {
    id: "sample",
    uri: "file:///sample.webp",
    size: { width: 100, height: 100 },
    origin: { x: 0, y: 0, width: 100, height: 100 },
  };
  row.props.onOpen(selection);
  const viewer = nodes(f.render(), "Viewer")[0];
  assert.ok(viewer);
  assert.equal(viewer.props.selection, selection);
  assert.equal(
    (viewer.props.canDelete as (memory: unknown) => boolean)({
      id: "library-sample:trip:0",
    }),
    false,
  );
  assert.equal(
    (viewer.props.canDelete as (memory: unknown) => boolean)({
      id: "real-photo",
    }),
    true,
  );
});

test("album capture still opens quick capture for its trip", () => {
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
