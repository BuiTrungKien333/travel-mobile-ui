import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const { resolveApiUrl } = tripModuleLoader(
  {},
  { URL },
)<typeof import("../src/services/api/api-url.ts")>(
  "src/services/api/api-url.ts",
);
const dev = { development: true, platform: "web", isDevice: true };

test("one development URL reaches web, Android emulator, iOS simulator and a LAN phone", () => {
  const configured = "http://localhost:8080";
  assert.equal(resolveApiUrl(configured, dev), configured);
  assert.equal(
    resolveApiUrl(configured, { ...dev, platform: "android", isDevice: false }),
    "http://10.0.2.2:8080",
  );
  assert.equal(
    resolveApiUrl(configured, { ...dev, platform: "ios", isDevice: false }),
    configured,
  );
  for (const platform of ["android", "ios"]) {
    assert.equal(
      resolveApiUrl(configured, {
        ...dev,
        platform,
        metroHost: "192.168.40.104:8081",
      }),
      "http://192.168.40.104:8080",
    );
    assert.equal(resolveApiUrl(configured, { ...dev, platform }), undefined);
    assert.equal(
      resolveApiUrl(configured, {
        ...dev,
        platform,
        metroHost: "localhost:8081",
      }),
      undefined,
    );
  }
});

test("explicit backend addresses are preserved and production never rewrites HTTPS", () => {
  const explicit = "http://192.168.40.104:8080";
  assert.equal(
    resolveApiUrl(explicit, { ...dev, platform: "android", isDevice: false }),
    explicit,
  );
  assert.equal(
    resolveApiUrl("https://api.example.com", {
      ...dev,
      development: false,
      platform: "android",
      metroHost: "192.168.40.104:8081",
    }),
    "https://api.example.com",
  );
  assert.equal(
    resolveApiUrl("http://localhost:8080", { ...dev, development: false }),
    undefined,
  );
});

test("standalone LAN demo accepts private IPv4 only with an explicit flag", () => {
  const release = { ...dev, development: false, platform: "android" };
  for (const origin of [
    "http://192.168.1.9:18081",
    "http://10.1.2.3:18081",
    "http://172.16.0.2:18081",
    "http://172.31.255.254:18081",
  ]) {
    assert.equal(resolveApiUrl(origin, release), undefined);
    assert.equal(
      resolveApiUrl(origin, { ...release, allowLanHttp: true }),
      origin,
    );
  }
  for (const origin of [
    "http://localhost:18081",
    "http://127.0.0.1:18081",
    "http://8.8.8.8:18081",
    "http://172.32.0.1:18081",
    "http://api.example.com",
    "http://user:pass@192.168.1.9:18081",
    "http://192.168.1.9:18081/api/v1",
  ]) {
    assert.equal(
      resolveApiUrl(origin, { ...release, allowLanHttp: true }),
      undefined,
    );
  }
  assert.equal(
    resolveApiUrl("http://192.168.1.9:18081", {
      ...release,
      platform: "web",
      allowLanHttp: true,
    }),
    "http://192.168.1.9:18081",
  );
  assert.equal(
    resolveApiUrl("http://192.168.1.9:18081", {
      ...release,
      platform: "ios",
      allowLanHttp: true,
    }),
    undefined,
  );
});

test("invalid or credential-bearing API configuration is rejected", () => {
  for (const value of [
    undefined,
    "",
    "bad",
    "file:///tmp/api",
    "http://user:pass@localhost:8080",
    "http://localhost:8080/api/v1",
    "http://localhost:8080?key=secret",
    "http://localhost:8080#fragment",
  ]) {
    assert.equal(resolveApiUrl(value, dev), undefined);
  }
});
