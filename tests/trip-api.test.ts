import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  tripDetailSchema,
  tripSummarySchema,
  tripReadSchema,
  tripViewModel,
  tripLocalToday,
  createTripRequestId,
} from "../src/features/trip/api/trip-contract.ts";
import {
  getTripDisplayStatus,
  getTotalTripStops,
} from "../src/features/trip/utils/trip-formatters.ts";
import { ApiError } from "../src/services/api/api-error.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const spec = JSON.parse(
  readFileSync(
    new URL("../docs/api/trip-crud.openapi.json", import.meta.url),
    "utf8",
  ),
);
const example: unknown = spec.components.schemas.TripResponse.example;
function readExample() {
  const envelope = example as { data: unknown };
  return tripReadSchema.parse(envelope.data);
}

test("Trip contract accepts documented read payload and rejects malformed identity, dates and amounts", () => {
  const trip = readExample().trip;
  assert.ok(tripDetailSchema.safeParse(trip).success);
  for (const values of [
    { ...trip, id: "draft-1" },
    { ...trip, mode: "draft" },
    { ...trip, startDate: "2026-02-30" },
    { ...trip, budget: { amount: -1, currency: "VND" } },
    { ...trip, timeZone: "UTC" },
  ])
    assert.equal(tripDetailSchema.safeParse(values).success, false);
});

test("Server mode and counts are preserved without inventing timeline stops or a cover", () => {
  const dto = readExample().trip;
  const view = tripViewModel({ ...dto, mode: "LIVE", stopCount: 8 }, dto);
  assert.equal(view.serverMode, "LIVE");
  assert.equal(getTripDisplayStatus(view, "2099-01-01"), "ongoing");
  assert.equal(getTotalTripStops(view), 8);
  assert.equal(view.days.length, 3);
  assert.ok(view.days.every((day) => day.stops.length === 0));
  assert.equal(view.coverImage, undefined);
  const legacy = tripViewModel(
    tripSummarySchema.parse({
      ...dto,
      startDate: null,
      endDate: null,
      dayCount: 0,
    }),
  );
  assert.equal(legacy.startDate, undefined);
  assert.equal(legacy.days.length, 0);
});

test("Trip calendar uses Vietnam midnight and request identifiers are UUIDs", () => {
  assert.equal(tripLocalToday(new Date("2026-11-01T16:59:59Z")), "2026-11-01");
  assert.equal(tripLocalToday(new Date("2026-11-01T17:00:00Z")), "2026-11-02");
  const ids = new Set(Array.from({ length: 100 }, () => createTripRequestId()));
  assert.equal(ids.size, 100);
  for (const id of ids)
    assert.match(
      id,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
});

test("Trip transport uses the shared client, preserves create keys and forwards cancellation", async () => {
  const calls: {
    method: string;
    url: string;
    value?: unknown;
    config?: unknown;
  }[] = [];
  let response: unknown = example;
  const load = tripModuleLoader({
    "@/services/api/client": {
      apiClient: {
        post: async (url: string, value: unknown) => {
          calls.push({ method: "POST", url, value });
          return { data: response };
        },
        get: async (url: string, config: unknown) => {
          calls.push({ method: "GET", url, config });
          return { data: response };
        },
      },
    },
    "@/services/api/api-error": { ApiError },
  });
  const { tripApi } = load<
    typeof import("../src/features/trip/api/trip-api.ts")
  >("src/features/trip/api/trip-api.ts");
  const payload =
    spec.paths["/trips"].post.requestBody.content["application/json"].example;
  const created = await tripApi.create(payload);
  const signal = new AbortController().signal;
  await tripApi.detail(created.trip.id, signal);
  assert.equal(calls[0]?.value, payload);
  assert.equal(calls[1]?.url, `/api/v1/trips/${created.trip.id}`);
  assert.equal((calls[1]?.config as { signal: AbortSignal }).signal, signal);
  response = spec.components.schemas.TripPageResponse.example;
  await tripApi.list(2, signal);
  const params = (calls[2]?.config as { params: { page: number; size: number; sort: string } }).params;
  assert.equal(params.page, 2);
  assert.equal(params.size, 20);
  assert.equal(params.sort, "createdAt,desc");
  response = { success: true, data: { trip: { id: "draft-1" } } };
  await assert.rejects(
    tripApi.create(payload),
    (error: unknown) =>
      error instanceof ApiError && error.code === "INVALID_RESPONSE",
  );
});
