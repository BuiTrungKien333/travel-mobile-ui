# Mapbox web callback lifecycle patch

Mapbox GL JS 3.34.2 can throw `this.errorCb is not a function` when a telemetry/session request fails after `map.remove()`. Metro's `fetchThenEvalJs.ts` stack is the dynamic bundle evaluation boundary, not the source of the failure.

Upstream issue: https://github.com/mapbox/mapbox-gl-js/issues/13735
Upstream fix (scheduled for 3.36): https://github.com/mapbox/mapbox-gl-js/commit/8a04af5

`scripts/patch-mapbox-web.cjs` adds null guards to the four callback invocations in the installed production entry and its readable development equivalent. It preserves active error delivery, SDK requests, authentication and map cleanup. It runs on `npm install`/`npm ci` through `postinstall`, without an additional dependency. Native Mapbox is unaffected.

The patch is pinned to 3.34.2, validates the expected callback count, and is idempotent. Review/remove it when upgrading Mapbox; it is a narrow crash fix, not a full backport of upstream's per-map telemetry callback tracking. Distribution source maps remain upstream originals.

After applying to an existing checkout, restart Metro with `npx expo start --web --clear` and reload the browser. If using `--ignore-scripts`, run `node scripts/patch-mapbox-web.cjs` manually before bundling.

Regression: `node --experimental-strip-types --test tests/mapbox-web-callbacks.test.ts` reproduces the original failure for both SDK classes, checks delayed failures after removal, preserves errors while active and checks the production entry.

Validation: all 7 regression tests pass; TypeScript (`--noEmit --noUnusedLocals --noUnusedParameters`) passes. Expo Doctor reports existing package-version mismatches (13 packages); no dependencies were upgraded for this fix. A full browser interaction test has not been run.
