import assert from "node:assert/strict";
import { test } from "node:test";
import { getDayProgress } from "../src/features/home/utils/day-progress.ts";
import { directionsUrl } from "../src/features/home/utils/map-links.ts";
import type { TripStop } from "../src/features/home/types/home-types.ts";

const stops: TripStop[] = [
  {
    id: "museum",
    time: "15:30",
    name: { vi: "Bảo tàng", en: "Museum" },
    kind: { vi: "Văn hóa", en: "Culture" },
  },
  {
    id: "lake",
    time: "09:30",
    name: { vi: "Hồ", en: "Lake" },
    kind: { vi: "Dạo bộ", en: "Walk" },
  },
  {
    id: "square",
    time: "11:00",
    name: { vi: "Quảng trường", en: "Square" },
    kind: { vi: "Khám phá", en: "Explore" },
  },
];
test("next stop follows explicit check-ins and chronological order without mutating the itinerary", () => {
  const result = getDayProgress(stops, ["lake", "lake", "unrelated"]);
  assert.equal(result.nextStop?.id, "square");
  assert.equal(result.visitedStops.length, 1);
  assert.deepEqual(
    result.ordered.map((stop) => stop.id),
    ["lake", "square", "museum"],
  );
  assert.equal(stops[0].id, "museum");
});
test("undoing a visit restores that stop; completed and empty days have no next stop", () => {
  assert.equal(getDayProgress(stops, ["square"]).nextStop?.id, "lake");
  assert.equal(
    getDayProgress(
      stops,
      stops.map((stop) => stop.id),
    ).nextStop,
    undefined,
  );
  assert.equal(getDayProgress([], []).nextStop, undefined);
});
test("map directions preserve Vietnamese names and safely encode URL parameters", () => {
  const url = new URL(directionsUrl("Hồ Xuân Hương & quảng trường", "Đà Lạt"));
  assert.equal(url.origin, "https://www.google.com");
  assert.equal(url.pathname, "/maps/dir/");
  assert.equal(url.searchParams.get("api"), "1");
  assert.equal(
    url.searchParams.get("destination"),
    "Hồ Xuân Hương & quảng trường, Đà Lạt, Vietnam",
  );
  assert.equal(url.searchParams.size, 2);
});
