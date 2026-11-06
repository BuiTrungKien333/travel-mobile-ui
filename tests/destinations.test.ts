import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { ApiError } from "../src/services/api/api-error.ts";
import { readFileSync } from "node:fs";
import {
  tripReadSchema,
  tripViewModel,
} from "../src/features/trip/api/trip-contract.ts";
import type { TripMutation } from "../src/features/trip/types/trip-details-types.ts";

const id = "4d1e7cfe-1171-44ec-a019-adf1334a805c";
const option = { id, code: "LD", name: "Lâm Đồng" };
const page = {
  content: [option],
  page: 0,
  size: 20,
  totalElements: 21,
  totalPages: 2,
  context: { serverTime: "2026-11-03T00:00:00Z", evaluatedDate: "2026-11-03" },
};

test("catalog transport validates responses, trims search and forwards page/cancellation", async () => {
  let response: unknown = { success: true, data: page };
  const calls: {
    url: string;
    config: { params: Record<string, unknown>; signal: AbortSignal };
  }[] = [];
  const load = tripModuleLoader({
    "@/services/api/client": {
      apiClient: {
        get: async (url: string, config: (typeof calls)[number]["config"]) => {
          calls.push({ url, config });
          return { data: response };
        },
      },
    },
    "@/services/api/api-error": { ApiError },
  });
  const { destinationsApi } = load<
    typeof import("../src/features/trip/api/destinations-api.ts")
  >("src/features/trip/api/destinations-api.ts");
  const signal = new AbortController().signal;
  const result = await destinationsApi.list("  lam dong  ", 1, signal);
  assert.equal(result.content[0].id, id);
  assert.equal(calls[0].url, "/api/v1/destinations");
  assert.equal(calls[0].config.signal, signal);
  assert.equal(
    JSON.stringify(calls[0].config.params),
    JSON.stringify({ q: "lam dong", page: 1, size: 20 }),
  );
  for (const invalid of [
    { ...page, content: [{ ...option, id: "bad" }] },
    { ...page, page: -1 },
    { ...page, size: 101 },
    { ...page, context: {} },
  ]) {
    response = { success: true, data: invalid };
    await assert.rejects(
      destinationsApi.list("", 0),
      (error: unknown) =>
        error instanceof ApiError && error.code === "INVALID_RESPONSE",
    );
  }
  const before = calls.length;
  for (const [q, p] of [
    ["a".repeat(121), 0],
    ["", -1],
    ["", 0.5],
  ] as const)
    await assert.rejects(destinationsApi.list(q, p));
  assert.equal(calls.length, before);
});

test("catalog query scopes cache to owner/search, disables preview and paginates with cancellation", async () => {
  let owner: string | undefined = "owner-a";
  let debounced = "old";
  type Options = {
    queryKey: unknown;
    enabled: boolean;
    initialPageParam: number;
    queryFn: (input: {
      pageParam: number;
      signal: AbortSignal;
    }) => Promise<unknown>;
    getNextPageParam: (value: typeof page) => number | undefined;
  };
  let options: Options | undefined;
  const calls: unknown[][] = [];
  const load = tripModuleLoader({
    "@/features/auth/hooks/use-auth": {
      useProfile: () => ({ data: owner ? { id: owner } : undefined }),
    },
    "../hooks/use-debounced-value": { useDebouncedValue: () => debounced },
    "@tanstack/react-query": {
      useInfiniteQuery: (value: Options) => {
        options = value;
        return { marker: true };
      },
    },
    "./destinations-api": {
      destinationQueryKeys: {
        list: (user: string, q: string) => ["destinations", user, q],
      },
      destinationsApi: {
        list: async (...args: unknown[]) => {
          calls.push(args);
          return page;
        },
      },
    },
  });
  const { useDestinationsQuery } = load<
    typeof import("../src/features/trip/api/destinations-queries.ts")
  >("src/features/trip/api/destinations-queries.ts");
  assert.equal(useDestinationsQuery("new", true).isDebouncing, true);
  assert.ok(options);
  assert.equal(
    JSON.stringify(options.queryKey),
    '["destinations","owner-a","old"]',
  );
  const signal = new AbortController().signal;
  await options.queryFn({ pageParam: 1, signal });
  assert.equal(calls[0][0], "old");
  assert.equal(calls[0][1], 1);
  assert.equal(calls[0][2], signal);
  assert.equal(options.getNextPageParam(page), 1);
  assert.equal(options.getNextPageParam({ ...page, page: 1 }), undefined);
  useDestinationsQuery("new", false);
  assert.equal(options.enabled, false);
  owner = undefined;
  useDestinationsQuery("new", true);
  assert.equal(options.enabled, false);
  owner = "owner-b";
  debounced = "new";
  assert.equal(useDestinationsQuery(" new ", true).isDebouncing, false);
  assert.equal(
    JSON.stringify(options.queryKey),
    '["destinations","owner-b","new"]',
  );
});

