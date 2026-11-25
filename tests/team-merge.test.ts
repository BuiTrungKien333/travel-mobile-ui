import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { tripReadSchema } from "../src/features/trip/api/trip-contract.ts";
import { routeEnvelopeSchema } from "../src/features/trip/api/maps-types.ts";
import { tripQueryKeys } from "../src/features/trip/api/trip-query-keys.ts";
import { memoryQueryKeys } from "../src/features/home/api/memory-query-keys.ts";
import { decodeRoutePolyline } from "../src/features/trip/utils/decode-route-polyline.ts";
import { ApiError } from "../src/services/api/api-error.ts";
import { todayCalendarDate } from "../src/utils/calendar-date.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const require = createRequire(import.meta.url);
const specification = JSON.parse(
  readFileSync(
    new URL("../docs/api/trip-crud.openapi.json", import.meta.url),
    "utf8",
  ),
);
const trip = tripReadSchema.parse(
  specification.components.schemas.TripResponse.example.data,
).trip;
const placeId = "10000000-0000-4000-8000-000000000001";
const tripPlaceId = "20000000-0000-4000-8000-000000000001";
const itemId = "30000000-0000-4000-8000-000000000001";
const instant = "2026-11-02T00:00:00Z";

test("day save sends only one day's stops and both revisions", async () => {
  const calls: { path: string; payload: unknown }[] = [];
  const load = tripModuleLoader({
    "@/services/api/api-error": { ApiError },
    "@/services/api/client": {
      apiClient: {
        put: async (path: string, payload: unknown) => {
          calls.push({ path, payload });
          return {
            data: {
              success: true,
              data: {
                id: null,
                tripId: trip.id,
                name: "Main",
                status: "DRAFT",
                days: [],
                updatedAt: null,
              },
            },
          };
        },
      },
    },
  });
  const { itineraryApi } = load<
    typeof import("../src/features/trip/api/itinerary-api.ts")
  >("src/features/trip/api/itinerary-api.ts");
  const date = trip.days[0].date;
  const input = {
    expectedTripVersion: trip.version,
    expectedUpdatedAt: instant,
    stops: [
      {
        placeId,
        sequence: 0,
        arrivalTime: `${date}T09:30:00`,
        durationMinutes: 45,
        note: "Meet here",
      },
    ],
  };
  assert.equal(
    (await itineraryApi.saveDay(trip.id, date, input)).tripId,
    trip.id,
  );
  assert.equal(
    calls[0].path,
    `/api/v1/trips/${trip.id}/itinerary/days/${date}`,
  );
  assert.equal(JSON.stringify(calls[0].payload), JSON.stringify(input));
  await assert.rejects(itineraryApi.saveDay(trip.id, "2026-11-31", input), {
    code: "INVALID_ITINERARY",
  });
  await assert.rejects(
    itineraryApi.saveDay(trip.id, date, { ...input, expectedTripVersion: -1 }),
    { code: "INVALID_ITINERARY" },
  );
  assert.equal(calls.length, 1);
});

test("Optional maps config preserves camera, OAuth, development build and scene plugins", () => {
  const names = [
    "EXPO_PUBLIC_NATIVE_MAP_ENABLED",
    "GOOGLE_MAPS_ANDROID_API_KEY",
    "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID",
  ];
  const previous = names.map((name) => process.env[name]);
  const appConfig = require("../app.config.js");
  const config = { name: "Fixture", slug: "fixture", plugins: ["expo-camera"] };
  try {
    delete process.env.EXPO_PUBLIC_NATIVE_MAP_ENABLED;
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID =
      "123-fixture.apps.googleusercontent.com";
    const baseline = JSON.stringify(appConfig({ config }).plugins);
    for (const name of [
      "expo-camera",
      "expo-dev-client",
      "expo-build-properties",
      "react-native-nitro-google-signin",
      "enableSceneSupport",
    ])
      assert.ok(baseline.includes(name), name);
    assert.equal(baseline.includes("react-native-maps"), false);
    process.env.EXPO_PUBLIC_NATIVE_MAP_ENABLED = "true";
    delete process.env.GOOGLE_MAPS_ANDROID_API_KEY;
    assert.throws(() => appConfig({ config }), /GOOGLE_MAPS_ANDROID_API_KEY/);
    process.env.GOOGLE_MAPS_ANDROID_API_KEY = "fixture-public-restricted-key";
    const enabled = JSON.stringify(appConfig({ config }).plugins);
    assert.ok(enabled.includes("androidGoogleMapsApiKey"));
    assert.ok(enabled.includes("expo-camera"));
    assert.ok(enabled.includes("react-native-nitro-google-signin"));
  } finally {
    names.forEach((name, index) => {
      if (previous[index] === undefined) delete process.env[name];
      else process.env[name] = previous[index];
    });
  }
});

