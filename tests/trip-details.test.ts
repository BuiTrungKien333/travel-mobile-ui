import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { loadHomePreview } from "./helpers/load-home-preview.ts";
import type { Trip, TripStop } from "../src/features/home/types/home-types.ts";

const load = tripModuleLoader({
  "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
});
const { applyTripMutation } = load<
  typeof import("../src/features/trip/utils/trip-mutations.ts")
>("src/features/trip/utils/trip-mutations.ts");
const { getDayTravel, suggestedDayOrder, getTripForecast } = load<
  typeof import("../src/features/trip/data/trip-details-preview.ts")
>("src/features/trip/data/trip-details-preview.ts");
const { tripRouteSchema } = load<
  typeof import("../src/features/trip/schemas/trip-route-schema.ts")
>("src/features/trip/schemas/trip-route-schema.ts");
const {
  stopDetailsSchema,
  tripInfoSchema,
  daySettingsSchema,
  tripStartPointSchema,
  tripEditSchema,
} = load<typeof import("../src/features/trip/schemas/trip-details-schema.ts")>(
  "src/features/trip/schemas/trip-details-schema.ts",
);
const { copy } = load<
  typeof import("../src/features/trip/i18n/trip-details-copy.ts")
>("src/features/trip/i18n/trip-details-copy.ts").useTripDetailsCopy();
const { createPreviewStore } = loadHomePreview();
function fixture() {
  const store = createPreviewStore();
  store.getState().changeScenario("upcoming");
  const trip = store.getState().trips.find((item) => item.id === "dalat");
  assert.ok(trip);
  return { store, trip };
}

test("departure picker preserves local 24-hour times without a timezone shift", () => {
  const { timePickerDate, timePickerValue } = load<
    typeof import("../src/features/trip/utils/time-picker-value.ts")
  >("src/features/trip/utils/time-picker-value.ts");
  for (const value of ["00:00", "07:05", "12:00", "23:59"]) {
    assert.equal(timePickerValue(timePickerDate(value)), value);
    const [hour, minute] = value.split(":").map(Number);
    assert.equal(timePickerValue(new Date(2026, 9, 24, hour, minute)), value);
  }
});

test("departure picker opens empty or malformed values at a valid default", () => {
  const { timePickerDate, timePickerValue } = load<
    typeof import("../src/features/trip/utils/time-picker-value.ts")
  >("src/features/trip/utils/time-picker-value.ts");
  for (const value of ["", "25:00", "08:60", "8:30"]) {
    assert.equal(timePickerValue(timePickerDate(value)), "08:30");
  }
});

test("details route rejects arrays, invalid dates and malformed identifiers", () => {
  assert.equal(
    tripRouteSchema.safeParse({
      tripId: "dalat",
      day: "2026-10-21",
      map: "expanded",
    }).success,
    true,
  );
  assert.equal(
    tripRouteSchema.safeParse({ tripId: "draft-1", day: "2026-10-24" }).success,
    true,
  );
  for (const value of [
    { tripId: ["dalat"] },
    { tripId: "../../secret" },
    { tripId: "" },
    { tripId: "dalat", day: "2026-02-30" },
    { tripId: "dalat", day: ["2026-10-24"] },
    { tripId: "dalat", map: ["expanded"] },
    { tripId: "dalat", map: "invalid" },
  ])
    assert.equal(tripRouteSchema.safeParse(value).success, false);
});

test("newly selected places remain in the pool until a day and time are chosen", () => {
  const { store, trip } = fixture();
  const stop = trip.days[0].stops[0];
  store.getState().createDraft({
    destination: "Đà Lạt",
    startDate: "2026-10-24",
    endDate: "2026-10-25",
    initialStops: [stop],
  });
  const draft = store.getState().trips[0];
  assert.equal(draft.days[0].stops.length, 0);
  assert.equal(draft.unscheduledStops?.[0].time, "");
  assert.equal(
    store.getState().mutateTrip(draft.id, {
      kind: "stop",
      date: null,
      targetDate: draft.days[1].date,
      stopId: stop.id,
      values: { time: "10:15", durationMinutes: 60 },
    }),
    true,
  );
  const saved = store.getState().trips[0];
  assert.equal(saved.unscheduledStops?.length, 0);
  assert.equal(saved.days[1].stops[0].time, "10:15");
  assert.equal(stop.time, "09:30");
});

