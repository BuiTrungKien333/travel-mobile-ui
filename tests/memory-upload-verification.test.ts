import assert from "node:assert/strict";
import { test } from "node:test";
import type { LocalMemory } from "../src/features/memories/schemas/local-memory-schema.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

function fixture(finalRead: "fail" | "empty") {
  let draft: LocalMemory = {
    id: "local-verified",
    photo: "data:image/png;base64,AA==",
    text: "",
    destination: "",
    tripId: "trip",
    date: "2026-01-01",
    time: "10:00",
    local: {
      userId: "owner",
      capturedAt: "2026-01-01T03:00:00Z",
      deviceSaved: false,
    },
  };
  let reads = 0;
  let creates = 0;
  let uploads = 0;
  let limits = 0;
  const load = tripModuleLoader(
    {
      "react-native": { Platform: { OS: "web" } },
      "@/utils/create-request-id": { createRequestId: () => "request" },
      "../api/memory-api": {
        memoryApi: {
          limits: async () => {
            limits++;
            return { maxFileBytes: 100, maxDimension: 100, maxPixels: 100 };
          },
          create: async () => {
            creates++;
            return { id: "memory" };
          },
          upload: async () => {
            uploads++;
          },
          detail: async () => {
            reads++;
            if (reads === 2 && finalRead === "fail")
              throw new Error("Response lost");
            return { id: "memory", media: reads > 2 ? [{ id: "photo" }] : [] };
          },
        },
      },
    },
    {
      FormData,
      Blob,
      fetch: async () => ({
        ok: true,
        blob: async () => new Blob(["image"], { type: "image/png" }),
      }),
    },
  );
  const { uploadLocalMemory } = load<
    typeof import("../src/features/memories/services/upload-photo.ts")
  >("src/features/memories/services/upload-photo.ts");
  return {
    upload: () =>
      uploadLocalMemory(
        draft,
        "owner",
        async (value) => {
          draft = value;
        },
        () => {},
      ),
    unassigned: () =>
      uploadLocalMemory(
        { ...draft, tripId: undefined },
        "owner",
        async () => {},
        () => {},
      ),
    get draft() {
      return draft;
    },
    get creates() {
      return creates;
    },
    get uploads() {
      return uploads;
    },
    get limits() {
      return limits;
    },
  };
}

test("a lost final read retains the pending photo and retry verifies without another upload", async () => {
  const f = fixture("fail");
  await assert.rejects(f.upload());
  assert.equal(f.draft.local.serverId, "memory");
  assert.equal(f.draft.local.uploaded, undefined);
  assert.equal(f.draft.photo, "data:image/png;base64,AA==");
  await f.upload();
  assert.equal(f.draft.local.uploaded, true);
  assert.equal(f.creates, 1);
  assert.equal(f.uploads, 1);
});

test("an empty verification response must not hide a local draft as uploaded", async () => {
  const f = fixture("empty");
  await assert.rejects(f.upload(), { code: "INVALID_RESPONSE" });
  assert.equal(f.draft.local.uploaded, undefined);
  assert.equal(f.draft.local.serverId, "memory");
});

test("unassigned photos never reach a media API", async () => {
  const f = fixture("fail");
  await assert.rejects(f.unassigned(), { code: "TRIP_001" });
  assert.equal(f.limits, 0);
  assert.equal(f.creates, 0);
  assert.equal(f.uploads, 0);
});