test("Adapter separates place, trip-place and itinerary item identities on read and save", () => {
  const load = tripModuleLoader({ "@/services/api/api-error": { ApiError } });
  const { toTrip, toSaveItineraryRequest } = load<
    typeof import("../src/features/trip/api/trip-adapters.ts")
  >("src/features/trip/api/trip-adapters.ts");
  const value = toTrip(
    trip,
    [
      {
        id: tripPlaceId,
        tripId: trip.id,
        placeId,
        place: {
          id: placeId,
          providerPlaceId: "provider-1",
          name: "Hồ Xuân Hương",
          address: "Đà Lạt",
          latitude: 11.94,
          longitude: 108.44,
          provinceId: null,
          provinceName: null,
          category: null,
          createdAt: instant,
        },
        priority: null,
        estimatedDuration: 45,
        notes: null,
        plannedOrder: 0,
        visited: true,
        createdAt: instant,
        updatedAt: instant,
      },
    ],
    {
      id: null,
      tripId: trip.id,
      name: "Fixture",
      status: "PLANNING",
      updatedAt: null,
      days: [
        {
          date: trip.days[0].date,
          stops: [
            {
              id: itemId,
              placeId,
              name: "Hồ Xuân Hương",
              address: null,
              latitude: null,
              longitude: null,
              category: null,
              arrivalTime: `${trip.days[0].date}T09:30:00`,
              durationMinutes: 60,
              sequence: 0,
              note: null,
              distanceFromPreviousKm: null,
              travelMinutesFromPrevious: null,
            },
          ],
        },
      ],
    },
  );
  const stop = value.days[0].stops[0];
  assert.equal(stop.id, tripPlaceId);
  assert.equal(stop.placeId, placeId);
  assert.equal(stop.itineraryItemId, itemId);
  assert.equal(stop.visited, true);
  assert.equal(value.unscheduledStops?.length, 0);
  const saved = toSaveItineraryRequest(value);
  assert.equal(saved.days.length, 1);
  assert.equal(saved.days[0].stops[0].placeId, placeId);
  assert.equal(saved.days[0].stops[0].durationMinutes, 60);
  delete stop.placeId;
  assert.throws(
    () => toSaveItineraryRequest(value),
    (error: unknown) =>
      error instanceof ApiError && error.code === "INVALID_ITINERARY",
  );
});

test("trip adapter preserves the first matching day's settings and empty days", () => {
  const { toTrip } = tripModuleLoader()<
    typeof import("../src/features/trip/api/trip-adapters.ts")
  >("src/features/trip/api/trip-adapters.ts");
  const date = trip.days[0].date;
  const settings = {
    origin: { name: "Hotel", address: null, latitude: 16, longitude: 108 },
    departureTime: "08:30:00",
    returnToStart: true,
    travelMode: "DRIVE" as const,
  };
  const itinerary = {
    id: null,
    tripId: trip.id,
    name: "Main",
    status: "DRAFT",
    updatedAt: null,
    days: [
      { date, stops: [], settings },
      { date, stops: [], settings: { ...settings, departureTime: "10:00:00" } },
    ],
  };
  const before = JSON.stringify(itinerary);

  const result = toTrip(trip, [], itinerary);

  assert.equal(result.days.length, trip.days.length);
  assert.equal(result.days[0].startTime, "08:30");
  assert.equal(result.days[0].startLocation, "Hotel");
  assert.equal(result.days[0].returnToStart, true);
  assert.ok(result.days.every((day) => day.stops.length === 0));
  assert.equal(JSON.stringify(itinerary), before);
  assert.equal(toTrip(trip).days[0].startTime, undefined);
});

test("Shared trip and memory cache namespaces isolate accounts", () => {
  assert.notDeepEqual(
    tripQueryKeys.detail("alice", trip.id),
    tripQueryKeys.detail("bob", trip.id),
  );
  assert.notDeepEqual(
    tripQueryKeys.itinerary("alice", trip.id),
    tripQueryKeys.itinerary("bob", trip.id),
  );
  assert.notDeepEqual(
    memoryQueryKeys.list("alice", trip.id),
    memoryQueryKeys.list("bob", trip.id),
  );
  assert.equal(
    tripQueryKeys.places("alice", trip.id)[0],
    tripQueryKeys.root[0],
  );
});

test("Route validation rejects invalid costs and the decoder rejects malformed provider geometry", () => {
  const payload = {
    success: true,
    data: {
      distanceMeters: 1000,
      durationSeconds: 300,
      provider: "fixture",
      encodedPolyline: null,
    },
  };
  assert.equal(routeEnvelopeSchema.safeParse(payload).success, true);
  assert.equal(
    routeEnvelopeSchema.safeParse({
      ...payload,
      data: { ...payload.data, durationSeconds: -1 },
    }).success,
    false,
  );
  assert.deepEqual(decodeRoutePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@"), [
    { latitude: 38.5, longitude: -120.2 },
    { latitude: 40.7, longitude: -120.95 },
    { latitude: 43.252, longitude: -126.453 },
  ]);
  for (const geometry of ["_", "\u0000?", "~~~~~~?", "?".repeat(250001)])
    assert.deepEqual(decodeRoutePolyline(geometry), []);
});

test("Calendar day uses the trip timezone at the Vietnam midnight boundary", () => {
  assert.equal(
    todayCalendarDate(new Date("2026-11-01T16:59:59Z")),
    "2026-11-01",
  );
  assert.equal(
    todayCalendarDate(new Date("2026-11-01T17:00:00Z")),
    "2026-11-02",
  );
});
