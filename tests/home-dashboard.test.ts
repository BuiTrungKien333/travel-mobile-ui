import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError } from "../src/services/api/api-error.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { homeFixture } from "./helpers/home-dashboard-fixture.ts";
import type { Memory } from "../src/features/home/types/home-types.ts";

function loader(
  get: (
    url: string,
    config: { signal?: AbortSignal },
  ) => Promise<{ data: unknown }> = async () => ({ data: {} }),
) {
  return tripModuleLoader({
    "@/services/api/client": { apiClient: { get } },
    "@/services/api/api-error": { ApiError },
  })<typeof import("../src/features/home/api/home-api.ts")>(
    "src/features/home/api/home-api.ts",
  );
}
test("Home boundary validates five states, identities, coordinates and bounded photos", () => {
  const { homeDashboardSchema } = loader();
  for (const state of [
    "NEW",
    "PLANNING",
    "UPCOMING",
    "LIVE",
    "RETURNING",
  ] as const)
    assert.ok(homeDashboardSchema.safeParse(homeFixture(state)).success);
  for (const data of [
    { ...homeFixture(), state: "NEW" },
    { ...homeFixture(), selectedTrip: null },
    { ...homeFixture(), state: "LIVE", dayIndex: 0 },
    { ...homeFixture("LIVE"), dayIndex: null },
    { ...homeFixture("LIVE"), nextStop: { id: "fake" } },
    {
      ...homeFixture(),
      footprint: { provinces: -1, places: 0, hasHistory: false },
    },
  ])
    assert.equal(homeDashboardSchema.safeParse(data).success, false);
  const ready = homeFixture();
  ready.selectedTrip!.trip.status = "READY";
  assert.ok(homeDashboardSchema.safeParse(ready).success);
});
test("Home transport forwards cancellation and rejects invalid API payload instead of showing New", async () => {
  let payload: unknown = { success: true, data: homeFixture("NEW") };
  const signal = new AbortController().signal;
  const { homeApi } = loader(async (url, config) => {
    assert.equal(url, "/api/v1/home/dashboard");
    assert.equal(config.signal, signal);
    return { data: payload };
  });
  assert.equal((await homeApi.get(signal)).state, "NEW");
  payload = { success: true, data: { state: "NEW" } };
  await assert.rejects(
    homeApi.get(signal),
    (e: unknown) => e instanceof ApiError && e.code === "INVALID_RESPONSE",
  );
});
test("Home merges only the selected owner's local photos and does not invent remote versions", () => {
  const { homeMemories } = loader();
  const data = homeFixture("LIVE"),
    tripId = data.selectedTrip!.trip.id;
  const local = (id: string, userId?: string, date = "2026-11-07"): Memory => ({
    id,
    tripId,
    date,
    time: "01:00",
    photo: "file:///photo.jpg",
    text: "",
    destination: "",
    local: { capturedAt: "2026-11-06T18:00:00Z", deviceSaved: true, userId },
  });
  const memories = homeMemories(
    data,
    [
      local("own", "owner-a"),
      local("foreign", "owner-b"),
      local("unscoped"),
      local("yesterday", "owner-a", "2026-11-06"),
    ],
    "owner-a",
  );
  assert.equal(memories.length, 1);
  assert.equal(memories[0].id, "own");
  assert.equal(memories[0].remote, undefined);
});
test("Home midnight refresh is based on server Vietnam calendar, without minute polling", () => {
  const { nextHomeRefreshDelay } = loader();
  assert.equal(nextHomeRefreshDelay(homeFixture().context), 84600250);
  assert.equal(
    nextHomeRefreshDelay({
      evaluatedDate: "2026-11-07",
      serverTime: "2026-11-07T16:59:59Z",
    }),
    1250,
  );
});
test("Home stop preserves Place vs membership vs itinerary identity and absent time", () => {
  const { homeNextStop } = loader();
  const id = "8a82cfea-5731-4e28-8ef8-81204853c24d",
    placeId = "9a82cfea-5731-4e28-8ef8-81204853c24d",
    itemId = "aa82cfea-5731-4e28-8ef8-81204853c24d";
  const stop = homeNextStop({
    id,
    placeId,
    itineraryItemId: itemId,
    name: "Lake",
    address: null,
    latitude: null,
    longitude: null,
    category: null,
    time: null,
    durationMinutes: 45,
    note: null,
  });
  assert.equal(stop?.id, id);
  assert.equal(stop?.placeId, placeId);
  assert.equal(stop?.itineraryItemId, itemId);
  assert.equal(stop?.time, "—");
  assert.equal(stop?.location, undefined);
  assert.equal(stop?.quickInfo, undefined);
});