type Node = { type: unknown; props: Record<string, unknown> };
function isNode(value: unknown): value is Node {
  return (
    !!value && typeof value === "object" && "type" in value && "props" in value
  );
}
function nodes(tree: unknown, type: string): Node[] {
  if (Array.isArray(tree)) return tree.flatMap((child) => nodes(child, type));
  if (!isNode(tree)) return [];
  return [
    ...(tree.type === type ? [tree] : []),
    ...nodes(tree.props.children, type),
  ];
}
function invoke(node: Node, name: string, ...args: unknown[]) {
  const fn = node.props[name];
  assert.equal(typeof fn, "function");
  return (fn as (...values: unknown[]) => unknown)(...args);
}
function pickerHarness(preview = false) {
  let states: unknown[] = [];
  let cursor = 0;
  const state = {
    data: { pages: [page] },
    isPending: false,
    isError: false,
    isFetching: false,
    isFetchNextPageError: false,
    isFetchingNextPage: false,
    hasNextPage: true,
    refetch: () => {
      retries++;
    },
    fetchNextPage: () => {
      nextPages++;
    },
  };
  let retries = 0;
  let nextPages = 0;
  let debouncing = false;
  const commits: unknown[][] = [];
  const queries: unknown[][] = [];
  let pendingClose: (() => void) | undefined;
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const element = (type: unknown, props: Record<string, unknown>) => ({
    type,
    props,
  });
  const load = tripModuleLoader({
    react: {
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
      useMemo: (get: () => unknown) => get(),
    },
    "react/jsx-runtime": { jsx: element, jsxs: element, Fragment: "Fragment" },
    "react-native": {
      View: "View",
      Pressable: "Pressable",
      Modal: "Modal",
      FlatList: "FlatList",
      TextInput: "TextInput",
      ActivityIndicator: "ActivityIndicator",
      KeyboardAvoidingView: "KeyboardAvoidingView",
      Platform: {
        OS: "android",
        select: (values: { default: unknown }) => values.default,
      },
      StyleSheet: {
        create: (value: unknown) => value,
        absoluteFill: {},
        hairlineWidth: 1,
      },
    },
    "react-native-gesture-handler": {
      GestureDetector: "GestureDetector",
      GestureHandlerRootView: "GestureHandlerRootView",
    },
    "react-native-reanimated": {
      __esModule: true,
      default: { View: "Animated.View" },
    },
    "@/constants/development": { UI_PREVIEW_ENABLED: preview },
    "@/hooks/use-screen-insets": {
      useScreenInsets: () => ({ top: 36, bottom: 24, left: 0, right: 0 }),
    },
    "@/hooks/use-app-theme": {
      useAppTheme: () => ({
        ...tokens,
        colors: new Proxy({}, { get: () => "color" }),
      }),
    },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "../api/destinations-queries": {
      useDestinationsQuery: (...args: unknown[]) => {
        queries.push(args);
        return { query: state, isDebouncing: debouncing };
      },
    },
    "../hooks/use-picker-sheet-motion": {
      usePickerSheetMotion: () => ({
        close: (apply?: () => void) => {
          pendingClose = apply;
        },
        reduceMotion: true,
      }),
    },
  });
  const { DestinationPickerSheet } = load<
    typeof import("../src/features/trip/components/destination-picker-sheet.tsx")
  >("src/features/trip/components/destination-picker-sheet.tsx");
  const render = (provinceId: string | null = id) => {
    cursor = 0;
    const outer: unknown = DestinationPickerSheet({
      visible: true,
      currentDestination: option.name,
      currentProvinceId: provinceId,
      onSelect: (...args: unknown[]) => commits.push(args),
      onClose: () => {},
    });
    assert.ok(isNode(outer));
    assert.equal(typeof outer.type, "function");
    return (outer.type as (props: unknown) => Node)(outer.props);
  };
  return {
    state,
    commits,
    queries,
    render,
    setDebouncing: (value: boolean) => {
      debouncing = value;
    },
    finishClose: () => pendingClose?.(),
    counts: () => ({ retries, nextPages }),
    reset: () => {
      states = [];
    },
  };
}
function list(tree: unknown) {
  const value = nodes(tree, "FlatList")[0];
  assert.ok(value);
  return value;
}
function row(value: Node, index: number) {
  assert.ok(Array.isArray(value.props.data));
  const result = invoke(value, "renderItem", { item: value.props.data[index] });
  assert.ok(isNode(result));
  return result;
}

