import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidElement, type ReactElement } from "react";
import type { LocalMemory } from "../src/features/memories/schemas/local-memory-schema.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const userId = "10000000-0000-0000-0000-000000000001";
const tripId = "40000000-0000-0000-0000-000000000001";
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

function cameraFixture(quick = false) {
  const states: unknown[] = [];
  const refs: { current: unknown }[] = [];
  let stateCursor = 0;
  let refCursor = 0;
  let deviceFails = false;
  let uploadFails = false;
  let sessionVersion = 1;
  let changeAccountOnExport = false;
  const events: string[] = [];
  let pickerAssets: { uri: string; width: number; height: number }[] = [];
  let pickerOptions: Record<string, unknown> | undefined;
  const records: LocalMemory[] = [];
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const state = {
    panel: null,
    memories: records,
    saveLocalPhoto: async (input: { tripId?: string }) => {
      events.push("save");
      const memory: LocalMemory = {
        id: "local-capture",
        photo: "file:///documents/capture.jpg",
        text: "",
        destination: "Đà Lạt",
        tripId: input.tripId,
        date: "2026-01-01",
        time: "10:00",
        local: {
          userId,
          capturedAt: "2026-01-01T03:00:00Z",
          deviceSaved: false,
        },
      };
      records.push(memory);
      return memory;
    },
    exportLocalPhoto: async (id: string) => {
      const memory = records.find((item) => item.id === id);
      assert.ok(memory);
      if (memory.local.deviceSaved) return;
      events.push("device");
      if (changeAccountOnExport) sessionVersion++;
      if (deviceFails) throw new Error("Device save failed");
      records[0] = { ...memory, local: { ...memory.local, deviceSaved: true } };
    },
  };
  const load = tripModuleLoader({
    "@/constants/development": { UI_PREVIEW_ENABLED: false },
    "@/features/auth/services/auth-session": {
      authSession: { getVersion: () => sessionVersion },
    },
    react: {
      useState: (initial: unknown) => {
        const index = stateCursor++;
        if (!(index in states)) states[index] = initial;
        return [
          states[index],
          (value: unknown) => {
            states[index] = typeof value === "function" ? value(states[index]) : value;
          },
        ];
      },
      useRef: (initial: unknown) => {
        const index = refCursor++;
        return (refs[index] ??= { current: initial });
      },
      useEffect: () => {},
      useCallback: (callback: unknown) => callback,
    },
    "expo-camera": { CameraView: "CameraView" },
    "expo-image": { Image: "Image" },
    "expo-image-picker": {
      launchImageLibraryAsync: async (options: Record<string, unknown>) => {
        pickerOptions = options;
        return { canceled: !pickerAssets.length, assets: pickerAssets };
      },
    },
    "expo-router/react-navigation": {
      useIsFocused: () => true,
      useNavigation: () => ({ dispatch() {} }),
      usePreventRemove() {},
    },
    "react-native": {
      View: "View",
      ActivityIndicator: "Spinner",
      Platform: { OS: "android" },
      AppState: { currentState: "active" },
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
      useTripPreview: (select: (value: typeof state) => unknown) =>
        select(state),
    },
    "@/features/auth/hooks/use-auth": {
      useProfile: () => ({ data: { id: userId } }),
    },
    "@/features/memories/hooks/use-memories": {
      useMemoryTrips: () => ({ trips: [] }),
      useMemoryActions: () => ({
        upload: {
          isPending: false,
          mutateAsync: async ({ memory }: { memory: LocalMemory }) => {
            events.push("upload");
            assert.equal(memory.local.deviceSaved, !deviceFails);
            if (uploadFails) throw new Error("Connection lost");
          },
        },
      }),
    },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-text": { AppText: "AppText" },
    "../hooks/use-camera-access": {
      useCameraAccess: () => ({
        permission: { granted: true },
        issue: null,
        requesting: false,
      }),
    },
    "../services/camera-photos": {
      prepareCameraPhoto: async () => ({ uri: "file:///cache/camera.jpg" }),
    },
    "./camera-layout": { CameraLayout: "CameraLayout" },
    "./photo-import-sheet": { PhotoImportSheet: "PhotoImportSheet" },
    "./camera-icon-button": { CameraIconButton: "CameraIconButton" },
  });
  const { NativeTripCamera } = load<
    typeof import("../src/features/camera/components/native-trip-camera.tsx")
  >("src/features/camera/components/native-trip-camera.tsx");
  function render() {
    stateCursor = 0;
    refCursor = 0;
    return NativeTripCamera({
      quick,
      tripId: quick ? undefined : tripId,
      date: "2026-01-01",
      title: "Camera",
      count: 0,
      onBack: () => {},
      onHome: () => {},
      onDetails: () => {},
      onJournal: () => {},
    });
  }
  type PreviewProps = {
    children?: unknown;
    ref: (camera: { takePictureAsync: () => Promise<{ uri: string }> }) => void;
    onCameraReady: () => void;
  };
  function preview(node: unknown): ReactElement<PreviewProps> | undefined {
    if (Array.isArray(node)) return node.map(preview).find(Boolean);
    if (!isValidElement<PreviewProps>(node)) return;
    return node.type === "CameraView" ? node : preview(node.props.children);
  }
  const camera = preview(render().props.frame);
  assert.ok(camera);
  camera.props.ref({
    takePictureAsync: async () => ({ uri: "file:///cache/camera.jpg" }),
  });
  camera.props.onCameraReady();
  return {
    render,
    preview: () => preview(render().props.frame),
    events,
    records,
    selectPhotos: (count: number) => {
      pickerAssets = Array.from({ length: count }, (_, index) => ({
        uri: `file:///photo-${index}.jpg`,
        width: 1200,
        height: 800,
      }));
    },
    getPickerOptions: () => pickerOptions,
    setDeviceFailure: (value: boolean) => {
      deviceFails = value;
    },
    setUploadFailure: (value: boolean) => {
      uploadFails = value;
    },
    changeAccountOnExport: () => {
      changeAccountOnExport = true;
    },
  };
}

