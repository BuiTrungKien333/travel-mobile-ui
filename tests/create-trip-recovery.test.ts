import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { TripStop } from "../src/features/home/types/home-types.ts";
import type { CreateTripSession, CreateTripProgress } from "../src/features/trip/api/create-trip-with-places.ts";
import type { AddTripPlaceRequest, TripResponse, TripPlaceResponse } from "../src/features/trip/api/trip-types.ts";

const id = "40000000-0000-0000-0000-000000000001";
const stamp = "2026-11-05T00:00:00Z";
const trip: TripResponse = {
  id, title: "Đà Nẵng", destination: { name: "Đà Nẵng" }, startDate: "2026-11-20", endDate: "2026-11-21",
  status: "PLANNING", mode: "PLANNING", timeZone: "Asia/Ho_Chi_Minh", version: 0, createdAt: stamp, updatedAt: stamp,
  readiness: { hasDates: true, hasPlaces: false, unscheduledCount: 0 }, dayCount: 2, stopCount: 0, memoryCount: 0,
  coverImageUrl: null, preferences: [], budget: null, accommodation: null, notes: null, days: [],
};
const stops: TripStop[] = [
  { id: "provider-a", providerPlaceId: "a", name: { vi: "Cầu Rồng", en: "Dragon Bridge" }, kind: { vi: "Cầu", en: "Bridge" },
    time: "", location: { latitude: 16.061, longitude: 108.227 }, note: "Đi buổi tối", durationMinutes: 40 },
  { id: "custom-b", name: { vi: "Chỗ hẹn", en: "Meeting point" }, kind: { vi: "Địa điểm riêng", en: "Private place" },
    time: "", location: { latitude: 16.05, longitude: 108.21 } },
];
function session(): CreateTripSession {
  return { request: { clientRequestId: id, title: trip.title, destination: trip.destination,
    startDate: "2026-11-20", endDate: "2026-11-21" }, stops: structuredClone(stops) };
}

/** Exercise the real API parsing as well as orchestration, with an HTTP boundary double. */
function server(mocks: Record<string, unknown> = {}) {
  const saved: TripPlaceResponse[] = [];
  const calls: { method: string; url: string; body?: unknown }[] = [];
  const failures = { createResponse: false, list: false, addAt: -1, lostAddResponse: false };
  let addCount = 0;
  const load = tripModuleLoader({ "@/services/api/client": { apiClient: {
    post: async (url: string, body: AddTripPlaceRequest) => {
      calls.push({ method: "POST", url, body });
      if (url === "/api/v1/trips") {
        if (failures.createResponse) { failures.createResponse = false; throw new Error("lost create response"); }
        return { data: { success: true, data: { trip, context: { serverTime: stamp, evaluatedDate: "2026-11-05" } } } };
      }
      const fail = addCount++ === failures.addAt;
      if (fail && !failures.lostAddResponse) throw new Error("offline");
      const placeId = `40000000-0000-0000-0000-${String(saved.length + 2).padStart(12, "0")}`;
      const place: TripPlaceResponse = {
        id: placeId, tripId: id, placeId, priority: 0, estimatedDuration: body.estimatedDuration ?? null,
        notes: body.notes ?? null, plannedOrder: body.plannedOrder ?? null, visited: false, createdAt: stamp, updatedAt: stamp,
        place: { id: placeId, providerPlaceId: body.providerPlaceId ?? null, name: body.name ?? "",
          latitude: body.latitude ?? null, longitude: body.longitude ?? null, address: body.address ?? null,
          category: body.category ?? null, provinceId: null, provinceName: null, createdAt: stamp },
      };
      saved.push(place);
      if (fail) throw new Error("lost place response");
      return { data: { success: true, data: place } };
    },
    get: async (url: string) => {
      calls.push({ method: "GET", url });
      if (failures.list) throw new Error("offline");
      return { data: { success: true, data: saved } };
    },
  } }, ...mocks });
  const { createTripWithPlaces } = load<typeof import("../src/features/trip/api/create-trip-with-places.ts")>("src/features/trip/api/create-trip-with-places.ts");
  const progress: CreateTripProgress[] = [];
  return { run: (input: CreateTripSession) => createTripWithPlaces(input, (value) => progress.push(value)),
    calls, saved, failures, progress, load };
}

