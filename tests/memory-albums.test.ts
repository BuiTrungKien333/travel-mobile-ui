import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { loadHomePreview } from "./helpers/load-home-preview.ts";

const load = tripModuleLoader();
const { getTripPhotos, getMemoryCaptureTarget } = load<
  typeof import("../src/features/memories/utils/memory-albums.ts")
>("src/features/memories/utils/memory-albums.ts");
const { memoryCaptureRouteSchema, memoryPhotoRouteSchema } = load<
  typeof import("../src/features/memories/schemas/memory-route-schema.ts")
>("src/features/memories/schemas/memory-route-schema.ts");

test("albums isolate each trip's photos and sort newest first without changing the store", () => {
  const store = loadHomePreview().createPreviewStore();
  const original = store.getState().memories;
  const photos = getTripPhotos([...original].reverse(), "past-dalat");
  assert.equal(photos.length, 6);
  assert.equal(photos[0].time, "17:30");
  assert.equal(photos.at(-1)?.time, "09:15");
  assert.equal(getTripPhotos(original, "missing").length, 0);
  assert.equal(store.getState().memories, original);
  assert.equal(
    getTripPhotos(
      [
        {
          id: "note",
          text: "Note only",
          destination: "Đà Lạt",
          tripId: "past-dalat",
        },
      ],
      "past-dalat",
    ).length,
    0,
  );
});

test("camera defaults to the ongoing trip and keeps an explicitly selected place or general day", () => {
  const store = loadHomePreview().createPreviewStore();
  assert.equal(
    getMemoryCaptureTarget(store.getState().trips, store.getState().today, {}),
    null,
  );
  store.getState().changeScenario("ongoing");
  const { trips, today } = store.getState();
  const target = getMemoryCaptureTarget(trips, today, {});
  assert.equal(target?.trip.id, "dalat-ongoing");
  assert.equal(target?.day.date, today);
  const selected = getMemoryCaptureTarget(trips, today, {
    tripId: target?.trip.id,
    day: today,
    stopId: "square",
  });
  assert.equal(selected?.stop?.id, "square");
  assert.equal(
    getMemoryCaptureTarget(trips, today, {
      tripId: target?.trip.id,
      stopId: "",
    })?.stop,
    undefined,
  );
  assert.equal(
    getMemoryCaptureTarget(trips, today, { tripId: "missing" }),
    null,
  );
  assert.equal(
    getMemoryCaptureTarget(trips, today, {
      tripId: target?.trip.id,
      day: "2020-01-01",
    }),
    null,
  );
  assert.equal(
    getMemoryCaptureTarget(trips, today, {
      tripId: target?.trip.id,
      stopId: "deleted-stop",
    }),
    null,
  );
  assert.equal(
    getMemoryCaptureTarget(
      trips.map((trip) => ({ ...trip, status: "cancelled" })),
      today,
      { tripId: "dalat-ongoing" },
    ),
    null,
  );
});

test("selected capture joins its album, saves a note, and disappears from that album after removal", () => {
  const store = loadHomePreview().createPreviewStore();
  store.getState().changeScenario("ongoing");
  const target = getMemoryCaptureTarget(
    store.getState().trips,
    store.getState().today,
    { stopId: "square" },
  );
  assert.ok(target);
  const before = getTripPhotos(
    store.getState().memories,
    target.trip.id,
  ).length;
  const memory = store.getState().saveCapturedMoment({
    tripId: target.trip.id,
    date: target.day.date,
    stopId: target.stop?.id,
    time: "18:30",
    uri: "file:///cache/memory.jpg",
  });
  assert.ok(memory);
  assert.equal(memory.place?.vi, "Quảng trường Lâm Viên");
  assert.equal(
    getTripPhotos(store.getState().memories, target.trip.id).length,
    before + 1,
  );
  store.getState().updateMemoryNote(memory.id, "Một chiều thật đẹp");
  assert.equal(
    getTripPhotos(store.getState().memories, target.trip.id).find(
      (photo) => photo.id === memory.id,
    )?.text,
    "Một chiều thật đẹp",
  );
  store.getState().removeMemory(memory.id);
  assert.equal(
    getTripPhotos(store.getState().memories, target.trip.id).length,
    before,
  );
});

test("memory route boundaries reject arrays, malformed ids and dates while accepting general-day selection", () => {
  assert.ok(
    memoryCaptureRouteSchema.safeParse({
      tripId: "past-dalat",
      day: "2026-09-20",
      stopId: "",
    }).success,
  );
  for (const params of [
    { tripId: ["past-dalat"] },
    { day: "2026-02-30" },
    { stopId: "../../escape" },
  ]) {
    assert.equal(memoryCaptureRouteSchema.safeParse(params).success, false);
  }
  assert.ok(
    memoryPhotoRouteSchema.safeParse({
      tripId: "past-dalat",
      memoryId: "recent-ongoing-lake",
    }).success,
  );
  assert.equal(
    memoryPhotoRouteSchema.safeParse({ memoryId: "photo-1" }).success,
    false,
  );
});
