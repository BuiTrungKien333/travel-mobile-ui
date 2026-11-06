import type { ExpoConfig, ConfigContext } from "expo/config";

// This file owns the dynamic native configuration; app.json keeps the base UI/permission settings.
const managedPlugins = new Set([
  "expo-dev-client",
  "expo-build-properties",
  "react-native-maps",
  "react-native-nitro-google-signin",
  "./plugins/with-google-sign-in.js",
]);

export default ({ config }: ConfigContext): ExpoConfig => {
  if (!config.name || !config.slug) {
    throw new Error("app.json must define expo.name and expo.slug.");
  }
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const androidPackage = process.env.GOOGLE_ANDROID_PACKAGE_NAME?.trim();
  const iosBundleId = process.env.GOOGLE_IOS_BUNDLE_ID?.trim();
  const androidMapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  const iosMapsKey = process.env.GOOGLE_MAPS_IOS_API_KEY?.trim();

  if (iosClientId && !/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(iosClientId)) {
    throw new Error("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID must be an iOS OAuth client ID.");
  }

  const plugins: NonNullable<ExpoConfig["plugins"]> = (config.plugins ?? []).filter((plugin) => {
    const name = typeof plugin === "string" ? plugin : plugin[0];
    return !name || !managedPlugins.has(name);
  });
  plugins.push(
    "expo-dev-client",
    ["expo-build-properties", { ios: { enableSceneSupport: true } }],
    ["react-native-maps", {
      ...(androidMapsKey ? { androidGoogleMapsApiKey: androidMapsKey } : {}),
      ...(iosMapsKey ? { iosGoogleMapsApiKey: iosMapsKey } : {}),
    }],
  );

  if (iosClientId) {
    plugins.push(
      ["react-native-nitro-google-signin", {
        iosUrlScheme: `com.googleusercontent.apps.${iosClientId.replace(/\.apps\.googleusercontent\.com$/, "")}`,
      }],
      "./plugins/with-google-sign-in.js",
    );
  }

  return {
    ...config,
    name: config.name,
    slug: config.slug,
    plugins,
    android: {
      ...config.android,
      ...(androidPackage ? { package: androidPackage } : {}),
      ...(androidMapsKey ? { config: {
        ...config.android?.config,
        googleMaps: { apiKey: androidMapsKey },
      } } : {}),
    },
    ios: { ...config.ios, ...(iosBundleId ? { bundleIdentifier: iosBundleId } : {}) },
  };
};
