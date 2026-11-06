import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

function ProfileFixture() {
  let version = 1;
  let uploads = 0;
  let failSave = false;
  let changeSessionOnUpload = false;
  const saves: unknown[] = [];
  const cached: unknown[] = [];
  const load = tripModuleLoader({
    react: { useRef: (current: unknown) => ({ current }) },
    "@tanstack/react-query": {
      useQueryClient: () => ({ setQueryData: (_key: unknown, user: unknown) => cached.push(user) }),
      useMutation: (options: unknown) => options,
    },
    "@/store/use-auth-store": { useAuthStore() {} },
    "../services/auth-session": { authSession: { getVersion: () => version } },
    "../api/avatar-api": { uploadAvatar: async () => {
      uploads++; if (changeSessionOnUpload) version++; return "https://images.example/avatar.jpg";
    } },
    "../api/auth-api": { authApi: { updateProfile: async (values: unknown) => {
      saves.push(JSON.parse(JSON.stringify(values))); if (failSave) throw new Error("offline"); return values;
    } } },
  });
  const { useUpdateProfile } = load<{ useUpdateProfile(): {
    mutationFn(values: { fullName: string; avatarPhoto?: string }): Promise<unknown>;
    onSuccess(user: unknown): void;
  } }>("src/features/auth/hooks/use-auth.ts");
  const mutation = useUpdateProfile();
  return { mutation, saves, cached, get uploads() { return uploads; },
    failSave(value: boolean) { failSave = value; }, changeSessionOnUpload() { changeSessionOnUpload = true; } };
}

test("profile uploads a photo before saving its remote URL and updating profile cache", async () => {
  const f = ProfileFixture();
  const user = await f.mutation.mutationFn({ fullName: "Lan", avatarPhoto: "file:///avatar.jpg" });
  f.mutation.onSuccess(user);
  assert.equal(f.uploads, 1);
  assert.deepEqual(f.saves, [{ fullName: "Lan", avatarUrl: "https://images.example/avatar.jpg" }]);
  assert.deepEqual(f.cached, [user]);
});

test("retrying a failed profile save reuses the uploaded photo; name-only edits do not upload", async () => {
  const f = ProfileFixture(); f.failSave(true);
  await assert.rejects(f.mutation.mutationFn({ fullName: "Lan", avatarPhoto: "file:///avatar.jpg" }));
  f.failSave(false);
  await f.mutation.mutationFn({ fullName: "Lan", avatarPhoto: "file:///avatar.jpg" });
  await f.mutation.mutationFn({ fullName: "Mai" });
  assert.equal(f.uploads, 1);
  assert.deepEqual(f.saves.at(-1), { fullName: "Mai" });
});

test("a session change during upload prevents saving the old user's avatar", async () => {
  const f = ProfileFixture(); f.changeSessionOnUpload();
  await assert.rejects(f.mutation.mutationFn({ fullName: "Lan", avatarPhoto: "file:///avatar.jpg" }));
  assert.equal(f.saves.length, 0);
  assert.equal(f.cached.length, 0);
});

test("avatar upload sends a native file to the existing media API and rejects a local response URL", async () => {
  const files: unknown[][] = [];
  let url = "https://images.example/avatar.jpg";
  const load = tripModuleLoader({
    "react-native": { Platform: { OS: "android" } },
    "@/services/api/client": { apiClient: { post: async (path: string, _body: unknown, options: { timeout: number }) => {
      assert.equal(path, "/api/v1/media/upload");
      assert.equal(options.timeout, 60000);
      return { data: { success: true, data: { url } } };
    } } },
  }, { FormData: class { append(...args: unknown[]) { files.push(args); } } });
  const { uploadAvatar } = load<typeof import("../src/features/auth/api/avatar-api.ts")>("src/features/auth/api/avatar-api.ts");
  assert.equal(await uploadAvatar("file:///avatar.jpg"), url);
  assert.deepEqual(JSON.parse(JSON.stringify(files)), [["file", {
    uri: "file:///avatar.jpg", name: "avatar.jpg", type: "image/jpeg",
  }]]);
  url = "file:///private/avatar.jpg";
  await assert.rejects(uploadAvatar("file:///avatar.jpg"));
});
