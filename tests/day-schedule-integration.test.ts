import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { isValidElement } from "react";
import { ApiError } from "../src/services/api/api-error.ts";
import { tripReadSchema } from "../src/features/trip/api/trip-contract.ts";
import {
  daySettingsSchema,
  updateDayScheduleSchema,
} from "../src/features/trip/api/itinerary-types.ts";
import type {
  ItineraryResponse,
  UpdateDayScheduleRequest,
} from "../src/features/trip/api/itinerary-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const example = JSON.parse(
  readFileSync(
    new URL("../docs/api/trip-crud.openapi.json", import.meta.url),
    "utf8",
  ),
);
const trip = tripReadSchema.parse(
  example.components.schemas.TripResponse.example.data,
).trip;
const date = trip.days[0].date;
const placeId = "11111111-1111-4111-8111-111111111111";
const settings = {
  origin: {
    name: "My stay",
    address: "Private address",
    latitude: 11.94,
    longitude: 108.44,
  },
  departureTime: "08:30",
  returnToStart: true,
  travelMode: "WALK" as const,
};
const request: UpdateDayScheduleRequest = {
  expectedTripVersion: trip.version,
  expectedUpdatedAt: "2026-11-07T00:00:00Z",
  settings,
  durations: [{ placeId, minutes: 60 }],
};
const itinerary: ItineraryResponse = {
  id: null,
  tripId: trip.id,
  name: "Main",
  status: "DRAFT",
  updatedAt: null,
  days: [
    {
      date,
      settings,
      stops: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          placeId,
          name: "Lake",
          address: "Lake address",
          latitude: 11.95,
          longitude: 108.45,
          category: null,
          arrivalTime: `${date}T08:40:00`,
          durationMinutes: 60,
          sequence: 0,
          note: "Bring water",
          distanceFromPreviousKm: null,
          travelMinutesFromPrevious: null,
        },
      ],
    },
  ],
};

test("day settings enforce paired coordinates, return origin and valid local departure time", () => {
  assert.equal(updateDayScheduleSchema.safeParse(request).success, true);
  assert.equal(
    daySettingsSchema.safeParse({ ...settings, origin: null }).success,
    false,
  );
  assert.equal(
    daySettingsSchema.safeParse({
      ...settings,
      origin: { ...settings.origin, latitude: null },
    }).success,
    false,
  );
  assert.equal(
    daySettingsSchema.safeParse({ ...settings, departureTime: "25:00" })
      .success,
    false,
  );
  assert.equal(
    updateDayScheduleSchema.safeParse({
      ...request,
      durations: [{ placeId, minutes: 0 }],
    }).success,
    false,
  );
  assert.equal(
    daySettingsSchema.safeParse({
      ...settings,
      origin: { ...settings.origin, latitude: null, longitude: null },
    }).success,
    true,
  );
});

test("schedule API sends a versioned day request and the adapter restores its origin, time and return preference", async () => {
  const calls: { path: string; body: unknown }[] = [];
  const load = tripModuleLoader({
    "@/services/api/api-error": { ApiError },
    "@/services/api/client": {
      apiClient: {
        put: async (path: string, body: unknown) => {
          calls.push({ path, body });
          return { data: { success: true, data: itinerary } };
        },
      },
    },
  });
  const { itineraryApi } = load<
    typeof import("../src/features/trip/api/itinerary-api.ts")
  >("src/features/trip/api/itinerary-api.ts");
  const { toTrip } = load<
    typeof import("../src/features/trip/api/trip-adapters.ts")
  >("src/features/trip/api/trip-adapters.ts");
  const result = await itineraryApi.updateSchedule(trip.id, date, request);
  assert.equal(
    calls[0].path,
    `/api/v1/trips/${trip.id}/itinerary/days/${date}/schedule`,
  );
  assert.equal(JSON.stringify(calls[0].body), JSON.stringify(request));
  const day = toTrip(trip, [], result).days[0];
  assert.equal(day.startLocation, "My stay");
  assert.equal(day.startAddress, "Private address");
  assert.equal(day.startTime, "08:30");
  assert.equal(day.returnToStart, true);
  assert.equal(day.transport, "walk");
  assert.deepEqual(JSON.parse(JSON.stringify(day.startCoordinate)), {
    latitude: 11.94,
    longitude: 108.44,
  });
  await assert.rejects(
    itineraryApi.updateSchedule(trip.id, "2026-11-31", request),
    { code: "INVALID_ITINERARY" },
  );
  assert.equal(calls.length, 1);
});

