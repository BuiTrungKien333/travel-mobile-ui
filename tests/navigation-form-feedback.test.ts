import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Button = { text: string; onPress?: () => void };
function ExitFixture(dirty: boolean, busy = false) {
  let blocked = false;
  let prevent: ((event: { data: { action: { type: string } } }) => void) | undefined;
  const alerts: Button[][] = [];
  const dispatched: unknown[] = [];
  const load = tripModuleLoader({
    "expo-router/react-navigation": {
      useNavigation: () => ({ dispatch: (action: unknown) => dispatched.push(action) }),
      usePreventRemove: (value: boolean, callback: typeof prevent) => { blocked = value; prevent = callback; },
    },
    "react-native": { Platform: { OS: "android" }, Alert: { alert: (_title: string, _hint: string, buttons: Button[]) => alerts.push(buttons) } },
    "./use-i18n": { useI18n: () => ({ t: (key: string) => key }) },
  });
  const { useUnsavedExit } = load<typeof import("../src/hooks/use-unsaved-exit.ts")>("src/hooks/use-unsaved-exit.ts");
  const close = useUnsavedExit(dirty, busy);
  return { close, alerts, dispatched, blocked, back: () => prevent?.({ data: { action: { type: "GO_BACK" } } }) };
}

test("dirty sheet Cancel/Back retains edits until discard is explicitly chosen", () => {
  const f = ExitFixture(true); let closed = 0;
  f.close(() => { closed++; });
  assert.equal(f.blocked, true); assert.equal(closed, 0);
  assert.equal(f.alerts[0][0].text, "common.keepEditing");
  f.alerts[0][0].onPress?.(); assert.equal(closed, 0);
  f.alerts[0][1].onPress?.(); assert.equal(closed, 1);
});

test("route removal dispatches the original Back action after confirmation; saving blocks all exits", () => {
  const dirty = ExitFixture(true); dirty.back();
  assert.equal(dirty.dispatched.length, 0);
  dirty.alerts[0][1].onPress?.();
  assert.equal(JSON.stringify(dirty.dispatched), JSON.stringify([{ type: "GO_BACK" }]));
  const saving = ExitFixture(true, true); let left = false;
  saving.close(() => { left = true; }); saving.back();
  assert.equal(left, false); assert.equal(saving.alerts.length, 0); assert.equal(saving.blocked, true);
  const clean = ExitFixture(false); clean.close(() => { left = true; });
  assert.equal(left, true); assert.equal(clean.blocked, false);
});

test("photo Back preserves its caller; a deep link falls back to its own trip album", () => {
  let canBack = true; let backs = 0; const replaced: unknown[] = [];
  const load = tripModuleLoader({ "expo-router": { router: { canGoBack: () => canBack, back: () => { backs++; }, replace: (route: unknown) => replaced.push(route) } } });
  const { backOrReplace } = load<typeof import("../src/utils/back-or-replace.ts")>("src/utils/back-or-replace.ts");
  const fallback = { pathname: "/memories/[tripId]" as const, params: { tripId: "trip" } };
  backOrReplace(fallback); assert.equal(backs, 1); assert.equal(replaced.length, 0);
  canBack = false; backOrReplace(fallback);
  assert.equal(replaced[0], fallback);
});

test("a missing failed query takes priority over another pending request; cached errors keep content mounted", () => {
  const { requiredQueryState } = tripModuleLoader()<typeof import("../src/utils/required-query-state.ts")>("src/utils/required-query-state.ts");
  const pending = { data: undefined, isPending: true, isError: false };
  assert.equal(requiredQueryState([pending, { data: undefined, isPending: false, isError: true }]), "error");
  assert.equal(requiredQueryState([pending]), "loading");
  assert.equal(requiredQueryState([{ data: [], isPending: false, isError: true }]), "ready");
});

