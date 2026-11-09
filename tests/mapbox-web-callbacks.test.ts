import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const { patchMapboxCallbacks } = require("../scripts/patch-mapbox-web.cjs");
const dist = join(
  dirname(require.resolve("mapbox-gl-web/package.json")),
  "dist",
);
const installed = readFileSync(join(dist, "mapbox-gl-dev.js"), "utf8");
const original = installed.replaceAll("this.errorCb?.(", "this.errorCb(");

// Exercise the actual SDK classes with only network/browser dependencies stubbed.
function createRequest(className: string, source: string) {
  const start = source.indexOf(`class ${className} extends TelemetryEvent {`);
  assert.ok(start >= 0);
  const end = source.indexOf("\nclass ", start + 1);
  assert.ok(end > start);
  class TelemetryEvent {
    queue = [{ id: 1, timestamp: 1, customAccessToken: "test" }];
    anonId = "test";
    anonIdTimestamp = 1;
  }
  const SDKClass = runInNewContext(
    `${source.slice(start, end)}; ${className}`,
    {
      TelemetryEvent,
      validateUuid: () => true,
      config: {},
      version: "3.34.2",
      EVENT_SCHEMA_VERSION: 1,
      SKU_ID: "test",
      define_import_meta_env_default: {},
      bundleDistribution: "test",
      sdkInfo: null,
    },
  );
  const instance = new SDKClass();
  let settle: (error: Error | null) => void = () =>
    assert.fail("No request started");
  const request = (
    _time: number,
    payload: unknown,
    callback: typeof settle,
  ) => {
    settle = callback;
  };
  instance.postEvent = request;
  instance.getSession = request;
  const errors: Error[] = [];
  instance.errorCb = (error: Error) => errors.push(error);
  instance.processRequests();
  return { instance, errors, settle: (error: Error | null) => settle(error) };
}

for (const className of ["MapLoadEvent", "MapSessionAPI"]) {
  test(`${className}: reproduces original late failure after remove`, () => {
    const pending = createRequest(className, original);
    pending.instance.remove();
    assert.throws(
      () => pending.settle(new Error("network unavailable")),
      /errorCb is not a function/,
    );
  });

  test(`${className}: patched late failure does not crash`, () => {
    const pending = createRequest(className, patchMapboxCallbacks(original));
    pending.instance.remove();
    assert.doesNotThrow(() => pending.settle(new Error("network unavailable")));
    assert.equal(pending.errors.length, 0);
  });

  test(`${className}: preserves active errors and successful requests`, () => {
    const pending = createRequest(className, patchMapboxCallbacks(original));
    const error = new Error("network unavailable");
    pending.settle(error);
    assert.equal(pending.errors[0], error);
    pending.settle(null);
    assert.equal(pending.instance.success[1], true);
  });
}

test("production entry is guarded; patch is repeatable and rejects changed SDK structure", () => {
  const production = readFileSync(join(dist, "mapbox-gl.js"), "utf8");
  assert.equal((production.match(/this\.errorCb\?\.\(/g) ?? []).length, 4);
  assert.equal(patchMapboxCallbacks(production), production);
  assert.throws(
    () => patchMapboxCallbacks("this.errorCb(error)"),
    /no longer matches/,
  );
});
