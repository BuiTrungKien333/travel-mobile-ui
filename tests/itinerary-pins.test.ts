import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { TripPlaceResponse, TripResponse } from "../src/features/trip/api/trip-types.ts";
import type { ItineraryResponse } from "../src/features/trip/api/itinerary-types.ts";

const id = "40000000-0000-0000-0000-000000000001";
const secondId = "40000000-0000-0000-0000-000000000002";
const date = "2026-11-20";
const stamp = "2026-11-05T00:00:00Z";
const trip: TripResponse = {
  id, title: "Trip", destination: { name: "Da Lat", provinceId: null }, startDate: date, endDate: date,
  status: "PLANNING", mode: "PLANNING", timeZone: "Asia/Ho_Chi_Minh", version: 0, createdAt: stamp, updatedAt: stamp,
  readiness: { hasDates: true, hasPlaces: true, unscheduledCount: 0 }, dayCount: 1, stopCount: 2, memoryCount: 0,
  coverImageUrl: null, preferences: [], budget: null, accommodation: null, notes: null,
  days: [{ id, date, dayNumber: 1, startLocation: null, startTime: null, returnToStart: false, transport: "CAR" }],
};
const places: TripPlaceResponse[] = [id, secondId].map((placeId) => ({
  id: placeId, tripId: id, placeId, priority: 0, estimatedDuration: 30, notes: null, plannedOrder: 0,
  visited: false, createdAt: stamp, updatedAt: stamp,
  place: { id: placeId, providerPlaceId: null, name: "Visit", address: null, latitude: 11.94, longitude: 108.44,
    provinceId: null, provinceName: null, category: null, createdAt: stamp },
}));
const itinerary: ItineraryResponse = {
  id, tripId: id, name: "Main", status: "DRAFT", updatedAt: stamp,
  days: [{ date, stops: [id, secondId].map((placeId, index) => ({
    id: placeId, placeId, name: "Visit", address: null, latitude: 11.94, longitude: 108.44, category: null,
    arrivalTime: `${date}T${index ? "12" : "10"}:00:00`, durationMinutes: 30, sequence: index,
    pinned: index === 0, note: "Keep", distanceFromPreviousKm: null, travelMinutesFromPrevious: null,
  })) }],
};

function modules() {
  const load = tripModuleLoader();
  return {
    ...load<typeof import("../src/features/trip/api/trip-adapters.ts")>("src/features/trip/api/trip-adapters.ts"),
    ...load<typeof import("../src/features/trip/utils/trip-mutations.ts")>("src/features/trip/utils/trip-mutations.ts"),
  };
}
test("pins and the itinerary version survive reading and serializing the server schedule", () => {
  const { toTrip, toSaveItineraryRequest } = modules();
  const mapped = toTrip(trip, places, itinerary);
  assert.equal(mapped.days[0].stops[0].pinned, true);
  assert.equal(mapped.days[0].stops[1].pinned, false);
  const request = toSaveItineraryRequest(mapped);
  assert.equal(request.expectedUpdatedAt, stamp);
  assert.equal(request.days[0].stops[0].pinned, true);
  assert.equal(request.days[0].stops[0].arrivalTime, `${date}T10:00:00`);
});
test("a persisted pin prevents reordering until the user explicitly unpins it", () => {
  const { toTrip, applyTripMutation, toSaveItineraryRequest } = modules();
  const mapped = toTrip(trip, places, itinerary);
  assert.equal(applyTripMutation(mapped, { kind: "reorder", date, ids: [secondId, id] }), null);
  const unpinned = applyTripMutation(mapped, { kind: "stop", date, targetDate: date, stopId: id, values: { pinned: false } });
  assert.ok(unpinned);
  assert.equal(toSaveItineraryRequest(unpinned).days[0].stops[0].pinned, false);
  const reordered = applyTripMutation(unpinned, { kind: "reorder", date, ids: [secondId, id] });
  assert.ok(reordered);
  assert.equal(reordered.days[0].stops[1].id, id);
  assert.equal(mapped.days[0].stops[0].pinned, true);
});
test("save API sends the pin with the viewed itinerary version and parses the persisted response", async () => {
  let sent: unknown;
  const load = tripModuleLoader({ "@/services/api/client": { apiClient: {
    put: async (_url: string, body: unknown) => { sent = body; return { data: { success: true, data: itinerary } }; },
  } } });
  const { itineraryApi } = load<typeof import("../src/features/trip/api/itinerary-api.ts")>("src/features/trip/api/itinerary-api.ts");
  const { toTrip, toSaveItineraryRequest } = modules();
  const saved = await itineraryApi.save(id, toSaveItineraryRequest(toTrip(trip, places, itinerary)));
  assert.equal((sent as { expectedUpdatedAt: string }).expectedUpdatedAt, stamp);
  assert.equal(saved.days[0].stops[0].pinned, true);
});
test("a pinned visit without an appointment is rejected before any HTTP call", async () => {
  let calls = 0;
  const load = tripModuleLoader({ "@/services/api/client": { apiClient: { put: async () => { calls++; } } } });
  const { itineraryApi } = load<typeof import("../src/features/trip/api/itinerary-api.ts")>("src/features/trip/api/itinerary-api.ts");
  await assert.rejects(itineraryApi.save(id, { days: [{ date, stops: [{ placeId: id, sequence: 0,
    arrivalTime: null, durationMinutes: 30, note: null, pinned: true }] }] }), { code: "INVALID_ITINERARY" });
  assert.equal(calls, 0);
});
test("editor requires a day and time for a pin while allowing an unpinned backlog visit", () => {
  const load = tripModuleLoader({ "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) } });
  const { useTripDetailsCopy } = load<typeof import("../src/features/trip/i18n/trip-details-copy.ts")>("src/features/trip/i18n/trip-details-copy.ts");
  const { stopDetailsSchema } = load<typeof import("../src/features/trip/schemas/trip-details-schema.ts")>("src/features/trip/schemas/trip-details-schema.ts");
  const schema = stopDetailsSchema(useTripDetailsCopy().copy);
  const valid = { time: "10:00", durationMinutes: "30", pinned: true, note: "", targetDate: date };
  assert.equal(schema.safeParse(valid).success, true);
  assert.equal(schema.safeParse({ ...valid, time: "" }).success, false);
  assert.equal(schema.safeParse({ ...valid, targetDate: null }).success, false);
  assert.equal(schema.safeParse({ ...valid, pinned: false, time: "", targetDate: null }).success, true);
});
