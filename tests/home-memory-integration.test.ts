import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { loadHomePreview } from "./helpers/load-home-preview.ts";

test("API camera navigation opens quick capture without promoting preview trips", () => {
  const routes: unknown[] = [];
  const state = loadHomePreview().createPreviewStore().getState();
  const load = tripModuleLoader({
    "@/constants/development": { UI_PREVIEW_ENABLED: false },
    "expo-router": { router: { push: (route: unknown) => routes.push(route) } },
    "../providers/trip-preview-provider": {
      useTripPreview: (select: (value: typeof state) => unknown) =>
        select(state),
    },
  });
  const { useNavigationCapture } = load<
    typeof import("../src/features/home/hooks/use-navigation-capture.ts")
  >("src/features/home/hooks/use-navigation-capture.ts");
  useNavigationCapture()();
  assert.deepEqual(routes, ["/memories/quick-capture"]);
});

test("explicit UI preview keeps the current trip capture panel", () => {
  const store = loadHomePreview().createPreviewStore();
  store.getState().changeScenario("ongoing");
  const load = tripModuleLoader({
    "@/constants/development": { UI_PREVIEW_ENABLED: true },
    "expo-router": {
      router: {
        push: () => assert.fail("Preview must not use the API camera"),
      },
    },
    "../providers/trip-preview-provider": {
      useTripPreview: (
        select: (value: ReturnType<typeof store.getState>) => unknown,
      ) => select(store.getState()),
    },
  });
  const { useNavigationCapture } = load<
    typeof import("../src/features/home/hooks/use-navigation-capture.ts")
  >("src/features/home/hooks/use-navigation-capture.ts");
  useNavigationCapture()();
  assert.equal(store.getState().panel?.kind, "camera");
});
