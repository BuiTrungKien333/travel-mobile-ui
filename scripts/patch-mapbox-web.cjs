const { readFileSync, writeFileSync } = require("node:fs");
const { dirname, join } = require("node:path");

// Mapbox #13735: remove() clears errorCb while telemetry/session requests can
// still fail. Keep normal errors; ignore callbacks belonging to a removed map.
// Remove this patch after upgrading to the upstream fix (scheduled for 3.36).
// https://github.com/mapbox/mapbox-gl-js/issues/13735
function patchMapboxCallbacks(source) {
  const calls = source.match(/this\.errorCb\(/g) ?? [];
  const guarded = source.match(/this\.errorCb\?\.\(/g) ?? [];
  if (calls.length + guarded.length !== 4) {
    throw new Error(
      "Mapbox callback patch no longer matches: review the SDK before updating.",
    );
  }
  return source.replaceAll("this.errorCb(", "this.errorCb?.(");
}

function patchInstalledMapbox() {
  const packagePath = require.resolve("mapbox-gl-web/package.json");
  const { version } = JSON.parse(readFileSync(packagePath, "utf8"));
  if (version !== "3.34.2") {
    throw new Error(
      `Review/remove the Mapbox callback patch for version ${version}.`,
    );
  }
  const dist = join(dirname(packagePath), "dist");
  // Production entry used by Metro and the readable equivalent used in tests.
  for (const name of ["mapbox-gl.js", "mapbox-gl-dev.js"]) {
    const path = join(dist, name);
    const source = readFileSync(path, "utf8");
    const patched = patchMapboxCallbacks(source);
    if (patched !== source) writeFileSync(path, patched);
  }
  console.log("Mapbox web callback lifecycle patch applied.");
}

if (require.main === module) patchInstalledMapbox();
module.exports = { patchMapboxCallbacks };
