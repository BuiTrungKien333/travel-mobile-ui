import assert from "node:assert/strict";
import { test } from "node:test";
import type { TripStop } from "../src/features/home/types/home-types.ts";
import {
  tripMapBounds,
  tripMapPins,
  tripStaticMapUri,
  TRIP_MAP_DEFAULT_CENTER,
  TRIP_MAP_DEFAULT_ZOOM,
} from "../src/features/trip/utils/trip-mapbox.ts";

function stop(id: string, location?: TripStop["location"]): TripStop {
  return {
    id,
    name: { vi: id, en: id },
    time: "",
    kind: { vi: "", en: "" },
    location,
  };
}

test("an empty itinerary still has a static map centered on the initial location", () => {
  const uri = tripStaticMapUri([], undefined, "pk.fake", "#123456");
  const [longitude, latitude] = TRIP_MAP_DEFAULT_CENTER;
  assert.equal(
    new URL(uri!).pathname,
    `/styles/v1/mapbox/streets-v12/static/${longitude},${latitude},${TRIP_MAP_DEFAULT_ZOOM}/640x420@2x`,
  );
  assert.doesNotMatch(uri!, /pin-s|path-4/);
  assert.equal(
    tripStaticMapUri([], undefined, "sk.fake", "#123456"),
    undefined,
  );
});

test("map pin numbers follow the itinerary even when a stop has no coordinates", () => {
  const pins = tripMapPins(
    [
      stop("lake", { latitude: 11.94, longitude: 108.44 }),
      stop("missing"),
      stop("invalid", { latitude: 99, longitude: 108.45 }),
      stop("museum", { latitude: 11.95, longitude: 108.46 }),
    ],
    "vi",
  );
  assert.deepEqual(
    pins.map(({ id, number }) => [id, number]),
    [
      ["lake", 1],
      ["museum", 4],
    ],
  );
  assert.deepEqual(tripMapBounds(pins, [[108.43, 11.92]]), [
    [108.43, 11.92],
    [108.46, 11.95],
  ]);
});

test("static fallback keeps numbered markers when a polyline exceeds the provider URL limit", () => {
  const pins = tripMapPins(
    [
      stop("first", { latitude: 11.94, longitude: 108.44 }),
      stop("second", { latitude: 11.95, longitude: 108.46 }),
    ],
    "vi",
  );
  assert.equal(
    tripStaticMapUri(pins, "route", "sk.fake", "#123456"),
    undefined,
  );
  const route = tripStaticMapUri(pins, "encoded(line)", "pk.fake", "#123456");
  assert.match(
    route ?? "",
    /path-4\+123456\(encoded%28line%29\),pin-s-1\+123456/,
  );
  assert.match(
    route ?? "",
    /\/auto\/640x420@2x\?access_token=pk\.fake&padding=32$/,
  );
  const withoutPath = tripStaticMapUri(
    pins,
    "a".repeat(8200),
    "pk.fake",
    "#123456",
  );
  assert.doesNotMatch(withoutPath ?? "", /path-4/);
  assert.match(withoutPath ?? "", /pin-s-2\+123456\(108\.46000,11\.95000\)/);
});
