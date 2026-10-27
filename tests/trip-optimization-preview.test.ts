import assert from "node:assert/strict";
import { test } from "node:test";
import type { TripDay } from "../src/features/home/types/home-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const load = tripModuleLoader();
const { getOptimizationComparison } = load<
  typeof import("../src/features/trip/utils/trip-optimization-preview.ts")
>("src/features/trip/utils/trip-optimization-preview.ts");

function day(ids = ["square", "lake", "museum"]): TripDay {
  return {
    date: "2026-10-24",
    transport: "car",
    stops: ids.map((id) => ({
      id,
      time: "09:30",
      name: { vi: id, en: id },
      kind: { vi: "", en: "" },
    })),
  };
}

test("route preview compares fixture totals and rounds saved distance", () => {
  const result = getOptimizationComparison(day(), ["lake", "square", "museum"]);
  assert.ok(result);
  assert.equal(result.before.km, 5.3);
  assert.equal(result.after.km, 4.7);
  assert.equal(result.savedKm, 0.6);
  assert.equal(result.savedMinutes, 3);
  const walking = getOptimizationComparison({ ...day(), transport: "walk" }, [
    "lake",
    "square",
    "museum",
  ]);
  assert.equal(walking?.savedMinutes, 7);
});

test("route preview distinguishes unchanged routes from increases", () => {
  const unchanged = getOptimizationComparison(day(), [
    "square",
    "lake",
    "museum",
  ]);
  assert.equal(unchanged?.savedKm, 0);
  assert.equal(unchanged?.savedMinutes, 0);
  const increased = getOptimizationComparison(
    day(["lake", "square", "museum"]),
    ["square", "lake", "museum"],
  );
  assert.equal(increased?.savedKm, -0.6);
  assert.equal(increased?.savedMinutes, -3);
});

test("route preview does not invent savings for missing legs or starting/return legs", () => {
  assert.equal(
    getOptimizationComparison(day(["museum", "square", "lake"]), [
      "lake",
      "square",
      "museum",
    ]),
    null,
  );
  assert.equal(
    getOptimizationComparison({ ...day(), startLocation: "Hotel" }, [
      "lake",
      "square",
      "museum",
    ]),
    null,
  );
  assert.equal(
    getOptimizationComparison({ ...day(), returnToStart: true }, [
      "lake",
      "square",
      "museum",
    ]),
    null,
  );
});

test("route preview rejects incomplete or duplicated proposed orders", () => {
  for (const ids of [
    ["lake"],
    ["lake", "lake", "museum"],
    ["lake", "square", "missing"],
  ]) {
    assert.equal(getOptimizationComparison(day(), ids), null);
  }
});
