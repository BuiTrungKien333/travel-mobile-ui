import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { Memory } from "../src/features/home/types/home-types.ts";

test("memory calendar round-trips Vietnam midnight independently of device time zone", () => {
  const load = tripModuleLoader();
  const { todayCalendarDate, travelClockTime, travelDateTime } = load<
    typeof import("../src/utils/calendar-date.ts")
  >("src/utils/calendar-date.ts");
  const instant = new Date("2026-10-21T17:05:00Z");
  assert.equal(todayCalendarDate(instant), "2026-10-22");
  assert.equal(travelClockTime(instant), "00:05");
  assert.equal(
    travelDateTime("2026-10-22", "00:05").toISOString(),
    instant.toISOString(),
  );
  assert.ok(Number.isNaN(travelDateTime("2026-02-30", "10:00").getTime()));
  assert.ok(Number.isNaN(travelDateTime("2026-10-22", "24:05").getTime()));
});

test("server photos use the trip calendar and local drafts cannot leak between accounts", () => {
  const load = tripModuleLoader();
  const { mergeMemories } = load<
    typeof import("../src/features/memories/utils/server-memories.ts")
  >("src/features/memories/utils/server-memories.ts");
  const local: Memory = {
    id: "local-draft",
    photo: "file:///photo.jpg",
    text: "Private",
    date: "2026-10-22",
    time: "00:05",
    destination: "",
    local: { capturedAt: "2026-10-21T17:05:00Z", deviceSaved: false },
  };
  const remote = {
    id: "memory",
    userId: "owner",
    version: 0,
    tripId: null,
    placeId: null,
    note: "Saved",
    experiencedAt: "2026-10-21T17:05:00Z",
    coverImageUrl: null,
    mediaCount: 1,
    media: [
      {
        id: "photo",
        url: "https://example.com/photo.jpg",
        displayOrder: 0,
        mimeType: "image/jpeg",
        width: 8,
        height: 6,
      },
    ],
  };
  const result = mergeMemories(
    [remote],
    [
      local,
      {
        ...local,
        id: "local-other",
        local: { ...local.local!, userId: "other" },
      },
    ],
    [],
    "owner",
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].date, "2026-10-22");
  assert.equal(result[0].time, "00:05");
  const owned = { ...local, local: { ...local.local!, userId: "owner" } };
  assert.equal(mergeMemories([], [owned], [], "owner").length, 1);
});