test("move between days is atomic, prevents unintended duplicates and keeps source immutable", () => {
  const { trip } = fixture();
  const stop = trip.days[0].stops[0];
  const mutation = {
    kind: "stop",
    date: trip.days[0].date,
    stopId: stop.id,
    targetDate: trip.days[1].date,
    values: { time: "10:00", durationMinutes: 45 },
  } as const;
  assert.equal(applyTripMutation(trip, mutation), null);
  const moved = applyTripMutation(trip, {
    ...mutation,
    targetDate: trip.days[2].date,
  });
  assert.ok(moved);
  assert.equal(moved.days[0].stops.length, 1);
  assert.equal(moved.days[2].stops[0].id, stop.id);
  assert.equal(moved.days[2].stops[0].time, "10:00");
  assert.equal(trip.days[0].stops.length, 2);
  assert.equal(trip.days[2].stops.length, 0);
});

test("removing from a day moves to the pool and restore reinstates the exact schedule", () => {
  const { store, trip } = fixture();
  const snapshot = {
    days: trip.days,
    unscheduledStops: trip.unscheduledStops,
    startDate: trip.startDate,
    endDate: trip.endDate,
  };
  assert.equal(
    store.getState().mutateTrip(trip.id, {
      kind: "remove",
      date: trip.days[0].date,
      stopId: "lake",
    }),
    true,
  );
  let saved = store.getState().trips.find((item) => item.id === trip.id);
  assert.ok(saved);
  assert.equal(saved.unscheduledStops?.[0].id, "lake");
  assert.equal(
    saved.days[0].stops.some((stop) => stop.id === "lake"),
    false,
  );
  store.getState().mutateTrip(trip.id, { kind: "restore", snapshot });
  saved = store.getState().trips.find((item) => item.id === trip.id);
  assert.ok(saved);
  assert.equal(saved.days, snapshot.days);
  assert.equal(saved.unscheduledStops, snapshot.unscheduledStops);
});

test("date changes keep matching days, rescue removed places and preserve memories", () => {
  const { store, trip } = fixture();
  const memories = store.getState().memories;
  const changed = applyTripMutation(trip, {
    kind: "dates",
    startDate: "2026-10-25",
    endDate: "2026-10-28",
  });
  assert.ok(changed);
  assert.equal(changed.days.length, 4);
  assert.equal(changed.days[0], trip.days[1]);
  assert.equal(changed.days[3].stops.length, 0);
  assert.equal(changed.unscheduledStops?.length, 2);
  const withNotes: Trip = {
    ...trip,
    unscheduledStops: [{ ...trip.days[0].stops[0], note: "Booking A" }],
    days: trip.days.map((day, index) =>
      index === 0
        ? {
            ...day,
            stops: day.stops.map((stop) =>
              stop.id === "lake" ? { ...stop, note: "Booking B" } : stop,
            ),
          }
        : day,
    ),
  };
  const rescued = applyTripMutation(withNotes, {
    kind: "dates",
    startDate: "2026-10-25",
    endDate: "2026-10-28",
  });
  assert.equal(
    rescued?.unscheduledStops?.find((stop) => stop.id === "lake")?.note,
    "Booking A\nBooking B",
  );
  store.getState().mutateTrip(trip.id, {
    kind: "dates",
    startDate: "2026-10-25",
    endDate: "2026-10-28",
  });
  assert.equal(store.getState().memories, memories);
  assert.equal(
    applyTripMutation(trip, {
      kind: "dates",
      startDate: "2026-10-28",
      endDate: "2026-10-25",
    }),
    null,
  );
});

