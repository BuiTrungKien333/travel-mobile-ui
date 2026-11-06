import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

function PhotoMotionFixture(blocked = false) {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  const enabled: boolean[] = []; const finishes: ((finished: boolean) => void)[] = [];
  const pages: number[] = []; let closes = 0;
  function gesture(kind: string) {
    const chain: object = new Proxy({}, { get: (_target, method) => (...args: unknown[]) => {
      if (typeof args[0] === "function") handlers.set(`${kind}.${String(method)}`, args[0] as (...args: unknown[]) => void);
      if (method === "enabled") enabled.push(args[0] === true);
      return chain;
    } });
    return chain;
  }
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>("src/theme/tokens.ts");
  const load = tripModuleLoader({
    react: { useEffect() {}, useRef: (current: unknown) => ({ current }) },
    "react-native-gesture-handler": { Gesture: { Pan: () => gesture("pan"), Pinch: () => gesture("pinch"), Tap: () => gesture("tap"),
      Race: () => ({}), Exclusive: () => ({}), Simultaneous: () => ({}) } },
    "react-native-worklets": { scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) => callback(...args) },
    "react-native-reanimated": { ReduceMotion: { System: "system" }, useSharedValue: (initial: unknown) => {
      let value = initial; return { get: () => value, set: (next: unknown) => { value = next; } };
    },
      useAnimatedStyle: (style: () => unknown) => style, cancelAnimation() {},
      withSpring: (value: number, options: { reduceMotion: string }, finish?: (finished: boolean) => void) => {
        assert.equal(options.reduceMotion, "system"); if (finish) finishes.push(finish); return value;
      }, withTiming: (value: number) => value },
    "@/hooks/use-app-theme": { useAppTheme: () => tokens },
  });
  const { usePhotoViewerMotion } = load<typeof import("../src/features/home/hooks/use-photo-viewer-motion.ts")>("src/features/home/hooks/use-photo-viewer-motion.ts");
  const motion = usePhotoViewerMotion({ origin: { x: 10, y: 100, width: 100, height: 100 }, size: { width: 1200, height: 800 },
    viewport: { width: 390, height: 844 }, blocked, controlsVisible: true, onDismiss: () => { closes++; },
    onToggleControls() {}, pageIndex: 0, pageCount: 6, onPageChange: (page) => pages.push(page) });
  function send(name: string, ...args: unknown[]) { const handler = handlers.get(name); assert.ok(handler, name); handler(...args); }
  motion.open();
  return { motion, send, finishes, pages, enabled, get closes() { return closes; } };
}

test("pinch then pan moves the zoomed photo without dismissing it; Back can recover a cancelled close", () => {
  const f = PhotoMotionFixture();
  f.send("pinch.onStart", { focalX: 195, focalY: 422 });
  f.send("pinch.onUpdate", { focalX: 195, focalY: 422, scale: 2 }); f.send("pinch.onFinalize");
  f.send("pan.onStart"); f.send("pan.onUpdate", { translationX: 80, translationY: 500 });
  f.send("pan.onEnd", { velocityX: 0, velocityY: 1000 }); f.send("pan.onFinalize", {}, true);
  assert.equal(f.finishes.length, 0); assert.equal(f.closes, 0);
  f.motion.close(); f.motion.close(); assert.equal(f.finishes.length, 1);
  f.finishes[0](false); f.motion.close(); f.finishes[0](true); assert.equal(f.closes, 0);
  f.finishes[1](true); assert.equal(f.closes, 1);
});

test("cancelled paging does not change the photo; a vertical dismiss completes once", () => {
  const f = PhotoMotionFixture();
  f.send("pan.onStart"); f.send("pan.onUpdate", { translationX: -100, translationY: 0 });
  f.send("pan.onFinalize", {}, false); assert.deepEqual(f.pages, []);
  f.send("pan.onStart"); f.send("pan.onUpdate", { translationX: 0, translationY: 200 });
  f.send("pan.onEnd", { velocityX: 0, velocityY: 1000 }); f.send("pan.onFinalize", {}, true);
  f.finishes[0](true); f.finishes[0](true); assert.equal(f.closes, 1);
});

test("info/confirmation/action overlays disable image gestures while Back remains available", () => {
  const f = PhotoMotionFixture(true);
  assert.ok(f.enabled.length >= 4); assert.ok(f.enabled.every((value) => !value));
  f.motion.close(); f.finishes[0](true); assert.equal(f.closes, 1);
});
