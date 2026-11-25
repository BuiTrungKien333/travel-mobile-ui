import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type {
  Memory,
  Trip,
  TripStop,
} from "../src/features/home/types/home-types.ts";
import type { ServerMemory } from "../src/features/memories/api/memory-api.ts";

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

test("merging photos preserves first trip/place matches, stable media order and inputs", () => {
  const { mergeMemories } = tripModuleLoader()<
    typeof import("../src/features/memories/utils/server-memories.ts")
  >("src/features/memories/utils/server-memories.ts");
  const first: TripStop = {
    id: "membership",
    placeId: "place",
    time: "",
    name: { vi: "Đầu tiên", en: "First" },
    kind: { vi: "", en: "" },
  };
  const trip: Trip = {
    id: "trip",
    destination: "Đà Nẵng",
    status: "planned",
    days: [
      { date: "2026-10-22", stops: [first] },
      {
        date: "2026-10-23",
        stops: [{ ...first, name: { vi: "Sau", en: "Later" } }],
      },
    ],
  };
  const media = (id: string, displayOrder: number) => ({
    id,
    displayOrder,
    url: `https://example.com/${id}.jpg`,
    mimeType: null,
    width: null,
    height: null,
  });
  const remote: ServerMemory = {
    id: "memory",
    userId: "owner",
    version: 2,
    tripId: "trip",
    placeId: "place",
    note: "Saved",
    experiencedAt: "2026-10-21T17:05:00Z",
    coverImageUrl: null,
    mediaCount: 3,
    media: [media("last", 2), media("first", 0), media("tied", 0)],
  };
  const inputs = {
    remote: [
      remote,
      {
        ...remote,
        id: "unknown",
        tripId: "unknown",
        media: [media("other", 0)],
      },
    ],
    trips: [trip, { ...trip, destination: "Ignored duplicate", days: [] }],
  };
  const snapshot = JSON.stringify(inputs);

  const photos = mergeMemories(inputs.remote, [], inputs.trips, "owner");

  assert.deepEqual(
    Array.from(photos, (photo) => photo.id),
    ["first", "tied", "last", "other"],
  );
  assert.equal(photos[0].destination, "Đà Nẵng");
  assert.equal(photos[0].place, first.name);
  assert.equal(photos[0].date, "2026-10-22");
  assert.equal(photos[0].time, "00:05");
  assert.equal(photos[3].destination, "");
  assert.equal(photos[3].place, undefined);
  assert.equal(JSON.stringify(inputs), snapshot);
});

test("merging drafts distinguishes an empty server memory from an uploaded photo", () => {
  const { mergeMemories } = tripModuleLoader()<
    typeof import("../src/features/memories/utils/server-memories.ts")
  >("src/features/memories/utils/server-memories.ts");
  const draft = (
    id: string,
    serverId?: string,
    userId = "owner",
    uploaded = false,
  ): Memory => ({
    id,
    photo: "file:///photo.jpg",
    text: "",
    destination: "",
    local: {
      capturedAt: "2026-10-21T17:05:00Z",
      deviceSaved: false,
      userId,
      serverId,
      uploaded,
    },
  });
  const remote: ServerMemory = {
    id: "empty",
    userId: "owner",
    version: 0,
    tripId: null,
    placeId: null,
    note: null,
    experiencedAt: "2026-10-21T17:05:00Z",
    coverImageUrl: null,
    mediaCount: 0,
    media: [],
  };
  const photos = mergeMemories(
    [
      remote,
      {
        ...remote,
        id: "saved",
        mediaCount: 1,
        media: [
          {
            id: "remote-photo",
            url: "https://example.com/a.jpg",
            displayOrder: 0,
            mimeType: null,
            width: null,
            height: null,
          },
        ],
      },
    ],
    [
      draft("new"),
      draft("retry", "empty"),
      draft("duplicate", "saved"),
      draft("other-account", undefined, "other"),
      draft("deleted-backup", "missing", "owner", true),
    ],
    [],
    "owner",
  );
  assert.deepEqual(
    Array.from(photos, (photo) => photo.id),
    ["new", "retry", "remote-photo"],
  );
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
