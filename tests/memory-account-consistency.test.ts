import assert from "node:assert/strict";
import { test } from "node:test";
import { webcrypto } from "node:crypto";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { LocalMemory } from "../src/features/memories/schemas/local-memory-schema.ts";

const owner = "10000000-0000-0000-0000-000000000001";
const serverId = "20000000-0000-0000-0000-000000000001";
const draft = (): LocalMemory => ({ id: "local-owned", photo: "file:///documents/owned.jpg", text: "Original", destination: "Da Lat",
  date: "2026-01-01", time: "10:00", local: { userId: owner, capturedAt: "2026-01-01T03:00:00Z", deviceSaved: false } });

test("one corrupt native metadata record does not hide valid photos or delete source files", async () => {
  const values = new Map([["tripzy.memory.local-owned", JSON.stringify(draft())], ["tripzy.memory.local-bad", "{broken"]]);
  class File { name: string; uri: string; constructor(name: string) { this.name = name; this.uri = `file:///documents/${name}`; } }
  class Directory { exists = true; list() { return [new File("local-owned.jpg"), new File("local-bad.jpg"), new File("local-orphan.jpg")]; } }
  const load = tripModuleLoader({ "expo-file-system": { File, Directory, Paths: { document: "file:///documents" } },
    "expo-secure-store": { getItemAsync: async (key: string) => values.get(key) ?? null } });
  const storage = load<typeof import("../src/features/memories/services/local-memory-storage.ts")>("src/features/memories/services/local-memory-storage.ts");
  let skipped = 0;
  const photos = await storage.readLocalMemories((count) => { skipped = count; });
  assert.equal(photos.length, 1);
  assert.equal(photos[0].id, "local-owned");
  assert.equal(skipped, 1);
  assert.equal(values.get("tripzy.memory.local-bad"), "{broken");
});

test("web album decrypts healthy records while retaining a corrupt encrypted record", async () => {
  const key = await webcrypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const encrypted = await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(draft())));
  const records = [{ id: "local-owned", iv, data: encrypted }, { id: "local-bad", iv, data: new ArrayBuffer(2) }];
  let closed = false;
  const db = { close: () => { closed = true; }, transaction: (name: string) => {
    const transaction: any = { objectStore: () => ({ get: () => {
      const request: any = { result: key };
      queueMicrotask(() => { request.onsuccess(); transaction.oncomplete(); }); return request;
    }, getAll: () => {
      const request: any = { result: records };
      queueMicrotask(() => request.onsuccess()); return request;
    } }) }; return transaction;
  } };
  const load = tripModuleLoader({}, { crypto: webcrypto, CryptoKey: key.constructor, TextDecoder,
    indexedDB: { open: () => { const request: any = { result: db }; queueMicrotask(() => request.onsuccess()); return request; } } });
  const storage = load<typeof import("../src/features/memories/services/local-memory-storage.web.ts")>("src/features/memories/services/local-memory-storage.web.ts");
  let skipped = 0;
  const photos = await storage.readLocalMemories((count) => { skipped = count; });
  assert.equal(photos.length, 1); assert.equal(skipped, 1); assert.equal(records.length, 2); assert.equal(closed, true);
});

function actionsFixture() {
  let generation = 1;
  let records = [draft()];
  let failDelete = true;
  let switchDuringNote = false;
  const calls: string[] = [];
  const options: { mutationFn: (...args: any[]) => Promise<any> }[] = [];
  const state = { getLocalPhotos: () => records,
    persistLocalPhoto: async (record: LocalMemory) => { records = [record]; },
    updateMemoryNote: async (_id: string, text: string) => { records = [{ ...records[0], text }]; },
    removeMemory: async () => { records = []; } };
  const load = tripModuleLoader({
    "@tanstack/react-query": { onlineManager: { isOnline: () => true }, useMutation: (value: typeof options[number]) => { options.push(value); return value; },
      useQueryClient: () => ({ invalidateQueries: () => {}, setQueryData: () => {} }) },
    "@/features/auth/hooks/use-auth": { useProfile: () => ({ data: { id: owner } }) },
    "@/features/auth/services/auth-session": { authSession: { getUserId: () => owner, getVersion: () => generation } },
    "@/features/home/providers/trip-preview-provider": { useTripPreview: (select: (value: typeof state) => unknown) => select(state) },
    "../api/memory-api": { memoryQueryKeys: { list: () => ["memories", owner] }, memoryApi: {
      updateNote: async (_id: string, version: number, note: string) => { calls.push(`note:${version}`); if (switchDuringNote) generation++; return { id: serverId, userId: owner, version: version + 1, note }; },
      detail: async () => ({ id: serverId, media: [{ id: "30000000-0000-0000-0000-000000000001" }] }),
      removePhoto: async () => { calls.push("delete"); if (failDelete) throw new Error("Connection lost"); },
    } }, "../api/memory-trips-api": {}, "../services/upload-photo": { uploadLocalMemory: async () => {} },
  });
  load<typeof import("../src/features/memories/hooks/use-memories.ts")>("src/features/memories/hooks/use-memories.ts").useMemoryActions();
  return { update: options[1], remove: options[2], records: () => records, calls,
    replace: (photo: LocalMemory) => { records = [photo]; }, switchSession: () => { generation++; }, allowDelete: () => { failDelete = false; }, switchOnNote: () => { switchDuringNote = true; } };
}