test("picker commits exact catalog ID after exit and free text clears it, even for same name", () => {
  const h = pickerHarness();
  let tree = h.render();
  let value = list(tree);
  assert.equal(
    (row(value, 0).props.accessibilityState as { selected: boolean }).selected,
    true,
  );
  invoke(row(value, 0), "onPress");
  assert.equal(h.commits.length, 0);
  h.finishClose();
  assert.equal(JSON.stringify(h.commits[0]), JSON.stringify([option.name, id]));
  invoke(nodes(tree, "TextInput")[0], "onChangeText", option.name);
  tree = h.render();
  value = list(tree);
  assert.equal(
    (row(value, 0).props.accessibilityState as { selected: boolean }).selected,
    false,
  );
  invoke(row(value, 0), "onPress");
  h.finishClose();
  assert.equal(
    JSON.stringify(h.commits[1]),
    JSON.stringify([option.name, null]),
  );
  invoke(nodes(tree, "TextInput")[0], "onChangeText", "  Đà Lạt  ");
  tree = h.render();
  invoke(nodes(tree, "TextInput")[0], "onSubmitEditing");
  h.finishClose();
  assert.equal(JSON.stringify(h.commits[2]), JSON.stringify(["Đà Lạt", null]));
});

test("picker hides stale catalog matches while debouncing, keeps manual choice and supports empty/retry/page append", () => {
  const h = pickerHarness();
  let tree = h.render();
  invoke(nodes(tree, "TextInput")[0], "onChangeText", "Đà Lạt");
  h.setDebouncing(true);
  tree = h.render();
  assert.equal((list(tree).props.data as unknown[]).length, 1);
  assert.equal(
    nodes(list(tree).props.ListHeaderComponent, "ActivityIndicator").length,
    1,
  );
  assert.equal(
    nodes(list(tree).props.ListFooterComponent, "AppButton").length,
    0,
  );
  h.setDebouncing(false);
  h.state.data.pages = [{ ...page, content: [] }];
  h.state.hasNextPage = false;
  tree = h.render();
  assert.ok(nodes(list(tree).props.ListFooterComponent, "AppText").length);
  h.state.isError = true;
  tree = h.render();
  invoke(
    nodes(list(tree).props.ListFooterComponent, "AppButton")[0],
    "onPress",
  );
  assert.equal(h.counts().retries, 1);
  h.state.isFetchNextPageError = true;
  tree = h.render();
  invoke(
    nodes(list(tree).props.ListFooterComponent, "AppButton")[0],
    "onPress",
  );
  assert.equal(h.counts().nextPages, 1);
  h.state.isError = false;
  h.state.hasNextPage = true;
  h.state.data.pages = [
    page,
    {
      ...page,
      page: 1,
      content: [{ ...option, id: "61b35dfc-a22e-4dc6-94d2-223f4225bc71" }],
    },
  ];
  tree = h.render();
  assert.equal((list(tree).props.data as unknown[]).length, 3);
  h.state.isFetching = true;
  tree = h.render();
  assert.equal(
    nodes(list(tree).props.ListFooterComponent, "AppButton")[0].props.disabled,
    true,
  );
});

test("cancel never commits a selection; preview uses local suggestions with catalog disabled", () => {
  const h = pickerHarness(true);
  const tree = h.render();
  assert.equal(h.queries[0][1], false);
  assert.equal((list(tree).props.data as unknown[]).length, 8);
  invoke(nodes(tree, "Modal")[0], "onRequestClose");
  h.finishClose();
  assert.equal(h.commits.length, 0);
});

