import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { Trip, TripStop } from "../src/features/home/types/home-types.ts";

const load = tripModuleLoader();
const { timelineDropTarget, moveTimelineStop } = load<
  typeof import("../src/features/trip/utils/timeline-reorder.ts")
>("src/features/trip/utils/timeline-reorder.ts");
const { mergeScheduledOrder } = load<
  typeof import("../src/features/trip/utils/trip-details-layout.ts")
>("src/features/trip/utils/trip-details-layout.ts");
const { applyTripMutation } = load<
  typeof import("../src/features/trip/utils/trip-mutations.ts")
>("src/features/trip/utils/trip-mutations.ts");
const stops: TripStop[] = ["a", "b", "c", "d"].map((id, index) => ({
  id,
  time: `${String(9 + index).padStart(2, "0")}:00`,
  name: { vi: id, en: id },
  kind: { vi: "", en: "" },
}));

test("drop targets use measured row centers, support both directions, and clamp at the ends", () => {
  const slots = [100, 200, 80, 120].map((height, index) => ({
    id: stops[index].id,
    height,
    pinned: false,
  }));
  assert.equal(timelineDropTarget(slots, 0, 0), 0);
  assert.equal(timelineDropTarget(slots, 0, 80), 1);
  assert.equal(timelineDropTarget(slots, 0, 300), 2);
  assert.equal(timelineDropTarget(slots, 3, -300), 1);
  assert.equal(timelineDropTarget(slots, 0, -10000), 0);
  assert.equal(timelineDropTarget(slots, 0, 10000), 3);
});

test("pinned stops cannot move and cannot be crossed by a dragged stop", () => {
  const pinned = stops.map((stop, index) => ({ ...stop, pinned: index === 1 }));
  const slots = pinned.map((stop) => ({
    id: stop.id,
    height: 100,
    pinned: stop.pinned,
  }));
  assert.equal(timelineDropTarget(slots, 1, 500), 1);
  assert.equal(timelineDropTarget(slots, 0, 500), 0);
  assert.equal(timelineDropTarget(slots, 3, -500), 2);
  assert.equal(moveTimelineStop(pinned, "b", 0), null);
  assert.equal(moveTimelineStop(pinned, "a", 3), null);
  assert.equal(moveTimelineStop(pinned, "d", 0), null);
  assert.deepEqual(Array.from(moveTimelineStop(pinned, "d", 2) ?? []), [
    "a",
    "b",
    "d",
    "c",
  ]);
});

test("drop mutations reorder only scheduled stops and preserve time slots, pins, and unscheduled entries", () => {
  const pending = { ...stops[3], id: "pending", time: "" };
  const trip: Trip = {
    id: "trip",
    destination: "Da Lat",
    status: "planned",
    days: [
      { date: "2026-10-24", stops: [stops[0], pending, stops[1], stops[2]] },
    ],
  };
  const ids = moveTimelineStop(stops.slice(0, 3), "c", 0);
  assert.ok(ids);
  const updated = applyTripMutation(trip, {
    kind: "reorder",
    date: trip.days[0].date,
    ids: mergeScheduledOrder(trip.days[0], ids),
  });
  assert.ok(updated);
  assert.deepEqual(
    Array.from(updated.days[0].stops, (stop) => stop.id),
    ["c", "pending", "a", "b"],
  );
  assert.deepEqual(
    Array.from(updated.days[0].stops, (stop) => stop.time),
    ["09:00", "", "10:00", "11:00"],
  );
  assert.equal(updated.days[0].stops[1].id, pending.id);
  assert.equal(updated.days[0].stops[1].time, pending.time);
  assert.equal(updated.days[0].stops[1].name, pending.name);
  assert.deepEqual(
    trip.days[0].stops.map((stop) => stop.id),
    ["a", "pending", "b", "c"],
  );
});

test("invalid/no-op drops do not create a mutation; swipe removal can be undone", () => {
  assert.equal(moveTimelineStop(stops, "missing", 1), null);
  assert.equal(moveTimelineStop(stops, "a", -1), null);
  assert.equal(moveTimelineStop(stops, "a", 4), null);
  assert.equal(moveTimelineStop(stops, "a", 0), null);
  const trip: Trip = {
    id: "trip",
    destination: "Da Lat",
    status: "planned",
    days: [{ date: "2026-10-24", stops }],
  };
  const removed = applyTripMutation(trip, {
    kind: "remove",
    date: trip.days[0].date,
    stopId: "b",
  });
  assert.ok(removed);
  assert.equal(
    removed.days[0].stops.some((stop) => stop.id === "b"),
    false,
  );
  assert.equal(removed.unscheduledStops?.[0].id, "b");
  const restored = applyTripMutation(removed, {
    kind: "restore",
    snapshot: { days: trip.days, unscheduledStops: trip.unscheduledStops },
  });
  assert.ok(restored);
  assert.equal(restored.days, trip.days);
  assert.equal(restored.unscheduledStops, undefined);
});
