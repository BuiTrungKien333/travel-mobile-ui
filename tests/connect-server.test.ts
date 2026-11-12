import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { resolveApiUrl } from "../src/services/api/api-url.ts";

type Failure = "network" | "timeout" | "json" | "body-timeout" | "down" | "status" | "session" | "preference";
function fixture(failure?: Failure) {
  const events: string[] = [];
  let alarm = () => {};
  let timeoutCleared = false;
  let request: { url: string; options: RequestInit } | undefined;
  const load = tripModuleLoader({
    "@/services/api/client": { resolveApiUrl: (value: string) => resolveApiUrl(value, {
      development: false, platform: "android", isDevice: true, allowLanHttp: true,
    }) },
    "@/services/api/server-connection": { saveServerConnection: async (origin: string) => {
      events.push(`save:${origin}`);
      if (failure === "preference") throw new Error("native private storage details");
    } },
    "./auth-session": { authSession: { expire: async () => {
      assert.equal(timeoutCleared, true, "network timer must not cover native storage");
      events.push("session");
      if (failure === "session") throw new Error("private credential details");
    } } },
  }, {
    AbortController,
    setTimeout: (callback: () => void) => { alarm = callback; return 1; },
    clearTimeout: () => { timeoutCleared = true; },
    fetch: async (url: string, options: RequestInit) => {
      request = { url, options }; events.push("probe");
      if (failure === "timeout") { alarm(); throw new Error("Aborted"); }
      if (failure === "network") throw new Error("native socket details");
      return { ok: failure !== "status", status: failure === "status" ? 401 : 200,
        json: async () => {
          if (failure === "body-timeout") { alarm(); throw new Error("Aborted"); }
          if (failure === "json") throw new Error("<html>private proxy page</html>");
          return { status: failure === "down" ? "DOWN" : "UP" };
        } };
    },
  });
  const { connectServer } = load<typeof import("../src/features/auth/services/connect-server.ts")>("src/features/auth/services/connect-server.ts");
  return { events, connectServer, get request() { return request; } };
}

test("connect probes anonymously, then clears credentials before persisting the normalized origin", async () => {
  const f = fixture();
  assert.equal(await f.connectServer(" http://192.168.1.8:18081/ "), "http://192.168.1.8:18081");
  assert.deepEqual(f.events, ["probe", "session", "save:http://192.168.1.8:18081"]);
  assert.equal(f.request?.url, "http://192.168.1.8:18081/actuator/health");
  assert.equal(f.request?.options.cache, "no-store");
  assert.deepEqual(Object.keys(f.request?.options.headers ?? {}), ["Accept"]);
});

for (const [failure, expected] of [
  ["network", "NETWORK"], ["timeout", "TIMEOUT"], ["json", "RESPONSE"],
  ["body-timeout", "TIMEOUT"], ["down", "HEALTH"], ["status", "HEALTH"],
  ["session", "SESSION"], ["preference", "PREFERENCE"],
] as const) {
  test(`connect reports ${expected} for ${failure} without leaking native details`, async () => {
    const f = fixture(failure);
    await assert.rejects(f.connectServer("http://192.168.1.8:18081"), (error: unknown) => {
      assert.ok(error && typeof error === "object" && "code" in error && "message" in error);
      assert.equal(error.code, expected);
      assert.equal(error.message, `CONNECT_${expected}`);
      return true;
    });
    if (failure !== "preference") assert.equal(f.events.some((event) => event.startsWith("save:")), false);
    if (!["session", "preference"].includes(failure)) assert.deepEqual(f.events, ["probe"]);
  });
}

test("invalid candidate URLs do not probe or expire the current session", async () => {
  const f = fixture();
  await assert.rejects(f.connectServer("https://user:secret@example.com"), { code: "INVALID_URL" });
  assert.equal(f.events.length, 0);
});
