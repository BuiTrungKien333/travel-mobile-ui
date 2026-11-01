import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidElement } from "react";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { loadHomePreview } from "./helpers/load-home-preview.ts";

const load = tripModuleLoader();
const { cameraPhotoCrop } = load<
  typeof import("../src/features/camera/utils/camera-photo-geometry.ts")
>("src/features/camera/utils/camera-photo-geometry.ts");

test("camera digital zoom crops the square shown in the viewfinder for portrait and landscape photos", () => {
  const full = cameraPhotoCrop(4000, 3000);
  assert.equal(full.originX, 500);
  assert.equal(full.originY, 0);
  assert.equal(full.width, 3000);
  const zoom = cameraPhotoCrop(4000, 3000, 2);
  assert.equal(zoom.originX, 1250);
  assert.equal(zoom.originY, 750);
  assert.equal(zoom.width, 1500);
  for (const [width, height] of [
    [4031, 3023],
    [3023, 4031],
    [1, 1],
  ]) {
    for (const factor of [1, 2, 3]) {
      const crop = cameraPhotoCrop(width, height, factor);
      assert.equal(crop.width, crop.height);
      assert.ok(crop.width >= 1 && crop.originX >= 0 && crop.originY >= 0);
      assert.ok(
        crop.originX + crop.width <= width &&
          crop.originY + crop.height <= height,
      );
    }
  }
  for (const value of [0, -1, NaN, Infinity])
    assert.throws(() => cameraPhotoCrop(value, 100));
  assert.throws(() => cameraPhotoCrop(100, 100, 4));
});

test("captured and imported photos join the correct trip journal, with a bounded session and no automatic check-in", () => {
  const store = loadHomePreview().createPreviewStore();
  store.getState().changeScenario("ongoing");
  const state = store.getState();
  const input = {
    tripId: "dalat-ongoing",
    date: state.today,
    uri: "file:///cache/selected.jpg",
    time: "10:45",
    stopId: "square",
  };
  const originalVisits = state.visited;
  const saved = state.saveCapturedMoment(input);
  assert.ok(saved);
  assert.equal(saved.photo, input.uri);
  assert.equal(saved.tripId, input.tripId);
  assert.equal(saved.date, input.date);
  assert.equal(saved.place?.vi, "Quảng trường Lâm Viên");
  assert.equal(store.getState().visited, originalVisits);
  assert.equal(store.getState().memories[0].id, saved.id);
  for (const change of [
    { tripId: "missing" },
    { date: "2020-01-01" },
    { uri: "javascript:alert(1)" },
    { time: "25:60" },
  ])
    assert.equal(state.saveCapturedMoment({ ...input, ...change }), null);
  while (store.getState().memories.length < 20)
    assert.ok(state.saveCapturedMoment(input));
  assert.equal(state.saveCapturedMoment(input), null);
  assert.equal(
    new Set(store.getState().memories.map((entry) => entry.id)).size,
    20,
  );
});

test("old development builds show a camera module notice before importing native camera code", () => {
  const navigation: unknown[] = [];
  const store = loadHomePreview().createPreviewStore();
  store.getState().changeScenario("ongoing");
  const tokens = load<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const moduleLoad = tripModuleLoader({
    expo: { requireOptionalNativeModule: () => null },
    "expo-router": {
      router: {
        canGoBack: () => true,
        back: () => {},
        dismissTo: (route: unknown) => navigation.push(route),
      },
    },
    "react-native": { Platform: { OS: "android" }, View: "View" },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/features/home/providers/trip-preview-provider": {
      useTripPreview: (
        select: (state: ReturnType<typeof store.getState>) => unknown,
      ) => select(store.getState()),
    },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/common/screen-safe-area": {
      ScreenSafeArea: "ScreenSafeArea",
    },
    "../components/camera-layout": { CameraLayout: "CameraLayout" },
    "../components/native-trip-camera": new Proxy(
      {},
      {
        get: () => {
          throw new Error("Native camera evaluated too early");
        },
      },
    ),
  });
  const { TripCameraScreen } = moduleLoad<
    typeof import("../src/features/camera/screens/trip-camera-screen.tsx")
  >("src/features/camera/screens/trip-camera-screen.tsx");
  const tree = TripCameraScreen({
    tripId: "dalat-ongoing",
    day: store.getState().today,
  });
  assert.ok(
    isValidElement<{
      title: string;
      count: number;
      onDetails: () => void;
      onHome: () => void;
    }>(tree),
  );
  assert.equal(tree.type, "CameraLayout");
  assert.ok(tree.props.title.includes("Đà Lạt"));
  assert.equal(
    tree.props.count,
    store
      .getState()
      .memories.filter(
        (entry) => entry.tripId === "dalat-ongoing" && !!entry.photo,
      ).length,
  );
  tree.props.onDetails();
  assert.equal(
    (navigation[0] as { params: { tripId: string } }).params.tripId,
    "dalat-ongoing",
  );
  tree.props.onHome();
  assert.equal(navigation[1], "/tabs");
});
