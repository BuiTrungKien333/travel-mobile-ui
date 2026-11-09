import assert from "node:assert/strict";
import { test } from "node:test";
import type { Memory, Trip } from "../src/features/home/types/home-types.ts";
import type { LocalMemory } from "../src/features/memories/schemas/local-memory-schema.ts";
import type { PhotoSelection } from "../src/features/home/utils/photo-viewer-geometry.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown, type: string): Node[] {
  if (Array.isArray(value)) return value.flatMap((item) => nodes(item, type));
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const item = value as Node;
  return [
    ...(item.type === type ? [item] : []),
    ...nodes(item.props.children, type),
    ...nodes(item.props.ListHeaderComponent, type),
  ];
}
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
const photo = (id = "local-photo"): LocalMemory => ({
  id,
  photo: `file:///private/${id}.jpg`,
  text: "Keep this note",
  destination: "",
  date: "2026-01-01",
  time: "10:00",
  local: {
    userId: "owner",
    capturedAt: "2026-01-01T03:00:00Z",
    deviceSaved: false,
    width: 800,
    height: 600,
  },
});
const trip: Trip = {
  id: "trip",
  destination: "Da Nang",
  status: "planned",
  days: [{ date: "2026-01-01", stops: [] }],
};

type Options = {
  initial?: LocalMemory[];
  uploadFails?: boolean;
  assignmentFails?: boolean;
  changeSessionOnAssign?: boolean;
};
function fixture(options: Options = {}) {
  let records = options.initial ?? [photo()];
  const slots: unknown[] = [];
  let cursor = 0;
  let version = 1;
  let assigns = 0;
  let uploads = 0;
  let alerts = 0;
  let uploadFails = options.uploadFails ?? true;
  let exported = 0;
  let deleted = 0;
  const uploadInputs: Memory[] = [];
  const routes: unknown[] = [];
  const effects: (() => void)[] = [];
  const state = {
    localPhotoStatus: "ready",
    loadLocalPhotos() {},
    exportLocalPhoto: async (id: string) => {
      exported++;
      records = records.map((item) =>
        item.id === id
          ? { ...item, local: { ...item.local, deviceSaved: true } }
          : item,
      );
    },
    assignLocalPhoto: async (
      id: string,
      selection: { day: string; stopId: string },
      selectedTrip: Trip,
    ) => {
      assigns++;
      if (options.assignmentFails) throw new Error("Disk full");
      assert.equal(selectedTrip, trip);
      const previous = records.find((item) => item.id === id);
      assert.ok(previous);
      const assigned: LocalMemory = {
        ...previous,
        tripId: trip.id,
        date: selection.day,
        destination: trip.destination,
        local: {
          ...previous.local,
          placeId: selection.stopId ? "place-id" : undefined,
        },
      };
      records = records.map((item) => (item.id === id ? assigned : item));
      if (options.changeSessionOnAssign) version++;
      return assigned;
    },
  };
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const load = tripModuleLoader({
    react: {
      useState: (initial: unknown) => {
        const index = cursor++;
        if (!(index in slots)) slots[index] = initial;
        return [
          slots[index],
          (value: unknown) => {
            slots[index] =
              typeof value === "function" ? value(slots[index]) : value;
          },
        ];
      },
      useRef: (initial: unknown) => {
        const index = cursor++;
        return (slots[index] ??= { current: initial });
      },
      useEffect: (effect: () => void) => effects.push(effect),
      useCallback: (callback: unknown) => callback,
    },
    "react/jsx-runtime": {
      jsx: (type: unknown, props: Record<string, unknown>) => ({ type, props }),
      jsxs: (type: unknown, props: Record<string, unknown>) => ({
        type,
        props,
      }),
    },
    "expo-router": {
      router: { push: (route: unknown) => routes.push(structuredClone(route)) },
    },
    "expo-router/react-navigation": { usePreventRemove() {} },
    "react-native": {
      ActivityIndicator: "Spinner",
      FlatList: "FlatList",
      View: "View",
      StyleSheet: { hairlineWidth: 1 },
      Platform: { OS: "android" },
      Alert: {
        alert: () => {
          alerts++;
        },
      },
    },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "en" }) },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/features/auth/services/auth-session": {
      authSession: { getVersion: () => version },
    },
    "@/features/home/components/journal-photo-viewer": {
      JournalPhotoViewer: "JournalPhotoViewer",
    },
    "@/features/home/components/journal-photo-thumbnail": {
      JournalPhotoThumbnail: "JournalPhotoThumbnail",
    },
    "@/features/home/providers/trip-preview-provider": {
      useTripPreview: (select: (value: typeof state) => unknown) =>
        select(state),
    },
    "../hooks/use-memories": {
      useMemories: () => {
        throw new Error("Xem sau must not depend on the remote library");
      },
      useLocalMemories: () => records,
      useMemoryActions: () => ({
        remove: {
          isPending: false,
          mutateAsync: async (memory: Memory) => {
            deleted++;
            records = records.filter((item) => item.id !== memory.id);
          },
        },
        upload: {
          mutateAsync: async ({
            memory,
            onProgress,
          }: {
            memory: Memory;
            onProgress?: (value: number) => void;
          }) => {
            uploads++;
            uploadInputs.push(memory);
            assert.equal(memory.tripId, trip.id);
            assert.ok(memory.local);
            onProgress?.(0.5);
            if (uploadFails) throw new Error("offline");
            records = records.map((item) =>
              item.id === memory.id
                ? { ...item, local: { ...item.local, uploaded: true } }
                : item,
            );
          },
        },
      }),
    },
    "../components/memory-capture-picker": {
      MemoryCapturePicker: "MemoryCapturePicker",
    },
    "../components/memory-primitives": {
      MemoryPage: "MemoryPage",
      MemoryEmpty: "MemoryEmpty",
      MemoryIconButton: "MemoryIconButton",
    },
  });
  const { SavedLaterScreen } = load<
    typeof import("../src/features/memories/screens/saved-later-screen.tsx")
  >("src/features/memories/screens/saved-later-screen.tsx");
  function render() {
    cursor = 0;
    return SavedLaterScreen();
  }
  function list() {
    return nodes(render(), "FlatList")[0];
  }
  function row(id: string) {
    const item = records.find((item) => item.id === id);
    assert.ok(item);
    const props = list().props;
    return (
      props.renderItem as (input: { item: Memory; index: number }) => Node
    )({ item, index: (props.data as Memory[]).findIndex((m) => m.id === id) });
  }
  function choose(id = "local-photo") {
    const button = nodes(row(id), "AppButton").find(
      (node) => node.props.children === "Add to a trip",
    );
    assert.ok(button);
    (button.props.onPress as () => void)();
    return nodes(render(), "MemoryCapturePicker")[0].props as {
      onSelect: (
        selection: { tripId: string; day: string; stopId: string },
        trip: Trip,
      ) => void;
      onClose: () => void;
    };
  }
  return {
    render,
    list,
    row,
    choose,
    routes,
    uploadInputs,
    get records() {
      return records;
    },
    get assigns() {
      return assigns;
    },
    get uploads() {
      return uploads;
    },
    get alerts() {
      return alerts;
    },
    get deleted() {
      return deleted;
    },
    get exported() {
      return exported;
    },
    succeedUpload: () => {
      uploadFails = false;
    },
  };
}
const target = { tripId: "trip", day: "2026-01-01", stopId: "" };