test("timeline remembers each day's final position without replacing the map's animated scroll handler", () => {
  const refs: { current: unknown }[] = []; let cursor = 0;
  let selectionEffect: (() => (() => void)) | undefined;
  let queued: (() => void) | undefined;
  let effects = 0;
  const offsets: number[] = [];
  const load = tripModuleLoader({ react: {
    useRef: (value: unknown) => refs[cursor++] ??= { current: value },
    useEffect: (callback: () => (() => void)) => { if (effects++ === 0) selectionEffect = callback; },
  }, "react-native-reanimated": { useReducedMotion: () => true } }, {
    requestAnimationFrame: (callback: () => void) => { queued = callback; return 1; }, cancelAnimationFrame: () => { queued = undefined; },
  });
  type Timeline = { list: { current: { scrollToOffset: (value: { offset: number }) => void } | null };
    rememberOffset: (event: { nativeEvent: { contentOffset: { y: number } } }) => void };
  const { useTripTimelineScroll } = load<{ useTripTimelineScroll: (key: string) => Timeline }>("src/features/trip/hooks/use-trip-timeline-scroll.ts");
  function RenderTimeline(key: string) {
    cursor = 0; effects = 0;
    const result = useTripTimelineScroll(key);
    result.list.current = { scrollToOffset: ({ offset }) => offsets.push(offset) };
    selectionEffect?.(); queued?.();
    return result;
  }
  RenderTimeline("day-a").rememberOffset({ nativeEvent: { contentOffset: { y: 420 } } });
  RenderTimeline("day-b").rememberOffset({ nativeEvent: { contentOffset: { y: 80 } } });
  RenderTimeline("day-a"); RenderTimeline("day-b");
  assert.deepEqual(offsets, [0, 0, 420, 80]);
});

test("dirty sheet asks before its closing animation; cancelling a swipe leaves the sheet visible", () => {
  let panEnd: ((event: { translationY: number; velocityY: number }) => void) | undefined;
  let approve: (() => void) | undefined;
  let closed = 0;
  const timingTargets: number[] = [];
  const pan = {
    activeOffsetY(_value: unknown) { return this; }, failOffsetX(_value: unknown) { return this; },
    onUpdate(_callback: unknown) { return this; }, onFinalize(_callback: unknown) { return this; },
    onEnd(callback: typeof panEnd) { panEnd = callback; return this; },
  };
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>("src/theme/tokens.ts");
  const load = tripModuleLoader({
    react: { useCallback: (callback: unknown) => callback, useEffect() {}, useRef: (value: unknown) => ({ current: value }) },
    "react-native": { Keyboard: { dismiss() {} }, useWindowDimensions: () => ({ height: 800 }) },
    "react-native-gesture-handler": { Gesture: { Pan: () => pan } },
    "react-native-reanimated": {
      useReducedMotion: () => true, ReduceMotion: { System: "system" }, cancelAnimation() {}, useAnimatedStyle: () => ({}),
      useSharedValue: <T>(initial: T) => { let value = initial; return { get: () => value, set: (next: T) => { value = next; } }; },
      withTiming: (target: number, _options: unknown, finish?: (finished: boolean) => void) => { timingTargets.push(target); finish?.(true); return target; },
    },
    "react-native-worklets": { scheduleOnRN: (callback: () => void) => callback() },
    "@/hooks/use-app-theme": { useAppTheme: () => tokens },
  });
  const { usePickerSheetMotion } = load<typeof import("../src/features/trip/hooks/use-picker-sheet-motion.ts")>("src/features/trip/hooks/use-picker-sheet-motion.ts");
  const sheet = usePickerSheetMotion(() => { closed++; }, (leave) => { approve = leave; });
  sheet.close(); assert.equal(closed, 0); assert.equal(timingTargets.length, 0);
  panEnd?.({ translationY: 100, velocityY: 900 });
  assert.equal(closed, 0); assert.equal(timingTargets.at(-1), 0);
  approve?.(); assert.equal(closed, 1); assert.equal(timingTargets.at(-1), 800);
});
