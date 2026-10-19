import assert from "node:assert/strict";
import { test } from "node:test";
import { loadHomePreview } from "./helpers/load-home-preview.ts";
import { selectHome } from "../src/features/home/utils/select-home.ts";
import { getDayProgress } from "../src/features/home/utils/day-progress.ts";
import {
  suggestedPacking,
  weatherPreviews,
} from "../src/features/home/data/weather-preview.ts";

const { createPreviewStore } = loadHomePreview();

test("all four preview scenarios select correctly and photo fixtures belong to their trips", () => {
  const store = createPreviewStore();
  assert.equal(store.getState().scenario, "returning");
  for (const scenario of ["new", "upcoming", "ongoing", "returning"] as const) {
    store.getState().changeScenario(scenario);
    const state = store.getState();
    assert.equal(selectHome(state.trips, state.today).kind, scenario);
    assert.equal(
      new Set(state.memories.map((memory) => memory.id)).size,
      state.memories.length,
    );
    const photoCount = state.memories.filter(
      (memory) =>
        memory.photo && (scenario !== "ongoing" || memory.date === state.today),
    ).length;
    assert.equal(photoCount, scenario === "new" ? 0 : 6);
    for (const memory of state.memories) {
      const trip = state.trips.find((item) => item.id === memory.tripId);
      assert.ok(trip);
      assert.ok(memory.date && memory.date <= state.today);
      assert.ok(trip.days.some((day) => day.date === memory.date));
    }
  }
});

test("draft creation builds inclusive calendar days and opens its plan", () => {
  const store = createPreviewStore();
  store.getState().changeScenario("new");
  assert.equal(
    store
      .getState()
      .createDraft({
        destination: "Huế",
        startDate: "2026-10-31",
        endDate: "2026-11-02",
      }),
    true,
  );
  const state = store.getState();
  const selection = selectHome(state.trips, state.today);
  assert.equal(selection.kind, "upcoming");
  if (selection.kind !== "upcoming")
    throw new Error("Expected an upcoming draft");
  assert.equal(
    selection.trip.days.map((day) => day.date).join(","),
    "2026-10-31,2026-11-01,2026-11-02",
  );
  assert.equal(selection.trip.status, "draft");
  assert.equal(state.panel?.kind, "plan");
});

test("adding suggestions does not duplicate stops or mutate original scenario fixtures", () => {
  const store = createPreviewStore();
  store.getState().changeScenario("upcoming");
  const trip = store.getState().trips.find((item) => item.id === "dalat");
  assert.ok(trip);
  const day = trip.days[2];
  assert.equal(day.stops.length, 0);
  for (let i = 0; i < 5; i++) store.getState().addStop(trip.id, day.date);
  const updated = store.getState().trips.find((item) => item.id === trip.id)
    ?.days[2];
  assert.equal(updated?.stops.length, 3);
  assert.equal(new Set(updated?.stops.map((stop) => stop.id)).size, 3);
  assert.equal(day.stops.length, 0);
  store.getState().changeScenario("upcoming");
  assert.equal(
    store.getState().trips.find((item) => item.id === trip.id)?.days[2].stops
      .length,
    0,
  );
});

test("checking in advances the next stop, is idempotent, and supports undo", () => {
  const store = createPreviewStore();
  store.getState().changeScenario("ongoing");
  const state = store.getState();
  const trip = state.trips.find((item) => item.id === "dalat-ongoing");
  assert.ok(trip);
  const stops = trip.days.find((day) => day.date === state.today)?.stops ?? [];
  const key = `${trip.id}:${state.today}`;
  assert.equal(
    getDayProgress(stops, state.visited[key]).nextStop?.id,
    "square",
  );
  state.setVisited(trip.id, state.today, "square", true);
  state.setVisited(trip.id, state.today, "square", true);
  assert.equal(
    store.getState().visited[key].filter((id) => id === "square").length,
    1,
  );
  assert.equal(
    getDayProgress(stops, store.getState().visited[key]).nextStop?.id,
    "museum",
  );
  state.setVisited(trip.id, state.today, "square", false);
  assert.equal(
    getDayProgress(stops, store.getState().visited[key]).nextStop?.id,
    "square",
  );
  state.setVisited(trip.id, state.today, "unknown-stop", true);
  assert.equal(store.getState().visited[key].includes("unknown-stop"), false);
});

test("photo capture rejects missing trip/day and respects the bounded preview capacity", () => {
  const store = createPreviewStore();
  store.getState().changeScenario("ongoing");
  const state = store.getState();
  assert.equal(
    state.savePhotoMoment({
      tripId: "missing",
      date: state.today,
      photoId: "lake",
    }),
    null,
  );
  assert.equal(
    state.savePhotoMoment({
      tripId: "dalat-ongoing",
      date: "2020-01-01",
      photoId: "lake",
    }),
    null,
  );
  while (store.getState().memories.length < 20) {
    assert.ok(
      state.savePhotoMoment({
        tripId: "dalat-ongoing",
        date: state.today,
        photoId: "lake",
      }),
    );
  }
  assert.equal(
    state.savePhotoMoment({
      tripId: "dalat-ongoing",
      date: state.today,
      photoId: "lake",
    }),
    null,
  );
  assert.equal(
    new Set(store.getState().memories.map((memory) => memory.id)).size,
    20,
  );
});

test("deleting all photos stays empty until a scenario reset and does not leak into other sessions", () => {
  const store = createPreviewStore();
  const original = store.getState().memories[0];
  store.getState().updateMemoryNote(original.id, "Một hành trình đáng nhớ");
  assert.equal(store.getState().memories[0].text, "Một hành trình đáng nhớ");
  for (const memory of store.getState().memories)
    store.getState().removeMemory(memory.id);
  assert.equal(store.getState().memories.length, 0);
  assert.equal(createPreviewStore().getState().memories.length, 6);
  store.getState().changeScenario("returning");
  assert.equal(store.getState().memories.length, 6);
  assert.equal(store.getState().memories[0].text, original.text);
});

test("trip packing merges needs across all forecast dates and handles missing forecasts", () => {
  assert.equal(suggestedPacking([], true).length, 0);
  const days = weatherPreviews.dalat.days;
  assert.deepEqual(suggestedPacking(days, true), [
    "layer",
    "umbrella",
    "sun",
    "shoes",
  ]);
  assert.equal(suggestedPacking(days, false).includes("shoes"), false);
  const dry = days.filter((day) =>
    day.hours.every((hour) => hour.rainChance <= 40),
  );
  assert.equal(suggestedPacking(dry, true).includes("umbrella"), false);
});
