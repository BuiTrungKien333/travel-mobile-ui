import { readFileSync } from "node:fs";
import type { HomeDashboard } from "../../src/features/home/api/home-api.ts";
import { tripReadSchema } from "../../src/features/trip/api/trip-contract.ts";

export function homeFixture(
  state: HomeDashboard["state"] = "UPCOMING",
): HomeDashboard {
  const spec = JSON.parse(
    readFileSync(
      new URL("../../docs/api/trip-crud.openapi.json", import.meta.url),
      "utf8",
    ),
  );
  const selected = tripReadSchema.parse(
    spec.components.schemas.TripResponse.example.data,
  );
  const context = {
    serverTime: "2026-11-06T17:30:00Z",
    evaluatedDate: "2026-11-07",
  };
  const startDate =
    state === "LIVE"
      ? "2026-11-06"
      : state === "RETURNING"
        ? "2026-11-01"
        : state === "PLANNING"
          ? "2026-11-20"
          : "2026-11-10";
  selected.context = context;
  selected.trip.startDate = startDate;
  selected.trip.endDate = new Date(
    Date.parse(`${startDate}T12:00:00Z`) + 2 * 86400000,
  )
    .toISOString()
    .slice(0, 10);
  selected.trip.mode =
    state === "LIVE" ? "LIVE" : state === "RETURNING" ? "RECAP" : "PLANNING";
  selected.trip.status =
    state === "LIVE"
      ? "ACTIVE"
      : state === "RETURNING"
        ? "COMPLETED"
        : "PLANNING";
  selected.trip.days = selected.trip.days.map((d, i) => ({
    ...d,
    date: new Date(Date.parse(`${startDate}T12:00:00Z`) + i * 86400000)
      .toISOString()
      .slice(0, 10),
  }));
  return {
    state,
    selectedTrip: state === "NEW" ? null : selected,
    context,
    dayIndex: state === "LIVE" ? 1 : null,
    todayStopCount: 0,
    nextStop: null,
    firstEmptyDay: state === "UPCOMING" || state === "PLANNING" ? 1 : null,
    footprint: { provinces: 0, places: 0, hasHistory: state === "RETURNING" },
    recentPhotos: [],
  };
}
