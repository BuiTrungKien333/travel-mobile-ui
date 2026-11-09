import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { once } from "node:events";
import type { Server } from "node:http";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import type { LocalMemory } from "../src/features/memories/schemas/local-memory-schema.ts";
import type { ServerMemory } from "../src/features/memories/api/memory-api.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const userId = "10000000-0000-0000-0000-000000000001";
const tripId = "40000000-0000-0000-0000-000000000001";
const placeId = "50000000-0000-0000-0000-000000000001";
const png =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j90sAAAAASUVORK5CYII=";

test("mobile memory HTTP flow matches the backend contract and safely retries partial saves", async (t) => {
  let server: Server | undefined;
  let baseURL = process.env.MEMORY_SIMULATION_URL;
  if (!baseURL) {
    const records = new Map<string, unknown>();
    const module = { exports: {} };
    runInNewContext(
      readFileSync(
        new URL("../postman/mocks/memory-backend/default.js", import.meta.url),
        "utf8",
      ),
      {
        require: createRequire(import.meta.url),
        module,
        Buffer,
        URL,
        process: { env: { PORT: "0" } },
        pm: {
          state: {
            get: async (key: string) => records.get(key),
            set: async (key: string, value: unknown) => records.set(key, value),
          },
        },
      },
    );
    server = module.exports as Server;
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address === "object");
    baseURL = `http://127.0.0.1:${address.port}`;
    t.after(
      () =>
        new Promise<void>((resolve, reject) =>
          server?.close((error) => (error ? reject(error) : resolve())),
        ),
    );
  }
  const load = tripModuleLoader(
    {
      "react-native": { Platform: { OS: "web" } },
      "expo-constants": { __esModule: true, default: { expoConfig: null } },
      "expo-device": { isDevice: true },
      "@/store/use-locale-store": {
        useLocaleStore: { getState: () => ({ locale: "vi" }) },
      },
    },
    {
      process: { env: { EXPO_PUBLIC_API_URL: new URL(baseURL).origin } },
      __DEV__: true,
      URL,
      fetch,
      FormData,
      Blob,
      AbortController,
    },
  );
  const { configureAuthTransport, apiClient } = load<
    typeof import("../src/services/api/client.ts")
  >("src/services/api/client.ts");
  // Postman's path routing adds a routeKey; production API configuration remains origin-only.
  apiClient.defaults.baseURL = baseURL;
  configureAuthTransport({
    getAccessToken: () => "contract-test",
    getVersion: () => 1,
    refresh: async () => {},
    expire: async () => {},
  });
  const { memoryApi } = load<
    typeof import("../src/features/memories/api/memory-api.ts")
  >("src/features/memories/api/memory-api.ts");
  const { loadMemoryTrips } = load<
    typeof import("../src/features/memories/api/memory-trips-api.ts")
  >("src/features/memories/api/memory-trips-api.ts");
  const { tripApi } = load<
    typeof import("../src/features/trip/api/trip-api.ts")
  >("src/features/trip/api/trip-api.ts");
  const { uploadLocalMemory, photoFormData } = load<
    typeof import("../src/features/memories/services/upload-photo.ts")
  >("src/features/memories/services/upload-photo.ts");
  const { mergeMemories } = load<
    typeof import("../src/features/memories/utils/server-memories.ts")
  >("src/features/memories/utils/server-memories.ts");
  async function control(mode = "ok", reset = false) {
    const response = await fetch(
      `${baseURL}/__control?mode=${mode}${reset ? "&reset=1" : ""}`,
      { method: "POST" },
    );
    assert.equal(response.status, 200);
  }
  async function state(): Promise<{
    creates: number;
    uploads: number;
    keys: string[];
    multipart: boolean;
  }> {
    return (await fetch(`${baseURL}/__state`)).json();
  }
  const draft = (): LocalMemory => ({
    id: "local-contract",
    photo: png,
    destination: "Đà Lạt",
    text: "Khoảnh khắc",
    tripId,
    date: "2026-01-01",
    time: "10:00",
    local: {
      userId,
      capturedAt: "2026-01-01T03:00:00.000Z",
      deviceSaved: false,
      width: 1,
      height: 1,
      placeId,
    },
  });

  await t.test(
    "trip creation uses the current backend fields and reads the returned trip ID",
    async () => {
      const created = await tripApi.create({
        clientRequestId: "90000000-0000-4000-8000-000000000001",
        title: "Đà Lạt",
        destination: { name: "Đà Lạt", provinceId: null },
        startDate: "2026-01-01",
        endDate: "2026-01-02",
        timeZone: "Asia/Ho_Chi_Minh",
        initialPlaceIds: [],
        budget: { amount: 1000000, currency: "VND" },
        preferences: ["nature"],
      });
      assert.equal(created.trip.id, tripId);
    },
  );

  await t.test(
    "trip selection uses real Place IDs, and HTTP multipart upload reloads the saved memory",
    async () => {
      await control("ok", true);
      const trips = await loadMemoryTrips();
      assert.equal(trips[0].title, "A real trip");
      assert.equal(trips[0].destination, "Đà Lạt");
      assert.equal(trips[0].status, "completed");
      assert.equal(trips[0].days.length, 2);
      assert.equal(trips[0].days[0].stops[0].placeId, placeId);
      assert.equal(
        trips[0].days[0].stops[0].id,
        "60000000-0000-0000-0000-000000000001",
      );
      let stored = draft();
      const saved = await uploadLocalMemory(
        stored,
        userId,
        async (value) => {
          stored = value;
        },
        () => {},
      );
      assert.equal(saved.tripId, tripId);
      assert.equal(saved.media.length, 1);
      assert.equal(stored.local.uploaded, true);
      const observed = await state();
      assert.equal(observed.creates, 1);
      assert.equal(observed.uploads, 1);
      assert.equal(observed.multipart, true);
      const list = await memoryApi.list();
      assert.equal(list.length, 1);
      const merged = mergeMemories(list, [stored], trips, userId);
      assert.equal(merged.length, 1);
      assert.equal(merged[0].place?.vi, "Lâm Viên");
      assert.equal(merged[0].remote?.memoryId, saved.id);
    },
  );

  for (const mode of [
    "upload-failed",
    "create-response-lost",
    "upload-response-lost",
  ]) {
    await t.test(
      `${mode}: retain the original and retry without a second memory or photo`,
      async () => {
        await control(mode, true);
        let stored = draft();
        const persist = async (value: LocalMemory) => {
          stored = value;
        };
        await assert.rejects(
          uploadLocalMemory(stored, userId, persist, () => {}),
        );
        assert.equal(stored.photo, png);
        assert.equal(stored.local.uploaded, undefined);
        assert.ok(stored.local.clientRequestId);
        await control();
        const saved = await uploadLocalMemory(
          stored,
          userId,
          persist,
          () => {},
        );
        assert.equal(saved.media.length, 1);
        const observed = await state();
        assert.equal(observed.creates, 1);
        assert.equal(new Set(observed.keys).size, 1);
      },
    );
  }
  await t.test(
    "optimistic note versions and invalid response boundaries are enforced",
    async () => {
      const [memory] = await memoryApi.list();
      const updated = await memoryApi.updateNote(
        memory.id,
        memory.version,
        "x".repeat(2000),
      );
      assert.equal(updated.note?.length, 2000);
      await assert.rejects(
        memoryApi.updateNote(memory.id, memory.version, "stale"),
        { code: "MEMORY_003", status: 409 },
      );
      await control("malformed");
      await assert.rejects(memoryApi.detail(memory.id), {
        code: "INVALID_RESPONSE",
      });
    },
  );
  await t.test(
    "oversized files, invalid image formats and changed accounts cannot create memories",
    async () => {
      await control("ok", true);
      const limits = await memoryApi.limits();
      await assert.rejects(
        photoFormData(
          { ...draft(), photo: "data:image/svg+xml,<svg/>" },
          limits,
        ),
        { code: "UPLOAD_003" },
      );
      await assert.rejects(
        photoFormData(draft(), { ...limits, maxFileBytes: 1 }),
        { code: "UPLOAD_002" },
      );
      await assert.rejects(
        photoFormData(
          { ...draft(), local: { ...draft().local, width: 20000 } },
          limits,
        ),
        { code: "UPLOAD_008" },
      );
      await assert.rejects(
        uploadLocalMemory(
          { ...draft(), date: "2099-01-01" },
          userId,
          async () => {},
          () => {},
        ),
        { code: "MEMORY_FUTURE_DATE" },
      );
      await assert.rejects(
        uploadLocalMemory(
          draft(),
          "90000000-0000-0000-0000-000000000001",
          async () => {},
          () => {},
        ),
        { code: "CANCELLED" },
      );
      let active = true;
      await assert.rejects(
        uploadLocalMemory(
          draft(),
          userId,
          async () => {
            active = false;
          },
          () => {
            if (!active) throw new Error("Session changed");
          },
        ),
      );
      assert.equal((await state()).creates, 0);
    },
  );
  await t.test(
    "concurrent upload actions share one create/upload operation",
    async () => {
      await control("ok", true);
      let stored = draft();
      const save = async (value: LocalMemory) => {
        stored = value;
      };
      const [first, second] = await Promise.all([
        uploadLocalMemory(stored, userId, save, () => {}),
        uploadLocalMemory(stored, userId, save, () => {}),
      ]);
      assert.equal(first.id, second.id);
      assert.equal((await state()).creates, 1);
      assert.equal((await state()).uploads, 1);
    },
  );
  await t.test(
    "media is visible, local drafts stay isolated, and uploaded backups never resurrect deleted photos",
    () => {
      const remote: ServerMemory = {
        id: "20000000-0000-0000-0000-000000000001",
        version: 2,
        userId,
        tripId: null,
        placeId: null,
        experiencedAt: "2026-01-01T03:00:00Z",
        note: "Shared note",
        mediaCount: 2,
        coverImageUrl: null,
        media: [1, 2].map((number) => ({
          id: `30000000-0000-0000-0000-00000000000${number}`,
          url: `https://example.com/${number}.png`,
          displayOrder: 3 - number,
          mimeType: "image/png",
          width: 1,
          height: 1,
        })),
      };
      const photos = mergeMemories(
        [remote],
        [draft()],
        [],
        "90000000-0000-0000-0000-000000000001",
      );
      assert.equal(photos.length, 2);
      assert.ok(photos[0].id.endsWith("2"));
      assert.ok(photos.every((photo) => photo.text === remote.note));
      assert.equal(
        mergeMemories(
          [],
          [{ ...draft(), local: { ...draft().local, uploaded: true } }],
          [],
          userId,
        ).length,
        0,
      );
    },
  );
});

