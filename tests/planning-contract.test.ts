import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createPlanningDraftSchema,
  planningInput,
  planningPreferences,
  planningLatestEnvelopeSchema,
} from "../src/features/trip/api/planning-contract.ts";
import { supportsAiPlanning } from "../src/features/trip/utils/planning-eligibility.ts";
import { planningRouteSource } from "../src/features/trip/utils/planning-route-source.ts";
import { planningTextContext } from "../src/features/trip/utils/planning-text-context.ts";
import { planningTime } from "../src/features/trip/utils/planning-time.ts";

const preferences = {
  destination: "Đà Nẵng",
  numberOfDays: 2,
  interests: ["MUSEUM"],
  excludedTags: ["BEACH"],
  dailyStartTime: "08:00",
  dailyEndTime: "17:00",
  travelPace: "RELAXED",
  mustVisitNames: [],
  excludedPlaceNames: [],
};
const input = {
  startDate: "2027-01-10",
  origin: { name: "Hotel", latitude: 16.065, longitude: 108.223 },
  roundTrip: true,
  restMinutes: 45,
  preferences,
};
test("a trip without any draft accepts the server's omitted null data", () => {
  assert.equal(
    planningLatestEnvelopeSchema.parse({ success: true, message: "success" })
      .data,
    null,
  );
  assert.equal(
    planningLatestEnvelopeSchema.parse({ success: true, data: null }).data,
    null,
  );
});
test("route labels distinguish real road metrics, fallback, unreachable routes and stored legacy drafts", () => {
  assert.equal(
    planningRouteSource({
      routeSource: "MAPBOX_DRIVING",
      routeStatus: "AVAILABLE",
    }),
    "ROAD",
  );
  assert.equal(
    planningRouteSource({
      routeSource: "MAPBOX_DRIVING",
      routeStatus: "UNREACHABLE",
    }),
    "UNREACHABLE",
  );
  assert.equal(
    planningRouteSource({ routeSource: "ESTIMATED_HAVERSINE_35_KMH" }),
    "ESTIMATED",
  );
  assert.equal(
    planningRouteSource({ routeSource: "NOT_CALCULATED" }),
    "NOT_CALCULATED",
  );
  assert.equal(planningRouteSource(), "ESTIMATED");
});
test("restoring a natural request preserves its explicit hours, pace and multiline preferences", () => {
  const restored = planningTextContext(
    "Tôi đi Đà Nẵng 2 ngày, mỗi ngày từ 09:30 đến 18:00. Nhịp độ năng động.\n\nThích lịch sử.\nKhông đi biển.",
  );
  assert.deepEqual(restored, {
    start: "09:30",
    end: "18:00",
    pace: "ACTIVE",
    text: "Thích lịch sử.\nKhông đi biển.",
  });
  const original = "Tôi đi chơi với gia đình.\n\nƯu tiên đi thong thả.";
  assert.equal(planningTextContext(original).text, original);
});
test("blocked overnight proposals show the next date rather than a misleading earlier finish time", () => {
  assert.equal(planningTime("2027-01-10T23:00:00", "2027-01-10"), "23:00");
  assert.equal(
    planningTime("2027-01-11T00:15:00", "2027-01-10"),
    "2027-01-11 00:15",
  );
});
test("a real structured planning request preserves explicit constraints", () => {
  const request = createPlanningDraftSchema.parse({
    clientRequestId: "dcfe387a-4262-4a5f-b5f8-b2c061544c41",
    expectedTripVersion: 3,
    input,
  });
  assert.deepEqual(request.input.preferences?.excludedTags, ["BEACH"]);
  assert.equal(request.expectedTripVersion, 3);
});
test("text and structured preferences are exclusive and one is required", () => {
  assert.equal(
    planningInput.safeParse({ ...input, text: "history" }).success,
    false,
  );
  assert.equal(
    planningInput.safeParse({ ...input, preferences: null }).success,
    false,
  );
  assert.equal(
    planningInput.safeParse({ ...input, preferences: null, text: "history" })
      .success,
    true,
  );
});
test("invalid visit windows and unsupported preferences are rejected before generation", () => {
  assert.equal(
    planningPreferences.safeParse({ ...preferences, dailyEndTime: "07:00" })
      .success,
    false,
  );
  assert.equal(
    planningPreferences.safeParse({ ...preferences, dailyStartTime: "25:00" })
      .success,
    false,
  );
  assert.equal(
    planningPreferences.safeParse({ ...preferences, interests: ["food"] })
      .success,
    false,
  );
});
test("planning origin must be selected with valid coordinates", () => {
  assert.equal(
    planningInput.safeParse({ ...input, origin: { name: "Hotel" } }).success,
    false,
  );
  assert.equal(
    planningInput.safeParse({
      ...input,
      origin: { name: "Invalid", latitude: 95, longitude: 106.7 },
    }).success,
    false,
  );
  assert.equal(
    planningInput.safeParse({
      ...input,
      origin: { name: "Ho Chi Minh", latitude: 10.8, longitude: 106.7 },
    }).success,
    true,
  );
});
test("AI entry point is limited to supported future planning trips", () => {
  const trip = {
    destination: { name: "Đà Nẵng", provinceId: "prov-48" },
    mode: "PLANNING",
    status: "PLANNING",
    dayCount: 2,
  };
  assert.equal(supportsAiPlanning(trip), true);
  assert.equal(supportsAiPlanning({ ...trip, dayCount: 3 }), true);
  assert.equal(
    supportsAiPlanning({
      ...trip,
      destination: { name: "Hà Nội", provinceId: "prov-01" },
    }),
    true,
  );
  for (const change of [
    { mode: "LIVE" },
    { mode: "RECAP" },
    { status: "ACTIVE" },
    { dayCount: 4 },
    { dayCount: 0 },
    { destination: { name: "Hà Nội", provinceId: null } },
    { destination: { name: "   ", provinceId: "prov-01" } },
  ]) {
    assert.equal(supportsAiPlanning({ ...trip, ...change }), false);
  }
});
