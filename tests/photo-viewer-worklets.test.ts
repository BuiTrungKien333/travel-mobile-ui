import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const {
  transformSync,
}: {
  transformSync: (
    source: string,
    options: Record<string, unknown>,
  ) => { code: string | null } | null;
} = require("@babel/core");

test("photo geometry initializes and runs after the actual Worklets Babel transform", () => {
  const filename = fileURLToPath(
    new URL(
      "../src/features/home/utils/photo-viewer-geometry.ts",
      import.meta.url,
    ),
  );
  const source = readFileSync(filename, "utf8");
  const compiled = transformSync(source, {
    filename,
    babelrc: false,
    configFile: false,
    plugins: [
      "@babel/plugin-transform-typescript",
      "react-native-worklets/plugin",
      "@babel/plugin-transform-modules-commonjs",
    ],
  });
  assert.ok(compiled?.code);
  const output = { exports: {} };
  // Import-time closure capture must not reference a helper in its temporal dead zone.
  runInNewContext(compiled.code, { ...output, global: { Error } });
  const geometry =
    output.exports as typeof import("../src/features/home/utils/photo-viewer-geometry.ts");
  assert.equal(geometry.clampPhoto(8, 1, 5), 5);
  assert.equal(
    geometry.photoPageDestination(2, 6, -100, 0, 390, 0.2, 650, 32),
    3,
  );
  assert.equal(geometry.rubberBand(20, -100, 100, 390, 0.28), 20);
});
