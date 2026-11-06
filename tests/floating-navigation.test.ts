import assert from "node:assert/strict";
import { test } from "node:test";
import * as tokens from "../src/theme/tokens.ts";
import { lightColors } from "../src/theme/colors.ts";
import { floatingNavigationLayout } from "../src/components/common/floating-navigation-layout.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Node = { type: unknown; props: Record<string, unknown> };
const element = (type: unknown, props: Record<string, unknown>): Node => ({
  type,
  props,
});
function nodes(value: unknown, type: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap((v) => nodes(v, type));
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [
    ...(node.type === type ? [node] : []),
    ...nodes(node.props.children, type),
  ];
}
function style(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) return Object.assign({}, ...value.map(style));
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}
function call(node: Node, key: string, ...args: unknown[]) {
  const handler = node.props[key];
  assert.equal(typeof handler, "function");
  return (handler as (...args: unknown[]) => unknown)(...args);
}
const near = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) < 0.001, `${a} != ${b}`);

test("outer tabs spread symmetrically without moving the camera's adjacent tabs", () => {
  const before = floatingNavigationLayout(379.43, {
    ...tokens.layout,
    tabBarOuterTabOffset: 0,
  });
  const after = floatingNavigationLayout(379.43, tokens.layout);
  const offset = tokens.layout.tabBarOuterTabOffset;
  near(after.tabLeft[0], before.tabLeft[0] - offset);
  near(after.tabLeft[3], before.tabLeft[3] + offset);
  near(after.tabLeft[1], before.tabLeft[1]);
  near(after.tabLeft[2], before.tabLeft[2]);
  near(after.cameraLeft, before.cameraLeft);
});

test("small phones, Pixel width and tablet cap keep symmetric non-overlapping 44px targets and camera clearance", () => {
  for (const viewport of [320, 360, 390, 411.43, 430, 768]) {
    const width = Math.min(
      tokens.layout.tabBarMaxWidth,
      viewport - tokens.spacing.lg * 2,
    );
    const g = floatingNavigationLayout(width, tokens.layout);
    assert.ok(g.itemWidth >= 44);
    assert.ok(g.barHeight - tokens.layout.tabBarPadding * 2 >= 44);
    assert.ok(g.tabLeft[0] >= 0);
    assert.ok(
      g.tabLeft[3] + g.itemWidth <= width - tokens.layout.tabBarPadding * 2,
    );
    for (let i = 1; i < 4; i++)
      assert.ok(g.tabLeft[i] >= g.tabLeft[i - 1] + g.itemWidth);
    const centers = g.tabLeft.map(
      (left) => tokens.layout.tabBarPadding + left + g.itemWidth / 2,
    );
    near(centers[0] + centers[3], width);
    near(centers[1] + centers[2], width);
    near(g.cameraLeft + tokens.layout.tabBarCameraSize / 2, width / 2);
    const leftGap =
      width / 2 -
      tokens.layout.tabBarCameraSize / 2 -
      centers[1] -
      g.itemWidth / 2;
    const rightGap =
      centers[2] -
      g.itemWidth / 2 -
      width / 2 -
      tokens.layout.tabBarCameraSize / 2;
    near(leftGap, rightGap);
    assert.ok(leftGap >= 16, `Camera clearance at ${viewport}: ${leftGap}`);
    assert.ok(
      tokens.layout.tabBarPadding + tokens.layout.tabBarCameraSize <=
        tokens.layout.tabBarCameraRise + g.barHeight,
    );
  }
});