test("assignment is tap guarded, uploads the exact persisted snapshot and keeps failures visible", async () => {
  const f = fixture();
  const picker = f.choose();
  picker.onSelect({ ...target, stopId: "membership-id" }, trip);
  picker.onSelect(target, trip);
  await flush();
  assert.equal(f.assigns, 1);
  assert.equal(f.uploads, 1);
  assert.equal(f.records[0].photo, "file:///private/local-photo.jpg");
  assert.equal(f.uploadInputs[0], f.records[0]);
  assert.equal(f.uploadInputs[0].local?.placeId, "place-id");
  assert.equal((f.list().props.data as Memory[]).length, 1);
  assert.ok(
    nodes(f.render(), "AppText").some(
      (node) => node.props.accessibilityRole === "alert",
    ),
  );
  assert.ok(
    nodes(f.row("local-photo"), "AppText").some(
      (node) => node.props.children === "Waiting to sync to a trip",
    ),
  );
});

test("pending photos survive screen recreation and retry without another assignment", async () => {
  const f = fixture();
  f.choose().onSelect(target, trip);
  await flush();
  const reopened = fixture({ initial: f.records, uploadFails: false });
  assert.equal(reopened.uploads, 0);
  const retry = nodes(reopened.row("local-photo"), "AppButton").find(
    (node) => node.props.children === "Retry sync",
  );
  assert.ok(retry);
  (retry.props.onPress as () => void)();
  (retry.props.onPress as () => void)();
  await flush();
  assert.equal(reopened.uploads, 1);
  assert.equal(reopened.assigns, 0);
  assert.equal(reopened.records[0].local.uploaded, true);
  assert.equal((reopened.list().props.data as Memory[]).length, 0);
  const album = nodes(reopened.render(), "AppButton").find(
    (node) => node.props.children === "Open trip album",
  );
  assert.ok(album);
  (album.props.onPress as () => void)();
  assert.deepEqual(reopened.routes, [
    { pathname: "/memories/[tripId]", params: { tripId: "trip" } },
  ]);
});

