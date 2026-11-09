import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { Trip, TripStop } from "../src/features/home/types/home-types.ts";

const load = tripModuleLoader();
const {
  getTripDetailsMode,
  scheduledStops,
  tripBacklog,
  mergeScheduledOrder,
  visitTimeRange,
} = load<typeof import("../src/features/trip/utils/trip-details-layout.ts")>(
  "src/features/trip/utils/trip-details-layout.ts",
);
const { applyTripMutation } = load<
  typeof import("../src/features/trip/utils/trip-mutations.ts")
>("src/features/trip/utils/trip-mutations.ts");
const stop = (id: string, time = "09:30"): TripStop => ({
  id,
  time,
  name: { vi: id, en: id },
  kind: { vi: "", en: "" },
});
function fixture(): Trip {
  return {
    id: "trip",
    destination: "Đà Lạt",
    status: "planned",
    startDate: "2026-10-24",
    endDate: "2026-10-27",
    days: [{ date: "2026-10-24", stops: [stop("a"), stop("b", "10:30")] }],
  };
}

test("details modes use calendar boundaries inclusively, even when draft/status flags are stale", () => {
  const trip = fixture();
  assert.equal(getTripDetailsMode(trip, "2026-10-23"), "planning");
  assert.equal(getTripDetailsMode(trip, "2026-10-24"), "live");
  assert.equal(getTripDetailsMode(trip, "2026-10-27"), "live");
  assert.equal(getTripDetailsMode(trip, "2026-10-28"), "recap");
  assert.equal(
    getTripDetailsMode({ ...trip, status: "draft" }, "2026-10-25"),
    "live",
  );
  assert.equal(
    getTripDetailsMode({ ...trip, status: "completed" }, "2026-10-23"),
    "planning",
  );
  assert.equal(
    getTripDetailsMode({ ...trip, status: "cancelled" }, "2026-10-25"),
    "cancelled",
  );
});

test("missing/invalid ranges don't accidentally produce a live trip", () => {
  const trip = fixture();
  for (const dates of [
    { startDate: undefined, endDate: undefined },
    { startDate: "2026-02-30", endDate: "2026-10-27" },
    { startDate: "2026-10-28", endDate: "2026-10-24" },
  ]) {
    assert.equal(
      getTripDetailsMode({ ...trip, ...dates }, "2026-10-25"),
      "planning",
    );
  }
});

test("backlog includes untimed day entries and pool entries with their real source; scheduled views exclude both", () => {
  const trip = fixture();
  trip.days[0].stops.push(stop("waiting", ""), stop("invalid", "25:00"));
  trip.days.push({ date: "2026-10-25", stops: [stop("waiting", "")] });
  trip.unscheduledStops = [stop("pool", "12:00")];
  assert.equal(
    scheduledStops(trip.days[0])
      .map((entry) => entry.id)
      .join(),
    "a,b",
  );
  const backlog = tripBacklog(trip);
  assert.equal(backlog.length, 4);
  assert.equal(new Set(backlog.map((entry) => entry.key)).size, 4);
  assert.equal(backlog[0].date, null);
  assert.equal(backlog[1].date, "2026-10-24");
  assert.equal(backlog[3].date, "2026-10-25");
});

test("scheduling an untimed day entry removes it from backlog and retains notes and source immutability", () => {
  const trip = fixture();
  trip.days[0].stops.push({ ...stop("waiting", ""), note: "ticket" });
  const result = applyTripMutation(trip, {
    kind: "stop",
    date: trip.days[0].date,
    stopId: "waiting",
    targetDate: trip.days[0].date,
    values: { time: "14:00", durationMinutes: 60 },
  });
  assert.ok(result);
  assert.equal(tripBacklog(result).length, 0);
  assert.equal(scheduledStops(result.days[0]).length, 3);
  assert.equal(result.days[0].stops[2].note, "ticket");
  assert.equal(trip.days[0].stops[2].time, "");
});

test("scheduled-only reordering leaves untimed entries, pinned slots and time slots intact", () => {
  const trip = fixture();
  const day = trip.days[0];
  day.stops = [
    stop("a", "09:00"),
    stop("waiting", ""),
    { ...stop("pin", "10:00"), pinned: true },
    stop("b", "11:00"),
  ];
  const ids = mergeScheduledOrder(day, ["b", "pin", "a"]);
  assert.equal(ids.join(), "b,waiting,pin,a");
  const result = applyTripMutation(trip, {
    kind: "reorder",
    date: day.date,
    ids,
  });
  assert.ok(result);
  assert.equal(
    result.days[0].stops.map((entry) => entry.time).join(),
    "09:00,,10:00,11:00",
  );
  assert.equal(tripBacklog(result)[0].stop.id, "waiting");
});

test("visit range handles default durations, crossing midnight and unassigned times", () => {
  assert.equal(visitTimeRange(stop("a"))?.label, "09:30 – 10:15");
  const late = visitTimeRange({ ...stop("b", "23:30"), durationMinutes: 90 });
  assert.equal(late?.label, "23:30 – 01:00");
  assert.equal(late?.nextDay, true);
  assert.equal(visitTimeRange(stop("c", "")), null);
});