test("creation adds selected places to the pool with metadata and reports actual progress", async () => {
  const api = server();
  const input = session();
  assert.equal(await api.run(input), id);
  assert.equal(input.tripId, id);
  assert.equal(api.saved.length, 2);
  assert.equal(api.saved[0].notes, "Đi buổi tối");
  assert.equal(api.saved[0].estimatedDuration, 40);
  assert.deepEqual(api.saved.map((place) => place.plannedOrder), [0, 1]);
  assert.equal(api.progress.at(-1)?.savedCount, 2);
  assert.equal(api.progress.at(-1)?.remainingStops.length, 0);
  assert.ok(api.calls.every((call) => !call.url.includes("itinerary")));
});

test("a partial failure retains the trip and resumes only missing places", async () => {
  const api = server();
  const input = session();
  api.failures.addAt = 1;
  await assert.rejects(api.run(input), /offline/);
  assert.equal(input.tripId, id);
  assert.equal(api.progress.at(-1)?.savedCount, 1);
  assert.equal(api.progress.at(-1)?.remainingStops[0].id, "custom-b");
  assert.equal(await api.run(input), id);
  assert.equal(api.saved.length, 2);
  assert.equal(api.calls.filter((call) => call.url === "/api/v1/trips").length, 1);
  assert.equal(api.calls.filter((call) => call.method === "GET").length, 2);
});

for (const failIndex of [0, 1]) {
  test(`lost place response ${failIndex}: retry reconciles provider/custom identity before POST`, async () => {
    const api = server();
    const input = session();
    api.failures.addAt = failIndex;
    api.failures.lostAddResponse = true;
    await assert.rejects(api.run(input), /lost place response/);
    assert.equal(await api.run(input), id);
    assert.equal(api.saved.length, 2);
    assert.equal(api.calls.filter((call) => call.method === "POST" && call.url.endsWith("/places")).length, 2);
  });
}

test("lost creation response reuses the original idempotency key", async () => {
  const api = server();
  const input = session();
  api.failures.createResponse = true;
  await assert.rejects(api.run(input), /lost create response/);
  assert.equal(input.tripId, undefined);
  assert.equal(await api.run(input), id);
  const creates = api.calls.filter((call) => call.url === "/api/v1/trips");
  assert.deepEqual(creates[0].body, creates[1].body);
  assert.equal(api.saved.length, 2);
});

test("failure to read the pool stops writes until reconciliation succeeds", async () => {
  const api = server();
  const input = session();
  api.failures.list = true;
  await assert.rejects(api.run(input), /offline/);
  assert.equal(input.tripId, id);
  assert.equal(api.saved.length, 0);
  api.failures.list = false;
  assert.equal(await api.run(input), id);
  assert.equal(api.calls.filter((call) => call.url === "/api/v1/trips").length, 1);
});

test("an invalid selection is rejected before creating a trip or adding any place", async () => {
  for (const location of [undefined, { latitude: 91, longitude: 108 }, { latitude: NaN, longitude: 108 }]) {
    const api = server();
    const input = session();
    input.stops[1].location = location;
    await assert.rejects(api.run(input));
    assert.equal(api.calls.length, 0);
  }
});

test("a trip with no initial places completes without an unnecessary list request", async () => {
  const api = server();
  const input = session();
  input.stops = [];
  assert.equal(await api.run(input), id);
  assert.equal(api.calls.length, 1);
});

test("duplicate selections with different local IDs do not add the same provider twice", async () => {
  const api = server();
  const input = session();
  input.stops = [stops[0], { ...stops[0], id: "another-local-id" }];
  await api.run(input);
  assert.equal(api.saved.length, 1);
  assert.equal(api.progress.at(-1)?.remainingStops.length, 0);
});