test("native multipart descriptors preserve PNG MIME instead of declaring every file as JPEG", async () => {
  class NativeForm {
    parts = new Map<string, unknown[]>();
    append(name: string, value: unknown) {
      this.parts.set(name, [...(this.parts.get(name) ?? []), value]);
    }
    getAll(name: string) {
      return this.parts.get(name) ?? [];
    }
  }
  const load = tripModuleLoader(
    {
      "react-native": { Platform: { OS: "android" } },
      "@/services/api/client": { apiClient: {} },
      "expo-file-system": {
        File: class {
          uri: string;
          exists = true;
          size = 100;
          constructor(uri: string) {
            this.uri = uri;
          }
        },
      },
    },
    { FormData: NativeForm },
  );
  const { photoFormData } = load<
    typeof import("../src/features/memories/services/upload-photo.ts")
  >("src/features/memories/services/upload-photo.ts");
  const memory: LocalMemory = {
    id: "local-png",
    photo: "file:///photo.jpg",
    destination: "",
    text: "",
    date: "2026-01-01",
    time: "10:00",
    local: {
      capturedAt: "2026-01-01T03:00:00Z",
      deviceSaved: false,
      mimeType: "image/png",
    },
  };
  const limits = { maxFileBytes: 1000, maxPixels: 1000, maxDimension: 1000 };
  const body = await photoFormData(memory, limits);
  const [part] = body.getAll("file");
  assert.equal(typeof part, "object");
  assert.equal((part as { type: string }).type, "image/png");
  assert.equal((part as { name: string }).name, "local-png.png");
  assert.equal((part as { uri: string }).uri, memory.photo);
  await assert.rejects(
    photoFormData(
      { ...memory, local: { ...memory.local, mimeType: "image/heic" } },
      limits,
    ),
    { code: "UPLOAD_003" },
  );
});
