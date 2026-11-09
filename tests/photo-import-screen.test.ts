import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidElement, type ReactElement } from "react";
import type { LocalMemory } from "../src/features/memories/schemas/local-memory-schema.ts";
import type { Trip } from "../src/features/home/types/home-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
function find(
  node: unknown,
  type: string,
): ReactElement<Record<string, unknown>> | undefined {
  if (Array.isArray(node))
    return node.map((item) => find(item, type)).find(Boolean);
  if (!isValidElement<{ children?: unknown }>(node)) return;
  return node.type === type ? node : find(node.props.children, type);
}
function fixture(withTrip = true) {
  const slots: unknown[] = [];
  let cursor = 0,
    saves = 0,
    uploads = 0,
    refreshes = 0,
    closes = 0;
  let fail = true;
  const owner = "10000000-0000-4000-8000-000000000001";
  const serverId = "20000000-0000-4000-8000-000000000001";
  const requestId = "30000000-0000-4000-8000-000000000001";
  const trip: Trip = {
    id: "trip",
    status: "planned",
    destination: "Da Lat",
    days: [{ date: "2026-01-01", stops: [] }],
  };
  const state = {
    memories: [] as LocalMemory[],
    saveLocalPhoto: async () => {
      saves++;
      const photo: LocalMemory = {
        id: "local-photo",
        photo: "file:///private/photo.jpg",
        text: "",
        destination: "",
        date: "2026-01-01",
        time: "10:00",
        local: {
          userId: owner,
          capturedAt: "2026-01-01T03:00:00Z",
          deviceSaved: false,
        },
      };
      state.memories = [photo];
      return photo;
    },
  };
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const load = tripModuleLoader({
    react: {
      useState(initial: unknown) {
        const index = cursor++;
        if (!(index in slots))
          slots[index] = typeof initial === "function" ? initial() : initial;
        return [
          slots[index],
          (value: unknown) => {
            slots[index] =
              typeof value === "function" ? value(slots[index]) : value;
          },
        ];
      },
      useRef(initial: unknown) {
        const index = cursor++;
        return (slots[index] ??= { current: initial });
      },
      useEffect() {},
    },
    "react-native": {
      View: "View",
      Modal: "Modal",
      FlatList: "List",
      ActivityIndicator: "Spinner",
      StyleSheet: { hairlineWidth: 1 },
    },
    "expo-image": { Image: "Image" },
    "@/constants/development": { UI_PREVIEW_ENABLED: false },
    "@/components/ui/app-button": { AppButton: "Button" },
    "@/components/ui/app-text": { AppText: "Text" },
    "@/components/common/screen-safe-area": { ScreenSafeArea: "SafeArea" },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/features/auth/hooks/use-auth": {
      useProfile: () => ({ data: { id: owner } }),
    },
    "@/features/auth/services/auth-session": {
      authSession: { getVersion: () => 1 },
    },
    "@/features/home/providers/trip-preview-provider": {
      useTripPreview: (select: (input: typeof state) => unknown) =>
        select(state),
    },
    "@/features/memories/hooks/use-memories": {
      useMemoryActions: () => ({
        refresh: () => {
          refreshes++;
        },
        upload: {
          mutateAsync: async ({
            memory,
            refreshQueries,
          }: {
            memory: LocalMemory;
            refreshQueries: boolean;
          }) => {
            uploads++;
            assert.equal(refreshQueries, false);
            if (fail) {
              state.memories = [
                {
                  ...memory,
                  local: {
                    ...memory.local,
                    serverId,
                    clientRequestId: requestId,
                  },
                },
              ];
              throw new Error("Response lost after server saved metadata");
            }
            assert.equal(memory.local.serverId, serverId);
            assert.equal(memory.local.clientRequestId, requestId);
          },
        },
      }),
    },
    "../services/camera-photos": {
      prepareCameraPhoto: async (
        source: unknown,
        zoom: number,
        square: boolean,
      ) => {
        assert.equal(zoom, 1);
        assert.equal(square, false);
        return source;
      },
    },
    "./camera-icon-button": { CameraIconButton: "IconButton" },
  });
  const { PhotoImportSheet } = load<
    typeof import("../src/features/camera/components/photo-import-sheet.tsx")
  >("src/features/camera/components/photo-import-sheet.tsx");
  function render() {
    cursor = 0;
    return PhotoImportSheet({
      sources: [{ uri: "file:///gallery/photo.jpg", width: 1200, height: 800 }],
      trip: withTrip ? trip : undefined,
      date: "2026-01-01",
      onClose: () => {
        closes++;
      },
    });
  }
  return {
    render,
    state,
    fail: (value: boolean) => {
      fail = value;
    },
    counts: () => ({ saves, uploads, refreshes, closes }),
  };
}

test("the import screen retries from persisted IDs after a lost response, not its stale initial draft", async () => {
  const f = fixture();
  const modal = f.render();
  modal.props.onShow();
  modal.props.onShow();
  await flush();
  assert.equal(f.counts().saves, 1);
  assert.equal(f.counts().uploads, 1);
  const list = find(f.render(), "List");
  assert.ok(list);
  const rows = list.props.data as { state: string }[];
  assert.equal(rows[0].state, "error");
  f.fail(false);
  const retry = find(f.render(), "Button");
  assert.ok(retry);
  (retry.props.onPress as () => void)();
  await flush();
  assert.deepEqual(f.counts(), {
    saves: 1,
    uploads: 2,
    refreshes: 2,
    closes: 0,
  });
  assert.equal(
    (find(f.render(), "List")?.props.data as { state: string }[])[0].state,
    "uploaded",
  );
});

test("the import screen without a trip stores privately and finishes without network or duplicate gallery exports", async () => {
  const f = fixture(false);
  f.render().props.onShow();
  await flush();
  assert.deepEqual(f.counts(), {
    saves: 1,
    uploads: 0,
    refreshes: 0,
    closes: 0,
  });
  assert.equal(
    (find(f.render(), "List")?.props.data as { state: string }[])[0].state,
    "saved",
  );
  const done = find(f.render(), "Button");
  assert.ok(done);
  (done.props.onPress as () => void)();
  assert.equal(f.counts().closes, 1);
});