function harness(platform: string) {
  let states: unknown[] = [];
  let cursor = 0;
  let selected = 0;
  let prevented = false;
  const events: Record<string, unknown>[] = [];
  const navigations: string[] = [];
  const heights: number[] = [];
  const listeners = new Map<string, () => void>();
  let captures = 0;
  const routes = ["index", "trips", "memories", "profile"].map((name) => ({
    name,
    key: name,
  }));
  const descriptors = Object.fromEntries(
    routes.map(({ key }) => [
      key,
      {
        options: {
          title: key,
          tabBarHideOnKeyboard: true,
          tabBarIcon: (props: unknown) => element("Icon", { value: props }),
        },
      },
    ]),
  );
  const load = tripModuleLoader({
    react: {
      useContext: () => (height: number) => heights.push(height),
      useEffect: (setup: () => unknown) => setup(),
      useState: (initial: unknown) => {
        const i = cursor++;
        if (!(i in states)) states[i] = initial;
        return [
          states[i],
          (value: unknown) => {
            states[i] = value;
          },
        ];
      },
    },
    "react/jsx-runtime": { jsx: element, jsxs: element },
    "expo-router/js-tabs": { BottomTabBarHeightCallbackContext: {} },
    "react-native": {
      View: "View",
      Pressable: "Pressable",
      Platform: { OS: platform },
      StyleSheet: { create: (v: unknown) => v },
      Keyboard: {
        addListener: (event: string, listener: () => void) => {
          listeners.set(event, listener);
          return { remove: () => {} };
        },
      },
    },
    "react-native-reanimated": {
      __esModule: true,
      default: { View: "Animated.View" },
      Easing: { cubic: {}, out: () => ({}) },
      ReduceMotion: { System: "system" },
      useAnimatedStyle: (get: () => unknown) => get(),
      withTiming: (value: unknown) => value,
    },
    "react-native-safe-area-context": {
      useSafeAreaInsets: () => ({
        top: 0,
        bottom: platform === "android" ? 24 : 0,
        left: 0,
        right: 0,
      }),
    },
    "@/hooks/use-app-theme": {
      useAppTheme: () => ({ ...tokens, colors: lightColors }),
    },
    "./navigation-camera-button": { NavigationCameraButton: "Camera" },
    "./notched-navigation-backdrop": { NotchedNavigationBackdrop: "Backdrop" },
  });
  const { FloatingBottomNavigation } = load<{
    FloatingBottomNavigation: (props: Record<string, unknown>) => Node | null;
  }>("src/components/common/floating-bottom-navigation.tsx");
  const render = () => {
    cursor = 0;
    return FloatingBottomNavigation({
      state: { index: selected, routes },
      descriptors,
      navigation: {
        emit: (event: Record<string, unknown>) => {
          events.push(event);
          return { defaultPrevented: prevented };
        },
        navigate: (name: string) => navigations.push(name),
      },
      onCapture: () => {
        captures++;
      },
      captureLabel: "Capture",
      animationEnabled: false,
    });
  };
  return {
    render,
    events,
    navigations,
    heights,
    listeners,
    captures: () => captures,
    select: (index: number) => {
      selected = index;
    },
    prevent: () => {
      prevented = true;
    },
  };
}

test("web and Android use identical measured icon/dot/camera coordinates, while native reserves its safe area", () => {
  const frames: unknown[] = [];
  for (const platform of ["web", "android"]) {
    const h = harness(platform);
    let tree = h.render();
    assert.ok(tree);
    const measurable = nodes(tree, "View").filter(
      (node) => typeof node.props.onLayout === "function",
    );
    call(measurable[1], "onLayout", {
      nativeEvent: { layout: { width: 379.43 } },
    });
    tree = h.render();
    assert.ok(tree);
    const backdrop = nodes(tree, "Backdrop")[0];
    assert.equal(backdrop.props.width, 379.43);
    const tabs = nodes(tree, "Pressable");
    assert.equal(tabs.length, 4);
    const camera = nodes(tree, "Camera")[0];
    assert.equal(camera.props.accessibilityLabel, "Capture");
    call(camera, "onPress");
    assert.equal(h.captures(), 1);
    const geometry = floatingNavigationLayout(379.43, tokens.layout);
    const offsets: number[] = [];
    for (let index = 0; index < 4; index++) {
      h.select(index);
      const selected = h.render();
      const marker = nodes(selected, "Animated.View")[0];
      const transforms = style(marker.props.style).transform as {
        translateX: number;
      }[];
      offsets.push(transforms[0].translateX);
      near(
        offsets[index] + tokens.layout.tabBarActiveDotSize / 2,
        geometry.tabLeft[index] + geometry.itemWidth / 2,
      );
    }
    frames.push(
      JSON.stringify({
        offsets,
        backdrop: backdrop.props,
        tabWidths: tabs.map(
          (tab) =>
            style(
              (tab.props.style as (props: unknown) => unknown)({
                pressed: false,
              }),
            ).width,
        ),
      }),
    );
    const bottom = style(tree.props.style).paddingBottom as number;
    assert.ok(
      bottom >=
        (platform === "android" ? 24 + tokens.spacing.md : tokens.spacing.xl),
    );
    call(tree, "onLayout", { nativeEvent: { layout: { height: 128 } } });
    assert.equal(h.heights.at(-1), 128);
  }
  assert.equal(frames[0], frames[1]);
});

test("tab events, prevented navigation and keyboard hiding keep working after layout changes", () => {
  const h = harness("android");
  let tree = h.render();
  const tabs = nodes(tree, "Pressable");
  call(tabs[0], "onPress");
  assert.equal(h.navigations.length, 0);
  call(tabs[1], "onPress");
  assert.equal(h.navigations[0], "trips");
  h.prevent();
  call(tabs[2], "onPress");
  assert.equal(h.navigations.length, 1);
  call(tabs[3], "onLongPress");
  assert.equal(h.events.at(-1)?.type, "tabLongPress");
  h.listeners.get("keyboardDidShow")?.();
  tree = h.render();
  assert.equal(tree, null);
  assert.equal(h.heights.at(-1), 0);
  h.listeners.get("keyboardDidHide")?.();
  assert.ok(h.render());
});