test("stale note editor cannot overwrite a newly uploaded photo; known versions are persisted after edit", async () => {
  const f = actionsFixture(); const old = draft();
  const uploaded = { ...old, local: { ...old.local, serverId, serverVersion: 4, uploaded: true } };
  f.replace(uploaded);
  await assert.rejects(f.update.mutationFn({ memory: old, text: "Stale" }), { code: "MEMORY_VERSION_REQUIRED" });
  assert.equal(f.calls.length, 0);
  await f.update.mutationFn({ memory: uploaded, text: "Changed" });
  assert.equal(f.records()[0].text, "Changed");
  assert.equal(f.records()[0].local.serverVersion, 5);
  assert.equal(f.calls[0], "note:4");
});

test("failed delete preserves a durable pending record and retry removes private copy only after confirmation", async () => {
  const f = actionsFixture();
  f.replace({ ...draft(), local: { ...draft().local, serverId, serverVersion: 0, uploaded: true } });
  await assert.rejects(f.remove.mutationFn(f.records()[0]));
  assert.equal(f.records()[0].local.deletePending, true);
  f.allowDelete(); await f.remove.mutationFn(f.records()[0]);
  assert.equal(f.records().length, 0);
});

test("logout and same-user login invalidate actions from the previous session before network or disk writes", async () => {
  const f = actionsFixture(); f.switchSession();
  await assert.rejects(f.update.mutationFn({ memory: draft(), text: "No" }), { code: "CANCELLED" });
  await assert.rejects(f.remove.mutationFn(draft()), { code: "CANCELLED" });
  assert.equal(f.records()[0].text, "Original"); assert.equal(f.calls.length, 0);
});

test("a note response arriving after account switch cannot overwrite private metadata", async () => {
  const f = actionsFixture();
  const photo = { ...draft(), local: { ...draft().local, serverId, serverVersion: 3 } };
  f.replace(photo); f.switchOnNote();
  await assert.rejects(f.update.mutationFn({ memory: photo, text: "Late response" }), { code: "CANCELLED" });
  assert.equal(f.records()[0].text, "Original"); assert.equal(f.records()[0].local.serverVersion, 3);
});

test("photo operation gate blocks overlapping delete/edit and releases after failure", async () => {
  const { withMemoryOperation } = tripModuleLoader()<typeof import("../src/features/memories/services/memory-operation.ts")>("src/features/memories/services/memory-operation.ts");
  let finish!: () => void;
  const pending = withMemoryOperation(owner, "local-owned", () => new Promise<void>((resolve) => { finish = resolve; }));
  await assert.rejects(withMemoryOperation(owner, "local-owned", async () => {}), { code: "MEMORY_BUSY" });
  finish(); await pending;
  await assert.rejects(withMemoryOperation(owner, "local-owned", async () => { throw new Error("Failed"); }));
  await withMemoryOperation(owner, "local-owned", async () => {});
});

test("authoritative cloud deletion does not resurrect uploaded backups; offline copies still open in read-only albums", () => {
  const load = tripModuleLoader();
  const { mergeMemories } = load<typeof import("../src/features/memories/utils/server-memories.ts")>("src/features/memories/utils/server-memories.ts");
  const { localAlbumTrips } = load<typeof import("../src/features/memories/utils/local-albums.ts")>("src/features/memories/utils/local-albums.ts");
  const photo = { ...draft(), tripId: "40000000-0000-0000-0000-000000000001", local: { ...draft().local, serverId, uploaded: true } };
  assert.equal(mergeMemories([], [photo], [], owner, true).length, 0);
  assert.equal(mergeMemories([], [photo], [], owner, false).length, 1);
  assert.equal(localAlbumTrips([photo], [], owner)[0].localOnly, true);
  assert.equal(localAlbumTrips([photo], [], "other").length, 0);
  const mediaId = "30000000-0000-0000-0000-000000000001";
  const remote = { id: serverId, version: 7, userId: owner, tripId: photo.tripId, placeId: null,
    experiencedAt: photo.local.capturedAt, note: "Server note", mediaCount: 1, coverImageUrl: null,
    media: [{ id: mediaId, url: "https://example.com/photo.png", displayOrder: 0, mimeType: "image/png", width: 1, height: 1 }] };
  const merged = mergeMemories([remote], [photo], [], owner, false);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].photo, photo.photo);
  assert.equal(merged[0].text, "Server note");
  assert.equal(merged[0].remote?.version, 7);
});
