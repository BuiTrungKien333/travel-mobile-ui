import assert from "node:assert/strict";
import { test } from "node:test";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { SessionManager } from "../src/features/auth/services/session-manager.ts";
import type { AuthData } from "../src/features/auth/types/auth-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const data = (label: string): AuthData => ({
  accessToken: `${label}.access`,
  refreshToken: `${label}.refresh`,
  tokenType: "Bearer",
  expiresIn: 1800000,
  user: {
    id: "00000000-0000-4000-8000-000000000001",
    email: "fixture@example.com",
    fullName: "Fixture",
    role: "USER",
  },
});
function barrier() {
  let resolve = () => {};
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function setup() {
  const load = tripModuleLoader(
    {
      "expo-constants": { __esModule: true, default: { expoConfig: null } },
      "expo-device": { isDevice: false },
      "react-native": { Platform: { OS: "web" } },
      "@/store/use-locale-store": {
        useLocaleStore: { getState: () => ({ locale: "vi" }) },
      },
    },
    {
      __DEV__: true,
      URL,
      process: { env: { EXPO_PUBLIC_API_URL: "http://localhost:8080" } },
    },
  );
  const { apiClient, configureAuthTransport, resolveApiUrl } = load<
    typeof import("../src/services/api/client.ts")
  >("src/services/api/client.ts");
  const { authApi } = load<
    typeof import("../src/features/auth/api/auth-api.ts")
  >("src/features/auth/api/auth-api.ts");
  const state = {
    clears: 0,
    refreshes: 0,
    language: "",
    publicAuthorization: undefined as unknown,
    stored: null as string | null,
    status: "",
  };
  const session = new SessionManager({
    read: async () => state.stored,
    write: async (token) => {
      state.stored = token;
    },
    remove: async () => {
      state.stored = null;
    },
    requestRefresh: authApi.refresh,
    requestLogout: authApi.logout,
    onStatus: (status) => {
      state.status = status;
    },
    onUser: () => {},
    onClear: () => {
      state.clears++;
    },
  });
  configureAuthTransport(session);
  let protectedStatus = 200;
  let rejectAfterRefresh = false;
  let waitForRefresh: Promise<void> | undefined;
  const refreshStarted = barrier();
  const unauthorized = (
    config: InternalAxiosRequestConfig,
    status: number,
    code: string,
  ) => {
    throw new AxiosError(
      "Fixture error",
      "ERR_BAD_RESPONSE",
      config,
      undefined,
      {
        config,
        status,
        statusText: "Fixture",
        headers: {},
        data: { success: false, code },
      },
    );
  };
  apiClient.defaults.adapter = async (config) => {
    state.language = String(config.headers.get("Accept-Language"));
    if (config.url === "/api/v1/auth/login") {
      state.publicAuthorization = config.headers.get("Authorization");
      return {
        config,
        status: 200,
        statusText: "OK",
        headers: {},
        data: { success: true, data: data("initial") },
      };
    }
    if (config.url === "/api/v1/auth/refresh") {
      state.refreshes++;
      assert.equal(config.headers.get("Authorization"), undefined);
      refreshStarted.resolve();
      await waitForRefresh;
      return {
        config,
        status: 200,
        statusText: "OK",
        headers: {},
        data: { success: true, data: data("rotated") },
      };
    }
    if (config.url === "/api/v1/auth/logout")
      return {
        config,
        status: 204,
        statusText: "No Content",
        headers: {},
        data: "",
      };
    if (protectedStatus === 403) unauthorized(config, 403, "AUTH_007");
    if (
      protectedStatus === 401 &&
      (rejectAfterRefresh ||
        config.headers.get("Authorization") !== "Bearer rotated.access")
    )
      unauthorized(config, 401, "AUTH_001");
    return {
      config,
      status: 200,
      statusText: "OK",
      headers: {},
      data: { success: true, data: { id: "fixture" } },
    };
  };
  return {
    apiClient,
    authApi,
    state,
    session,
    resolveApiUrl,
    refreshStarted,
    setStatus: (status: number) => {
      protectedStatus = status;
    },
    rejectRetried: () => {
      rejectAfterRefresh = true;
    },
    waitRefresh: (promise: Promise<void>) => {
      waitForRefresh = promise;
    },
    login: () =>
      session.authenticate(() =>
        authApi.login({
          email: "fixture@example.com",
          password: "fixture-password",
        }),
      ),
  };
}

test("Real Axios interceptors and Auth API share the session and locale without sending bearer credentials to login", async () => {
  const h = setup();
  await h.login();
  await h.apiClient.get("/api/v1/users/me");
  await h.authApi.login({
    email: "fixture@example.com",
    password: "fixture-password",
  });
  assert.equal(h.state.publicAuthorization, undefined);
  assert.equal(h.state.language, "vi");
  assert.equal(h.state.status, "authenticated");
  assert.equal(h.state.stored, "initial.refresh");
});

test("Concurrent protected 401 responses rotate once through the real transport and retry with the new access token", async () => {
  const h = setup();
  await h.login();
  h.setStatus(401);
  const release = barrier();
  h.waitRefresh(release.promise);
  const pending = Promise.all([
    h.apiClient.get("/api/v1/users/me"),
    h.apiClient.get("/api/v1/trips"),
  ]);
  await h.refreshStarted.promise;
  release.resolve();
  const responses = await pending;
  assert.ok(responses.every((response) => response.status === 200));
  assert.equal(h.state.refreshes, 1);
  assert.equal(h.state.stored, "rotated.refresh");
  assert.equal(h.state.clears, 0);
});

test("A repeated unauthorized response expires credentials instead of starting a refresh loop", async () => {
  const h = setup();
  await h.login();
  h.setStatus(401);
  h.rejectRetried();
  await assert.rejects(h.apiClient.get("/api/v1/users/me"), {
    code: "AUTH_001",
  });
  assert.equal(h.state.refreshes, 1);
  assert.equal(h.state.status, "anonymous");
  assert.equal(h.state.stored, null);
  assert.equal(h.state.clears, 1);
});

test("A deactivated account clears credentials and cache without attempting refresh", async () => {
  const h = setup();
  await h.login();
  h.setStatus(403);
  await assert.rejects(h.apiClient.get("/api/v1/users/me"), {
    code: "AUTH_007",
  });
  assert.equal(h.state.refreshes, 0);
  assert.equal(h.state.stored, null);
  assert.equal(h.state.clears, 1);
});

test("Logout during a refresh cannot restore the old account after the HTTP response arrives", async () => {
  const h = setup();
  await h.login();
  h.setStatus(401);
  const release = barrier();
  h.waitRefresh(release.promise);
  const pending = h.apiClient.get("/api/v1/users/me");
  const rejected = assert.rejects(pending, { code: "CANCELLED" });
  await h.refreshStarted.promise;
  await h.session.logout();
  release.resolve();
  await rejected;
  assert.equal(h.session.getAccessToken(), null);
  assert.equal(h.state.stored, null);
  assert.equal(h.state.status, "anonymous");
});

test("API URL boundary rejects embedded credentials and token-like query or fragment parameters", () => {
  const h = setup();
  for (const value of [
    "http://username:password@localhost:8080",
    "https://example.com?token=fixture",
    "https://example.com#token=fixture",
    "https://example.com/api",
    "javascript:alert(1)",
  ])
    assert.equal(h.resolveApiUrl(value), undefined);
  assert.equal(
    h.resolveApiUrl(" https://api.example.com "),
    "https://api.example.com",
  );
});
