import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const id = "40000000-0000-0000-0000-000000000001";
const instant = "2026-11-05T00:00:00Z";
const context = { serverTime: instant, evaluatedDate: "2026-11-05" };
const trip = {
  id, title: "Đà Lạt", destination: { name: "Đà Lạt", provinceId: null }, startDate: "2026-11-06", endDate: "2026-11-07",
  status: "PLANNING", mode: "PLANNING", timeZone: "Asia/Ho_Chi_Minh", version: 3, createdAt: instant, updatedAt: instant,
  readiness: { hasDates: true, hasPlaces: false, unscheduledCount: 0 }, dayCount: 2, stopCount: 0, memoryCount: 0,
  coverImageUrl: null, preferences: [], budget: null, accommodation: null, notes: null, days: [],
};

test("trip pagination reads content and rejects legacy arrays or a repeated page", async () => {
  let mode = "ok";
  const pages: number[] = [];
  const load = tripModuleLoader({ "@/services/api/client": { apiClient: {
    get: async (_url: string, options: { params: { page: number } }) => {
      const page = options.params.page; pages.push(page);
      return { data: { success: true, data: mode === "legacy" ? [trip] : {
        content: [{ ...trip, id: page === 0 ? id : "40000000-0000-0000-0000-000000000002" }],
        page: mode === "repeat" ? 0 : page, size: 1, totalPages: 2, totalElements: 2, context,
      } } };
    },
  } } });
  const { tripApi } = load<typeof import("../src/features/trip/api/trip-api.ts")>("src/features/trip/api/trip-api.ts");
  assert.equal((await tripApi.list()).length, 2);
  assert.deepEqual(pages, [0, 1]);
  mode = "legacy";
  await assert.rejects(tripApi.list(), { code: "INVALID_RESPONSE" });
  mode = "repeat";
  await assert.rejects(tripApi.list(), { code: "INVALID_RESPONSE" });
});

test("trip create, PATCH, date preview and delete send the required request IDs and versions", async () => {
  const requests: { method: string; url: string; body: unknown }[] = [];
  const load = tripModuleLoader({ "@/services/api/client": { apiClient: {
    post: async (url: string, body: unknown) => {
      requests.push({ method: "POST", url, body });
      return { data: { success: true, data: url.endsWith("date-change-preview") ? {
        baseVersion: 3, startDate: "2026-11-07", endDate: "2026-11-07", dayCount: 1,
        removedDates: ["2026-11-06"], addedDates: [], movedToPoolCount: 2, requiresAcknowledgement: true,
      } : { trip, context } } };
    },
    patch: async (url: string, body: unknown) => {
      requests.push({ method: "PATCH", url, body }); return { data: { success: true, data: { trip: { ...trip, version: 4 }, context } } };
    },
    delete: async (url: string, options: unknown) => { requests.push({ method: "DELETE", url, body: options }); },
  } } });
  const { tripApi } = load<typeof import("../src/features/trip/api/trip-api.ts")>("src/features/trip/api/trip-api.ts");
  const { createServerTrip } = load<typeof import("../src/features/trip/api/create-trip.ts")>("src/features/trip/api/create-trip.ts");
  const key = "60000000-0000-0000-0000-000000000001";
  await createServerTrip({ title: trip.title, destination: "Đà Lạt", startDate: trip.startDate, endDate: trip.endDate }, key);
  assert.equal((requests[0].body as { clientRequestId: string }).clientRequestId, key);
  assert.equal((requests[0].body as { destination: { name: string } }).destination.name, "Đà Lạt");
  const dates = { version: 3, startDate: "2026-11-07", endDate: "2026-11-07" };
  assert.equal((await tripApi.previewDates(id, dates)).requiresAcknowledgement, true);
  assert.equal((await tripApi.update(id, { ...dates, acknowledgeDateImpact: true, budget: null })).version, 4);
  await tripApi.remove(id, 4);
  assert.equal(requests[2].method, "PATCH");
  assert.equal((requests[2].body as { version: number }).version, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(requests[3].body)), { params: { version: 4 } });
});

test("date impact confirmation resolves cancellation without accepting the change", async () => {
  let cancel: (() => void) | undefined;
  const load = tripModuleLoader({ "react-native": { Alert: { alert: (_title: string, message: string, actions: { onPress: () => void }[]) => {
    assert.ok(message.includes("2")); cancel = actions[0].onPress;
  } } } });
  const { confirmDateImpact } = load<typeof import("../src/features/trip/utils/confirm-date-impact.ts")>("src/features/trip/utils/confirm-date-impact.ts");
  const decision = confirmDateImpact({ dateImpactTitle: "Change", dateImpactHint: "Move {count} places", cancel: "Cancel", save: "Save" } as Parameters<typeof confirmDateImpact>[0], 2);
  assert.ok(cancel); cancel();
  assert.equal(await decision, false);
});
