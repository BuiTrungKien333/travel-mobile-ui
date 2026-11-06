import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { TripStop } from "../src/features/home/types/home-types.ts";

function DismissFixture() {
  let cleanup: (() => void) | undefined;
  const events: string[] = [];
  const load = tripModuleLoader({ react: { useRef: (current: unknown) => ({ current }),
    useEffect: (effect: () => (() => void)) => { cleanup = effect(); } } });
  const lifecycle = load<typeof import("../src/hooks/use-dismiss-lifecycle.ts")>("src/hooks/use-dismiss-lifecycle.ts")
    .useDismissLifecycle(() => events.push("close"));
  return { lifecycle, events, unmount: () => cleanup?.() };
}

test("dismissal commits once, ignores duplicate completion and rejects late callbacks after unmount", () => {
  const f = DismissFixture();
  const ticket = f.lifecycle.begin(() => f.events.push("apply"));
  assert.ok(ticket !== undefined);
  assert.equal(f.lifecycle.begin(() => f.events.push("wrong")), undefined);
  f.lifecycle.complete(ticket); f.lifecycle.complete(ticket);
  assert.deepEqual(f.events, ["apply", "close"]);
  const late = DismissFixture(); const pending = late.lifecycle.begin(() => late.events.push("apply"));
  assert.ok(pending !== undefined); late.unmount(); late.lifecycle.complete(pending);
  assert.deepEqual(late.events, []);
});

test("cancelled exit can retry and an old animation cannot complete the new request", () => {
  const f = DismissFixture(); const first = f.lifecycle.begin(() => f.events.push("old"));
  assert.ok(first !== undefined); assert.equal(f.lifecycle.cancel(first), true);
  const second = f.lifecycle.begin(() => f.events.push("new")); assert.ok(second !== undefined);
  f.lifecycle.complete(first); assert.equal(f.lifecycle.cancel(first), false);
  assert.deepEqual(f.events, []);
  f.lifecycle.complete(second); assert.deepEqual(f.events, ["new", "close"]);
});

test("native motion preference responds to system changes and removes its listener", () => {
  let reduced = false; let changed: ((value: boolean) => void) | undefined; let cleanup: (() => void) | undefined; let removed = 0;
  const load = tripModuleLoader({ react: {
    useState: () => [reduced, (value: boolean) => { reduced = value; }], useEffect: (effect: () => (() => void)) => { cleanup = effect(); },
  }, "react-native": { AccessibilityInfo: { addEventListener: (name: string, handler: typeof changed) => {
    assert.equal(name, "reduceMotionChanged"); changed = handler; return { remove: () => { removed++; } };
  } } }, "react-native-reanimated": { useReducedMotion: () => false } });
  const { useMotionPreference } = load<typeof import("../src/hooks/use-motion-preference.ts")>("src/hooks/use-motion-preference.ts");
  assert.equal(useMotionPreference(), false); changed?.(true); assert.equal(reduced, true);
  cleanup?.(); assert.equal(removed, 1);
});

