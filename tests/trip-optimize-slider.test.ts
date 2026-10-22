import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Shared = {
  get: () => number | boolean;
  set: (next: number | boolean) => void;
};
type PanHandlers = {
  start?: () => void;
  update?: (event: { translationX: number }) => void;
  end?: () => void;
  finalize?: (event: unknown, success: boolean) => void;
};
type Control = {
  props: {
    onLayout: (event: { nativeEvent: { layout: { width: number } } }) => void;
    onPress: (event: { nativeEvent: { detail: number } }) => void;
    onAccessibilityAction: (event: {
      nativeEvent: { actionName: string };
    }) => void;
  };
};

function harness(platform = "web") {
  let calls = 0;
  let readerQueries = 0;
  const readerChanges: boolean[] = [];
  const effects: (() => unknown)[] = [];
  const shared: Shared[] = [];
  const handlers: PanHandlers = {};
  const animations: ((finished: boolean) => void)[] = [];
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const pan = {
    activeOffsetX: () => pan,
    failOffsetY: () => pan,
    onStart: (callback: PanHandlers["start"]) => {
      handlers.start = callback;
      return pan;
    },
    onUpdate: (callback: PanHandlers["update"]) => {
      handlers.update = callback;
      return pan;
    },
    onEnd: (callback: PanHandlers["end"]) => {
      handlers.end = callback;
      return pan;
    },
    onFinalize: (callback: PanHandlers["finalize"]) => {
      handlers.finalize = callback;
      return pan;
    },
  };
  function animate(
    target: number,
    _options: unknown,
    callback?: (finished: boolean) => void,
  ) {
    if (callback) animations.push(callback);
    return target;
  }
  const load = tripModuleLoader({
    react: {
      useState: () => [
        false,
        (enabled: boolean) => readerChanges.push(enabled),
      ],
      useEffect: (effect: () => unknown) => effects.push(effect),
    },
    "react-native": {
      Platform: { OS: platform },
      AccessibilityInfo: {
        addEventListener: () => ({ remove: () => {} }),
        isScreenReaderEnabled: () => {
          readerQueries += 1;
          return Promise.resolve(true);
        },
      },
      Pressable: "Pressable",
      StyleSheet: { create: (value: unknown) => value, hairlineWidth: 1 },
    },
    "react-native-gesture-handler": {
      Gesture: { Pan: () => pan },
      GestureDetector: "GestureDetector",
    },
    "react-native-reanimated": {
      __esModule: true,
      default: { View: "AnimatedView" },
      ReduceMotion: { System: "system" },
      useSharedValue: (initial: number | boolean) => {
        let value = initial;
        const entry = {
          get: () => value,
          set: (next: number | boolean) => {
            value = next;
          },
        };
        shared.push(entry);
        return entry;
      },
      useAnimatedStyle: (callback: () => unknown) => callback(),
      cancelAnimation: () => {},
      withSpring: animate,
      withTiming: animate,
    },
    "react-native-worklets": {
      scheduleOnRN: (callback: () => void) => callback(),
    },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/common/glass-backdrop": { GlassBackdrop: "GlassBackdrop" },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/components/ui/app-text": { AppText: "AppText" },
  });
  const { TripOptimizeSlider } = load<{
    TripOptimizeSlider: (props: { onOptimize: () => void }) => Control;
  }>("src/features/trip/components/trip-optimize-slider.tsx");
  const control = TripOptimizeSlider({
    onOptimize: () => {
      calls += 1;
    },
  });
  effects.forEach((effect) => effect());
  control.props.onLayout({ nativeEvent: { layout: { width: 320 } } });
  return {
    control,
    handlers,
    shared,
    animations,
    calls: () => calls,
    readerQueries: () => readerQueries,
    readerChanges,
  };
}

test("partial and cancelled drags return to start without opening optimization", () => {
  const h = harness();
  h.handlers.start?.();
  h.handlers.update?.({ translationX: -100 });
  assert.equal(h.shared[0].get(), 0);
  h.handlers.update?.({ translationX: 80 });
  h.handlers.end?.();
  assert.equal(h.shared[0].get(), 0);
  h.handlers.start?.();
  h.handlers.update?.({ translationX: 240 });
  h.handlers.finalize?.(null, false);
  assert.equal(h.shared[0].get(), 0);
  assert.equal(h.calls(), 0);
});

test("a full slide clamps to the track, activates once and can be used again after resetting", () => {
  const h = harness();
  h.handlers.start?.();
  h.handlers.update?.({ translationX: 1000 });
  assert.equal(h.shared[0].get(), 260);
  h.handlers.end?.();
  h.handlers.end?.();
  assert.equal(h.animations.length, 1);
  h.animations.shift()?.(true);
  assert.equal(h.calls(), 1);
  assert.equal(h.shared[0].get(), 0);
  h.animations.shift()?.(true);
  h.handlers.start?.();
  h.handlers.update?.({ translationX: 240 });
  h.handlers.end?.();
  h.animations.shift()?.(true);
  assert.equal(h.calls(), 2);
});

test("ordinary taps do not activate; keyboard and accessibility activation remain available", () => {
  const h = harness();
  h.control.props.onPress({ nativeEvent: { detail: 1 } });
  assert.equal(h.calls(), 0);
  h.control.props.onPress({ nativeEvent: { detail: 0 } });
  assert.equal(h.calls(), 1);
  h.animations.shift()?.(true);
  h.control.props.onAccessibilityAction({
    nativeEvent: { actionName: "activate" },
  });
  assert.equal(h.calls(), 2);
});

test("web keeps the slider despite RN Web's always-true screen reader stub; native still detects readers", async () => {
  const web = harness();
  await Promise.resolve();
  assert.equal(web.readerQueries(), 0);
  assert.deepEqual(web.readerChanges, []);
  const native = harness("android");
  await Promise.resolve();
  assert.equal(native.readerQueries(), 1);
  assert.deepEqual(native.readerChanges, [true]);
});