test("native and web share the same translucent SVG face without decoder-specific shadow filters", () => {
  const load = tripModuleLoader({
    "react/jsx-runtime": { jsx: element, jsxs: element },
    "react-native": {
      View: "View",
      StyleSheet: { create: (v: unknown) => v, absoluteFill: {} },
    },
    "expo-image": { Image: "Image" },
    "@/hooks/use-app-theme": {
      useAppTheme: () => ({ ...tokens, colors: lightColors }),
    },
  });
  const native = load<{
    NotchedNavigationBackdrop: (props: {
      width: number;
      height: number;
    }) => Node;
  }>("src/components/common/notched-navigation-backdrop.tsx");
  const web = load<{
    NotchedNavigationBackdrop: (props: {
      width: number;
      height: number;
    }) => Node;
  }>("src/components/common/notched-navigation-backdrop.web.tsx");
  const props = { width: 379.43, height: 60 };
  const nativeTree = native.NotchedNavigationBackdrop(props);
  const webRoot = web.NotchedNavigationBackdrop(props);
  const webTree = (webRoot.type as (props: unknown) => Node)(webRoot.props);
  const nativeSource = nodes(nativeTree, "Image")[0].props.source as {
    uri: string;
  };
  const webSource = nodes(webTree, "Image")[0].props.source as { uri: string };
  assert.equal(nativeSource.uri, webSource.uri);
  const svg = decodeURIComponent(
    nativeSource.uri.split(",").slice(1).join(","),
  );
  assert.ok(svg.includes('fill-opacity="0.8"'));
  assert.ok(!svg.includes("rgba("));
  assert.ok(!svg.includes("<filter"));
  assert.equal(nodes(webTree, "div").length, 1);
});

test("camera ambient animation only changes the halo, with an explicit gradient and stable ring geometry", () => {
  let phase = 0;
  let captures = 0;
  const load = tripModuleLoader({
    "react/jsx-runtime": { jsx: element, jsxs: element },
    "react-native": {
      View: "View",
      Pressable: "Pressable",
      StyleSheet: { create: (v: unknown) => v, absoluteFill: {} },
    },
    "expo-image": { Image: "Image" },
    "react-native-reanimated": {
      __esModule: true,
      default: { View: "Animated.View" },
      ReduceMotion: { System: "system" },
      useSharedValue: (value: number) => ({ value }),
      useAnimatedStyle: (get: () => unknown) => get(),
      withTiming: (value: number) => value,
    },
    "@/hooks/use-ambient-motion": {
      useAmbientMotion: () => ({ value: phase }),
    },
    "@/hooks/use-app-theme": {
      useAppTheme: () => ({ ...tokens, colors: lightColors }),
    },
    "@/components/ui/app-icon": { AppIcon: "Icon" },
  });
  const { NavigationCameraButton } = load<{
    NavigationCameraButton: (props: {
      onPress: () => void;
      accessibilityLabel: string;
    }) => Node;
  }>("src/components/common/navigation-camera-button.tsx");
  const haloOpacities: unknown[] = [];
  for (phase of [0, 0.125]) {
    const tree = NavigationCameraButton({
      onPress: () => captures++,
      accessibilityLabel: "Capture",
    });
    const transforms = style(tree.props.style).transform as { scale: number }[];
    assert.equal(transforms[0].scale, 1);
    haloOpacities.push(
      style(nodes(tree, "Animated.View")[1].props.style).opacity,
    );
    const button = nodes(tree, "Pressable")[0];
    const outer = style(button.props.style);
    const disk = style(nodes(tree, "View")[0].props.style);
    assert.equal(outer.width, outer.height);
    assert.equal(disk.width, disk.height);
    near(
      (outer.width as number) - (disk.width as number),
      tokens.layout.tabBarCameraRingWidth * 2,
    );
    assert.equal(disk.left, tokens.layout.tabBarCameraRingWidth);
    assert.equal(disk.top, disk.left);
    assert.equal(disk.backgroundColor, lightColors.primary);
    const image = nodes(tree, "Image")[0];
    const source = image.props.source as { uri: string };
    const svg = decodeURIComponent(source.uri.split(",").slice(1).join(","));
    assert.ok(svg.includes('gradientUnits="userSpaceOnUse"'));
    assert.ok(svg.includes(`x2="${disk.width}" y2="${disk.height}"`));
    assert.ok(svg.includes(`stop-color="${lightColors.primary}"`));
    assert.equal(image.props.contentFit, "fill");
    call(button, "onPress");
  }
  assert.notEqual(haloOpacities[0], haloOpacities[1]);
  assert.equal(captures, 2);
});
