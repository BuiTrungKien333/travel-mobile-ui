import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidElement, type ReactNode } from "react";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Value = number | boolean;
type Timer = { target: number; delay: number };
type Props = {
  children?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
};
type Pan = {
  start?: () => void;
  update?: (event: { translationY: number }) => void;
  end?: (event: { velocityY: number }) => void;
  finalize?: (event: unknown, success: boolean) => void;
};

function harness() {
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const states: unknown[] = [];
  const refs: { current: Value }[] = [];
  const effectDeps: (readonly unknown[] | undefined)[] = [];
  const effects: (() => unknown)[] = [];
  const shared: ReturnType<typeof makeShared>[] = [];
  const timers: (() => void)[] = [];
  const springs: ((finished: boolean) => void)[] = [];
  let stateIndex = 0;
  let sharedIndex = 0;
  let refIndex = 0;
  let effectIndex = 0;
  function makeShared(initial: Value) {
    let value = initial;
    return {
      get: () => value,
      set: (next: Value | Timer) => {
        if (typeof next === "object")
          timers.push(() => {
            value = next.target;
          });
        else value = next;
      },
    };
  }
  const resizeLock = makeShared(0);
  const handlers: Pan = {};
  const pan = {
    activeOffsetY: () => pan,
    failOffsetX: () => pan,
    onStart: (callback: Pan["start"]) => {
      handlers.start = callback;
      return pan;
    },
    onUpdate: (callback: Pan["update"]) => {
      handlers.update = callback;
      return pan;
    },
    onEnd: (callback: Pan["end"]) => {
      handlers.end = callback;
      return pan;
    },
    onFinalize: (callback: Pan["finalize"]) => {
      handlers.finalize = callback;
      return pan;
    },
  };
  const load = tripModuleLoader({
    react: {
      useCallback: (callback: unknown) => callback,
      useRef: (initial: Value) => {
        const index = refIndex++;
        return refs[index] ?? (refs[index] = { current: initial });
      },
      useState: (initial: unknown) => {
        const index = stateIndex++;
        if (!(index in states)) states[index] = initial;
        return [
          states[index],
          (next: unknown) => {
            states[index] = next;
          },
        ];
      },
      useEffect: (callback: () => unknown, deps?: readonly unknown[]) => {
        const index = effectIndex++;
        const previous = effectDeps[index];
        if (
          !previous ||
          !deps ||
          deps.some((value, i) => !Object.is(value, previous[i]))
        )
          effects.push(callback);
        effectDeps[index] = deps;
      },
    },
    "react-native": {
      Pressable: "Pressable",
      View: "View",
      useWindowDimensions: () => ({ height: 720 }),
    },
    "react-native-gesture-handler": {
      Gesture: { Pan: () => pan },
      GestureDetector: "GestureDetector",
    },
    "react-native-reanimated": {
      __esModule: true,
      default: { View: "AnimatedView" },
      ReduceMotion: { System: "system", Never: "never" },
      useSharedValue: (initial: Value) => {
        const index = sharedIndex++;
        return shared[index] ?? (shared[index] = makeShared(initial));
      },
      useAnimatedStyle: (callback: () => unknown) => callback(),
      cancelAnimation: () => {},
      withSpring: (
        target: number,
        _config: unknown,
        callback?: (finished: boolean) => void,
      ) => {
        if (callback) springs.push(callback);
        return target;
      },
      withTiming: (target: number, config: { duration: number }): Timer => ({
        target,
        delay: config.duration,
      }),
      withDelay: (delay: number, timer: Timer): Timer => ({
        ...timer,
        delay: timer.delay + delay,
      }),
    },
    "react-native-worklets": {
      scheduleOnRN: (callback: (value: boolean) => void, value: boolean) =>
        callback(value),
    },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/common/glass-backdrop": { GlassBackdrop: "GlassBackdrop" },
    "./trip-map-preview": { TripMapPreview: "TripMapPreview" },
    "./trip-details-header": { DetailIconButton: "DetailIconButton" },
  });
  const { TripPlanningMap } = load<
    typeof import("../src/features/trip/components/trip-planning-map.tsx")
  >("src/features/trip/components/trip-planning-map.tsx");
  function handle(node: ReactNode): Props | undefined {
    if (Array.isArray(node)) return node.map(handle).find(Boolean);
    if (!isValidElement<Props>(node)) return undefined;
    if (node.type === "Pressable") return node.props;
    return handle(node.props.children);
  }
  return {
    handlers,
    resizeLock,
    settle: () => {
      springs.splice(0).forEach((finish) => finish(true));
      timers.splice(0).forEach((finish) => finish());
    },
    render: (expandRequest = 0) => {
      stateIndex = 0;
      sharedIndex = 0;
      refIndex = 0;
      effectIndex = 0;
      const tree = TripPlanningMap({
        header: "Header",
        viewportHeight: 640,
        selectorHeight: 54,
        stops: [],
        startLabel: "Hotel",
        onSelect: () => {},
        onStart: () => {},
        onGeometryChange: () => {},
        resizeLock,
        expandRequest,
      });
      effects.splice(0).forEach((effect) => effect());
      const control = handle(tree);
      assert.ok(control);
      return control;
    },
  };
}

test("directions expands the map to the same snap point as a drag, without toggling it closed", () => {
  const h = harness();
  h.render();
  h.render(1);
  assert.equal(h.render(1).accessibilityLabel, "Thu gọn bản đồ");
  assert.equal(h.resizeLock.get(), 1);
  h.settle();
  h.render(1).onPress?.();
  assert.equal(h.render(1).accessibilityLabel, "Mở rộng bản đồ");
  h.settle();
  h.render(2);
  assert.equal(h.render(2).accessibilityLabel, "Thu gọn bản đồ");
  h.render(3);
  assert.equal(h.render(3).accessibilityLabel, "Thu gọn bản đồ");
});

test("a pan release followed by a press cannot toggle the expanded map closed", () => {
  const h = harness();
  assert.equal(h.render().accessibilityLabel, "Mở rộng bản đồ");
  h.handlers.start?.();
  h.handlers.update?.({ translationY: 300 });
  h.handlers.end?.({ velocityY: 0 });
  h.handlers.finalize?.({}, true);
  assert.equal(h.resizeLock.get(), 1);
  const expanded = h.render();
  assert.equal(expanded.accessibilityLabel, "Thu gọn bản đồ");
  expanded.onPress?.();
  assert.equal(h.render().accessibilityLabel, "Thu gọn bản đồ");
  h.settle();
  assert.equal(h.resizeLock.get(), 0);
  h.render().onPress?.();
  assert.equal(h.render().accessibilityLabel, "Mở rộng bản đồ");
});

test("cancelling a map drag restores its snap point and guards its release tap", () => {
  const h = harness();
  h.render();
  h.handlers.start?.();
  h.handlers.update?.({ translationY: 80 });
  h.handlers.finalize?.({}, false);
  const collapsed = h.render();
  collapsed.onPress?.();
  assert.equal(h.render().accessibilityLabel, "Mở rộng bản đồ");
  h.settle();
  h.render().onPress?.();
  assert.equal(h.render().accessibilityLabel, "Thu gọn bản đồ");
});
