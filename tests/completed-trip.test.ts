import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { Memory } from "../src/features/home/types/home-types.ts";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown, type: string): Node[] {
  if (Array.isArray(value)) return value.flatMap((child) => nodes(child, type));
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [
    ...(node.type === type ? [node] : []),
    ...nodes(node.props.children, type),
  ];
}
function harness() {
  let cursor = 0;
  const slots: unknown[] = [];
  let effects: (() => void)[] = [];
  let config: {
    queryFn: (context: { signal: AbortSignal }) => Promise<unknown>;
  };
  const requests: unknown[][] = [];
  const invalidated: unknown[] = [];
  const removed: string[] = [];
  let refreshes = 0;
  const query = {
    isPending: false,
    isError: false,
    data: {
      content: [
        {
          id: "memory-photo",
          experiencedAt: "2026-11-06T17:30:00Z",
          note: "Saved note",
          media: [
            {
              id: "photo1",
              url: "https://example.com/1.jpg",
              mimeType: "image/jpeg",
            },
            {
              id: "photo2",
              url: "https://example.com/2.jpg",
              mimeType: "image/jpeg",
            },
          ],
        },
        {
          id: "memory-note",
          experiencedAt: "2026-11-06T18:00:00Z",
          note: "Note only",
          media: [],
        },
      ],
      totalPages: 2,
      last: false,
    },
    refetch: async () => {
      refreshes++;
    },
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
      useEffect: (effect: () => void) => {
        effects.push(effect);
      },
    },
    "react/jsx-runtime": {
      jsx: (type: unknown, props: unknown) => ({ type, props }),
      jsxs: (type: unknown, props: unknown) => ({ type, props }),
    },
    "react-native": {
      View: "View",
      StyleSheet: { create: (style: unknown) => style, hairlineWidth: 1 },
    },
    "@tanstack/react-query": {
      useQuery: (value: typeof config) => {
        config = value;
        return query;
      },
      useQueryClient: () => ({
        invalidateQueries: async (input: unknown) => {
          invalidated.push(input);
        },
      }),
    },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/features/auth/hooks/use-auth": {
      useProfile: () => ({ data: { id: "owner" } }),
    },
    "@/features/auth/services/auth-session": {
      authSession: { getVersion: () => 1 },
    },
    "@/features/home/api/memory-api": {
      memoryApi: {
        list: async (...args: unknown[]) => {
          requests.push(args);
          return query.data;
        },
      },
    },
    "@/features/memories/api/memory-api": {
      memoryApi: {
        removePhoto: async (id: string) => {
          removed.push(id);
        },
      },
    },
    "@/components/ui/app-text": { AppText: "Text" },
    "@/components/ui/app-button": { AppButton: "Button" },
    "./trip-recap-content": { TripRecapContent: "RecapContent" },
    "../i18n/trip-integration-copy": {
      useTripIntegrationCopy: () => ({
        copy: { retry: "Retry", more: "More" },
      }),
    },
  });
  const { ConnectedTripRecap } = load<{
    ConnectedTripRecap: (props: {
      tripId: string;
      date: string;
      destination: string;
      refreshVersion?: number;
    }) => unknown;
  }>("src/features/trip/components/connected-trip-recap.tsx");
  function render(version = 1) {
    cursor = 0;
    effects = [];
    const tree = ConnectedTripRecap({
      tripId: "trip",
      date: "2026-11-07",
      destination: "Đà Lạt",
      refreshVersion: version,
    });
    effects.forEach((effect) => effect());
    return tree;
  }
  return {
    query,
    requests,
    invalidated,
    removed,
    render,
    get config() {
      return config;
    },
    get refreshes() {
      return refreshes;
    },
  };
}