test("edit payload handles same-name ID changes, explicit clearing and unrelated edits", () => {
  const spec = JSON.parse(
    readFileSync(
      new URL("../docs/api/trip-crud.openapi.json", import.meta.url),
      "utf8",
    ),
  );
  const original = tripReadSchema.parse(
    spec.components.schemas.TripResponse.example.data,
  ).trip;
  const base = {
    ...original,
    destination: { name: option.name, provinceId: id },
  };
  assert.equal(tripViewModel(base, base).destinationProvinceId, id);
  const { tripEditPayload } = tripModuleLoader({
    "@/services/api/api-error": { ApiError },
  })<typeof import("../src/features/trip/api/trip-edit-payload.ts")>(
    "src/features/trip/api/trip-edit-payload.ts",
  );
  const change: TripMutation = {
    kind: "info",
    changedFields: ["destinationProvinceId"],
    values: { destination: option.name, destinationProvinceId: null },
  };
  assert.equal(tripEditPayload(change, base, 4).destination?.provinceId, null);
  assert.equal(
    tripEditPayload(
      { ...change, values: { destinationProvinceId: id } },
      base,
      4,
    ).destination?.name,
    option.name,
  );
  const notes: TripMutation = {
    kind: "info",
    changedFields: ["notes"],
    values: {
      notes: "Only a note",
      destination: option.name,
      destinationProvinceId: null,
    },
  };
  assert.equal(
    Object.hasOwn(tripEditPayload(notes, base, 4), "destination"),
    false,
  );
});

