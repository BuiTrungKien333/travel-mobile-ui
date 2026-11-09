import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

function motionHarness(dismissDisabled = false) {
  let gestureEnabled = true;
  const effects: (() => () => void)[] = [];
  const completions: ((finished: boolean) => void)[] = [];
  const events: string[] = [];
  const handlers: Record<
    string,
    (event: { translationY: number; velocityY: number }) => void
  > = {};
  const gesture = Object.fromEntries(
    ["enabled", "activeOffsetY", "failOffsetX", "onUpdate", "onEnd", "onFinalize"].map(
      (key) => [
        key,
        (value: unknown) => {
          if (key === "enabled") gestureEnabled = value === true;
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
      scheduleOnRN: (callback: () => void) => callback(),
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
  const motion = usePickerSheetMotion(() => events.push("close"),dismissDisabled);
  const cleanup = effects[0]();
  return { motion, completions, events, handlers, cleanup, isGestureEnabled: () => gestureEnabled };
}

test("a pending server mutation disables swipe and prevents closing the sheet", () => {
  const h = motionHarness(true);
  h.motion.close();
  assert.equal(h.isGestureEnabled(), false);
  assert.equal(h.completions.length, 0);
  assert.deepEqual(h.events, []);
  h.cleanup();
});

test("Apply commits once after the close animation and duplicate presses cannot replace it", () => {
  const { motion, completions, events } = motionHarness();
  motion.close(() => events.push("apply"));
  motion.close(() => events.push("wrong apply"));
  assert.equal(events.length, 0);
  assert.equal(completions.length, 1);
  completions[0](true);
  assert.deepEqual(events, ["apply", "close"]);
});

test("cancelled exit does not commit form values and unmount cancels motion", () => {
  const { motion, completions, events, cleanup } = motionHarness();
  motion.close(() => events.push("apply"));
  completions[0](false);
  assert.deepEqual(events, []);
  cleanup();
  assert.deepEqual(events, ["cancel"]);
});

test("a swipe cannot bypass an in-flight Apply animation", () => {
  const { motion, handlers, completions, events } = motionHarness();
  motion.close(() => events.push("apply"));
  handlers.onEnd({ translationY: 90, velocityY: 100 });
  assert.equal(completions.length, 1);
  assert.deepEqual(events, []);
  completions[0](true);
  assert.deepEqual(events, ["apply", "close"]);
});

test("backdrop close and downward swipe dismiss without committing a selection", () => {
  const backdrop = motionHarness();
  backdrop.motion.close();
  backdrop.completions[0](true);
  assert.deepEqual(backdrop.events, ["close"]);
  const swipe = motionHarness();
  swipe.handlers.onEnd({ translationY: 90, velocityY: 100 });
  swipe.completions[0](true);
  assert.deepEqual(swipe.events, ["close"]);
});
