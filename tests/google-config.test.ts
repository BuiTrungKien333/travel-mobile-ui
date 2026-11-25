import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import type {
  ExpoConfig,
  ExportedConfigWithProps,
  Mod,
} from "expo/config-plugins";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(import.meta.dirname, "..");
const appConfig: (context: {
  config: ExpoConfig;
}) => ExpoConfig = require("../app.config.js");
const callbackPlugin: (
  config: ExpoConfig,
) => ExpoConfig & {
  mods: { ios: { appDelegate: Mod<{ contents: string; language: string }> } };
} = require("../plugins/with-google-sign-in.js");

test("iOS OAuth config derives the callback scheme and activates SDK 57 scene support without inventing IDs", () => {
  const previous = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  try {
    delete process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    const blank = appConfig({ config: { name: "Fixture", slug: "fixture" } });
    assert.equal(
      JSON.stringify(blank.plugins).includes(
        "react-native-nitro-google-signin",
      ),
      false,
    );
    assert.ok(
      JSON.stringify(blank.plugins).includes('"enableSceneSupport":true'),
    );
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID =
      "123-fixture.apps.googleusercontent.com";
    const configured = appConfig({
      config: { name: "Fixture", slug: "fixture" },
    });
    assert.ok(
      JSON.stringify(configured.plugins).includes(
        "com.googleusercontent.apps.123-fixture",
      ),
    );
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = "invalid";
    assert.throws(() =>
      appConfig({ config: { name: "Fixture", slug: "fixture" } }),
    );
  } finally {
    if (previous === undefined)
      delete process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    else process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = previous;
  }
});
test("LAN APK cleartext is opt-in and the production build profile disables that exception", () => {
  const previous = process.env.EXPO_PUBLIC_LAN_DEMO;
  const profiles = require("../eas.json").build;
  try {
    assert.equal(profiles["preview-lan"].developmentClient, false);
    assert.equal(profiles["preview-lan"].android.buildType, "apk");
    assert.equal(profiles.production.env.EXPO_PUBLIC_LAN_DEMO, "false");
    for (const flag of ["false", "true"]) {
      process.env.EXPO_PUBLIC_LAN_DEMO = flag;
      const configured = appConfig({
        config: { name: "Fixture", slug: "fixture" },
      });
      const properties = JSON.stringify(configured.plugins);
      assert.equal(
        properties.includes('"usesCleartextTraffic":true'),
        flag === "true",
      );
      assert.equal(
        properties.includes('"usesCleartextTraffic":false'),
        flag === "false",
      );
      assert.ok(properties.includes('"enableSceneSupport":true'));
    }
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_LAN_DEMO;
    else process.env.EXPO_PUBLIC_LAN_DEMO = previous;
  }
});

test("LAN builds limit Metro workers without replacing Expo's transformer and resolver", () => {
  const code = readFileSync(path.join(projectRoot, "metro.config.js"), "utf8");
  for (const [flag, available, expected] of [
    ["true", 12, 2],
    ["true", 1, 1],
    ["false", 12, 12],
  ] as const) {
    const defaults = {
      maxWorkers: available,
      transformer: { marker: "Expo" },
      resolver: { marker: "Expo" },
    };
    const module = { exports: {} };
    runInNewContext(code, {
      module,
      __dirname: projectRoot,
      process: { env: { EXPO_PUBLIC_LAN_DEMO: flag } },
      require: (id: string) => {
        assert.equal(id, "expo/metro-config");
        return { getDefaultConfig: () => defaults };
      },
    });
    const config = module.exports as typeof defaults;
    assert.equal(config.maxWorkers, expected);
    assert.equal(config.transformer, defaults.transformer);
    assert.equal(config.resolver, defaults.resolver);
  }
});

test("Google callback plugin applies to the actual installed Expo Swift template, preserves linking, and is idempotent", async () => {
  const template = execFileSync(
    "tar",
    [
      "-xOf",
      path.join(projectRoot, "node_modules/expo/template.tgz"),
      "package/ios/HelloWorld/AppDelegate.swift",
    ],
    { encoding: "utf8" },
  );
  const config = callbackPlugin({ name: "Fixture", slug: "fixture" });
  const input: ExportedConfigWithProps<{ contents: string; language: string }> =
    {
      ...config,
      modResults: { contents: template, language: "swift" },
      modRequest: {
        projectRoot,
        platformProjectRoot: path.join(projectRoot, "ios"),
        projectName: "Fixture",
        platform: "ios",
        modName: "appDelegate",
        introspect: false,
        ignoreExistingNativeFiles: false,
      },
    };
  const first = await config.mods.ios.appDelegate(input);
  assert.ok(first.modResults.contents.includes("import GoogleSignIn"));
  assert.ok(
    first.modResults.contents.includes("GIDSignIn.sharedInstance.handle(url)"),
  );
  assert.ok(
    first.modResults.contents.includes(
      "RCTLinkingManager.application(app, open: url, options: options)",
    ),
  );
  assert.ok(
    first.modResults.contents.includes("continue userActivity: NSUserActivity"),
  );
  const second = await config.mods.ios.appDelegate(first);
  assert.equal(second.modResults.contents, first.modResults.contents);
});
