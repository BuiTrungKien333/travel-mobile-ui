import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

function shared<T>(value: T) { return { get: () => value, set: (next: T) => { value = next; } }; }
type Event = { y: number; translationY: number };

test("pull refresh requires a sustained pull from the timeline top, not map pan or a quick flick", () => {
  let now = 1000;
  let refreshes = 0;
  let begin: (event: Event) => void = () => {};
  let end: (event: Event) => void = () => {};
  let finalize: () => void = () => {};
  const pan = {
    simultaneousWithExternalGesture: () => pan, maxPointers: () => pan,
    activeOffsetY: () => pan, failOffsetX: () => pan,
    onBegin: (callback: typeof begin) => { begin = callback; return pan; },
    onEnd: (callback: typeof end) => { end = callback; return pan; },
    onFinalize: (callback: typeof finalize) => { finalize = callback; return pan; },
  };
  const offset = shared(0);
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>("src/theme/tokens.ts");
  const load = tripModuleLoader({
    "react-native-gesture-handler": { Gesture: { Pan: () => pan } },
    "react-native-reanimated": { useSharedValue: shared },
    "react-native-worklets": { scheduleOnRN: (callback: () => void) => callback() },
    "@/hooks/use-app-theme": { useAppTheme: () => tokens },
  }, { Date: { now: () => now } });
  const { useTripPullRefresh } = load<typeof import("../src/features/trip/hooks/use-trip-pull-refresh.ts")>("src/features/trip/hooks/use-trip-pull-refresh.ts");
  useTripPullRefresh({ scrollGesture: pan, offset, mapHeight: 250, enabled: true, onRefresh: () => refreshes++ });
  function pull(y: number, distance: number, duration: number) {
    begin({ y, translationY: 0 }); now += duration;
    end({ y: y + distance, translationY: distance }); finalize();
  }
  pull(400, 120, 100); // Fast scroll: no refresh.
  pull(400, 20, 800); // Resting a finger: no refresh.
  pull(100, 140, 800); // Mapbox gesture: no refresh.
  offset.set(300); pull(400, 140, 800); // Mid-list: no refresh.
  assert.equal(refreshes, 0);
  offset.set(0); pull(400, 120, 700);
  assert.equal(refreshes, 1);
});

test("a brief scroll reversal and programmatic scroll cannot reopen the map", () => {
  let now = 1000;
  const updates: boolean[] = [];
  const positions: number[] = [];
  type Scroll = { contentOffset: { y: number } };
  let handlers: { onBeginDrag: (event: Scroll) => void; onScroll: (event: Scroll) => void; onEndDrag: () => void };
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>("src/theme/tokens.ts");
  const load = tripModuleLoader({
    react: { useEffect: (effect: () => void) => effect(), useState: () => [false, (value: boolean) => updates.push(value)] },
    "react-native-reanimated": { useSharedValue: shared, useReducedMotion: () => true,
      useAnimatedScrollHandler: (value: typeof handlers) => { handlers = value; return value; } },
    "react-native-worklets": { scheduleOnRN: (callback: (value?: boolean) => void, value?: boolean) => callback(value) },
    "@/hooks/use-app-theme": { useAppTheme: () => tokens },
  }, { Date: { now: () => now } });
  const { usePlanningMapCollapse } = load<typeof import("../src/features/trip/hooks/use-planning-map-collapse.ts")>("src/features/trip/hooks/use-planning-map-collapse.ts");
  usePlanningMapCollapse({ enabled: true, selectionKey: "day1", mapHeight: 300,
    list: { current: { scrollToOffset: ({ offset }: { offset: number }) => positions.push(offset) } } });
  const event = (y: number) => ({ contentOffset: { y } });
  handlers!.onBeginDrag(event(0)); now += 250; handlers!.onScroll(event(100));
  assert.equal(updates.at(-1), true);
  handlers!.onScroll(event(300)); handlers!.onEndDrag(); now += 800;
  handlers!.onScroll(event(280)); // Inertial/layout reversal.
  handlers!.onBeginDrag(event(300)); now += 30; handlers!.onScroll(event(290));
  assert.equal(updates.at(-1), true);
  now += 200; handlers!.onScroll(event(190));
  assert.equal(updates.at(-1), false);
  assert.equal(positions.at(-1), 0);
});
