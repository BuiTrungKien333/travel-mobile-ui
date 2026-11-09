import assert from "node:assert/strict";
import { test } from "node:test";
import * as React from "react";
import type { CameraLayoutProps } from "../src/features/camera/components/camera-layout";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { loadHomePreview } from "./helpers/load-home-preview.ts";

function fixture(available = true) {
  const routes: unknown[] = [];
  const store = loadHomePreview().createPreviewStore();
  store.getState().changeScenario("ongoing");
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  let inset: number | undefined;
  const load = tripModuleLoader({
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "../components/memory-load-state": { MemoryLoadState: "MemoryLoadState" },
    react: {
      ...React,
      useContext: () => inset,
      useState: (value: unknown) => [value, () => {}],
    },
    expo: { requireOptionalNativeModule: () => (available ? {} : null) },
    "expo-router": {
      router: {
        push: (route: unknown) => routes.push(structuredClone(route)),
        navigate: (route: unknown) => routes.push(route),
      },
    },
    "expo-router/js-tabs": { BottomTabBarHeightContext: {} },
    "react-native": {
      Platform: { OS: "android" },
      View: "View",
      ActivityIndicator: "Spinner",
    },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-screen-insets": { useScreenInsets: () => ({ bottom: 0 }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/features/camera/components/camera-layout": {
      CameraLayout: "CameraLayout",
    },
    "../components/memory-capture-picker": {
      MemoryCapturePicker: "MemoryCapturePicker",
    },
    "../hooks/use-memories": { useMemories: () => store.getState() },
  });
  const { MemoriesCameraScreen } = load<
    typeof import("../src/features/memories/screens/memories-camera-screen.tsx")
  >("src/features/memories/screens/memories-camera-screen.tsx");
  type CameraProps = CameraLayoutProps & {
    quick?: boolean;
    requestOnOpen?: boolean;
    tripId?: string;
    date: string;
    stopId?: string;
  };
  const trip = store
    .getState()
    .trips.find((trip) => trip.id === "dalat-ongoing");
  assert.ok(trip);
  return {
    store,
    routes,
    trip,
    today: store.getState().today,
    setInset: (height: number) => {
      inset = height;
    },
    render: (params: Parameters<typeof MemoriesCameraScreen>[0]) => {
      const tree = MemoriesCameraScreen(params);
      const content = tree.props.children[0];
      const camera = available ? content.props.children : content;
      assert.ok(React.isValidElement<CameraProps>(camera));
      return camera;
    },
  };
}

test("quick capture retains the dark standalone camera, journal capsule and trip picker", () => {
  const f = fixture();
  const camera = f.render({ quick: true });
  assert.equal(camera.props.title, "Chọn chuyến đi");
  assert.equal(camera.props.subtitle, "Chạm tên phía trên để chọn nơi lưu ảnh");
  assert.equal(camera.props.quick, true);
  assert.equal(camera.props.requestOnOpen, true);
  assert.equal(camera.props.tripId, undefined);
  assert.equal(typeof camera.props.onSelectTrip, "function");
  assert.equal(camera.props.hideJournal, undefined);
  assert.equal(camera.props.journalLabel, "Xem sau");
  assert.equal(camera.props.embeddedBottomInset, undefined);
  assert.equal(camera.props.bottomNavigation, undefined);
  camera.props.onDetails();
  assert.deepEqual(f.routes, ["/tabs/trips"]);
});

test("choosing a trip in quick capture sends photos to the chosen trip and day", () => {
  const f = fixture();
  const camera = f.render({
    quick: true,
    tripId: f.trip.id,
    day: f.today,
    stopId: "",
  });
  assert.equal(camera.props.quick, false);
  assert.equal(camera.props.tripId, f.trip.id);
  assert.equal(camera.props.date, f.today);
  assert.equal(camera.props.stopId, undefined);
  assert.notEqual(camera.props.title, "Chọn chuyến đi");
  assert.equal(camera.props.journalLabel, "Lịch sử");
  camera.props.onJournal();
  assert.deepEqual(f.routes, ["/memories/history"]);
});

test("Saved for later counts only local unassigned photos even when trip metadata is unavailable", () => {
  const f = fixture();
  const local = { capturedAt: "2026-11-07T03:00:00Z", deviceSaved: false };
  f.store.setState({
    memories: [
      {
        id: "local-unassigned",
        photo: "file:///unassigned.jpg",
        text: "",
        destination: "",
        local,
      },
      {
        id: "local-assigned",
        tripId: "trip-not-loaded",
        photo: "file:///assigned.jpg",
        text: "",
        destination: "",
        local,
      },
      {
        id: "remote-unassigned",
        photo: "https://example.com/photo.jpg",
        text: "",
        destination: "",
      },
    ],
  });
  assert.equal(f.render({ quick: true }).props.count, 1);
});

test("selected camera counts only that trip's photos and opens its details", () => {
  const f = fixture();
  f.store.setState({
    memories: [
      {
        id: "selected",
        tripId: f.trip.id,
        photo: "file:///selected.jpg",
        text: "",
        destination: "Đà Lạt",
      },
      {
        id: "other",
        tripId: "another-trip",
        photo: "file:///other.jpg",
        text: "",
        destination: "Huế",
      },
    ],
  });
  const camera = f.render({ quick: true, tripId: f.trip.id, day: f.today });
  assert.equal(camera.props.count, 1);
  camera.props.onDetails();
  assert.deepEqual(f.routes, [
    { pathname: "/trip/[tripId]", params: { tripId: f.trip.id, day: f.today } },
  ]);
});

test("trip camera mode retains its selected trip, history link and existing tab bar inset", () => {
  const f = fixture();
  f.setInset(120);
  const camera = f.render({ tripId: f.trip.id, day: f.today });
  assert.equal(camera.props.tripId, f.trip.id);
  assert.equal(camera.props.quick, undefined);
  assert.equal(camera.props.requestOnOpen, undefined);
  assert.equal(camera.props.hideJournal, undefined);
  assert.equal(camera.props.journalLabel, "Lịch sử");
  assert.equal(camera.props.embeddedBottomInset, 120);
  assert.equal(camera.props.bottomNavigation, undefined);
});

test("older app builds keep the dark camera layout and show a camera update notice", () => {
  const camera = fixture(false).render({ quick: true });
  assert.equal(camera.type, "CameraLayout");
  assert.equal(camera.props.title, "Chọn chuyến đi");
  assert.equal(camera.props.hideJournal, undefined);
  assert.equal(camera.props.bottomNavigation, undefined);
});