test("recap uses the selected trip/day, local capture times, all media and one copy of each note", async () => {
  const h = harness();
  const tree = h.render();
  await h.config.queryFn({ signal: new AbortController().signal });
  assert.equal(h.requests[0][0], 0);
  assert.equal(h.requests[0][2], "trip");
  assert.equal(h.requests[0][4], "2026-11-07");
  const recap = nodes(tree, "RecapContent")[0];
  const memories = recap.props.memories as Memory[];
  assert.equal(memories.length, 3);
  assert.equal(memories[0].time, "00:30");
  assert.equal(memories[0].destination, "Đà Lạt");
  assert.equal(memories[0].text, "Saved note");
  assert.equal(memories[1].text, "");
  assert.equal(memories[2].text, "Note only");
  await (recap.props.onDeletePhoto as (memory: Memory) => Promise<void>)(
    memories[0],
  );
  assert.deepEqual(h.removed, ["photo1"]);
  assert.ok(
    h.invalidated.some((value) => JSON.stringify(value).includes("dashboard")),
  );
  assert.ok(
    h.invalidated.some((value) => JSON.stringify(value).includes("detail")),
  );
  assert.equal(h.refreshes, 0);
  h.render(2);
  assert.equal(h.refreshes, 1);
});

test("recap exposes retry, pagination and a loading state without rendering stale photos", () => {
  const h = harness();
  h.query.isPending = true;
  assert.equal(nodes(h.render(), "RecapContent").length, 0);
  h.query.isPending = false;
  h.query.isError = true;
  const failed = h.render();
  assert.equal(nodes(failed, "RecapContent").length, 0);
  (nodes(failed, "Button")[0].props.onPress as () => void)();
  assert.equal(h.refreshes, 1);
  h.query.isError = false;
  const tree = h.render();
  const more = nodes(tree, "Button").find(
    (node) => node.props.children === "More",
  );
  assert.ok(more);
  (more.props.onPress as () => void)();
  h.render();
  void h.config.queryFn({ signal: new AbortController().signal });
  assert.equal(h.requests[0][0], 1);
});

test("recap card uses API totals and a bundled cover fallback without inventing visited counts", () => {
  let failed = false;
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const load = tripModuleLoader({
    react: {
      useState: () => [
        failed,
        (value: boolean) => {
          failed = value;
        },
      ],
    },
    "react/jsx-runtime": {
      jsx: (type: unknown, props: unknown) => ({ type, props }),
      jsxs: (type: unknown, props: unknown) => ({ type, props }),
    },
    "react-native": {
      View: "View",
      Pressable: "Pressable",
      StyleSheet: { hairlineWidth: 1 },
    },
    "expo-image": { Image: "Image" },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/ui/app-text": { AppText: "Text" },
    "@/components/ui/app-icon": { AppIcon: "Icon" },
    "@/features/home/components/journey-card": { JourneyCard: "JourneyCard" },
  });
  const { TripRecapCard } = load<
    typeof import("../src/features/trip/components/trip-recap-card.tsx")
  >("src/features/trip/components/trip-recap-card.tsx");
  let opened = 0;
  const props = {
    trip: {
      id: "past-trip",
      title: "Khám phá Đà Nẵng",
      destination: "Đà Nẵng",
      status: "completed" as const,
      startDate: "2026-11-01",
      endDate: "2026-11-03",
      coverImage: "https://example.com/missing.jpg",
      days: [],
    },
    dayCount: 3,
    stopCount: 9,
    memoryCount: 17,
    showCover: true,
    onOpen: () => {
      opened++;
    },
  };
  let tree = TripRecapCard(props);
  const text = nodes(tree, "Text").map((node) => node.props.children);
  assert.ok(text.includes("17"));
  assert.ok(text.includes("9"));
  assert.ok(text.includes("3"));
  assert.ok(text.includes("Đã hoàn thành"));
  (nodes(tree, "Pressable")[0].props.onPress as () => void)();
  assert.equal(opened, 1);
  const image = nodes(tree, "Image")[0];
  assert.equal(image.props.source, props.trip.coverImage);
  (image.props.onError as () => void)();
  tree = TripRecapCard(props);
  assert.ok(String(nodes(tree, "Image")[0].props.source).endsWith(".webp"));
});
