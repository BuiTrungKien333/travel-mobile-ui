import assert from "node:assert/strict";
import { test } from "node:test";
import type { Trip } from "../src/features/home/types/home-types.ts";
import type { ItineraryOptimizationProposal } from "../src/features/trip/api/itinerary-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const date = "2026-11-05";
const stamp = "2026-11-05T01:00:00Z";
const id = "40000000-0000-0000-0000-000000000001";
const otherId = "40000000-0000-0000-0000-000000000002";
const trip: Trip = { id, title: "Trip", destination: "Da Nang", status: "planned", serverVersion: 3,
  serverItineraryUpdatedAt: stamp, startDate: date, endDate: "2026-11-06", unscheduledStops: [],
  days: [{ date, stops: [id, otherId].map((stopId, index) => ({ id: stopId, time: index ? "" : "09:00", pinned: !index,
    name: { vi: `Visit ${index}`, en: `Visit ${index}` }, kind: { vi: "Place", en: "Place" }, durationMinutes: 45, plannedOrder: index,
    note: "Keep note", location: { latitude: 16, longitude: 108 } })) }, { date: "2026-11-06", stops: [] }],
};
const load = tripModuleLoader();
const { scheduleMutationRequest } = load<typeof import("../src/features/trip/api/save-trip-schedule.ts")>("src/features/trip/api/save-trip-schedule.ts");
const { reviewOptimization } = load<typeof import("../src/features/trip/utils/optimization-review.ts")>("src/features/trip/utils/optimization-review.ts");

function proposal(): ItineraryOptimizationProposal {
  return { status: "ALL_CLEAR", totalTripDistanceKm: 4, totalTripTransitMinutes: 8,
    dailySchedules: [{ dayDate: date, status: "ALL_CLEAR", totalDistanceKm: 4, totalTransitMinutes: 8,
      scheduleItems: trip.days[0].stops.map((stop, index) => ({ placeId: stop.id, placeName: stop.name.en,
        plannedDate: date, displayDate: date, arrivalTime: `${date}T${index ? "10:00" : "09:00"}:00`, durationMinutes: 45,
        transitDistanceKmFromPrev: 2, transitMinutesFromPrev: 4 })) }],
  };
}

test("an assigned visit without a time stays in its day and participates in next-stop order", () => {
  const { scheduledStops, tripBacklog, mergeScheduledOrder } = load<typeof import("../src/features/trip/utils/trip-details-layout.ts")>("src/features/trip/utils/trip-details-layout.ts");
  const { getDayProgress } = load<typeof import("../src/features/home/utils/day-progress.ts")>("src/features/home/utils/day-progress.ts");
  assert.equal(scheduledStops(trip.days[0]).length, 2);
  assert.equal(tripBacklog(trip).length, 0);
  assert.equal(getDayProgress(trip.days[0].stops, []).nextStop.id, id);
  assert.equal(getDayProgress(trip.days[0].stops, [id]).nextStop.id, otherId);
  assert.equal(mergeScheduledOrder(trip.days[0], [otherId, id]).join(), [otherId, id].join());
});

test("returning a visit to the pool carries metadata in the single CAS itinerary request without mutating the draft", () => {
  const before = JSON.stringify(trip);
  const request = scheduleMutationRequest(trip, { kind: "stop", date, stopId: otherId, targetDate: null,
    values: { time: "", durationMinutes: 95, note: "New note", pinned: false } });
  assert.equal(request.expectedUpdatedAt, stamp);
  assert.equal(request.days[0].stops.length, 1);
  assert.equal(request.poolUpdates?.[0].placeId, otherId);
  assert.equal(request.poolUpdates?.[0].durationMinutes, 95);
  assert.equal(request.poolUpdates?.[0].note, "New note");
  assert.equal(JSON.stringify(trip), before);
});

test("removing from a day preserves its metadata in the pool and needs an itinerary version", () => {
  const mutation = { kind: "remove" as const, date, stopId: otherId };
  const request = scheduleMutationRequest(trip, mutation);
  assert.equal(request.poolUpdates?.[0].note, "Keep note");
  assert.equal(request.poolUpdates?.[0].durationMinutes, 45);
  assert.throws(() => scheduleMutationRequest({ ...trip, serverItineraryUpdatedAt: undefined }, mutation));
});

test("moving to another day includes arrival date/time while preserving other visits and avoiding metadata PATCH", () => {
  const request = scheduleMutationRequest(trip, { kind: "stop", date, stopId: otherId, targetDate: "2026-11-06",
    values: { time: "11:15", durationMinutes: 60, note: "Moved", pinned: true } });
  assert.equal(request.poolUpdates, undefined);
  assert.equal(request.days[0].stops[0].pinned, true);
  assert.equal(request.days[1].stops[0].arrivalTime, "2026-11-06T11:15:00");
  assert.equal(request.days[1].stops[0].pinned, true);
});

test("reorder cannot move a pin and a valid reorder uses the editor's original version", () => {
  assert.throws(() => scheduleMutationRequest(trip, { kind: "reorder", date, ids: [otherId, id] }));
  const unpinned = structuredClone(trip); unpinned.days[0].stops[0].pinned = false;
  const request = scheduleMutationRequest(unpinned, { kind: "reorder", date, ids: [otherId, id], expectedItineraryUpdatedAt: stamp });
  assert.equal(request.expectedUpdatedAt, stamp);
  assert.equal(request.days[0].stops[0].placeId, otherId);
});