test("future assignment is rejected without changing data and canceling never uploads", () => {
  const f = fixture();
  f.choose().onSelect({ ...target, day: "2099-01-01" }, trip);
  assert.equal(f.assigns, 0);
  assert.equal(f.uploads, 0);
  assert.equal(f.alerts, 1);
  assert.equal(nodes(f.render(), "MemoryCapturePicker").length, 1);
  f.choose().onClose();
  assert.equal(f.records[0].tripId, undefined);
  assert.equal(f.uploads, 0);
});

test("failed local storage never uploads and keeps the unassigned photo", async () => {
  const f = fixture({ assignmentFails: true });
  f.choose().onSelect(target, trip);
  await flush();
  assert.equal(f.uploads, 0);
  assert.equal(f.records[0].tripId, undefined);
  assert.equal((f.list().props.data as Memory[]).length, 1);
});

test("account change between assignment and upload stops synchronization", async () => {
  const f = fixture({ changeSessionOnAssign: true });
  f.choose().onSelect(target, trip);
  await flush();
  assert.equal(f.assigns, 1);
  assert.equal(f.uploads, 0);
  assert.equal(f.records[0].local.userId, "owner");
});

test("local offline photos open the existing viewer with the whole gallery and measured origin", async () => {
  const f = fixture({ initial: [photo(), photo("local-second")] });
  assert.equal(f.uploads, 0);
  const thumbnail = nodes(f.row("local-photo"), "JournalPhotoThumbnail")[0];
  assert.ok(thumbnail);
  const selection: PhotoSelection = {
    id: "local-photo",
    uri: "file:///private/local-photo.jpg",
    size: { width: 800, height: 600 },
    origin: { x: 10, y: 100, width: 300, height: 300 },
  };
  (
    thumbnail.props.registerPhoto as (
      id: string,
      read: () => PhotoSelection,
    ) => void
  )(selection.id, () => selection);
  (thumbnail.props.onOpen as (selection: PhotoSelection) => void)(selection);
  const viewer = nodes(f.render(), "JournalPhotoViewer")[0];
  assert.ok(viewer);
  assert.deepEqual(
    Array.from(viewer.props.memories as Memory[], (item) => item.id),
    ["local-photo", "local-second"],
  );
  assert.equal(
    (viewer.props.getSelection as (id: string) => PhotoSelection)(selection.id),
    selection,
  );
  const snapshot = viewer.props.memories;
  (viewer.props.onActiveChange as (id: string) => void)("local-second");
  assert.equal(
    nodes(f.row("local-second"), "JournalPhotoThumbnail")[0].props.hidden,
    true,
  );
  assert.equal(
    nodes(f.render(), "JournalPhotoViewer")[0].props.memories,
    snapshot,
  );
  await (viewer.props.onSave as (memory: Memory) => Promise<void>)(
    f.records[1],
  );
  assert.equal(f.exported, 1);
  assert.equal(f.records[1].local.deviceSaved, true);
  (viewer.props.onClose as () => void)();
  assert.equal(nodes(f.render(), "JournalPhotoViewer").length, 0);
  assert.equal(
    nodes(f.row("local-second"), "JournalPhotoThumbnail")[0].props.hidden,
    false,
  );
  assert.equal(f.uploads, 0);
});