test("actual create/edit forms carry picker IDs through RHF and submit payloads", async () => {
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const element = (type: unknown, props: Record<string, unknown>) => ({
    type,
    props,
  });
  let values: Record<string, unknown> = {};
  let defaults: Record<string, unknown> = {};
  const dirty: Record<string, boolean> = {};
  let states: unknown[] = [];
  let cursor = 0;
  const submits: unknown[] = [];
  const navigated: unknown[] = [];
  const load = tripModuleLoader(
    {
      react: {
        useState: (initial: unknown) => {
          const i = cursor++;
          if (!(i in states)) states[i] = initial;
          return [
            states[i],
            (next: unknown) => {
              states[i] = next;
            },
          ];
        },
        useRef: (current: unknown) => ({ current }),
      },
      "react/jsx-runtime": {
        jsx: element,
        jsxs: element,
        Fragment: "Fragment",
      },
      "react-hook-form": {
        Controller: "Controller",
        useForm: (options: { defaultValues: Record<string, unknown> }) => {
          if (!Object.keys(values).length) {
            values = { ...options.defaultValues };
            defaults = { ...values };
          }
          return {
            control: {},
            formState: {
              errors: {},
              isDirty: true,
              isSubmitting: false,
              dirtyFields: dirty,
              defaultValues: defaults,
            },
            setValue: (
              key: string,
              value: unknown,
              config?: { shouldDirty: boolean },
            ) => {
              values[key] = value;
              if (config?.shouldDirty) dirty[key] = value !== defaults[key];
            },
            handleSubmit:
              (submit: (value: Record<string, unknown>) => unknown) => () =>
                submit({ ...values, budget: undefined }),
          };
        },
        useController: ({ name }: { name: string }) => ({
          field: {
            value: values[name],
            onChange: (v: unknown) => {
              values[name] = v;
            },
          },
        }),
        useWatch: ({ name }: { name?: string[] }) =>
          name ? name.map((key) => values[key]) : { ...values },
      },
      "@hookform/resolvers/zod": { zodResolver: () => ({}) },
      "react-native": {
        View: "View",
        Pressable: "Pressable",
        Modal: "Modal",
        TextInput: "TextInput",
        ScrollView: "ScrollView",
        KeyboardAvoidingView: "KeyboardAvoidingView",
        Keyboard: { dismiss: () => {} },
        Platform: {
          OS: "android",
          select: (v: { default: unknown }) => v.default,
        },
        StyleSheet: { create: (v: unknown) => v, hairlineWidth: 1 },
      },
      "react-native-reanimated": { useReducedMotion: () => true },
      "@/hooks/use-screen-insets": {
        useScreenInsets: () => ({ top: 36, bottom: 24, left: 0, right: 0 }),
      },
      "@/hooks/use-app-theme": {
        useAppTheme: () => ({
          ...tokens,
          colors: new Proxy({}, { get: () => "color" }),
        }),
      },
      "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
      "@/components/ui/app-text": { AppText: "AppText" },
      "@/components/ui/app-button": { AppButton: "AppButton" },
      "@/components/ui/app-input": { AppInput: "AppInput" },
      "@/components/ui/app-icon": { AppIcon: "AppIcon" },
      "./destination-picker-sheet": {
        DestinationPickerSheet: "DestinationPickerSheet",
      },
      "./date-range-sheet": { DateRangeSheet: "DateRangeSheet" },
      "../screens/place-picker-screen": {
        PlacePickerScreen: "PlacePickerScreen",
      },
      "../utils/confirm-discard": { confirmDiscard: () => {} },
      "@/constants/development": { UI_PREVIEW_ENABLED: false },
      "@/features/home/providers/trip-preview-provider": {
        useTripPreview: () => ({ today: "2026-11-03", createDraft: () => {} }),
      },
      "../api/trip-queries": {
        useCreateTripMutation: () => ({
          mutateAsync: async (value: unknown) => {
            submits.push(value);
            return { trip: { id } };
          },
        }),
      },
      "expo-router": {
        router: {
          push: (route: unknown) => {
            navigated.push(route);
          },
        },
      },
    },
    { Date, crypto: globalThis.crypto },
  );
  const { CreateTripModal } = load<
    typeof import("../src/features/trip/components/create-trip-modal.tsx")
  >("src/features/trip/components/create-trip-modal.tsx");
  const renderCreate = () => {
    cursor = 0;
    const outer: unknown = CreateTripModal({
      visible: true,
      onClose: () => {},
    });
    assert.ok(isNode(outer));
    return (outer.type as (props: unknown) => Node)(outer.props);
  };
  let tree = renderCreate();
  invoke(nodes(tree, "DestinationPickerSheet")[0], "onSelect", option.name, id);
  tree = renderCreate();
  assert.equal(
    nodes(tree, "DestinationPickerSheet")[0].props.currentProvinceId,
    id,
  );
  values.startDate = "2026-11-20";
  values.endDate = "2026-11-21";
  tree = renderCreate();
  const submitButton = nodes(tree, "AppButton").find(
    (node) => node.props.variant === "raised",
  );
  assert.ok(submitButton);
  await Promise.all([
    invoke(submitButton, "onPress"),
    invoke(submitButton, "onPress"),
  ]);
  assert.equal(
    submits.length,
    1,
    "rapid submissions must issue only one create request",
  );
  assert.equal(
    navigated.length,
    1,
    "successful creation must navigate only once",
  );
  assert.equal(
    (submits[0] as { destination: { provinceId: string } }).destination
      .provinceId,
    id,
  );
  invoke(nodes(tree, "DestinationPickerSheet")[0], "onSelect", "Đà Lạt", null);
  assert.equal(values.destinationProvinceId, null);

  values = {};
  states = [];
  Object.keys(dirty).forEach((key) => delete dirty[key]);
  const spec = JSON.parse(
    readFileSync(
      new URL("../docs/api/trip-crud.openapi.json", import.meta.url),
      "utf8",
    ),
  );
  const base = tripReadSchema.parse(
    spec.components.schemas.TripResponse.example.data,
  ).trip;
  const trip = tripViewModel(
    { ...base, destination: { name: option.name, provinceId: id } },
    base,
  );
  const commits: TripMutation[] = [];
  const { TripEditForm } = load<
    typeof import("../src/features/trip/components/trip-edit-form.tsx")
  >("src/features/trip/components/trip-edit-form.tsx");
  const renderEdit = () => {
    cursor = 0;
    return TripEditForm({
      trip,
      today: "2026-11-03",
      onCommit: (mutation) => {
        commits.push(mutation);
        return true;
      },
    });
  };
  tree = renderEdit();
  invoke(nodes(tree, "Pressable")[0], "onPress");
  tree = renderEdit();
  assert.equal(
    nodes(tree, "DestinationPickerSheet")[0].props.currentProvinceId,
    id,
  );
  invoke(
    nodes(tree, "DestinationPickerSheet")[0],
    "onSelect",
    option.name,
    null,
  );
  tree = renderEdit();
  const editButton = nodes(tree, "AppButton").find(
    (node) => node.props.variant === "gradient",
  );
  assert.ok(editButton);
  await invoke(editButton, "onPress");
  const edit = commits[0];
  assert.equal(edit.kind, "info");
  if (edit.kind !== "info") throw new Error("Expected metadata edit");
  assert.ok(edit.changedFields?.includes("destinationProvinceId"));
  assert.equal(edit.values.destinationProvinceId, null);
  assert.equal(edit.changedFields?.includes("destination"), false);
});
