import assert from "node:assert/strict";
import { test } from "node:test";
import type { TripStop } from "../src/features/home/types/home-types.ts";
import type {
  ItineraryResponse,
  SaveItineraryDayRequest,
} from "../src/features/trip/api/itinerary-types.ts";
import { ApiError } from "../src/services/api/api-error.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Save = { date: string; request: SaveItineraryDayRequest };
type StateUpdate = unknown | ((previous: unknown) => unknown);
const date = "2026-11-20";
const revision = "2026-11-07T01:00:00Z";
const nextRevision = "2026-11-07T01:01:00Z";
function harness() {
  let itinerary: ItineraryResponse = {
    id: "itinerary",
    tripId: "trip",
    name: "Trip",
    status: "DRAFT",
    updatedAt: revision,
    days: [date, "2026-11-21"].map((day) => ({
      date: day,
      stops: ["a", "b", "c"].map((placeId, index) => ({
        id: `item-${placeId}`,
        placeId,
        name: placeId,
        address: null,
        latitude: null,
        longitude: null,
        category: null,
        arrivalTime: `${day}T${String(9 + index).padStart(2, "0")}:00:00`,
        durationMinutes: 30 + index * 15,
        sequence: index,
        note: `note-${placeId}`,
        distanceFromPreviousKm: null,
        travelMinutesFromPrevious: null,
      })),
    })),
  };
  const saves: Save[] = [];
  const saving = { current: false };
  let deferred: (() => void) | undefined;
  let fail: unknown;
  let pause = false;
  let editable = true;
  let selected = date;
  const mutation = {
    isPending: false,
    error: undefined as unknown,
    reset() {
      this.error = undefined;
    },
    async mutateAsync(value: Save) {
      saves.push(value);
      mutation.isPending = true;
      try {
        if (pause)
          await new Promise<void>((resolve) => {
            deferred = resolve;
          });
        if (fail) {
          mutation.error = fail;
          throw fail;
        }
        // Model the server's revision check, including a late change on another client.
        if (value.request.expectedUpdatedAt !== itinerary.updatedAt) {
          mutation.error = new ApiError("TRIP_008");
          throw mutation.error;
        }
        itinerary = {
          ...itinerary,
          updatedAt: nextRevision,
          days: itinerary.days.map((day) =>
            day.date === value.date
              ? {
                  ...day,
                  stops: value.request.stops.map((entry) => {
                    const previous = day.stops.find(
                      (stop) => stop.placeId === entry.placeId,
                    );
                    assert.ok(previous);
                    return { ...previous, ...entry };
                  }),
                }
              : day,
          ),
        };
        return itinerary;
      } finally {
        mutation.isPending = false;
      }
    },
  };
  let cursor = 0;
  const state: unknown[] = [];
  const effects = new Map<number, unknown[]>();
  let afterRender: (() => void)[] = [];
  const load = tripModuleLoader({
    "@/services/api/api-error": { ApiError },
    "../api/trip-adapters": {
      toDayStops: (base: ItineraryResponse, day: string) =>
        base.days
          .find((entry) => entry.date === day)
          ?.stops.map(
            ({ placeId, sequence, arrivalTime, durationMinutes, note }) => ({
              placeId,
              sequence,
              arrivalTime,
              durationMinutes,
              note,
            }),
          ) ?? [],
    },
    react: {
      useState(initial: unknown) {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [
          state[index],
          (value: StateUpdate) => {
            state[index] =
              typeof value === "function" ? value(state[index]) : value;
          },
        ];
      },
      useRef(initial: unknown) {
        const index = cursor++;
        if (!(index in state)) state[index] = { current: initial };
        return state[index];
      },
      useEffect(callback: () => void, deps: unknown[]) {
        const index = cursor++;
        const previous = effects.get(index);
        if (!previous || deps.some((dep, i) => dep !== previous[i])) {
          effects.set(index, deps);
          afterRender.push(callback);
        }
      },
    },
  });
  const { useConnectedTimelineActions } = load<
    typeof import("../src/features/trip/hooks/use-connected-timeline-actions.ts")
  >("src/features/trip/hooks/use-connected-timeline-actions.ts");
  function render() {
    cursor = 0;
    afterRender = [];
    const stops: TripStop[] = (
      itinerary.days.find((day) => day.date === selected)?.stops ?? []
    ).map((stop) => ({
      id: stop.id,
      placeId: stop.placeId,
      name: { vi: stop.name, en: stop.name },
      kind: { vi: "", en: "" },
      time: stop.arrivalTime?.slice(11, 16) ?? "",
      durationMinutes: stop.durationMinutes,
    }));
    const result = useConnectedTimelineActions({
      selectionKey: `trip:${selected}`,
      date: selected,
      itinerary,
      tripVersion: 3,
      stops,
      editable,
      saving,
      mutation,
    });
    afterRender.forEach((effect) => effect());
    return result;
  }
  render();
  return {
    render,
    saves,
    saving,
    mutation,
    itinerary: () => itinerary,
    fail: (error: unknown) => {
      fail = error;
    },
    pause: () => {
      pause = true;
    },
    resume: () => {
      deferred?.();
    },
    readonly: () => {
      editable = false;
    },
    select: (day: string) => {
      selected = day;
    },
    remoteChange: () => {
      itinerary = { ...itinerary, updatedAt: "2026-11-07T01:02:00Z" };
    },
  };
}
const settle = () => new Promise<void>((resolve) => setImmediate(resolve));
const ids = (stops: TripStop[]) => Array.from(stops, (stop) => stop.id);

