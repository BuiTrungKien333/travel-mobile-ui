import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError } from "../src/services/api/api-error.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const id = "a965f8cb-3bb6-4d90-95fd-9b6329939166";
const province = "b965f8cb-3bb6-4d90-95fd-9b6329939166";
const place = {
  id,
  reference: { kind: "INTERNAL", placeId: id },
  source: "INTERNAL",
  name: "Hồ Xuân Hương",
  formattedAddress: "Trần Quốc Toản, Đà Lạt",
  location: { latitude: 11.94, longitude: 108.44 },
  provinceId: province,
  category: null,
  photo: null,
};
const detail = {
  ...place,
  environmentType: "UNSPECIFIED",
  openingHours: null,
  openingStatus: "UNKNOWN",
  admission: null,
  description: "Hồ nước tại trung tâm Đà Lạt.",
  photos: [],
  evaluatedAt: "2026-11-06T00:00:00Z",
};
const page = {
  content: [place],
  page: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
  reason: null,
  context: { serverTime: "2026-11-06T00:00:00Z", evaluatedDate: "2026-11-06" },
};

test("stored-place boundary rejects preview/provider identities, mismatched references and invalid coordinates", () => {
  const load = tripModuleLoader({ "@/services/api/client": { apiClient: {} } });
  const { placeSummarySchema, discoveryStop } = load<
    typeof import("../src/features/trip/api/place-discovery-api.ts")
  >("src/features/trip/api/place-discovery-api.ts");
  assert.ok(placeSummarySchema.safeParse(place).success);
  for (const invalid of [
    { ...place, id: "lake" },
    { ...place, source: "MAPBOX" },
    { ...place, reference: { kind: "INTERNAL", placeId: province } },
    { ...place, reference: { kind: "USER", placeId: id } },
    { ...place, location: { latitude: 100, longitude: 108 } },
  ])
    assert.equal(placeSummarySchema.safeParse(invalid).success, false);
  const stop = discoveryStop(placeSummarySchema.parse(place));
  assert.equal(stop.id, id);
  assert.equal(stop.placeId, id);
  assert.equal(stop.tripPlaceId, undefined);
  assert.equal(stop.durationMinutes, undefined);
  assert.equal(stop.visited, undefined);
});

test("discovery API trims search, scopes by trip or province, forwards cancellation and validates responses", async () => {
  let response: unknown = { success: true, data: page };
  const calls: { url: string; params?: unknown; signal?: AbortSignal }[] = [];
  const load = tripModuleLoader({
    "@/services/api/client": {
      apiClient: {
        get: async (
          url: string,
          config: { params: unknown; signal: AbortSignal },
        ) => {
          calls.push({ url, ...config });
          return { data: response };
        },
      },
    },
    "@/services/api/api-error": { ApiError },
  });
  const { placeDiscoveryApi } = load<
    typeof import("../src/features/trip/api/place-discovery-api.ts")
  >("src/features/trip/api/place-discovery-api.ts");
  const signal = new AbortController().signal;
  await placeDiscoveryApi.list(
    { provinceId: province },
    "  ho xuan huong  ",
    0,
    "vi",
    signal,
  );
  assert.equal(calls[0].url, "/api/v1/places/suggestions");
  assert.equal(calls[0].signal, signal);
  assert.equal(
    JSON.stringify(calls[0].params),
    JSON.stringify({
      provinceId: province,
      q: "ho xuan huong",
      page: 0,
      size: 20,
      locale: "vi",
    }),
  );
  const before = calls.length;
  await assert.rejects(
    placeDiscoveryApi.list({ tripId: id, provinceId: province }, "", 0, "vi"),
  );
  await assert.rejects(
    placeDiscoveryApi.list({ provinceId: "fixture" }, "", 0, "vi"),
  );
  await assert.rejects(placeDiscoveryApi.list({}, "", -1, "vi"));
  assert.equal(calls.length, before);
  response = {
    success: true,
    data: { ...page, content: [{ ...place, id: "custom-1" }] },
  };
  await assert.rejects(
    placeDiscoveryApi.list({}, "", 0, "vi"),
    (e: unknown) => e instanceof ApiError && e.code === "INVALID_RESPONSE",
  );
  response = { success: true, data: detail };
  const read = await placeDiscoveryApi.detail(id, "en", signal);
  assert.equal(read.openingHours, null);
  assert.equal(read.admission, null);
  assert.equal(read.description, detail.description);
  assert.equal(calls.at(-1)?.url, `/api/v1/places/${id}`);
  response = { success: true, data: { ...detail, description: 123 } };
  await assert.rejects(
    placeDiscoveryApi.detail(id, "vi"),
    (error: unknown) =>
      error instanceof ApiError && error.code === "INVALID_RESPONSE",
  );
});

