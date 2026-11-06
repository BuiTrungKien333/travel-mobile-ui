import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import path from "node:path";
import type { ExpoConfig } from "expo/config";
import type { ExportedConfigWithProps, IOSConfig, Mod } from "expo/config-plugins";

type AppDelegateFile = IOSConfig.Paths.AppDelegateProjectFile;

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(import.meta.dirname, "..");
const { getConfig }: typeof import("@expo/config") = require("@expo/config");
const callbackPlugin: (config: ExpoConfig) => ExpoConfig & { mods: { ios: { appDelegate: Mod<AppDelegateFile> } } } =
  require("../plugins/with-google-sign-in.js");

const configKeys = [
  "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID", "GOOGLE_ANDROID_PACKAGE_NAME", "GOOGLE_IOS_BUNDLE_ID",
  "GOOGLE_MAPS_ANDROID_API_KEY", "GOOGLE_MAPS_IOS_API_KEY",
];

function resolveConfig(environment: Record<string, string> = {}) {
  const previous = new Map(configKeys.map((key) => [key, process.env[key]]));
  try {
    for (const key of configKeys) {
      if (environment[key] === undefined) delete process.env[key];
      else process.env[key] = environment[key];
    }
    return getConfig(projectRoot);
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("the active Expo config includes Maps, dev-client and SDK 57 scene support together", () => {
  const resolved = resolveConfig();
  assert.equal(path.basename(resolved.dynamicConfigPath ?? ""), "app.config.ts");
  const plugins = resolved.exp.plugins ?? [];
  const names = plugins.map((plugin) => typeof plugin === "string" ? plugin : plugin[0]);
  for (const name of ["expo-router", "expo-dev-client", "expo-build-properties", "react-native-maps", "expo-camera", "expo-image-picker", "expo-media-library", "expo-secure-store", "expo-sharing"]) {
    assert.equal(names.filter((item) => item === name).length, 1, name);
  }
  assert.equal(names.includes("react-native-nitro-google-signin"), false);
  assert.ok(JSON.stringify(plugins).includes('"enableSceneSupport":true'));
  assert.equal(resolved.exp.scheme, "travelplannermobileui");
  assert.equal(resolved.exp.android?.package, "com.travel.mobile");
  assert.equal(resolved.exp.ios?.bundleIdentifier, "com.travel.mobile");
  const camera = plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === "expo-camera");
  assert.ok(Array.isArray(camera));
  assert.equal(camera[1].recordAudioAndroid, false);
});

test("Maps keys and native application IDs reach the config Expo actually loads", () => {
  const { exp } = resolveConfig({
    GOOGLE_ANDROID_PACKAGE_NAME: " com.example.travel ", GOOGLE_IOS_BUNDLE_ID: " com.example.travel.ios ",
    GOOGLE_MAPS_ANDROID_API_KEY: " android-fixture-key ", GOOGLE_MAPS_IOS_API_KEY: " ios-fixture-key ",
  });
  assert.equal(exp.android?.package, "com.example.travel");
  assert.equal(exp.ios?.bundleIdentifier, "com.example.travel.ios");
  assert.equal(exp.android?.config?.googleMaps?.apiKey, "android-fixture-key");
  const maps = exp.plugins?.find((plugin) => Array.isArray(plugin) && plugin[0] === "react-native-maps");
  assert.ok(Array.isArray(maps));
  assert.equal(maps[1].androidGoogleMapsApiKey, "android-fixture-key");
  assert.equal(maps[1].iosGoogleMapsApiKey, "ios-fixture-key");
});

test("the active config derives the Google iOS callback without inventing IDs", () => {
  const configured = resolveConfig({ EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: " 123-fixture.apps.googleusercontent.com " }).exp;
  const names = configured.plugins?.map((plugin) => typeof plugin === "string" ? plugin : plugin[0]) ?? [];
  assert.equal(names.filter((name) => name === "react-native-nitro-google-signin").length, 1);
  assert.equal(names.filter((name) => name === "./plugins/with-google-sign-in.js").length, 1);
  assert.ok(JSON.stringify(configured.plugins).includes("com.googleusercontent.apps.123-fixture"));
  assert.throws(() => resolveConfig({ EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: "invalid" }), /must be an iOS OAuth client ID/);
});

test("blank optional native settings keep the base IDs and do not add placeholder Maps keys", () => {
  const { exp } = resolveConfig(Object.fromEntries(configKeys.map((key) => [key, " "])));
  assert.equal(exp.android?.package, "com.travel.mobile");
  assert.equal(exp.ios?.bundleIdentifier, "com.travel.mobile");
  assert.equal(exp.android?.config?.googleMaps?.apiKey, undefined);
  const maps = exp.plugins?.find((plugin) => Array.isArray(plugin) && plugin[0] === "react-native-maps");
  assert.ok(Array.isArray(maps));
  assert.equal(maps[1].androidGoogleMapsApiKey, undefined);
  assert.equal(maps[1].iosGoogleMapsApiKey, undefined);
});
test("Google callback plugin applies to the actual installed Expo Swift template, preserves linking, and is idempotent", async () => {
  const template = execFileSync("tar", ["-xOf", path.join(projectRoot, "node_modules/expo/template.tgz"),
    "package/ios/HelloWorld/AppDelegate.swift"], { encoding: "utf8" });
  const config = callbackPlugin({ name: "Fixture", slug: "fixture" });
  const input: ExportedConfigWithProps<AppDelegateFile> = {
    ...config, modRawConfig: config,
    modResults: { path: path.join(projectRoot, "ios/Fixture/AppDelegate.swift"), contents: template, language: "swift" },
    modRequest: { projectRoot, platformProjectRoot: path.join(projectRoot, "ios"), projectName: "Fixture",
      platform: "ios", modName: "appDelegate", introspect: false, ignoreExistingNativeFiles: false },
  };
  const first = await config.mods.ios.appDelegate(input);
  assert.ok(first.modResults.contents.includes("import GoogleSignIn"));
  assert.ok(first.modResults.contents.includes("GIDSignIn.sharedInstance.handle(url)"));
  assert.ok(first.modResults.contents.includes("RCTLinkingManager.application(app, open: url, options: options)"));
  assert.ok(first.modResults.contents.includes("continue userActivity: NSUserActivity"));
  const second = await config.mods.ios.appDelegate(first);
  assert.equal(second.modResults.contents, first.modResults.contents);
});
