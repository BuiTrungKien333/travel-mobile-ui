import assert from "node:assert/strict";
import { test } from "node:test";
import type { LocalMemory } from "../src/features/memories/schemas/local-memory-schema.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

function fixture() {
  const records = new Map<string, LocalMemory>();
  let failRead = false;
  let failWrite = false;
  let copies = 0;
  let galleryWrites = 0;
  const load = tripModuleLoader({
    "../services/journal-photo-actions": {
      saveJournalPhoto: async () => {
        galleryWrites++;
      },
    },
    "@/features/memories/services/local-memory-storage": {
      readLocalMemories: async () => {
        if (failRead) throw new Error("Storage locked");
        return [...records.values()];
      },
      createLocalMemory: async (
        _uri: string,
        metadata: Omit<LocalMemory, "photo">,
      ) => {
        if (failWrite) throw new Error("Disk full");
        copies++;
        const record = {
          ...metadata,
          photo: `file:///documents/tripzy-memories/${metadata.id}.jpg`,
        };
        records.set(record.id, record);
        return record;
      },
      writeLocalMemory: async (memory: LocalMemory) => {
        if (failWrite) throw new Error("Disk full");
        records.set(memory.id, memory);
      },
      deleteLocalMemory: async (memory: LocalMemory) => {
        if (failWrite) throw new Error("Storage locked");
        records.delete(memory.id);
      },
    },
  });
  const { createPreviewStore } = load<
    typeof import("../src/features/home/store/trip-preview-store.ts")
  >("src/features/home/store/trip-preview-store.ts");
  return {
    createPreviewStore,
    records,
    setReadError: (value: boolean) => {
      failRead = value;
    },
    setWriteError: (value: boolean) => {
      failWrite = value;
    },
    copies: () => copies,
    galleryWrites: () => galleryWrites,
  };
}

test("quick capture needs no trip and survives hydration and scenario changes before being organized", async () => {
  const f = fixture();
  const store = f.createPreviewStore();
  const memory = await store
    .getState()
    .saveLocalPhoto({ uri: "file:///cache/camera.jpg" });
  assert.equal(memory.tripId, undefined);
  assert.equal(memory.local.deviceSaved, false);
  assert.ok(memory.photo.startsWith("file:///documents/"));
  store.getState().changeScenario("new");
  assert.equal(store.getState().memories[0].id, memory.id);
  const restored = f.createPreviewStore();
  await restored.getState().loadLocalPhotos();
  assert.equal(
    restored.getState().memories.find((item) => item.id === memory.id)?.photo,
    memory.photo,
  );
  await restored.getState().markLocalPhotoSaved(memory.id);
  assert.equal(f.copies(), 1);
  await restored
    .getState()
    .assignLocalPhoto(memory.id, {
      tripId: "past-dalat",
      day: "2026-09-18",
      stopId: "square",
    });
  const assigned = restored
    .getState()
    .memories.find((item) => item.id === memory.id);
  assert.equal(assigned?.tripId, "past-dalat");
  assert.equal(assigned?.place?.vi, "Quảng trường Lâm Viên");
  assert.equal(assigned?.local?.deviceSaved, true);
  await restored.getState().updateMemoryNote(memory.id, "A lasting moment");
  const reopened = f.createPreviewStore();
  await reopened.getState().loadLocalPhotos();
  assert.equal(
    reopened.getState().memories.find((item) => item.id === memory.id)?.text,
    "A lasting moment",
  );
  assert.equal(f.copies(), 1);
  await reopened.getState().removeMemory(memory.id);
  assert.equal(f.records.size, 0);
});

test("storage errors retain photos and don't report successful assignment or export", async () => {
  const f = fixture();
  const store = f.createPreviewStore();
  const memory = await store
    .getState()
    .saveLocalPhoto({ uri: "file:///cache/camera.jpg" });
  f.setWriteError(true);
  await assert.rejects(store.getState().markLocalPhotoSaved(memory.id));
  await assert.rejects(
    store
      .getState()
      .assignLocalPhoto(memory.id, {
        tripId: "past-dalat",
        day: "2026-09-18",
        stopId: "square",
      }),
  );
  await assert.rejects(store.getState().removeMemory(memory.id));
  const retained = store
    .getState()
    .memories.find((item) => item.id === memory.id);
  assert.equal(retained?.tripId, undefined);
  assert.equal(retained?.local?.deviceSaved, false);
  assert.equal(f.records.size, 1);
});

test("invalid assignment and external URIs are rejected before changing persisted data", async () => {
  const f = fixture();
  const store = f.createPreviewStore();
  await assert.rejects(
    store.getState().saveLocalPhoto({ uri: "https://example.com/private.jpg" }),
  );
  const memory = await store
    .getState()
    .saveLocalPhoto({ uri: "file:///cache/camera.jpg" });
  for (const selection of [
    { tripId: "missing", day: "2026-09-18", stopId: "square" },
    { tripId: "past-dalat", day: "2020-01-01", stopId: "square" },
    { tripId: "past-dalat", day: "2026-09-18", stopId: "missing" },
  ])
    await assert.rejects(
      store.getState().assignLocalPhoto(memory.id, selection),
    );
  assert.equal(f.records.get(memory.id)?.tripId, undefined);
});

test("failed hydration has a recoverable state and blocks writes until a successful retry", async () => {
  const f = fixture();
  const store = f.createPreviewStore();
  f.setReadError(true);
  await store.getState().loadLocalPhotos();
  assert.equal(store.getState().localPhotoStatus, "error");
  await assert.rejects(
    store.getState().saveLocalPhoto({ uri: "file:///cache/camera.jpg" }),
  );
  assert.equal(f.records.size, 0);
  f.setReadError(false);
  await store.getState().loadLocalPhotos();
  assert.equal(store.getState().localPhotoStatus, "ready");
  assert.ok(
    await store.getState().saveLocalPhoto({ uri: "file:///cache/camera.jpg" }),
  );
});

test("retrying metadata persistence or concurrent save requests never exports a second gallery copy", async () => {
  const f = fixture();
  const store = f.createPreviewStore();
  const memory = await store
    .getState()
    .saveLocalPhoto({ uri: "file:///cache/camera.jpg" });
  f.setWriteError(true);
  await assert.rejects(store.getState().exportLocalPhoto(memory.id));
  assert.equal(f.galleryWrites(), 1);
  assert.equal(f.records.get(memory.id)?.local.deviceSaved, false);
  f.setWriteError(false);
  await Promise.all([
    store.getState().exportLocalPhoto(memory.id),
    store.getState().exportLocalPhoto(memory.id),
  ]);
  assert.equal(f.galleryWrites(), 1);
  assert.equal(f.records.get(memory.id)?.local.deviceSaved, true);
});