test("trip edits validate dates and save metadata and schedule together without losing places", () => {
  const { trip } = fixture();
  const schema = tripEditSchema(copy);
  const fields = {
    destination: "  Đà Lạt  ",
    title: "  Kỳ nghỉ cùng bạn  ",
    accommodation: "Khách sạn",
    notes: "Ghi chú mới",
    budget: "3000000",
    preferences: ["nature"],
    startDate: "2026-10-25",
    endDate: "2026-10-27",
  };
  const { startDate, endDate, ...values } = schema.parse(fields);
  const beforeIds = trip.days
    .flatMap((day) => day.stops.map((stop) => stop.id))
    .sort();
  const edited = applyTripMutation(trip, {
    kind: "info",
    values,
    dateRange: { startDate, endDate },
  });
  assert.ok(edited);
  assert.equal(edited.title, "Kỳ nghỉ cùng bạn");
  assert.equal(edited.destination, "Đà Lạt");
  assert.equal(edited.budget?.amount, 3000000);
  assert.equal(edited.days.length, 3);
  assert.equal(edited.days[0], trip.days[1]);
  assert.deepEqual(
    [
      ...edited.days.flatMap((day) => day.stops.map((stop) => stop.id)),
      ...(edited.unscheduledStops ?? []).map((stop) => stop.id),
    ].sort(),
    Array.from(beforeIds),
  );
  assert.equal(
    applyTripMutation(trip, {
      kind: "info",
      values,
      dateRange: { startDate: endDate, endDate: startDate },
    }),
    null,
  );
  assert.notEqual(trip.title, values.title);
  assert.equal(trip.days.length, 4);
  assert.equal(
    schema.safeParse({ ...fields, startDate: "2026-02-30" }).success,
    false,
  );
  assert.equal(
    schema.safeParse({ ...fields, endDate: "2028-01-01" }).success,
    false,
  );
  assert.equal(
    schema.safeParse({ ...fields, destination: "  " }).success,
    false,
  );
  assert.equal(
    schema.safeParse({
      ...fields,
      startDate: "2025-10-21",
      endDate: "2025-10-22",
    }).success,
    true,
  );
  assert.equal(
    schema.safeParse({ ...fields, startDate: "", endDate: "" }).success,
    true,
  );
  assert.equal(
    schema.safeParse({ ...fields, startDate: "", endDate: fields.endDate })
      .success,
    false,
  );
});

test("editing metadata without dates preserves the existing schedule and destination", () => {
  const { trip } = fixture();
  const values = tripInfoSchema(copy).parse({
    title: "Tên mới",
    accommodation: "",
    notes: "",
    budget: "",
    preferences: [],
  });
  const edited = applyTripMutation(trip, { kind: "info", values });
  assert.ok(edited);
  assert.equal(edited.days, trip.days);
  assert.equal(edited.destination, trip.destination);
  assert.equal(edited.startDate, trip.startDate);
});

test("reorder preserves time slots, rejects missing IDs and honors fixed pinned positions", () => {
  const { trip } = fixture();
  const day = trip.days[1];
  const changed = applyTripMutation(trip, {
    kind: "reorder",
    date: day.date,
    ids: ["museum", "lake", "square"],
  });
  assert.ok(changed);
  assert.equal(
    changed.days[1].stops.map((stop) => stop.time).join(","),
    day.stops.map((stop) => stop.time).join(","),
  );
  assert.equal(changed.days[1].stops[0].id, "museum");
  assert.equal(
    applyTripMutation(trip, {
      kind: "reorder",
      date: day.date,
      ids: ["lake", "lake", "museum"],
    }),
    null,
  );
  const pinned: Trip = {
    ...trip,
    days: [
      {
        ...day,
        stops: day.stops.map((stop) => ({
          ...stop,
          pinned: stop.id === "square",
        })),
      },
    ],
  };
  assert.equal(
    applyTripMutation(pinned, {
      kind: "reorder",
      date: day.date,
      ids: ["square", "lake", "museum"],
    }),
    null,
  );
  assert.equal(suggestedDayOrder(pinned.days[0])?.[1], "square");
});

test("unknown legs stay unknown and walking/car estimates use distinct fixture values", () => {
  const { trip } = fixture();
  const day = trip.days[0];
  assert.equal(getDayTravel(day).minutes, 7);
  assert.equal(
    getDayTravel({ ...day, startLocation: "My hotel" }).complete,
    false,
  );
  assert.equal(getDayTravel({ ...day, returnToStart: true }).complete, false);
  assert.equal(getDayTravel({ ...day, transport: "walk" }).minutes, 20);
  assert.equal(getDayTravel({ ...day, transport: "motorcycle" }).minutes, 6);
  assert.equal(
    getDayTravel({
      ...day,
      stops: [...day.stops]
        .reverse()
        .map((stop) => ({ ...stop, id: `unknown-${stop.id}` })),
    }).complete,
    false,
  );
  const unknown: TripStop = { ...day.stops[0], id: "unknown" };
  assert.equal(
    suggestedDayOrder({ ...day, stops: [...day.stops, unknown] }),
    null,
  );
});

