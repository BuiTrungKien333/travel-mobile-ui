import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { loadHomePreview } from "./helpers/load-home-preview.ts";
import type { TripPreference } from "../src/features/home/types/home-types.ts";

const load = tripModuleLoader({
  "@/hooks/use-i18n": { useI18n: () => ({ locale: "en" }) },
});
const { createTripSchema } = load<
  typeof import("../src/features/trip/schemas/create-trip-schema.ts")
>("src/features/trip/schemas/create-trip-schema.ts");
const { useTripCopy } = load<
  typeof import("../src/features/trip/i18n/trip-copy.ts")
>("src/features/trip/i18n/trip-copy.ts");
const { getPlacesForDestination } = load<
  typeof import("../src/features/trip/data/place-bank.ts")
>("src/features/trip/data/place-bank.ts");
const { createPreviewStore } = loadHomePreview();
const copy = useTripCopy().copy;
const schema = createTripSchema(copy, "2026-10-21");
const values = {
  destination: "  Đà Nẵng  ",
  startDate: "2026-10-24",
  endDate: "2026-10-27",
  title: "  Summer trip  ",
  budget: "3000000",
  preferences: ["nature", "food"] as TripPreference[],
  initialStops: [],
};

test("trip form normalizes text and stores budget, currency and stable interests", () => {
  const parsed = schema.parse(values);
  assert.equal(parsed.destination, "Đà Nẵng");
  assert.equal(parsed.title, "Summer trip");
  assert.equal(parsed.budget, 3000000);
  const store = createPreviewStore();
  assert.equal(store.getState().createDraft(parsed), true);
  const trip = store.getState().trips[0];
  assert.equal(trip.budget?.amount, 3000000);
  assert.equal(trip.budget?.currency, "VND");
  assert.equal(trip.preferences?.join(","), "nature,food");
  assert.equal(store.getState().panel?.kind, "plan");
  parsed.preferences.push("beach");
  assert.equal(trip.preferences?.length, 2);
});

test("optional budget and interests do not prevent a one-day trip", () => {
  const parsed = schema.parse({
    ...values,
    budget: "",
    preferences: [],
    endDate: values.startDate,
  });
  assert.equal(parsed.budget, undefined);
});

test("invalid calendar dates, past departures, reversed and excessive ranges are field errors", () => {
  for (const [changes, field, message] of [
    [{ startDate: "2026-02-30" }, "startDate", copy.invalidDate],
    [{ startDate: "2026-10-20" }, "startDate", copy.pastDate],
    [{ endDate: "2026-10-23" }, "endDate", copy.dateOrder],
    [{ endDate: "2028-10-23" }, "endDate", copy.dateRange],
    [{ startDate: "" }, "startDate", copy.dateRequired],
  ] as const) {
    const result = schema.safeParse({ ...values, ...changes });
    assert.equal(result.success, false);
    if (result.success) throw new Error("Invalid trip was accepted");
    assert.ok(
      result.error.issues.some(
        (issue) => issue.path[0] === field && issue.message === message,
      ),
    );
  }
});

test("invalid amounts, overlong input and unknown interest IDs are rejected", () => {
  for (const changes of [
    { budget: "-1" },
    { budget: "1.5" },
    { budget: "1000000000001" },
    { destination: " " },
    { destination: "a".repeat(121) },
    { title: "a".repeat(121) },
    { preferences: ["unknown"] },
  ])
    assert.equal(schema.safeParse({ ...values, ...changes }).success, false);
});

test("unavailable city fixtures are empty instead of silently using Da Lat places", () => {
  assert.equal(getPlacesForDestination("Sapa, Lào Cai").length, 0);
  assert.equal(getPlacesForDestination("Paris").length, 0);
  assert.ok(
    getPlacesForDestination("Đà Nẵng").every((stop) =>
      stop.id.startsWith("dn-"),
    ),
  );
});

test("initial places stay unscheduled and are copied before choosing a trip day", () => {
  const store = createPreviewStore();
  const stops = [...getPlacesForDestination("Đà Nẵng")].reverse();
  const original = stops.map((stop) => stop.id).join(",");
  store
    .getState()
    .createDraft({ ...schema.parse(values), initialStops: stops });
  const trip = store.getState().trips[0];
  assert.equal(
    trip.unscheduledStops?.map((stop) => stop.time).join(","),
    ",,,",
  );
  assert.equal(stops.map((stop) => stop.id).join(","), original);
  stops.pop();
  assert.equal(trip.unscheduledStops?.length, 4);
  store
    .getState()
    .mutateTrip(trip.id, {
      kind: "add",
      date: trip.days[1].date,
      stops: getPlacesForDestination("Đà Nẵng").slice(0, 1),
    });
  assert.ok(store.getState().trips[0].days[1].stops[0].id.startsWith("dn-"));
});

test("the store rejects invalid date allocations without changing the active panel", () => {
  const store = createPreviewStore();
  const before = store.getState();
  for (const changes of [
    { endDate: "2025-01-01" },
    { startDate: "2026-02-30" },
    { endDate: "2029-01-01" },
    { budget: Infinity },
  ]) {
    assert.equal(
      store.getState().createDraft({ ...schema.parse(values), ...changes }),
      false,
    );
    assert.equal(store.getState().trips, before.trips);
    assert.equal(store.getState().panel, before.panel);
  }
});
