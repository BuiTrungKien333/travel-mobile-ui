import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

function environment({
  secure = true,
  embedded = false,
  allowed = true,
  media = true,
  legacyPolicy = false,
} = {}) {
  const window = { isSecureContext: secure, self: {}, top: {} };
  if (!embedded) window.top = window.self;
  const policy = { allowsFeature: (name: string) => name !== "camera" || allowed };
  const load = tripModuleLoader(
    {},
    {
      window,
      document: legacyPolicy
        ? { featurePolicy: policy }
        : { permissionsPolicy: policy },
      navigator: { mediaDevices: media ? { getUserMedia: () => {} } : undefined },
    },
  );
  return load<typeof import("../src/features/camera/utils/camera-environment.web.ts")>(
    "src/features/camera/utils/camera-environment.web.ts",
  ).getCameraEnvironmentIssue();
}

test("blocked preview frames explain the camera policy instead of requesting permission repeatedly", () => {
  assert.equal(environment({ embedded: true, allowed: false }), "embedded");
  assert.equal(
    environment({ embedded: true, allowed: false, legacyPolicy: true }),
    "embedded",
  );
});

test("top-level browsers and frames with camera access keep working", () => {
  assert.equal(environment(), null);
  assert.equal(environment({ embedded: true }), null);
});

test("insecure pages and browsers without camera support keep their specific errors", () => {
  assert.equal(environment({ secure: false }), "insecure");
  assert.equal(environment({ media: false }), "unsupported");
});