type ElementProps = {
  children?: unknown;
  onSave?: (value: unknown) => Promise<void>;
  integration?: { currentPosition: () => Promise<unknown> };
  [key: string]: unknown;
};
function elements(value: unknown): { type: unknown; props: ElementProps }[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!isValidElement<ElementProps>(value)) return [];
  return [
    { type: value.type, props: value.props },
    ...elements(value.props.children),
  ];
}

test("connected day sheet reuses the existing form and converts membership IDs into Place UUIDs", async () => {
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const load = tripModuleLoader({
    react: { useState: (initial: unknown) => [initial, () => {}] },
    "react-native": { View: "View" },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/features/home/components/home-primitives": { TextAction: "TextAction" },
    "../api/place-discovery-queries": {
      usePlaceDiscovery: () => ({ query: {} }),
    },
    "../api/place-discovery-api": {
      discoveryStop: () => {
        throw new Error("No query data in this fixture");
      },
    },
    "./trip-details-sheet": { TripDetailsSheet: "TripDetailsSheet" },
    "./trip-day-schedule-form": { TripDayScheduleForm: "TripDayScheduleForm" },
    "../services/current-trip-position": {
      currentTripPosition: async () => ({ id: "gps" }),
    },
  });
  const { ConnectedDayScheduleSheet } = load<
    typeof import("../src/features/trip/components/connected-day-schedule-sheet.tsx")
  >("src/features/trip/components/connected-day-schedule-sheet.tsx");
  const day = {
    date,
    stops: [
      {
        id: "membership",
        placeId,
        time: "08:40",
        name: { vi: "Lake", en: "Lake" },
        kind: { vi: "", en: "" },
      },
    ],
  };
  let saved: unknown;
  const tree = ConnectedDayScheduleSheet({
    trip: {
      id: trip.id,
      destination: trip.destination,
      status: "planned",
      days: [day],
    },
    day,
    routeMode: "WALK",
    pending: false,
    onClose: () => {},
    onSave: async (value) => {
      saved = value;
    },
  });
  const form = elements(tree).find(
    (element) => element.type === "TripDayScheduleForm",
  );
  assert.ok(form?.props.onSave);
  await form.props.onSave({
    startLocation: "My stay",
    startAddress: "Private address",
    startCoordinate: { latitude: 11.94, longitude: 108.44 },
    startTime: "08:30",
    returnToStart: true,
    durations: [{ stopId: "membership", minutes: 60 }],
  });
  assert.equal(
    JSON.stringify(saved),
    JSON.stringify({ settings, durations: [{ placeId, minutes: 60 }] }),
  );
  assert.ok(form.props.integration);
  assert.deepEqual(await form.props.integration.currentPosition(), {
    id: "gps",
  });
});

test("current position requests only foreground permission and never reads location after denial", async () => {
  let allowed = false;
  let reads = 0;
  const load = tripModuleLoader({
    "expo-location": {
      requestForegroundPermissionsAsync: async () => ({ granted: allowed }),
      Accuracy: { Balanced: 3 },
      getCurrentPositionAsync: async () => {
        reads++;
        return { coords: { latitude: 11.94, longitude: 108.44 } };
      },
    },
  });
  const { currentTripPosition } = load<
    typeof import("../src/features/trip/services/current-trip-position.ts")
  >("src/features/trip/services/current-trip-position.ts");
  assert.equal(reads, 0);
  await assert.rejects(
    currentTripPosition("Current position"),
    /LOCATION_PERMISSION_REQUIRED/,
  );
  assert.equal(reads, 0);
  allowed = true;
  const point = await currentTripPosition("Current position");
  assert.equal(reads, 1);
  assert.equal(point.location?.latitude, 11.94);
  assert.equal(point.location?.longitude, 108.44);
});
