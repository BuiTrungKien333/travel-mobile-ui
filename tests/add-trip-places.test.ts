import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { TripStop } from "../src/features/home/types/home-types.ts";
import type { AddTripPlaceRequest, TripResponse, TripPlaceResponse } from "../src/features/trip/api/trip-types.ts";
import type { ItineraryResponse, SaveItineraryRequest } from "../src/features/trip/api/itinerary-types.ts";

const id = "40000000-0000-0000-0000-000000000001";
const oldId = "40000000-0000-0000-0000-000000000002";
const date = "2026-11-20";
const stamp = "2026-11-05T00:00:00Z";
const nextStamp = "2026-11-05T00:01:00Z";
const selections: TripStop[] = [0, 1].map((index) => ({
  id: `local-${index}`, ...(index === 0 ? { providerPlaceId: "provider-a" } : {}),
  name: { vi: `Điểm ${index}`, en: `Place ${index}` }, kind: { vi: "Địa điểm", en: "Place" },
  time: "", location: { latitude: 16 + index, longitude: 108 }, durationMinutes: 30, note: `Ghi chú ${index}`,
}));
function setup() {
  const trip: TripResponse = {
    id, title: "Trip", destination: { name: "Đà Nẵng" }, startDate: date, endDate: "2026-11-21",
    status: "PLANNING", mode: "PLANNING", timeZone: "Asia/Ho_Chi_Minh", version: 0, createdAt: stamp, updatedAt: stamp,
    readiness: { hasDates: true, hasPlaces: true, unscheduledCount: 0 }, dayCount: 2, stopCount: 1, memoryCount: 0,
    coverImageUrl: null, preferences: [], budget: null, accommodation: null, notes: null,
    days: [date, "2026-11-21"].map((dayDate, index) => ({ id, date: dayDate, dayNumber: index + 1,
      startLocation: null, startCoordinate: null, startTime: null, returnToStart: false, transport: "CAR" })),
  };
  const saved: TripPlaceResponse[] = [];
  let itinerary: ItineraryResponse = { id, tripId: id, name: "Main", status: "DRAFT", updatedAt: stamp,
    days: [{ date, stops: [{ id: oldId, placeId: oldId, name: "Existing pinned visit", address: null,
      latitude: 16, longitude: 108, category: null, arrivalTime: `${date}T08:00:00`, durationMinutes: 90,
      sequence: 0, pinned: true, note: "Keep this", distanceFromPreviousKm: null, travelMinutesFromPrevious: null }] }],
  };
  const calls: { method: string; url: string; body?: unknown }[] = [];
  const fail = { addAt: -1, lostAddResponse: false, save: false, lostSaveResponse: false, list: false };
  let addCount = 0;
  let beforeSave: (() => void) | undefined;
  let afterAdd: (() => void) | undefined;
  const load = tripModuleLoader({ "@/services/api/client": { apiClient: {
    get: async (url: string) => {
      calls.push({ method: "GET", url });
      if (url.endsWith("/places")) {
        if (fail.list) throw new Error("offline");
        return { data: { success: true, data: structuredClone(saved) } };
      }
      if (url.endsWith("/itinerary")) return { data: { success: true, data: structuredClone(itinerary) } };
      return { data: { success: true, data: { trip, context: { serverTime: stamp, evaluatedDate: "2026-11-05" } } } };
    },
    post: async (url: string, body: AddTripPlaceRequest) => {
      calls.push({ method: "POST", url, body });
      const failed = addCount++ === fail.addAt;
      if (failed && !fail.lostAddResponse) throw new Error("offline");
      const placeId = `40000000-0000-0000-0000-${String(saved.length + 3).padStart(12, "0")}`;
      const result: TripPlaceResponse = { id: placeId, tripId: id, placeId, priority: 0,
        estimatedDuration: body.estimatedDuration ?? null, notes: body.notes ?? null, plannedOrder: body.plannedOrder ?? null,
        visited: false, createdAt: stamp, updatedAt: stamp, place: { id: placeId, providerPlaceId: body.providerPlaceId ?? null,
          name: body.name ?? "", address: body.address ?? null, latitude: body.latitude ?? null, longitude: body.longitude ?? null,
          category: body.category ?? null, provinceId: null, provinceName: null, createdAt: stamp },
      };
      saved.push(result);
      afterAdd?.();
      if (failed) throw new Error("lost POST response");
      return { data: { success: true, data: result } };
    },
    put: async (url: string, body: SaveItineraryRequest) => {
      calls.push({ method: "PUT", url, body });
      beforeSave?.();
      if (body.expectedUpdatedAt !== itinerary.updatedAt) throw new (load<typeof import("../src/services/api/api-error.ts")>("src/services/api/api-error.ts").ApiError)("TRIP_010", 409);
      if (fail.save) throw new Error("offline");
      itinerary = { ...itinerary, updatedAt: nextStamp, days: body.days.map((day) => ({ date: day.date,
        stops: day.stops.map((stop) => ({ ...stop, id: stop.placeId, pinned: stop.pinned ?? false,
          name: "Saved", address: null, latitude: 16, longitude: 108, category: null,
          distanceFromPreviousKm: null, travelMinutesFromPrevious: null })),
      })) };
      if (fail.lostSaveResponse) { fail.lostSaveResponse = false; throw new Error("lost PUT response"); }
      return { data: { success: true, data: itinerary } };
    },
  } } });
  const { addTripPlaces } = load<typeof import("../src/features/trip/api/add-trip-places.ts")>("src/features/trip/api/add-trip-places.ts");
  return { run: (target: string | null = date, stops = selections) => addTripPlaces(id, { stops, date: target }),
    trip, saved, fail, calls, get itinerary() { return itinerary; },
    setBeforeSave: (callback: () => void) => { beforeSave = callback; },
    setAfterAdd: (callback: () => void) => { afterAdd = callback; } };
}

