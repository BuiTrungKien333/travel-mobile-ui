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
    "@/constants/development": { UI_PREVIEW_ENABLED: true },
    "@/features/memories/screens/memories-camera-screen": {
      MemoriesCameraScreen: "MemoriesCamera",
    },
    "@/features/memories/hooks/use-memories": {
      useMemories: () => ({
        trips: store.getState().trips,
        memories: store.getState().memories,
        isPending: false,
        isError: false,
      }),
    },
    "@/features/memories/components/memory-load-state": {
      MemoryLoadState: "MemoryLoadState",
    },
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
  const wrapper = TripCameraScreen({
    tripId: "dalat-ongoing",
    day: store.getState().today,
  });
  assert.equal(typeof wrapper.type, "function");
  const tree = (wrapper.type as (props: unknown) => typeof wrapper)(
    wrapper.props,
  );
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

test("camera releases inactive previews and opens the gallery directly from the press without duplicate pickers", async () => {
  const store = loadHomePreview().createPreviewStore();
  const tokens = load<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  let focused = true;
  let pickerCalls = 0;
  const appState = { currentState: "active" };
  const nativeLoad = tripModuleLoader({
    "@/constants/development": { UI_PREVIEW_ENABLED: false },
    "@/features/auth/services/auth-session": {
      authSession: { getVersion: () => 1 },
    },
    "@/features/memories/hooks/use-memories": {
      useMemoryTrips: () => ({ trips: store.getState().trips }),
      useMemoryActions: () => ({ upload: { isPending: false } }),
    },
    "@/features/auth/hooks/use-auth": {
      useProfile: () => ({
        data: { id: "00000000-0000-0000-0000-000000000001" },
      }),
    },
    react: {
      useState: (initial: unknown) => [
        typeof initial === "function" ? initial() : initial,
        () => {},
      ],
      useRef: (current: unknown) => ({ current }),
      useEffect: () => {},
      useCallback: (callback: unknown) => callback,
    },
    "expo-camera": {
      CameraView: "CameraView",
      useCameraPermissions: () => [{ granted: true }, () => {}, () => {}],
    },
    "expo-image-picker": {
      launchImageLibraryAsync: async () => {
        pickerCalls++;
        return { canceled: true, assets: null };
      },
    },
    "../hooks/use-camera-access": {
      useCameraAccess: () => ({
        permission: { granted: true },
        issue: null,
        requesting: false,
        request: () => {},
      }),
    },
    "@/features/home/services/journal-photo-actions": {
      saveJournalPhoto: async () => {},
    },
    "expo-image": { Image: "Image" },
    "expo-router/react-navigation": {
      useIsFocused: () => focused,
      useNavigation: () => ({ dispatch() {} }),
      usePreventRemove() {},
    },
    "react-native": {
      View: "View",
      ActivityIndicator: "Spinner",
      AppState: appState,
      Platform: { OS: "android" },
      StyleSheet: { absoluteFill: {} },
    },
    "react-native-reanimated": {
      __esModule: true,
      default: { View: "AnimatedView" },
      useSharedValue: () => ({ get: () => 1, set: () => {} }),
      useAnimatedStyle: () => ({}),
      ReduceMotion: { System: "system" },
    },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/features/home/providers/trip-preview-provider": {
      useTripPreview: (
        select: (state: ReturnType<typeof store.getState>) => unknown,
      ) => select(store.getState()),
    },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-text": { AppText: "AppText" },
    "../services/camera-photos": { prepareCameraPhoto: () => {} },
    "./camera-layout": { CameraLayout: "CameraLayout" },
    "./camera-icon-button": { CameraIconButton: "CameraIconButton" },
  });
  const { NativeTripCamera } = nativeLoad<
    typeof import("../src/features/camera/components/native-trip-camera.tsx")
  >("src/features/camera/components/native-trip-camera.tsx");
  function containsCamera(node: unknown): boolean {
    if (Array.isArray(node)) return node.some(containsCamera);
    if (!isValidElement<{ children?: unknown }>(node)) return false;
    return node.type === "CameraView" || containsCamera(node.props.children);
  }
  function renderCamera(suspended = false) {
    return NativeTripCamera({
      title: "Memories",
      count: 0,
      date: "2026-10-21",
      suspended,
      onBack: () => {},
      onHome: () => {},
      onDetails: () => {},
      onJournal: () => {},
    });
  }
  function cameraVisible(suspended = false) {
    return containsCamera(renderCamera(suspended).props.frame);
  }
  assert.equal(cameraVisible(), true);
  focused = false;
  assert.equal(cameraVisible(), false);
  focused = true;
  assert.equal(cameraVisible(true), false);
  appState.currentState = "background";
  assert.equal(cameraVisible(), false);
  appState.currentState = "active";
  const tree = renderCamera();
  tree.props.onLibrary();
  assert.equal(pickerCalls, 1);
  tree.props.onLibrary();
  assert.equal(pickerCalls, 1);
  await new Promise<void>((resolve) => setImmediate(resolve));
  tree.props.onLibrary();
  assert.equal(pickerCalls, 2);
});
