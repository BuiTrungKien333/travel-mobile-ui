import assert from "node:assert/strict";
import { test } from "node:test";
import type { TripStop, Memory } from "../src/features/home/types/home-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const load = tripModuleLoader({ "@/components/ui/status-badge": { StatusBadge: "StatusBadge" } });
const { getPlaceReference } = load<typeof import("../src/features/trip/data/place-reference.ts")>("src/features/trip/data/place-reference.ts");
const { memorySyncState } = load<typeof import("../src/features/memories/components/memory-sync-badge.tsx")>("src/features/memories/components/memory-sync-badge.tsx");
const place: TripStop = { id: "server-id", name: { vi: "Hồ Xuân Hương", en: "Xuan Huong Lake" },
  kind: { vi: "Hồ", en: "Lake" }, time: "", location: { latitude: 11.942, longitude: 108.443 } };

test("reference enrichment requires a known name and Da Lat location; custom addresses and namesakes remain unknown", () => {
  assert.ok(getPlaceReference(place)?.url.startsWith("https://vietnam.travel/"));
  assert.equal(getPlaceReference({ ...place, location: { latitude: 21, longitude: 105 } }), undefined);
  assert.equal(getPlaceReference({ ...place, location: undefined }), undefined);
  assert.equal(getPlaceReference({ ...place, locationType: "address" }), undefined);
  assert.equal(getPlaceReference({ ...place, name: { vi: "Hồ Xuân Hương Hotel", en: "Hotel" } }), undefined);
  assert.ok(getPlaceReference({ ...place, name: { vi: "Ga Đà Lạt", en: "Station" } }));
});

test("photo badges distinguish private, uncertain upload, active sync, confirmed success and pending deletion", () => {
  const local = { capturedAt: "2026-11-06T00:00:00Z", deviceSaved: false };
  const memory: Memory = { id: "local", destination: "", text: "", local };
  assert.equal(memorySyncState(memory), "private");
  const pending = { ...memory, local: { ...local, clientRequestId: "capture-id" } };
  assert.equal(memorySyncState(pending), "pending");
  assert.equal(memorySyncState(pending, true), "syncing");
  assert.equal(memorySyncState(pending, false, true), "failed");
  const synced = { ...pending, local: { ...pending.local, uploaded: true } };
  assert.equal(memorySyncState(synced, false, true), "synced");
  assert.equal(memorySyncState({ ...synced, pendingDeletion: true }, true), "deleting");
});
