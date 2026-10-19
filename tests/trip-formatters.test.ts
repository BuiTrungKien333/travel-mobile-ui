import assert from "node:assert/strict";
import { test } from "node:test";
import type { Trip } from "../src/features/home/types/home-types.ts";
import {
  formatTripDates,
  formatTripDurationAndStops,
  getTotalTripStops,
  getTripDisplayStatus,
  getTripTitle,
} from "../src/features/trip/utils/trip-formatters.ts";

const today = "2026-10-21";

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "test-trip",
    destination: "Đà Lạt",
    status: "planned",
    startDate: "2026-10-24",
    endDate: "2026-10-27",
    days: [
      {
        date: "2026-10-24",
        stops: [
          {
            id: "s1",
            time: "09:00",
            name: { vi: "Điểm 1", en: "Stop 1" },
            kind: { vi: "Tham quan", en: "Sightseeing" },
          },
        ],
      },
      {
        date: "2026-10-25",
        stops: [
          {
            id: "s2",
            time: "10:00",
            name: { vi: "Điểm 2", en: "Stop 2" },
            kind: { vi: "Ẩm thực", en: "Food" },
          },
          {
            id: "s3",
            time: "14:00",
            name: { vi: "Điểm 3", en: "Stop 3" },
            kind: { vi: "Cà phê", en: "Coffee" },
          },
        ],
      },
    ],
    ...overrides,
  };
}

test("getTripTitle uses custom title if provided, otherwise localized default", () => {
  const custom = makeTrip({ title: "Kỳ nghỉ mùa thu" });
  assert.equal(getTripTitle(custom, "vi"), "Kỳ nghỉ mùa thu");
  assert.equal(getTripTitle(custom, "en"), "Kỳ nghỉ mùa thu");

  const planned = makeTrip({ destination: "Nha Trang" });
  assert.equal(getTripTitle(planned, "vi"), "Khám phá Nha Trang");
  assert.equal(getTripTitle(planned, "en"), "Explore Nha Trang");

  const draft = makeTrip({ destination: "Hội An", status: "draft" });
  assert.equal(getTripTitle(draft, "vi"), "Kế hoạch Hội An");
  assert.equal(getTripTitle(draft, "en"), "Hội An Draft");
});

test("getTripDisplayStatus identifies ongoing, upcoming, draft, completed, and cancelled", () => {
  const ongoing = makeTrip({
    startDate: "2026-10-20",
    endDate: "2026-10-23",
  });
  assert.equal(getTripDisplayStatus(ongoing, today), "ongoing");

  const upcoming = makeTrip({
    startDate: "2026-10-24",
    endDate: "2026-10-26",
  });
  assert.equal(getTripDisplayStatus(upcoming, today), "upcoming");

  const pastPlanned = makeTrip({
    startDate: "2026-09-01",
    endDate: "2026-09-05",
  });
  assert.equal(getTripDisplayStatus(pastPlanned, today), "completed");

  const draft = makeTrip({ status: "draft" });
  assert.equal(getTripDisplayStatus(draft, today), "draft");

  const cancelled = makeTrip({ status: "cancelled" });
  assert.equal(getTripDisplayStatus(cancelled, today), "cancelled");
});

test("getTotalTripStops accurately sums stops across days", () => {
  const trip = makeTrip();
  assert.equal(getTotalTripStops(trip), 3);

  const emptyTrip = makeTrip({ days: [] });
  assert.equal(getTotalTripStops(emptyTrip), 0);
});

test("formatTripDurationAndStops combines duration and stops correctly", () => {
  const trip = makeTrip();
  // 2026-10-24 to 2026-10-27 is 4 calendar days, 3 stops
  assert.equal(formatTripDurationAndStops(trip, "vi"), "4 ngày · 3 địa điểm");
  assert.equal(formatTripDurationAndStops(trip, "en"), "4 days · 3 places");

  const noStops = makeTrip({ days: [] });
  assert.equal(
    formatTripDurationAndStops(noStops, "vi"),
    "4 ngày · Chưa có địa điểm",
  );
  assert.equal(
    formatTripDurationAndStops(noStops, "en"),
    "4 days · No places yet",
  );
});

test("formatTripDates handles dates and missing dates fallback", () => {
  const trip = makeTrip({ startDate: "2026-10-24", endDate: "2026-10-27" });
  assert.ok(formatTripDates(trip, "vi").includes("24"));

  const undated = makeTrip({ startDate: undefined, endDate: undefined });
  assert.equal(formatTripDates(undated, "vi"), "Chưa chọn ngày");
  assert.equal(formatTripDates(undated, "en"), "Dates not set");
});
