import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

function fixture() {
  const values = new Map<string, string>();
  const calls: string[] = [];
  let fail = false;
  const slot = (options?: { keychainService?: string }) => options?.keychainService ?? "legacy";
  const load = tripModuleLoader({ "expo-secure-store": {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
    getItemAsync: async (_key: string, options?: { keychainService?: string }) => values.get(slot(options)) ?? null,
    setItemAsync: async (_key: string, token: string, options?: { keychainService?: string }) => {
      if (fail) throw { code: "ERR_ENCRYPT", message: "private token" };
      calls.push(slot(options)); values.set(slot(options), token);
    },
    deleteItemAsync: async (_key: string, options?: { keychainService?: string }) => { values.delete(slot(options)); },
  }});
  const module = load<typeof import("../src/features/auth/services/native-credentials.ts")>("src/features/auth/services/native-credentials.ts");
  return { ...module, values, calls, fail: () => { fail = true; } };
}

test("native credentials migrate legacy encrypted sessions to the dedicated keychain", async () => {
  const f = fixture();
  f.values.set("legacy", "old");
  assert.equal(await f.nativeCredentials.read(), "old");
  await f.nativeCredentials.write("rotated");
  assert.deepEqual(f.calls, ["wego.auth.session"]);
  assert.equal(f.values.has("legacy"), false);
  assert.equal(await f.nativeCredentials.read(), "rotated");
  await f.nativeCredentials.remove();
  assert.equal(await f.nativeCredentials.read(), null);
});

test("native write failures remain errors and expose only a safe diagnostic code", async () => {
  const f = fixture(); f.fail();
  await assert.rejects(f.nativeCredentials.write("private token"), (error: unknown) => {
    assert.ok(error instanceof f.CredentialStorageError);
    assert.equal(error.code, "STORAGE");
    assert.equal(error.diagnostic, "SECURE_WRITE_ERR_ENCRYPT");
    assert.equal(error.message.includes("private"), false);
    return true;
  });
  assert.equal(f.values.size, 0);
});