test("batch client uses one atomic request and rejects duplicate or preview IDs before sending", async () => {
  const requests: unknown[] = [];
  const load = tripModuleLoader({
    "@/services/api/client": {
      apiClient: {
        post: async (url: string, body: unknown) => {
          requests.push({ url, body });
          return { data: { success: true, data: [] } };
        },
      },
    },
    "@/services/api/api-error": { ApiError },
  });
  const { tripPlacesApi } = load<
    typeof import("../src/features/trip/api/trip-place-api.ts")
  >("src/features/trip/api/trip-place-api.ts");
  await tripPlacesApi.addPlaces(id, [province]);
  assert.equal(
    JSON.stringify(requests),
    JSON.stringify([
      {
        url: `/api/v1/trips/${id}/places/batch`,
        body: { placeIds: [province] },
      },
    ]),
  );
  for (const ids of [
    [],
    [id, id],
    ["custom-1"],
    Array.from({ length: 51 }, () => id),
  ])
    await assert.rejects(tripPlacesApi.addPlaces(id, ids));
  assert.equal(requests.length, 1);
  await tripPlacesApi.addPlaces(id, [province], "2026-11-20");
  assert.equal(
    JSON.stringify(requests[1]),
    JSON.stringify({
      url: `/api/v1/trips/${id}/places/batch`,
      body: { placeIds: [province], date: "2026-11-20" },
    }),
  );
});

