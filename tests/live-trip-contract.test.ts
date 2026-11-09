import assert from "node:assert/strict";
import { test } from "node:test";
import { homeFixture } from "./helpers/home-dashboard-fixture.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { ItineraryResponse } from "../src/features/trip/api/itinerary-types.ts";
import type { TripPlaceResponse } from "../src/features/trip/api/trip-types.ts";

test("date edits recover retained memberships into the real backlog until explicitly scheduled again", () => {
  const load = tripModuleLoader();
  const { toTrip } = load<
    typeof import("../src/features/trip/api/trip-adapters.ts")
  >("src/features/trip/api/trip-adapters.ts");
  const value = homeFixture("LIVE").selectedTrip;
  assert.ok(value);
  const id = "11111111-1111-4111-8111-111111111111";
  const membership: TripPlaceResponse = {
    id: "22222222-2222-4222-8222-222222222222",
    tripId: value.trip.id,
    placeId: id,
    visited: false,
    priority: 0,
    estimatedDuration: 75,
    notes: "Booking",
    plannedOrder: 0,
    createdAt: value.context.serverTime,
    updatedAt: value.context.serverTime,
    place: {
      id,
      providerPlaceId: null,
      name: "Điểm đã giữ",
      address: "Địa chỉ",
      latitude: 11.94,
      longitude: 108.44,
      provinceId: null,
      provinceName: null,
      category: null,
      createdAt: value.context.serverTime,
    },
  };
  const itinerary: ItineraryResponse = {
    id: null,
    tripId: value.trip.id,
    name: "Trip",
    status: "PLANNING",
    updatedAt: null,
    days: [],
  };
  const recovered = toTrip(value.trip, [membership], itinerary);
  assert.equal(recovered.unscheduledStops?.length, 1);
  const entry = recovered.unscheduledStops[0];
  assert.equal(entry.id, membership.id);
  assert.equal(entry.placeId, id);
  assert.equal(entry.note, "Booking");
  assert.equal(entry.durationMinutes, 75);
  assert.ok(recovered.days.every((day) => day.stops.length === 0));
  const date = value.trip.days[0].date;
  const scheduled = toTrip(value.trip, [membership], {
    ...itinerary,
    days: [
      {
        date,
        stops: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            placeId: id,
            name: "Điểm đã giữ",
            address: "Địa chỉ",
            latitude: 11.94,
            longitude: 108.44,
            category: null,
            sequence: 0,
            arrivalTime: `${date}T11:00:00`,
            durationMinutes: 75,
            note: "Booking",
            distanceFromPreviousKm: null,
            travelMinutesFromPrevious: null,
          },
        ],
      },
    ],
  });
  assert.equal(scheduled.unscheduledStops?.length, 0);
  assert.equal(scheduled.days[0].stops[0].placeId, id);
});

test("trip detail refreshes at Vietnam midnight using the backend calendar snapshot", () => {
  let options:
    | {
        refetchInterval: (query: {
          state: { data: unknown };
        }) => number | false;
      }
    | undefined;
  const load = tripModuleLoader({
    "@/features/auth/hooks/use-auth": {
      useProfile: () => ({ data: { id: "owner" } }),
    },
    "@/features/auth/services/auth-session": {},
    "@tanstack/react-query": {
      useQuery: (value: typeof options) => {
        options = value;
        return {};
      },
    },
    "./trip-api": { tripApi: {} },
  });
  const { useTripQuery } = load<
    typeof import("../src/features/trip/api/trip-queries.ts")
  >("src/features/trip/api/trip-queries.ts");
  useTripQuery("trip");
  assert.ok(options);
  assert.equal(options.refetchInterval({ state: { data: undefined } }), false);
  assert.equal(
    options.refetchInterval({
      state: {
        data: {
          context: {
            evaluatedDate: "2026-11-07",
            serverTime: "2026-11-07T16:59:59Z",
          },
        },
      },
    }),
    1250,
  );
  assert.equal(
    options.refetchInterval({
      state: {
        data: {
          context: {
            evaluatedDate: "2026-11-07",
            serverTime: "2026-11-07T17:00:01Z",
          },
        },
      },
    }),
    1000,
  );
});