test("the library picker forwards all selected photos to the import flow", async () => {
  const f = cameraFixture(true);
  f.selectPhotos(3);
  f.render().props.onLibrary();
  await flush();
  assert.equal(f.getPickerOptions()?.allowsMultipleSelection, true);
  assert.equal(f.getPickerOptions()?.selectionLimit, 10);
  const overlay = f.render().props.overlay;
  assert.ok(isValidElement<{ sources: unknown[] }>(overlay));
  assert.equal(overlay.props.sources.length, 3);
  assert.equal(f.events.length, 0);
});

test("web picker over the import limit shows an error without silently discarding photos", async () => {
  const f = cameraFixture(true);
  f.selectPhotos(11);
  f.render().props.onLibrary();
  await flush();
  assert.equal(f.render().props.overlay, undefined);
  assert.match(String(f.render().props.error), /10 ảnh/);
});

test("a trip capture saves to the device before its single upload attempt", async () => {
  const f = cameraFixture();
  f.render().props.onCapture();
  await flush();
  assert.deepEqual(f.events, ["save", "device", "upload"]);
  assert.equal(f.records[0].local.deviceSaved, true);
  assert.equal(f.render().props.pending, false);
});

test("flipping cameras changes the facing of one mounted native session", () => {
  const f = cameraFixture();
  const back = f.preview();
  assert.ok(back);
  f.render().props.onFlip();
  const front = f.preview();
  assert.ok(front);
  assert.equal(front.key, back.key, "Android must not unbind a new session through a removed view");
  assert.equal((front.props as { facing?: string }).facing, "front");
  f.render().props.onFlip();
  const rear = f.preview();
  assert.equal((rear?.props as { facing?: string }).facing, "back");
});

test("quick capture without a trip saves on device and never uploads", async () => {
  const f = cameraFixture(true);
  f.render().props.onCapture();
  await flush();
  assert.deepEqual(f.events, ["save", "device"]);
  assert.equal(f.records[0].tripId, undefined);
});

test("changing account while exporting a capture cannot upload it under the new session", async () => {
  const f = cameraFixture();
  f.changeAccountOnExport();
  f.render().props.onCapture();
  await flush();
  assert.deepEqual(f.events, ["save", "device"]);
  assert.equal(f.records.length, 1);
  assert.equal(f.records[0].local.userId, userId);
  assert.equal(f.render().props.pending, true);
});

test("gallery denial keeps the private copy and permits upload without claiming a library copy", async () => {
  const f = cameraFixture();
  f.setDeviceFailure(true);
  f.render().props.onCapture();
  await flush();
  assert.deepEqual(f.events, ["save", "device", "upload"]);
  assert.equal(f.render().props.pending, false);
  assert.equal(f.records[0].local.deviceSaved, false);
  assert.ok(f.render().props.error);
  assert.equal(f.records.length, 1);
});

test("quick capture still succeeds privately when phone library access is denied", async () => {
  const f = cameraFixture(true);
  f.setDeviceFailure(true);
  f.render().props.onCapture();
  await flush();
  assert.deepEqual(f.events, ["save", "device"]);
  assert.equal(f.render().props.pending, false);
  assert.equal(f.render().props.status, "Đã giữ ảnh trong ứng dụng và Xem sau");
  assert.equal(f.records.length, 1);
});

test("a failed upload retains the device copy and retries only after another press", async () => {
  const f = cameraFixture();
  f.setUploadFailure(true);
  f.render().props.onCapture();
  await flush();
  assert.equal(f.records[0].local.deviceSaved, true);
  assert.equal(f.render().props.pending, true);
  f.setUploadFailure(false);
  f.render();
  await flush();
  assert.deepEqual(f.events, ["save", "device", "upload"]);
  f.render().props.onCapture();
  await flush();
  assert.deepEqual(f.events, ["save", "device", "upload", "upload"]);
  assert.equal(f.records.length, 1);
});
