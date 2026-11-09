import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dayDistance,
  selectHome,
  tripDuration,
} from "../src/features/home/utils/select-home.ts";
import type { Trip } from "../src/features/home/types/home-types.ts";

function trip(
  id: string,
  startDate?: string,
  endDate?: string,
  status: Trip["status"] = "planned",
): Trip {
  return { id, destination: id, status, startDate, endDate, days: [] };
}
const today = "2026-10-21";
test("ongoing trip wins over nearer drafts and upcoming trips", () => {
  const selected = selectHome(
    [
      trip("draft", today, "2026-10-23", "draft"),
      trip("future", "2026-10-22", "2026-10-24"),
      trip("ongoing", "2026-10-20", "2026-10-23"),
    ],
    today,
  );
  assert.equal(selected.kind, "ongoing");
  if (selected.kind === "ongoing") {
    assert.equal(selected.trip.id, "ongoing");
    assert.equal(selected.dayIndex, 1);
  }
});
test("nearest future departure wins, including drafts, without mutating input", () => {
  const trips = [
    trip("later", "2026-11-01", "2026-11-04"),
    trip("draft", "2026-10-22", "2026-10-23", "draft"),
  ];
  const selected = selectHome(trips, today);
  assert.equal(selected.kind, "upcoming");
  if (selected.kind === "upcoming") assert.equal(selected.trip.id, "draft");
  assert.equal(trips[0].id, "later");
});
test("start and end dates are inclusive for an ongoing trip", () => {
  assert.equal(
    selectHome([trip("one-day", today, today)], today).kind,
    "ongoing",
  );
  assert.equal(
    selectHome([trip("last-day", "2026-10-20", today)], today).kind,
    "ongoing",
  );
});
test("completed travel gives returning state; cancelled and expired drafts do not", () => {
  assert.equal(
    selectHome([trip("past", "2026-09-01", "2026-09-03")], today).kind,
    "returning",
  );
  assert.equal(
    selectHome([trip("completed", undefined, undefined, "completed")], today)
      .kind,
    "returning",
  );
  assert.equal(
    selectHome(
      [
        trip("cancelled", today, "2026-10-24", "cancelled"),
        trip("old-draft", "2026-09-01", "2026-09-03", "draft"),
        trip("undated", undefined, undefined, "draft"),
      ],
      today,
    ).kind,
    "new",
  );
});
test("empty history is new; an upcoming trip beats past history", () => {
  assert.equal(selectHome([], today).kind, "new");
  assert.equal(
    selectHome(
      [
        trip("past", "2026-09-01", "2026-09-03", "completed"),
        trip("next", "2026-10-24", "2026-10-27"),
      ],
      today,
    ).kind,
    "upcoming",
  );
});
test("calendar durations are stable across month and DST boundaries", () => {
  assert.equal(dayDistance("2026-10-31", "2026-11-02"), 2);
  assert.equal(tripDuration(trip("month", "2026-10-31", "2026-11-02")), 3);
  assert.equal(tripDuration(trip("undated")), 0);
});
