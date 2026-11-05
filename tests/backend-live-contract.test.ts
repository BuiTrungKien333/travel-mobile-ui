import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

// Produced by MemoryMobileIntegrationTest through real controllers, services and PostgreSQL.
const fixturePath = process.env.BACKEND_CONTRACT_FIXTURE;
test("mobile schemas accept actual backend responses from PostgreSQL integration tests", { skip: !fixturePath }, async () => {
  assert.ok(fixturePath);
  const responses: Record<string, unknown> = JSON.parse(readFileSync(fixturePath, "utf8"));
  const client = {
    get: async (url: string) => ({ data: responses[url === "/api/v1/trips" ? "tripList" : url === "/api/v1/destinations" ? "destinations"
      : url === "/api/v1/media/limits" ? "limits" : url.endsWith("/itinerary") ? "itinerary" : url.endsWith("/places") ? "tripPlaces"
      : url.endsWith("/detail") ? "memoryDetail" : url.includes("/journal/memories") ? "memoryList" : "tripDetail"] }),
    put: async (url: string) => ({ data: url.includes("/days/") ? responses.tripDayUpdate : responses.profileUpdate }),
  };
  const load = tripModuleLoader({ "@/services/api/client": { apiClient: client } });
  const types = load<typeof import("../src/features/trip/api/trip-types.ts")>("src/features/trip/api/trip-types.ts");
  const detail = types.tripEnvelopeSchema.parse(responses.tripCreate).data.trip;
  const { tripApi } = load<typeof import("../src/features/trip/api/trip-api.ts")>("src/features/trip/api/trip-api.ts");
  assert.equal((await tripApi.list())[0].id, detail.id);
  assert.equal((await tripApi.get(detail.id)).title, "Mobile contract");
  const { toTrip } = load<typeof import("../src/features/trip/api/trip-adapters.ts")>("src/features/trip/api/trip-adapters.ts");
  assert.equal(toTrip(detail).serverVersion, detail.version);
  const dayDate = detail.days[0].date;
  const updatedDay = await tripApi.updateDay(detail.id, dayDate, {
    version: detail.version, startLocation: "Mobile hotel", startTime: "07:45", returnToStart: true,
    startCoordinate: { latitude: 11.94, longitude: 108.44 },
    transport: "MOTORCYCLE", durations: [],
  });
  const mappedDay = toTrip(updatedDay).days[0];
  assert.equal(mappedDay.startLocation, "Mobile hotel");
  assert.equal(mappedDay.startTime, "07:45");
  assert.deepEqual(JSON.parse(JSON.stringify(mappedDay.startCoordinate)), { latitude: 11.94, longitude: 108.44 });
  assert.equal(mappedDay.returnToStart, true);
  assert.equal(mappedDay.transport, "motorcycle");
  const { itineraryApi } = load<typeof import("../src/features/trip/api/itinerary-api.ts")>("src/features/trip/api/itinerary-api.ts");
  const { toSaveItineraryRequest } = load<typeof import("../src/features/trip/api/trip-adapters.ts")>("src/features/trip/api/trip-adapters.ts");
  const realItinerary = await itineraryApi.get(detail.id);
  const mappedTrip = toTrip(updatedDay, await tripApi.listPlaces(detail.id), realItinerary);
  assert.equal(mappedTrip.days[0].stops[0].pinned, true);
  assert.equal(toSaveItineraryRequest(mappedTrip).expectedUpdatedAt, realItinerary.updatedAt);
  assert.equal(toSaveItineraryRequest(mappedTrip).days[0].stops[0].pinned, true);
  const { memoryApi, serverMemorySchema } = load<typeof import("../src/features/memories/api/memory-api.ts")>("src/features/memories/api/memory-api.ts");
  const created = serverMemorySchema.parse((responses.memoryCreate as { data: unknown }).data);
  assert.equal((await memoryApi.detail(created.id)).tripId, detail.id);
  assert.equal((await memoryApi.list())[0].version, 0);
  assert.equal((await memoryApi.limits()).maxFileBytes, 10485760);
  const { searchDestinations } = load<typeof import("../src/features/trip/api/destinations-api.ts")>("src/features/trip/api/destinations-api.ts");
  assert.ok((await searchDestinations("")).length > 0);
  const { authApi } = load<typeof import("../src/features/auth/api/auth-api.ts")>("src/features/auth/api/auth-api.ts");
  assert.equal((await authApi.updateProfile({ fullName: "Updated mobile user", avatarUrl: "" })).fullName, "Updated mobile user");
});
