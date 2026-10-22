import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type ScrollEvent = { contentOffset: { y: number } };
type ScrollHandlers = {
  onScroll: (event: ScrollEvent) => void;
  onBeginDrag: (event: ScrollEvent) => void;
};

function harness(enabled = true, reduceMotion = false) {
  const changes: boolean[] = [];
  const scrolls: { offset: number; animated: boolean }[] = [];
  const effects: (() => void)[] = [];
  let handlers: ScrollHandlers | undefined;
  const load = tripModuleLoader({
    react: {
      useState: (initial: boolean) => [
        initial,
        (next: boolean) => changes.push(next),
      ],
      useEffect: (effect: () => void) => effects.push(effect),
    },
    "react-native-reanimated": {
      useReducedMotion: () => reduceMotion,
      useSharedValue: (initial: unknown) => {
        let value = initial;
        return {
          get: () => value,
          set: (next: unknown) => {
            value = next;
          },
        };
      },
      useAnimatedScrollHandler: (value: ScrollHandlers) => {
        handlers = value;
        return value;
      },
    },
    "react-native-worklets": {
      scheduleOnRN: (
        callback: (...args: unknown[]) => void,
        ...args: unknown[]
      ) => callback(...args),
    },
    "@/hooks/use-app-theme": {
      useAppTheme: () => ({
        layout: { tripPlanningMapAutoHideDistance: 48 },
        spacing: { sm: 8 },
        motion: {
          tripMapRestoreVelocity: 700,
          tripMapScrollSettleDuration: 600,
        },
      }),
    },
  });
  const { usePlanningMapCollapse } = load<{
    usePlanningMapCollapse: (options: {
      enabled: boolean;
      selectionKey: string;
      mapHeight: number;
      list: {
        current: { scrollToOffset: (value: (typeof scrolls)[number]) => void };
      };
    }) => { show: () => void };
  }>("src/features/trip/hooks/use-planning-map-collapse.ts");
  const motion = usePlanningMapCollapse({
    enabled,
    selectionKey: "day-1",
    mapHeight: 256,
    list: { current: { scrollToOffset: (value) => scrolls.push(value) } },
  });
  effects.forEach((effect) => effect());
  changes.length = 0;
  assert.ok(handlers);
  return {
    motion,
    changes,
    scrolls,
    handlers,
    event: (y: number) => ({ contentOffset: { y } }),
  };
}

test("scrolling down collapses once and ignores the resulting native scroll animation", () => {
  const { handlers, changes, scrolls, event } = harness();
  handlers.onScroll(event(12));
  assert.equal(changes.length, 0);
  handlers.onScroll(event(64));
  handlers.onScroll(event(120));
  handlers.onScroll(event(256));
  assert.deepEqual(changes, [true]);
  assert.deepEqual(
    scrolls.map(({ offset, animated }) => ({ offset, animated })),
    [{ offset: 256, animated: true }],
  );
});

test("a fast upward gesture restores the map and doesn't immediately re-collapse during the return", () => {
  const { handlers, changes, scrolls, event } = harness();
  handlers.onScroll(event(64));
  handlers.onScroll(event(256));
  handlers.onBeginDrag(event(400));
  handlers.onScroll(event(250));
  handlers.onScroll(event(120));
  handlers.onScroll(event(0));
  assert.deepEqual(changes, [true, false]);
  assert.deepEqual(
    scrolls.map((scroll) => scroll.offset),
    [256, 0],
  );
});

test("jumping to a numbered stop doesn't snap backwards to the map boundary", () => {
  const { handlers, scrolls, changes, event } = harness();
  handlers.onScroll(event(600));
  assert.deepEqual(changes, [true]);
  assert.equal(scrolls.length, 0);
});

test("the explicit map button respects reduced motion; other trip modes don't auto-collapse", () => {
  const reduced = harness(true, true);
  reduced.handlers.onScroll(reduced.event(64));
  reduced.motion.show();
  assert.ok(reduced.scrolls.every((scroll) => !scroll.animated));
  assert.equal(reduced.scrolls.at(-1)?.offset, 0);
  const disabled = harness(false);
  disabled.handlers.onScroll(disabled.event(300));
  assert.equal(disabled.changes.length, 0);
  assert.equal(disabled.scrolls.length, 0);
});
