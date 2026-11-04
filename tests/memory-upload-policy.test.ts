import assert from "node:assert/strict";
import { test } from "node:test";
import type { Memory } from "../src/features/home/types/home-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type UploadOptions = {
  mutationKey?: string[];
  retry?: boolean;
  networkMode?: string;
  mutationFn: (input: { memory: Memory }) => Promise<unknown>;
};

function MemoryUploadFixture() {
  let online = false;
  let version = 1;
  let exportFails = false;
  let changeAccount = false;
  const calls: string[] = [];
  const options: UploadOptions[] = [];
  const userId = "10000000-0000-0000-0000-000000000001";
  const state = {
    memories: [], persistLocalPhoto: async () => {},
    exportLocalPhoto: async () => {
      calls.push("device");
      if (exportFails) throw new Error("Device save failed");
      if (changeAccount) version++;
    },
  };
  const load = tripModuleLoader({
    "@tanstack/react-query": {
      onlineManager: { isOnline: () => online },
      useQueryClient: () => ({}),
      useMutation: (value: UploadOptions) => { options.push(value); return {}; },
    },
    "@/features/auth/hooks/use-auth": { useProfile: () => ({ data: { id: userId } }) },
    "@/features/auth/services/auth-session": { authSession: { getVersion: () => version } },
    "@/features/home/providers/trip-preview-provider": { useTripPreview: (select: (value: typeof state) => unknown) => select(state) },
    "../api/memory-api": { memoryQueryKeys: { list: () => ["memories"] } },
    "../api/memory-trips-api": {},
    "../services/upload-photo": { uploadLocalMemory: async (memory: Memory) => {
      assert.equal(memory.local?.deviceSaved, true);
      calls.push("upload");
    } },
  });
  const { useMemoryActions } = load<typeof import("../src/features/memories/hooks/use-memories.ts")>("src/features/memories/hooks/use-memories.ts");
  useMemoryActions();
  const upload = options.find((option) => option.mutationKey?.[0] === "memory-upload");
  assert.ok(upload);
  const memory: Memory = {
    id: "local-policy", photo: "file:///documents/photo.jpg", text: "", destination: "Đà Lạt",
    tripId: "40000000-0000-0000-0000-000000000001", date: "2026-01-01", time: "10:00",
    local: { userId, capturedAt: "2026-01-01T03:00:00Z", deviceSaved: false },
  };
  return { upload, memory, calls, setOnline: (value: boolean) => { online = value; }, failExport: () => { exportFails = true; }, changeAccountOnExport: () => { changeAccount = true; } };
}

test("offline upload fails without queuing or retrying when connectivity returns", async () => {
  const f = MemoryUploadFixture();
  assert.equal(f.upload.retry, false);
  assert.equal(f.upload.networkMode, "always");
  await assert.rejects(f.upload.mutationFn({ memory: f.memory }), { code: "NETWORK" });
  assert.deepEqual(f.calls, ["device"]);
  f.setOnline(true);
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.deepEqual(f.calls, ["device"]);
  assert.ok(f.memory.local);
  await f.upload.mutationFn({ memory: { ...f.memory, local: { ...f.memory.local, deviceSaved: true } } });
  assert.deepEqual(f.calls, ["device", "upload"]);
});

test("upload never starts if saving on device fails or the account changes during saving", async () => {
  for (const scenario of ["device", "account"]) {
    const f = MemoryUploadFixture();
    f.setOnline(true);
    if (scenario === "device") f.failExport();
    else f.changeAccountOnExport();
    await assert.rejects(f.upload.mutationFn({ memory: f.memory }));
    assert.deepEqual(f.calls, ["device"]);
  }
});
