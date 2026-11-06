import assert from "node:assert/strict";
import { test } from "node:test";
import type { Memory, Trip } from "../src/features/home/types/home-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown, type: string): Node[] {
  if (Array.isArray(value)) return value.flatMap((item) => nodes(item, type));
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const item = value as Node;
  return [...(item.type === type ? [item] : []), ...nodes(item.props.children, type), ...nodes(item.props.ListHeaderComponent, type)];
}
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

function fixture() {
  const memory: Memory = { id: "photo", photo: "file:///private/photo.jpg", text: "", destination: "", date: "2026-01-01", time: "10:00",
    local: { capturedAt: "2026-01-01T03:00:00Z", deviceSaved: false } };
  const trip: Trip = { id: "trip", destination: "Da Nang", status: "planned", days: [{ date: "2026-01-01", stops: [] }] };
  const slots: unknown[] = []; let cursor = 0; let assigns = 0; let uploads = 0; let alerts = 0;
  const routes: unknown[] = [];
  const state = { localPhotoStatus: "ready", loadLocalPhotos() {}, exportLocalPhoto: async () => {},
    assignLocalPhoto: async (_id: string, selection: { day: string }) => { assigns++; memory.tripId = trip.id; memory.date = selection.day; } };
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>("src/theme/tokens.ts");
  const load = tripModuleLoader({
    react: { useState: (initial: unknown) => {
      const index = cursor++; if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value: unknown) => { slots[index] = value; }];
    }, useRef: (initial: unknown) => { const index = cursor++; return slots[index] ??= { current: initial }; } },
    "react/jsx-runtime": { jsx: (type: unknown, props: Record<string, unknown>) => ({ type, props }),
      jsxs: (type: unknown, props: Record<string, unknown>) => ({ type, props }) },
    "expo-router": { router: { push: (route: unknown) => routes.push(route) } },
    "expo-router/react-navigation": { usePreventRemove() {} },
    "react-native": { ActivityIndicator: "Spinner", FlatList: "FlatList", View: "View", Alert: { alert: () => { alerts++; } } },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "en" }) },
    "@/components/ui/app-text": { AppText: "AppText" }, "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/features/home/providers/trip-preview-provider": { useTripPreview: (select: (value: typeof state) => unknown) => select(state) },
    "../hooks/use-memories": { useMemories: () => ({ memories: [memory], trips: [trip], isPending: false, isError: false }),
      useMemoryActions: () => ({ remove: { isError: false, isPending: false, mutate() {} }, upload: { mutateAsync: async ({ memory: photo }: { memory: Memory }) => {
        uploads++; assert.equal(photo.tripId, trip.id); assert.equal(photo.photo, memory.photo); throw new Error("offline");
      } } }) },
    "../components/memory-capture-picker": { MemoryCapturePicker: "MemoryCapturePicker" },
    "../components/memory-load-state": { MemoryLoadState: "MemoryLoadState" },
    "../components/memory-primitives": { MemoryPage: "MemoryPage", MemoryEmpty: "MemoryEmpty", MemoryIconButton: "MemoryIconButton" },
  });
  const { SavedLaterScreen } = load<typeof import("../src/features/memories/screens/saved-later-screen.tsx")>("src/features/memories/screens/saved-later-screen.tsx");
  function render() { cursor = 0; return SavedLaterScreen(); }
  function choose() {
    const list = nodes(render(), "FlatList")[0];
    const row = (list.props.renderItem as (input: { item: Memory }) => Node)({ item: memory });
    const buttons = nodes(row, "AppButton");
    (buttons.find((button) => button.props.children === "Add to a trip")?.props.onPress as () => void)();
    return nodes(render(), "MemoryCapturePicker")[0].props as { onSelect: (selection: { tripId: string; day: string; stopId: string }) => void };
  }
  return { memory, render, choose, routes, get assigns() { return assigns; }, get uploads() { return uploads; }, get alerts() { return alerts; } };
}

test("assigning a saved-later photo is tap guarded, retains the private copy on upload failure and offers the trip album", async () => {
  const f = fixture(); const picker = f.choose();
  const target = { tripId: "trip", day: "2026-01-01", stopId: "" };
  picker.onSelect(target); picker.onSelect(target); await flush();
  assert.equal(f.assigns, 1); assert.equal(f.uploads, 1);
  assert.equal(f.memory.photo, "file:///private/photo.jpg"); assert.equal(f.memory.tripId, "trip");
  const tree = f.render(); assert.ok(nodes(tree, "AppText").some((node) => node.props.accessibilityRole === "alert"));
  const album = nodes(tree, "AppButton").find((node) => node.props.children === "Open trip album");
  assert.ok(album); (album.props.onPress as () => void)(); assert.equal(f.routes.length, 1);
});

test("a future assignment is rejected before changing the local photo and leaves destination selection open", () => {
  const f = fixture(); f.choose().onSelect({ tripId: "trip", day: "2099-01-01", stopId: "" });
  assert.equal(f.assigns, 0); assert.equal(f.uploads, 0); assert.equal(f.alerts, 1);
  assert.equal(f.memory.tripId, undefined); assert.equal(nodes(f.render(), "MemoryCapturePicker").length, 1);
});