type Element = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const element = value as Element;
  return [element, ...nodes(element.props.children)];
}
function pickerHarness(reason: "DESTINATION_NOT_LINKED" | null = null) {
  const state: unknown[] = [];
  let cursor = 0;
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  let pending: Promise<void> = Promise.resolve();
  let count = 0;
  let closed = 0;
  const query = {
    data: { pages: [{ ...page, content: reason ? [] : page.content, reason }] },
    isPending: false,
    isError: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    refetch: () => {},
  };
  const load = tripModuleLoader({
    react: {
      useState: (initial: unknown) => {
        const i = cursor++;
        if (!(i in state)) state[i] = initial;
        return [
          state[i],
          (value: unknown) => {
            state[i] =
              typeof value === "function"
                ? (value as (old: unknown) => unknown)(state[i])
                : value;
          },
        ];
      },
      useRef: (initial: unknown) => {
        const i = cursor++;
        if (!(i in state)) state[i] = { current: initial };
        return state[i];
      },
    },
    "react/jsx-runtime": {
      jsx: (type: unknown, props: Record<string, unknown>) => ({ type, props }),
      jsxs: (type: unknown, props: Record<string, unknown>) => ({
        type,
        props,
      }),
    },
    "react-native": {
      View: "View",
      FlatList: "FlatList",
      KeyboardAvoidingView: "KeyboardAvoidingView",
      Keyboard: { dismiss: () => {} },
      Platform: { OS: "android" },
      StyleSheet: { create: (value: unknown) => value },
    },
    "react-native-gesture-handler": {
      GestureHandlerRootView: "GestureHandlerRootView",
    },
    "@/components/common/screen-safe-area": {
      ScreenSafeArea: "ScreenSafeArea",
    },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-input": { AppInput: "AppInput" },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/hooks/use-app-theme": {
      useAppTheme: () => ({
        ...tokens,
        colors: new Proxy({}, { get: () => "color" }),
      }),
    },
    "@/hooks/use-screen-insets": { useScreenInsets: () => ({ bottom: 24 }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/services/api/client": { apiClient: {} },
    "../api/place-discovery-queries": {
      usePlaceDiscovery: () => ({ query, isDebouncing: false }),
      usePlaceDetail: () => ({ data: detail }),
    },
    "../components/place-picker-list-items": {
      PlaceSearchResultRow: "PlaceSearchResultRow",
    },
    "../components/place-details-content": {
      PlaceDetailsContent: "PlaceDetailsContent",
    },
    "../components/trip-details-header": {
      DetailIconButton: "DetailIconButton",
    },
  });
  const { ConnectedPlacePickerScreen } = load<
    typeof import("../src/features/trip/screens/connected-place-picker-screen.tsx")
  >("src/features/trip/screens/connected-place-picker-screen.tsx");
  const props = {
    destination: "Đà Lạt",
    scope: { provinceId: province },
    onClose: () => {
      closed++;
    },
    onApply: () => {
      count++;
      return pending;
    },
  };
  const render = (
    initialSelected?: import("../src/features/home/types/home-types.ts").TripStop[],
    targetDay?: { date: string; dayNumber: number },
  ) => {
    cursor = 0;
    return nodes(
      ConnectedPlacePickerScreen({ ...props, initialSelected, targetDay }),
    );
  };
  const row = (tree: Element[]) => {
    const list = tree.find((n) => n.type === "FlatList")!;
    return (list.props.renderItem as (p: { item: unknown }) => Element)({
      item: (list.props.data as unknown[])[0],
    });
  };
  return {
    render,
    row,
    query,
    pending: (p: Promise<void>) => {
      pending = p;
    },
    calls: () => count,
    closed: () => closed,
  };
}
const event = (node: Element, name: string) =>
  (node.props[name] as () => void)();

test("an unlinked trip explains how to select a catalog province instead of reporting an empty catalog", () => {
  const h = pickerHarness("DESTINATION_NOT_LINKED");
  const tree = h.render();
  const list = tree.find((node) => node.type === "FlatList")!;
  const labels = nodes(list.props.ListEmptyComponent)
    .filter((node) => node.type === "AppText")
    .map((node) => node.props.children);
  assert.match(JSON.stringify(labels), /chưa liên kết với tỉnh\/thành/);
  assert.doesNotMatch(JSON.stringify(labels), /Chưa có địa điểm phù hợp/);
});

test("day-scoped picker shows the selected day and confirms adding directly to it", () => {
  const h = pickerHarness();
  const day = { date: "2026-11-20", dayNumber: 2 };
  let tree = h.render(undefined, day);
  event(h.row(tree), "onToggle");
  tree = h.render(undefined, day);
  const labels = JSON.stringify(
    tree
      .filter((node) => node.type === "AppText")
      .map((node) => node.props.children),
  );
  assert.match(labels, /Ngày 2, 20\/11/);
  assert.doesNotMatch(labels, /chưa xếp lịch/i);
  assert.equal(
    tree.filter((node) => node.type === "AppButton").at(-1)?.props.children,
    "Thêm 1 điểm vào ngày 2",
  );
});

test("picker retains selection after an error and locks double submit/back while saving", async () => {
  const h = pickerHarness();
  let tree = h.render();
  event(h.row(tree), "onToggle");
  tree = h.render();
  let reject!: (error: Error) => void;
  h.pending(
    new Promise<void>((_, fail) => {
      reject = fail;
    }),
  );
  const save = tree.filter((n) => n.type === "AppButton").at(-1)!;
  event(save, "onPress");
  event(save, "onPress");
  tree = h.render();
  event(tree.find((n) => n.type === "DetailIconButton")!, "onPress");
  assert.equal(h.calls(), 1);
  assert.equal(h.closed(), 0);
  reject(new Error("offline"));
  await new Promise(setImmediate);
  tree = h.render();
  assert.ok(
    tree.some(
      (n) => n.type === "AppText" && n.props.accessibilityRole === "alert",
    ),
  );
  assert.equal(h.row(tree).props.checked, true);
  assert.equal(
    tree.filter((n) => n.type === "AppButton").at(-1)?.props.disabled,
    false,
  );
});

test("real place detail is passed explicit unknown content and never sample prices or visit duration", () => {
  const h = pickerHarness();
  let tree = h.render();
  event(h.row(tree), "onPreview");
  tree = h.render();
  const content = tree.find((n) => n.type === "PlaceDetailsContent")!;
  assert.ok(content);
  assert.equal(
    JSON.stringify(content.props.suppliedDetails),
    JSON.stringify({ photo: null, description: detail.description }),
  );
  assert.equal(
    (content.props.place as { durationMinutes?: number }).durationMinutes,
    undefined,
  );
});

test("create selection can be cleared completely instead of trapping the last selected place", () => {
  const h = pickerHarness();
  const initial = [
    {
      id,
      placeId: id,
      name: { vi: "Place", en: "Place" },
      kind: { vi: "", en: "" },
      time: "",
    },
  ];
  let tree = h.render(initial);
  event(h.row(tree), "onToggle");
  tree = h.render(initial);
  assert.equal(
    tree.filter((n) => n.type === "AppButton").at(-1)?.props.disabled,
    false,
  );
});