type Element = { type: string | ((props: Record<string, unknown>) => Element); props: Record<string, unknown> };
type MutationOptions = {
  mutationFn: (input: CreateTripSession) => Promise<string>;
  onSettled: (data: string | undefined, error: unknown, input: CreateTripSession) => Promise<void>;
};

/** Real form handlers, schema, mutation hook and API; replace only hooks/platform rendering. */
function formHarness() {
  const slots: unknown[] = [];
  let cursor = 0;
  const values = { destination: "Đà Nẵng", title: "Trip", startDate: "2099-11-20", endDate: "2099-11-21",
    budget: "", preferences: [], initialStops: structuredClone(stops) };
  const formState = { errors: {} as Record<string, { message: string }>, isSubmitting: false, isDirty: true };
  const navigated: string[] = [];
  const invalidations: unknown[] = [];
  const alerts: { buttons: { onPress?: () => void }[] }[] = [];
  let closed = 0;
  let validate: (() => Promise<void>) | undefined;
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>("src/theme/tokens.ts");
  const theme = { ...tokens, colors: new Proxy({}, { get: () => "#123456" }) };
  function state<T>(initial: T | (() => T)) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === "function" ? (initial as () => T)() : initial;
    return [slots[index], (value: T) => { slots[index] = value; }];
  }
  const mutation = { isPending: false, mutateAsync: async (_input: CreateTripSession): Promise<string> => id };
  const api = server({
    react: { useState: state, useRef: (initial: unknown) => state(() => ({ current: initial }))[0] },
    "react/jsx-runtime": { jsx: (type: Element["type"], props: Element["props"]) => ({ type, props }),
      jsxs: (type: Element["type"], props: Element["props"]) => ({ type, props }) },
    "react-native": { View: "View", Modal: "Modal", Pressable: "Pressable", ScrollView: "ScrollView",
      TextInput: "TextInput", KeyboardAvoidingView: "KeyboardAvoidingView", Keyboard: { dismiss() {} },
      Alert: { alert: (_title: string, _message: string, buttons: { onPress?: () => void }[]) => alerts.push({ buttons }) },
      Platform: { OS: "android", select: (options: { default: unknown }) => options.default },
      StyleSheet: { create: (styles: unknown) => styles, hairlineWidth: 1 } },
    "react-native-reanimated": { useReducedMotion: () => true },
    "@tanstack/react-query": {
      useQueryClient: () => ({ invalidateQueries: async (key: unknown) => { invalidations.push(key); } }),
      useMutation: (options: MutationOptions) => {
        mutation.mutateAsync = async (input) => {
          mutation.isPending = true;
          let result: string | undefined;
          let error: unknown;
          try { result = await options.mutationFn(input); return result; }
          catch (caught) { error = caught; throw caught; }
          finally { await options.onSettled(result, error, input); mutation.isPending = false; }
        };
        return mutation;
      },
    },
    "react-hook-form": {
      useWatch: () => values,
      useController: ({ name }: { name: keyof typeof values }) => ({ field: { value: values[name], onChange() {}, onBlur() {} } }),
      useForm: ({ resolver }: { resolver: (values: unknown, context: unknown, options: unknown) => Promise<{
        values: unknown; errors: Record<string, { message: string }>;
      }> }) => ({ control: {}, formState, setValue() {}, setFocus() {},
        clearErrors: (key: string) => { delete formState.errors[key]; },
        setError: (key: string, error: { message: string }) => { formState.errors[key] = error; },
        handleSubmit: (onValid: (input: unknown) => Promise<void>, onInvalid: (errors: unknown) => void) => async () => {
          await validate?.();
          const result = await resolver(values, {}, { criteriaMode: "firstError", fields: {}, shouldUseNativeValidation: false });
          if (Object.keys(result.errors).length) { formState.errors = result.errors; onInvalid(result.errors); return; }
          await onValid(result.values);
        },
      }),
    },
    "@/hooks/use-app-theme": { useAppTheme: () => theme },
    "@/hooks/use-screen-insets": { useScreenInsets: () => ({ top: 0, bottom: 0 }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/utils/create-request-id": { createRequestId: () => id },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "./date-range-sheet": { DateRangeSheet: "DateRangeSheet" },
    "./destination-picker-sheet": { DestinationPickerSheet: "DestinationPickerSheet" },
    "../screens/place-picker-screen": { PlacePickerScreen: "PlacePickerScreen" },
  });
  const { CreateTripModal } = api.load<typeof import("../src/features/trip/components/create-trip-modal.tsx")>("src/features/trip/components/create-trip-modal.tsx");
  function render() {
    cursor = 0;
    let tree = CreateTripModal({ visible: true, onClose: () => { closed++; }, onCreated: (tripId) => navigated.push(tripId) }) as Element;
    if (typeof tree.type === "function") tree = tree.type(tree.props);
    const elements: Element[] = [];
    function visit(node: unknown) {
      if (Array.isArray(node)) { node.forEach(visit); return; }
      if (!node || typeof node !== "object" || !("props" in node)) return;
      const element = node as Element;
      elements.push(element);
      visit(element.props.children);
    }
    visit(tree);
    return elements;
  }
  function button(label: string) {
    const found = render().find((element) => element.type === "AppButton" && element.props.children === label);
    assert.ok(found, `Missing button ${label}`);
    return found.props.onPress as () => Promise<void>;
  }
  return { ...api, render, button, navigated, invalidations, alerts, values,
    get closed() { return closed; }, setValidation: (callback: () => Promise<void>) => { validate = callback; } };
}

test("form keeps a partial save open, warns before leaving, retries and opens the same trip", async () => {
  const ui = formHarness();
  ui.failures.addAt = 1;
  await ui.button("Tạo chuyến đi")();
  assert.equal(ui.navigated.length, 0);
  assert.equal(ui.closed, 0);
  assert.equal(ui.saved.length, 1);
  assert.equal(ui.invalidations.length, 1);
  const elements = ui.render();
  assert.ok(elements.some((element) => element.props.children === "Chỗ hẹn"));
  assert.ok(elements.some((element) => element.props.accessibilityRole === "alert"));
  assert.ok(!elements.some((element) => element.type === "TextInput"));
  await ui.button("Mở chuyến đi, thêm sau")();
  assert.equal(ui.alerts.length, 1);
  assert.equal(ui.navigated.length, 0);
  await ui.button("Thử thêm địa điểm còn lại")();
  assert.deepEqual(ui.navigated, [id]);
  assert.equal(ui.saved.length, 2);
  assert.equal(ui.invalidations.length, 2);
  assert.equal(ui.calls.filter((call) => call.url === "/api/v1/trips").length, 1);
});

test("rapid taps and Android Back during validation cannot submit twice or discard the form", async () => {
  const ui = formHarness();
  let release = () => {};
  ui.setValidation(() => new Promise<void>((resolve) => { release = resolve; }));
  const create = ui.button("Tạo chuyến đi");
  const pending = create();
  await create();
  const modal = ui.render().find((element) => element.type === "Modal");
  assert.ok(modal);
  (modal.props.onRequestClose as () => void)();
  assert.equal(ui.alerts.length, 0);
  assert.equal(ui.closed, 0);
  release();
  await pending;
  assert.equal(ui.calls.filter((call) => call.url === "/api/v1/trips").length, 1);
  assert.deepEqual(ui.navigated, [id]);
});

test("create response lost: form retains its values and retries the same request key", async () => {
  const ui = formHarness();
  ui.failures.createResponse = true;
  await ui.button("Tạo chuyến đi")();
  assert.equal(ui.navigated.length, 0);
  assert.equal(ui.values.initialStops.length, 2);
  assert.equal(ui.invalidations.length, 0);
  await ui.button("Tạo chuyến đi")();
  assert.deepEqual(ui.navigated, [id]);
  const requests = ui.calls.filter((call) => call.url === "/api/v1/trips");
  assert.deepEqual(requests[0].body, requests[1].body);
});