test("pool selection adds metadata without replacing any itinerary", async () => {
  const api = setup();
  await api.run(null);
  assert.equal(api.saved.length, 2);
  assert.equal(api.saved[0].notes, "Ghi chú 0");
  assert.equal(api.saved[0].estimatedDuration, 30);
  assert.equal(api.calls.filter((call) => call.method === "PUT").length, 0);
  assert.equal(api.itinerary.days[0].stops[0].pinned, true);
});

test("append uses latest itinerary directly and preserves pins/notes/times even for visits absent from the pool snapshot", async () => {
  const api = setup();
  const before = structuredClone(api.itinerary.days[0].stops[0]);
  await api.run();
  assert.equal(api.itinerary.days[0].stops.length, 3);
  const request = api.calls.find((call) => call.method === "PUT")?.body as SaveItineraryRequest;
  assert.equal(request.expectedUpdatedAt, stamp);
  assert.deepEqual(request.days[0].stops[0], { placeId: oldId, sequence: before.sequence, arrivalTime: before.arrivalTime,
    durationMinutes: before.durationMinutes, note: before.note, pinned: true });
  assert.deepEqual(request.days[0].stops.map((stop) => stop.sequence), [0, 1, 2]);
  assert.equal(request.days[0].stops[1].arrivalTime, null);
  assert.equal(request.days[0].stops[1].note, "Ghi chú 0");
});

test("partial add failure can retry the complete selection without duplicates and schedule all selected places", async () => {
  const api = setup();
  api.fail.addAt = 1;
  await assert.rejects(api.run(), /offline/);
  assert.equal(api.saved.length, 1);
  assert.equal(api.calls.filter((call) => call.method === "PUT").length, 0);
  await api.run();
  assert.equal(api.saved.length, 2);
  assert.equal(api.itinerary.days[0].stops.length, 3);
});

for (const index of [0, 1]) {
  test(`lost POST response for ${index === 0 ? "provider" : "custom"} place is reconciled on retry`, async () => {
    const api = setup();
    api.fail.addAt = index;
    api.fail.lostAddResponse = true;
    await assert.rejects(api.run(), /lost POST response/);
    await api.run();
    assert.equal(api.saved.length, 2);
    assert.equal(api.calls.filter((call) => call.method === "POST").length, 2);
    assert.equal(api.itinerary.days[0].stops.length, 3);
  });
}

test("failed itinerary save leaves places in the pool and retries scheduling without POSTing again", async () => {
  const api = setup();
  api.fail.save = true;
  await assert.rejects(api.run(), /offline/);
  assert.equal(api.saved.length, 2);
  assert.equal(api.itinerary.days[0].stops.length, 1);
  api.fail.save = false;
  await api.run();
  assert.equal(api.calls.filter((call) => call.method === "POST").length, 2);
  assert.equal(api.itinerary.days[0].stops.length, 3);
});

test("lost PUT response is recognized as already scheduled without a second itinerary write", async () => {
  const api = setup();
  api.fail.lostSaveResponse = true;
  await assert.rejects(api.run(), /lost PUT response/);
  await api.run();
  assert.equal(api.saved.length, 2);
  assert.equal(api.calls.filter((call) => call.method === "PUT").length, 1);
});

test("concurrent itinerary change rejects the stale write; retry preserves the changed visit and uses the new token", async () => {
  const api = setup();
  api.setBeforeSave(() => { api.itinerary.updatedAt = nextStamp; api.itinerary.days[0].stops[0].note = "Changed elsewhere"; });
  await assert.rejects(api.run(), { code: "TRIP_010", status: 409 });
  assert.equal(api.itinerary.days[0].stops.length, 1);
  api.setBeforeSave(() => {});
  await api.run();
  assert.equal(api.itinerary.days[0].stops[0].note, "Changed elsewhere");
  assert.equal(api.itinerary.days[0].stops.length, 3);
  const puts = api.calls.filter((call) => call.method === "PUT");
  assert.equal((puts[1].body as SaveItineraryRequest).expectedUpdatedAt, nextStamp);
});

test("removed target day and cancelled trip are rejected before any place writes", async () => {
  const api = setup();
  await assert.rejects(api.run("2026-12-01"), { code: "TARGET_DATE_MISSING" });
  api.trip.status = "CANCELLED";
  await assert.rejects(api.run(), { code: "TRIP_CANCELLED" });
  assert.equal(api.saved.length, 0);
});

test("day removed while adding keeps saved places and refuses to overwrite the itinerary", async () => {
  const api = setup();
  api.setAfterAdd(() => { api.trip.days = []; });
  await assert.rejects(api.run(), { code: "TARGET_DATE_MISSING" });
  assert.equal(api.saved.length, 2);
  assert.equal(api.calls.filter((call) => call.method === "PUT").length, 0);
});

test("retry does not move a selected place that is now scheduled on another day", async () => {
  const api = setup();
  await api.run();
  await assert.rejects(api.run("2026-11-21"), { code: "PLACE_ALREADY_SCHEDULED" });
  assert.equal(api.calls.filter((call) => call.method === "PUT").length, 1);
});

test("invalid coordinates and a failed pool read cannot trigger blind place writes", async () => {
  const api = setup();
  await assert.rejects(api.run(date, [{ ...selections[0], location: undefined }]), { code: "INVALID_PLACES" });
  assert.equal(api.calls.length, 0);
  api.fail.list = true;
  await assert.rejects(api.run(), /offline/);
  assert.equal(api.saved.length, 0);
});