test("drag saves the selected day's exact order, positional times and per-place metadata; undo uses the returned revision", async () => {
  const h = harness();
  const otherDay = structuredClone(h.itinerary().days[1]);
  const action = h.render();
  action.begin();
  action.reorder(["item-c", "item-a", "item-b"]);
  action.end();
  await settle();
  const request = h.saves[0].request;
  assert.equal(h.saves[0].date, date);
  assert.equal(request.expectedTripVersion, 3);
  assert.equal(request.expectedUpdatedAt, revision);
  assert.deepEqual(
    Array.from(request.stops, (s) => s.placeId),
    ["c", "a", "b"],
  );
  assert.deepEqual(
    Array.from(request.stops, (s) => s.arrivalTime),
    ["09", "10", "11"].map((hour) => `${date}T${hour}:00:00`),
  );
  assert.equal(request.stops[0].durationMinutes, 60);
  assert.equal(request.stops[0].note, "note-c");
  assert.deepEqual(h.itinerary().days[1], otherDay);
  assert.equal(h.render().canUndo, true);
  h.render().undo();
  await settle();
  assert.equal(h.saves[1].request.expectedUpdatedAt, nextRevision);
  assert.deepEqual(ids(h.render().stops), ["item-a", "item-b", "item-c"]);
  assert.equal(h.render().canUndo, false);
});

test("swipe removal updates immediately, blocks duplicate requests, and can restore only that day", async () => {
  const h = harness();
  h.pause();
  const action = h.render();
  action.remove("item-b");
  action.remove("item-a");
  assert.equal(h.saves.length, 1);
  assert.equal(h.saving.current, true);
  assert.deepEqual(ids(h.render().stops), ["item-a", "item-c"]);
  assert.equal(h.render().canInteract, false);
  h.resume();
  await settle();
  assert.equal(h.render().canUndo, true);
  assert.equal(h.itinerary().days[1].stops.length, 3);
});

test("network failure rolls back visual order and retries the same revision", async () => {
  const h = harness();
  h.pause();
  h.fail(new ApiError("NETWORK_ERROR"));
  h.render().reorder(["item-c", "item-a", "item-b"]);
  assert.deepEqual(ids(h.render().stops), ["item-c", "item-a", "item-b"]);
  h.resume();
  await settle();
  assert.deepEqual(ids(h.render().stops), ["item-a", "item-b", "item-c"]);
  assert.equal(h.render().canRetry, true);
  assert.equal(h.render().canUndo, false);
  h.fail(undefined);
  h.render().retry();
  assert.equal(h.saves[1].request.expectedUpdatedAt, revision);
  h.resume();
  await settle();
  assert.equal(h.render().canUndo, true);
});

test("stale drag and stale undo never replace a newer itinerary", async () => {
  const h = harness();
  const action = h.render();
  action.begin();
  h.remoteChange();
  h.render().reorder(["item-c", "item-a", "item-b"]);
  await settle();
  assert.equal(h.saves[0].request.expectedUpdatedAt, revision);
  assert.equal(h.render().canInteract, false);
  assert.equal(h.render().canRetry, false);
  assert.deepEqual(ids(h.render().stops), ["item-a", "item-b", "item-c"]);

  const undo = harness();
  undo.render().remove("item-b");
  await settle();
  undo.remoteChange();
  undo.render().undo();
  await settle();
  assert.equal(undo.saves[1].request.expectedUpdatedAt, nextRevision);
  assert.deepEqual(ids(undo.render().stops), ["item-a", "item-c"]);
  assert.equal(undo.render().canRetry, false);
});

test("invalid, duplicate, no-op, read-only and cross-day actions do not save", async () => {
  const h = harness();
  for (const order of [
    ["item-a"],
    ["item-a", "item-a", "item-c"],
    ["item-a", "unknown", "item-c"],
    ["item-a", "item-b", "item-c"],
  ])
    h.render().reorder(order);
  h.render().remove("unknown");
  assert.equal(h.saves.length, 0);
  h.readonly();
  h.render().remove("item-b");
  h.render().reorder(["item-c", "item-a", "item-b"]);
  assert.equal(h.saves.length, 0);
  assert.equal(h.render().canInteract, false);

  const changedDay = harness();
  const drag = changedDay.render();
  drag.begin();
  changedDay.select("2026-11-21");
  changedDay.render();
  drag.reorder(["item-c", "item-a", "item-b"]);
  assert.equal(changedDay.saves.length, 0);
});

test("undo is unavailable after switching days or opening another editor", async () => {
  const h = harness();
  h.render().remove("item-b");
  await settle();
  h.render().clear();
  assert.equal(h.render().canUndo, false);
  h.render().remove("item-c");
  await settle();
  h.select("2026-11-21");
  assert.equal(h.render().canUndo, false);
  h.render().undo();
  assert.equal(h.saves.length, 2);
});
