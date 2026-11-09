import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { resolveApiUrl } from "../src/services/api/api-url.ts";

function fixture(saved: string | null = null, development = true) {
  const client = { defaults: { baseURL: "https://original.example" } };
  let value = saved;
  let fail = false;
  const load = tripModuleLoader({
    "expo-secure-store": {
      getItemAsync: async () => value,
      setItemAsync: async (_key: string, next: string) => {
        if (fail) throw new Error("STORAGE");
        value = next;
      },
    },
    "react-native": { Platform: { OS: "android" } },
    "./client": {
      apiClient: client,
      resolveApiUrl: (input: string) => resolveApiUrl(input, { development, platform: "web", isDevice: false }),
    },
  }, { __DEV__: development, process: { env: {} } });
  const service = load<typeof import("../src/services/api/server-connection.ts")>("src/services/api/server-connection.ts");
  return { service, client, failStorage: () => { fail = true; }, get saved() { return value; } };
}

test("demo server preference restores an origin and persists only its normalized URL", async () => {
  const f = fixture("http://192.168.0.10:18081");
  await f.service.restoreServerConnection();
  assert.equal(f.service.getServerOrigin(), "http://192.168.0.10:18081");
  await f.service.saveServerConnection(" http://192.168.0.11:18081/ ");
  assert.equal(f.saved, "http://192.168.0.11:18081");
  assert.equal(f.client.defaults.baseURL, f.saved);
});

test("invalid stored origins and failed writes never replace the active API server", async () => {
  const f = fixture("https://user:secret@other.example");
  await f.service.restoreServerConnection();
  assert.equal(f.service.getServerOrigin(), "https://original.example");
  await assert.rejects(f.service.saveServerConnection("https://other.example/path"));
  f.failStorage();
  await assert.rejects(f.service.saveServerConnection("https://other.example"));
  assert.equal(f.service.getServerOrigin(), "https://original.example");
});

test("a normal production build ignores demo overrides", async () => {
  const f = fixture("https://other.example", false);
  await f.service.restoreServerConnection();
  assert.equal(f.service.canConfigureServer, false);
  assert.equal(f.service.getServerOrigin(), "https://original.example");
  await assert.rejects(f.service.saveServerConnection("https://other.example"));
});
