import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { TripResponse } from "../src/features/trip/api/trip-types.ts";

const id = "40000000-0000-0000-0000-000000000001";
const stopId = "50000000-0000-0000-0000-000000000001";
const instant = "2026-11-05T00:00:00Z";
const date = "2026-11-20";
const trip: TripResponse = {
  id, title: "Đà Lạt", destination: { name: "Đà Lạt", provinceId: null }, startDate: date, endDate: "2026-11-21",
  status: "PLANNING", mode: "PLANNING", timeZone: "Asia/Ho_Chi_Minh", version: 3, createdAt: instant, updatedAt: instant,
  readiness: { hasDates: true, hasPlaces: false, unscheduledCount: 0 }, dayCount: 2, stopCount: 0, memoryCount: 0,
  coverImageUrl: null, preferences: [], budget: null, accommodation: null, notes: null,
  days: [
    { id, date, dayNumber: 1, startLocation: "Khách sạn", startTime: "07:45", returnToStart: true, transport: "MOTORCYCLE" },
    { id: "40000000-0000-0000-0000-000000000002", date: "2026-11-21", dayNumber: 2,
      startLocation: null, startTime: null, returnToStart: false, transport: "CAR" },
  ],
};

function modules() {
  const load = tripModuleLoader();
  return {
    ...load<typeof import("../src/features/trip/api/trip-adapters.ts")>("src/features/trip/api/trip-adapters.ts"),
    ...load<typeof import("../src/features/trip/api/save-trip-day.ts")>("src/features/trip/api/save-trip-day.ts"),
  };
}

test("day settings are read by date even when the day has no stops", () => {
  const { toTrip } = modules();
  const mapped = toTrip({ ...trip, days: [...trip.days].reverse() });
  assert.equal(mapped.days[0].startLocation, "Khách sạn");
  assert.equal(mapped.days[0].startTime, "07:45");
  assert.equal(mapped.days[0].returnToStart, true);
  assert.equal(mapped.days[0].transport, "motorcycle");
  assert.equal(mapped.days[0].stops.length, 0);
  assert.equal(mapped.days[1].startLocation, undefined);
  assert.equal(mapped.days[1].startTime, undefined);
  assert.equal(mapped.days[1].transport, "car");
});

test("changing only transport preserves the other saved day settings", () => {
  const { toTrip, toUpdateTripDayRequest } = modules();
  const request = toUpdateTripDayRequest(toTrip(trip), { kind: "day", date, values: { transport: "walk" } });
  assert.deepEqual(JSON.parse(JSON.stringify(request)), {
    version: 3, startLocation: "Khách sạn", startTime: "07:45", returnToStart: true, transport: "WALK", durations: [],
  });
});

test("clearing origin and departure time sends null and requires return-to-start to be off", () => {
  const { toTrip, toUpdateTripDayRequest } = modules();
  const mapped = toTrip(trip);
  const request = toUpdateTripDayRequest(mapped, {
    kind: "day", date, values: { startLocation: " ", startTime: "", returnToStart: false },
  });
  assert.equal(request.startLocation, null);
  assert.equal(request.startTime, null);
  assert.throws(() => toUpdateTripDayRequest(mapped, { kind: "day", date, values: { startLocation: "" } }));
});

test("duration edits carry the itinerary snapshot and keep unchanged visits out of the request", () => {
  const { toTrip, toUpdateTripDayRequest } = modules();
  const mapped = toTrip(trip);
  mapped.days[0].stops.push({ id: stopId, time: "09:00", name: { vi: "Điểm ghé", en: "Stop" }, kind: { vi: "Nơi", en: "Place" }, durationMinutes: 45 });
  const request = toUpdateTripDayRequest(mapped, {
    kind: "day", date, values: {}, expectedItineraryUpdatedAt: instant,
    durations: [{ stopId, durationMinutes: 90 }],
  });
  assert.equal(request.expectedItineraryUpdatedAt, instant);
  assert.equal(request.durations[0].durationMinutes, 90);
  const noChange = toUpdateTripDayRequest(mapped, { kind: "day", date, values: {}, durations: [{ stopId, durationMinutes: 45 }] });
  assert.equal(noChange.durations.length, 0);
  assert.equal(noChange.expectedItineraryUpdatedAt, undefined);
  assert.throws(() => toUpdateTripDayRequest(mapped, { kind: "day", date, values: {}, durations: [{ stopId, durationMinutes: 90 }] }));
});

test("an open form keeps its original version after a background refresh", () => {
  const { toTrip, toUpdateTripDayRequest } = modules();
  const request = toUpdateTripDayRequest(toTrip({ ...trip, version: 4 }), {
    kind: "day", date, baseVersion: 3, values: { startTime: "08:00" },
  });
  assert.equal(request.version, 3);
  assert.throws(() => toUpdateTripDayRequest(toTrip(trip), { kind: "day", date: "2026-11-19", values: {} }));
  assert.throws(() => toUpdateTripDayRequest(toTrip(trip), { kind: "day", date, values: { startTime: "24:00" } }));
});

test("day API sends one validated request and reloads persisted fields from the server response", async () => {
  const calls: { url: string; body: unknown }[] = [];
  const load = tripModuleLoader({ "@/services/api/client": { apiClient: {
    put: async (url: string, body: Record<string, unknown>) => {
      calls.push({ url, body });
      return { data: { success: true, data: {
        context: { serverTime: instant, evaluatedDate: "2026-11-05" },
        trip: { ...trip, version: 4, days: [{ ...trip.days[0], ...body }, trip.days[1]] },
      } } };
    },
  } } });
  const { tripApi } = load<typeof import("../src/features/trip/api/trip-api.ts")>("src/features/trip/api/trip-api.ts");
  const { toTrip, toUpdateTripDayRequest } = modules();
  const request = toUpdateTripDayRequest(toTrip(trip), { kind: "day", date, values: { startTime: "10:00", transport: "car" } });
  const saved = await tripApi.updateDay(id, date, request);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `/api/v1/trips/${id}/days/${date}`);
  assert.equal(toTrip(saved).days[0].startTime, "10:00");
  assert.equal(toTrip(saved).days[0].transport, "car");
  assert.equal(saved.version, 4);
});

test("a rejected day save surfaces the server conflict without reporting success", async () => {
  const conflict = Object.assign(new Error("changed"), { code: "TRIP_010", status: 409 });
  const load = tripModuleLoader({ "@/services/api/client": { apiClient: { put: async () => { throw conflict; } } } });
  const { tripApi } = load<typeof import("../src/features/trip/api/trip-api.ts")>("src/features/trip/api/trip-api.ts");
  const { toTrip, toUpdateTripDayRequest } = modules();
  await assert.rejects(tripApi.updateDay(id, date, toUpdateTripDayRequest(toTrip(trip), { kind: "day", date, values: { transport: "walk" } })), { status: 409 });
});
