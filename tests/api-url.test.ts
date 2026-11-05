import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const { resolveApiUrl } = tripModuleLoader({}, { URL })<typeof import("../src/services/api/api-url.ts")>("src/services/api/api-url.ts");
const dev = { development: true, platform: "web", isDevice: true };

test("one development URL reaches web, Android emulator, iOS simulator and a LAN phone", () => {
  const configured = "http://localhost:8080";
  assert.equal(resolveApiUrl(configured, dev), configured);
  assert.equal(resolveApiUrl(configured, { ...dev, platform: "android", isDevice: false }), "http://10.0.2.2:8080");
  assert.equal(resolveApiUrl(configured, { ...dev, platform: "ios", isDevice: false }), configured);
  for (const platform of ["android", "ios"]) {
    assert.equal(resolveApiUrl(configured, { ...dev, platform, metroHost: "192.168.40.104:8081" }), "http://192.168.40.104:8080");
    assert.equal(resolveApiUrl(configured, { ...dev, platform }), undefined);
    assert.equal(resolveApiUrl(configured, { ...dev, platform, metroHost: "localhost:8081" }), undefined);
  }
});

test("explicit backend addresses are preserved and production never rewrites HTTPS", () => {
  const explicit = "http://192.168.40.104:8080";
  assert.equal(resolveApiUrl(explicit, { ...dev, platform: "android", isDevice: false }), explicit);
  assert.equal(resolveApiUrl("https://api.example.com", { ...dev, development: false, platform: "android", metroHost: "192.168.40.104:8081" }), "https://api.example.com");
  assert.equal(resolveApiUrl("http://localhost:8080", { ...dev, development: false }), undefined);
});

test("invalid or credential-bearing API configuration is rejected", () => {
  for (const value of [undefined, "", "bad", "file:///tmp/api", "http://user:pass@localhost:8080", "http://localhost:8080/api/v1", "http://localhost:8080?key=secret", "http://localhost:8080#fragment"]) {
    assert.equal(resolveApiUrl(value, dev), undefined);
  }
});