type Effect = { dependencies?: readonly unknown[]; cleanup?: () => void };
function DragFixture() {
  const states: unknown[] = []; const refs: { current: unknown }[] = []; const values: unknown[] = []; const effects: Effect[] = [];
  let stateIndex = 0; let refIndex = 0; let valueIndex = 0; let effectIndex = 0;
  let pending: (() => void)[] = []; let writes = 0;
  const orders: string[][] = [];
  const load = tripModuleLoader({ react: {
    useState: (initial: unknown) => { const index = stateIndex++; if (!(index in states)) states[index] = initial;
      return [states[index], (value: unknown) => { states[index] = value; }]; },
    useRef: (initial: unknown) => refs[refIndex++] ??= { current: initial },
    useEffect: (effect: () => void | (() => void), dependencies: readonly unknown[]) => {
      const index = effectIndex++; const previous = effects[index];
      if (!previous || dependencies.some((value, item) => !Object.is(value, previous.dependencies?.[item]))) pending.push(() => {
        previous?.cleanup?.(); const cleanup = effect(); effects[index] = { dependencies, cleanup: typeof cleanup === "function" ? cleanup : undefined };
      });
    },
  }, "react-native-reanimated": { useSharedValue: (initial: unknown) => {
    const index = valueIndex++;
    if (!(index in values)) { let current = initial; values[index] = { get: () => current, set: (value: unknown) => { current = value; if (index === 0) writes++; } }; }
    return values[index];
  } }, "@/hooks/use-app-theme": { useAppTheme: () => ({ layout: { tripTimelineEstimatedRowHeight: 160 } }) } });
  const { useTripTimelineDrag } = load<typeof import("../src/features/trip/hooks/use-trip-timeline-drag.ts")>("src/features/trip/hooks/use-trip-timeline-drag.ts");
  function Render(stops: TripStop[], selectionKey = "day-a") {
    stateIndex = 0; refIndex = 0; valueIndex = 0; effectIndex = 0; pending = [];
    const drag = useTripTimelineDrag({ stops, selectionKey, onReorder: (ids) => orders.push([...ids]) });
    pending.forEach((effect) => effect()); return drag;
  }
  return { Render, orders, Unmount: () => effects.forEach((effect) => effect.cleanup?.()), get writes() { return writes; } };
}
const stops = (count = 3): TripStop[] => Array.from({ length: count }, (_, index) => ({
  id: `stop-${index}`, name: { vi: `Điểm ${index}`, en: `Place ${index}` }, kind: { vi: "Điểm tham quan", en: "Place" }, time: "", pinned: false,
}));

test("one completed drag writes once; switching day or pin layout cancels queued drops", () => {
  const f = DragFixture(); const items = stops(); let drag = f.Render(items);
  drag.active.set(items[0].id); drag.begin(items[0].id); drag = f.Render(items);
  assert.equal(drag.draggedId, items[0].id);
  drag.finish(items[0].id, 2); drag.finish(items[0].id, 2); assert.equal(f.orders.length, 1);
  drag = f.Render(items); drag.active.set(items[0].id); drag.begin(items[0].id);
  const stale = drag.finish; drag = f.Render(items, "day-b"); stale(items[0].id, 2);
  assert.equal(drag.draggedId, null); assert.equal(f.orders.length, 1);
  drag.active.set(items[0].id); drag.begin(items[0].id);
  drag = f.Render(items.map((stop, index) => ({ ...stop, pinned: index === 1 })), "day-b");
  drag.finish(items[0].id, 2); assert.equal(f.orders.length, 1);
  drag = f.Render(items); drag.active.set(items[0].id); drag.begin(items[0].id);
  f.Unmount(); drag.finish(items[0].id, 2); assert.equal(f.orders.length, 1);
});

test("30-stop timeline avoids all 50 redundant slot transfers and retains measured row heights", () => {
  const f = DragFixture(); const items = stops(30); let drag = f.Render(items);
  assert.equal(f.writes, 1);
  for (let index = 0; index < 50; index++) drag = f.Render(items.map((stop) => ({ ...stop })));
  assert.equal(f.writes, 1);
  drag.measure(items[4].id, 220); assert.equal(f.writes, 2);
  f.Render(items.map((stop) => ({ ...stop })));
  assert.equal(f.writes, 2); assert.equal(drag.slots.get()[4].height, 220);
});

test("viewer page window has stable absolute indices and at most three images", () => {
  const { photoViewerPages } = tripModuleLoader()<typeof import("../src/features/home/utils/photo-viewer-geometry.ts")>("src/features/home/utils/photo-viewer-geometry.ts");
  for (const count of [1, 6, 100, 300]) {
    for (const index of [0, Math.floor(count / 2), count - 1]) {
      const pages = photoViewerPages(index, count);
      assert.ok(pages.includes(index)); assert.ok(pages.length <= 3);
      assert.ok(pages.every((page) => page >= 0 && page < count));
    }
  }
  assert.equal(photoViewerPages(0, 0).length, 0);
});