test("optimization review counts before/after differences without editing the trip", () => {
  const before = JSON.stringify(trip);
  const result = reviewOptimization(proposal(), trip.days);
  assert.equal(result.valid, true);
  assert.equal(result.changed, 1);
  assert.equal(result.previous.get(`${date}:${id}`)?.index, 0);
  assert.equal(JSON.stringify(trip), before);
});

test("optimization rejects empty, duplicate, missing, foreign, wrong-date and moved-pin proposals", () => {
  const empty = proposal(); empty.dailySchedules = [];
  const duplicate = proposal(); duplicate.dailySchedules[0].scheduleItems[1].placeId = id;
  const missing = proposal(); missing.dailySchedules[0].scheduleItems.pop();
  const foreign = proposal(); foreign.dailySchedules[0].scheduleItems[1].placeId = "foreign";
  const wrongDate = proposal(); wrongDate.dailySchedules[0].scheduleItems[0].arrivalTime = "2026-11-06T09:00:00";
  const movedPin = proposal(); movedPin.dailySchedules[0].scheduleItems.reverse();
  const latePin = proposal(); latePin.dailySchedules[0].scheduleItems[0].arrivalTime = `${date}T09:05:00`;
  for (const invalid of [empty, duplicate, missing, foreign, wrongDate, movedPin, latePin])
    assert.equal(reviewOptimization(invalid, trip.days).valid, false);
});

test("directions use coordinates and the selected mode; names remain URL encoded when no coordinate exists", () => {
  const { tripDirectionsUrl } = load<typeof import("../src/features/home/utils/map-links.ts")>("src/features/home/utils/map-links.ts");
  for (const [mode, expected] of [["car", "driving"], ["motorcycle", "two-wheeler"], ["walk", "walking"]] as const) {
    const url = new URL(tripDirectionsUrl(trip.days[0].stops[0], trip.destination, mode));
    assert.equal(url.searchParams.get("destination"), "16,108");
    assert.equal(url.searchParams.get("travelmode"), expected);
  }
  const named = new URL(tripDirectionsUrl({ ...trip.days[0].stops[0], location: undefined }, "Đà Nẵng"));
  assert.ok(named.searchParams.get("destination")?.includes("Đà Nẵng"));
});

test("visited writes have a tap guard, keep progress unchanged until success and reject future/cancelled days", async () => {
  const calls: unknown[] = [];
  let release = () => {};
  const f = tripModuleLoader({
    react: { useRef: () => ({ current: false }) },
    "@/utils/calendar-date": { todayCalendarDate: () => date },
    "../api/trip-hooks": { useUpdateTripPlaceMutation: () => ({ isPending: false,
      mutateAsync: async (request: unknown) => { calls.push(request); await new Promise<void>((resolve) => { release = resolve; }); } }) },
  });
  const { useTripVisit } = f<typeof import("../src/features/trip/hooks/use-trip-visit.ts")>("src/features/trip/hooks/use-trip-visit.ts");
  const hook = useTripVisit(trip);
  const pending = hook.setVisited(id, date, true);
  assert.equal(await hook.setVisited(id, date, true), false);
  assert.equal(calls.length, 1);
  assert.equal(trip.days[0].stops[0].visited, undefined);
  release(); assert.equal(await pending, true);
  await assert.rejects(hook.setVisited(id, "2026-11-06", true), { code: "VISIT_UNAVAILABLE" });
  await assert.rejects(useTripVisit({ ...trip, status: "cancelled" }).setVisited(id, date, true));
});

test("Home live card reads the server itinerary, opens walking directions and advances after a server check-in refresh", async () => {
  const current = structuredClone(trip);
  current.days[0].transport = "walk";
  const visits: string[] = []; const urls: string[] = [];
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>("src/theme/tokens.ts");
  const f = tripModuleLoader({
    react: { useState: () => [null, () => {}] },
    "expo-router": { router: { push() {} } },
    "react-native": { Linking: { openURL: async (url: string) => { urls.push(url); } }, View: "View", ActivityIndicator: "Spinner" },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "en" }) },
    "@/components/ui/app-text": { AppText: "AppText" }, "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/features/trip/api/trip-hooks": { useTripQuery: () => ({ data: {} }), useTripPlacesQuery: () => ({ data: [] }) },
    "@/features/trip/api/itinerary-hooks": { useTripItineraryQuery: () => ({ data: {} }) },
    "@/features/trip/api/trip-adapters": { toTrip: () => current },
    "@/features/trip/hooks/use-trip-visit": { useTripVisit: () => ({ isPending: false,
      setVisited: async (placeId: string) => { visits.push(placeId); } }) },
    "./ongoing-trip-components": { NextStopCard: "NextStopCard" },
  });
  const { HomeLiveJourney } = f<typeof import("../src/features/home/components/home-live-journey.tsx")>("src/features/home/components/home-live-journey.tsx");
  type Node = { type: unknown; props: Record<string, unknown> };
  function render() {
    const root = HomeLiveJourney({ tripId: id, today: date }) as Node;
    assert.equal(typeof root.type, "function");
    const content = (root.type as (props: Record<string, unknown>) => Node)(root.props);
    return (content.props.children as Node[])[0].props as { stop: { id: string }; onDirections: () => void; onVisited: () => void };
  }
  const card = render(); assert.equal(card.stop.id, id);
  card.onDirections(); card.onVisited();
  assert.deepEqual(visits, [id]);
  assert.equal(new URL(urls[0]).searchParams.get("travelmode"), "walking");
  assert.equal(render().stop.id, id);
  current.days[0].stops[0].visited = true;
  assert.equal(render().stop.id, otherId);
});
