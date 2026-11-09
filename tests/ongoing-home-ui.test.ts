import assert from "node:assert/strict";
import { test } from "node:test";
import type { Trip, TripStop } from "../src/features/home/types/home-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown, type: string): Node[] {
  if (Array.isArray(value)) return value.flatMap((item) => nodes(item, type));
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [
    ...(node.type === type ? [node] : []),
    ...nodes(node.props.children, type),
  ];
}
test("live Home keeps its logo header, uses a local cover fallback, and check-in camera keeps the visited stop", async () => {
  const slots: unknown[] = [];
  let cursor = 0;
  let visits = 0;
  let finish: (value: boolean) => void = () => {};
  const cameras: (TripStop | undefined)[] = [];
  const next: TripStop = {
    id: "link",
    tripPlaceId: "link",
    placeId: "place",
    name: { vi: "Lâm Viên", en: "Lam Vien" },
    kind: { vi: "", en: "" },
    time: "11:00",
  };
  const trip: Trip = {
    id: "trip-live",
    coverImage: "https://example.com/cover.jpg",
    destination: "Đà Lạt",
    status: "planned",
    days: [{ date: "2026-11-07", stops: [] }],
  };
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const load = tripModuleLoader({
    react: {
      useState: (initial: unknown) => {
        const i = cursor++;
        if (!(i in slots)) slots[i] = initial;
        return [
          slots[i],
          (value: unknown) => {
            slots[i] = value;
          },
        ];
      },
      useRef: (initial: unknown) => {
        const i = cursor++;
        return (slots[i] ??= { current: initial });
      },
      useEffect() {},
    },
    "react/jsx-runtime": {
      jsx: (type: unknown, props: Record<string, unknown>) => ({ type, props }),
      jsxs: (type: unknown, props: Record<string, unknown>) => ({
        type,
        props,
      }),
    },
    "react-native": { View: "View" },
    "expo-image": { Image: "Image" },
    "expo-router": { router: { push() {} } },
    "@/hooks/use-app-theme": {
      useAppTheme: () => ({
        ...tokens,
        colors: { surfaceTint: "white", background: "white" },
      }),
    },
    "@/components/ui/app-text": { AppText: "AppText" },
    "../components/check-in-prompt": { CheckInPrompt: "CheckInPrompt" },
    "../components/home-primitives": { HomePage: "HomePage" },
    "../components/ongoing-trip-header": {
      OngoingTripHeader: "OngoingTripHeader",
    },
    "../components/ongoing-trip-components": { NextStopCard: "NextStopCard" },
    "../components/journal-album": { JournalAlbum: "JournalAlbum" },
    "../i18n/ongoing-copy": { useOngoingCopy: () => ({ locale: "vi" }) },
    "../providers/trip-preview-provider": {
      useTripPreview: (select: (state: unknown) => unknown) =>
        select({ today: "2026-11-07", visited: {}, memories: [] }),
    },
  });
  const { OngoingHomeScreen } = load<
    typeof import("../src/features/home/screens/ongoing-home-screen.tsx")
  >("src/features/home/screens/ongoing-home-screen.tsx");
  const runtime = {
    today: "2026-11-07",
    nextStop: next,
    stopCount: 1,
    memories: [],
    busy: false,
    onVisit: async () => {
      visits++;
      return new Promise<boolean>((resolve) => {
        finish = resolve;
      });
    },
    onDetails() {},
    onWeather() {},
    onPlan() {},
    onJournal() {},
    onCamera: (stop?: TripStop) => cameras.push(stop),
    onDeletePhoto: async () => {},
    onRefresh() {},
    refreshing: false,
  };
  function render() {
    cursor = 0;
    return OngoingHomeScreen({ trip, dayIndex: 0, runtime });
  }
  let tree = render();
  assert.equal(nodes(tree, "HomePage")[0].props.showHeader, true);
  const cover = nodes(tree, "NextStopCard")[0].props.cover as Node;
  assert.equal(cover.type, "Image");
  assert.equal(cover.props.source, trip.coverImage);
  assert.equal(nodes(tree, "Image").length, 0);
  (cover.props.onError as () => void)();
  tree = render();
  const fallback = nodes(tree, "NextStopCard")[0].props.cover as Node;
  assert.ok(String(fallback.props.source).endsWith(".webp"));
  const again = nodes(render(), "NextStopCard")[0].props.cover as Node;
  assert.equal(again.props.source, fallback.props.source);
  const card = nodes(tree, "NextStopCard")[0];
  (card.props.onVisited as () => void)();
  (card.props.onVisited as () => void)();
  assert.equal(visits, 1);
  finish(true);
  await new Promise<void>((resolve) => setImmediate(resolve));
  const prompt = nodes(render(), "CheckInPrompt")[0];
  assert.ok(prompt);
  (prompt.props.onCapture as () => void)();
  assert.equal(cameras[0], next);
  assert.equal(nodes(render(), "LiveTimeline").length, 0);
});
