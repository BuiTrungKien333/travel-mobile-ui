import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

function MotionHarness(enabled = true) {
  const effects: (() => () => void)[] = [];
  const completions: ((finished: boolean) => void)[] = [];
  const events: string[] = [];
  const handlers: Record<
    string,
    (event: { translationY: number; velocityY: number }) => void
  > = {};
  const gesture = Object.fromEntries(
    ["enabled", "maxPointers", "activeOffsetY", "failOffsetX", "onUpdate", "onEnd", "onFinalize"].map(
      (key) => [
        key,
        (value: unknown) => {
          if (typeof value === "function")
            handlers[key] = value as (typeof handlers)[string];
          return gesture;
        },
      ],
    ),
  );
  const load = tripModuleLoader({
    react: {
      useEffect: (effect: (typeof effects)[number]) => effects.push(effect),
      useRef: (current: unknown) => ({ current }),
    },
    "react-native": {
      Keyboard: { dismiss: () => {} },
      useWindowDimensions: () => ({ height: 800 }),
    },
    "react-native-gesture-handler": { Gesture: { Pan: () => gesture } },
    "react-native-worklets": {
      scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) => callback(...args),
    },
    "react-native-reanimated": {
      useReducedMotion: () => false,
      ReduceMotion: { System: "system" },
      useSharedValue: (initial: unknown) => {
        let value = initial;
        return {
          get: () => value,
          set: (next: unknown) => {
            value = next;
          },
        };
      },
      useAnimatedStyle: (style: () => unknown) => style,
      cancelAnimation: () => events.push("cancel"),
      withTiming: (
        value: number,
        _options: unknown,
        complete?: (typeof completions)[number],
      ) => {
        if (complete) completions.push(complete);
        return value;
      },
    },
    "@/hooks/use-app-theme": {
      useAppTheme: () => ({
        layout: {
          sheetEntryOffset: 280,
          sheetDismissDistance: 80,
          sheetBackdropFadeDistance: 350,
        },
        motion: {
          tabTransitionDuration: 240,
          sheetDismissDuration: 180,
          sheetDismissVelocity: 700,
        },
        spacing: { sm: 8, md: 12, lg: 16 },
      }),
    },
  });
  const { usePickerSheetMotion } = load<
    typeof import("../src/features/trip/hooks/use-picker-sheet-motion.ts")
  >("src/features/trip/hooks/use-picker-sheet-motion.ts");
  const motion = usePickerSheetMotion(() => events.push("close"), undefined, enabled);
  const cleanups = effects.map((effect) => effect());
  const cleanup = () => cleanups.forEach((dispose) => dispose());
  return { motion, completions, events, handlers, cleanup };
}

test("Apply commits once after the close animation and duplicate presses cannot replace it", () => {
  const { motion, completions, events } = MotionHarness();
  motion.close(() => events.push("apply"));
  motion.close(() => events.push("wrong apply"));
  assert.equal(events.length, 0);
  assert.equal(completions.length, 1);
  completions[0](true);
  assert.deepEqual(events, ["apply", "close"]);
});

test("cancelled exit does not commit form values and unmount cancels motion", () => {
  const { motion, completions, events, cleanup } = MotionHarness();
  motion.close(() => events.push("apply"));
  completions[0](false);
  assert.deepEqual(events, []);
  cleanup();
  assert.deepEqual(events, ["cancel"]);
});

test("backdrop close and downward swipe dismiss without committing a selection", () => {
  const backdrop = MotionHarness();
  backdrop.motion.close();
  backdrop.completions[0](true);
  assert.deepEqual(backdrop.events, ["close"]);
  const swipe = MotionHarness();
  swipe.handlers.onEnd({ translationY: 90, velocityY: 100 });
  swipe.completions[0](true);
  assert.deepEqual(swipe.events, ["close"]);
});

test("an interrupted close unlocks retry and late completions cannot apply the previous selection", () => {
  const f = MotionHarness();
  f.motion.close(() => f.events.push("old")); f.completions[0](false);
  f.motion.close(() => f.events.push("new"));
  f.completions[0](true); assert.deepEqual(f.events, []);
  f.completions[1](true); assert.deepEqual(f.events, ["new", "close"]);
});

test("busy sheets cannot dismiss and unmounted sheets cannot commit late callbacks", () => {
  const busy = MotionHarness(false); busy.motion.close(() => busy.events.push("apply"));
  assert.equal(busy.completions.length, 0);
  const unmounted = MotionHarness(); unmounted.motion.close(() => unmounted.events.push("apply")); unmounted.cleanup();
  unmounted.completions[0](true); assert.deepEqual(unmounted.events, ["cancel"]);
});