test("forecast fixtures require both the supported destination and the selected date", () => {
  const { trip } = fixture();
  assert.ok(
    getTripForecast(
      { ...trip, id: "draft-1", destination: "Đà Lạt, Lâm Đồng" },
      "2026-10-24",
    ),
  );
  assert.equal(
    getTripForecast({ ...trip, destination: "Đà Nẵng" }, "2026-10-24"),
    undefined,
  );
  assert.equal(getTripForecast(trip, "2028-10-24"), undefined);
});

test("editor schemas validate clock times, durations and normalized budget", () => {
  const stop = {
    time: "09:30",
    durationMinutes: "45",
    pinned: false,
    note: "",
    targetDate: null,
  };
  assert.equal(stopDetailsSchema(copy).parse(stop).durationMinutes, 45);
  for (const changes of [
    { time: "25:30" },
    { time: "9:30" },
    { durationMinutes: "0" },
    { durationMinutes: "481" },
  ])
    assert.equal(
      stopDetailsSchema(copy).safeParse({ ...stop, ...changes }).success,
      false,
    );
  const info = tripInfoSchema(copy).parse({
    title: "  My trip  ",
    accommodation: "",
    notes: "",
    budget: "3000000",
    preferences: [],
  });
  assert.equal(info.title, "My trip");
  assert.equal(info.budget?.currency, "VND");
  assert.equal(info.budget?.amount, 3000000);
});

test("changing transport preserves departure settings and accepts a motorbike", () => {
  const { trip } = fixture();
  const day = {
    ...trip.days[0],
    startLocation: "Hotel",
    startTime: "08:00",
    returnToStart: true,
  };
  const values = daySettingsSchema(copy).parse({
    ...day,
    transport: "motorcycle",
  });
  assert.equal(values.transport, "motorcycle");
  const updated = applyTripMutation(
    { ...trip, days: [day, ...trip.days.slice(1)] },
    {
      kind: "day",
      date: day.date,
      values: { transport: "motorcycle" },
    },
  );
  assert.ok(updated);
  assert.equal(updated.days[0].transport, "motorcycle");
  assert.equal(updated.days[0].startLocation, "Hotel");
  assert.equal(updated.days[0].startTime, "08:00");
  assert.equal(updated.days[0].returnToStart, true);
  assert.equal(updated.days[0].stops, day.stops);
});

test("starting-point editor validates return trips and preserves transport when saving", () => {
  const schema = tripStartPointSchema(copy);
  assert.equal(
    schema.safeParse({
      startLocation: "   ",
      startTime: "08:30",
      returnToStart: true,
    }).success,
    false,
  );
  assert.equal(
    schema.safeParse({
      startLocation: "Home",
      startTime: "25:00",
      returnToStart: false,
    }).success,
    false,
  );
  const values = schema.parse({
    startLocation: "  Home address  ",
    startTime: "07:45",
    returnToStart: true,
    transport: "car",
  });
  assert.equal(values.startLocation, "Home address");
  assert.equal("transport" in values, false);
  const { trip } = fixture();
  const updated = applyTripMutation(
    {
      ...trip,
      days: trip.days.map((day) => ({ ...day, transport: "motorcycle" })),
    },
    {
      kind: "day",
      date: trip.days[0].date,
      values,
    },
  );
  assert.ok(updated);
  assert.equal(updated.days[0].transport, "motorcycle");
  assert.equal(updated.days[0].startTime, "07:45");
  assert.equal(updated.days[0].returnToStart, true);
});

test("deleting a trip removes its memories/visited keys while keeping other trips intact", () => {
  const store = createPreviewStore();
  store.getState().changeScenario("ongoing");
  const other = store
    .getState()
    .trips.find((trip) => trip.id !== "dalat-ongoing");
  assert.ok(other);
  store.getState().deleteTrip("dalat-ongoing");
  assert.equal(store.getState().trips.length, 1);
  assert.equal(store.getState().trips[0], other);
  assert.equal(
    store
      .getState()
      .memories.some((memory) => memory.tripId === "dalat-ongoing"),
    false,
  );
  assert.equal(
    Object.keys(store.getState().visited).some((key) =>
      key.startsWith("dalat-ongoing:"),
    ),
    false,
  );
  assert.equal(
    store
      .getState()
      .mutateTrip("deleted", { kind: "add", date: null, stops: [] }),
    false,
  );
});
