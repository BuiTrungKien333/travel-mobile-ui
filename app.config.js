/** @param {{ config: import('expo/config').ExpoConfig }} context */
module.exports = ({ config }) => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const androidPackage = process.env.GOOGLE_ANDROID_PACKAGE_NAME?.trim();
  const iosBundleId = process.env.GOOGLE_IOS_BUNDLE_ID?.trim();
  const plugins = [...(config.plugins ?? []), "expo-dev-client",
    ["expo-build-properties", { ios: { enableSceneSupport: true } }]];

  if (iosClientId) {
    if (!/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(iosClientId)) {
      throw new Error("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID must be an iOS OAuth client ID.");
    }
    plugins.push(["react-native-nitro-google-signin", {
      iosUrlScheme: `com.googleusercontent.apps.${iosClientId.replace(/\.apps\.googleusercontent\.com$/, "")}`,
    }], "./plugins/with-google-sign-in.js");
  }

  return { ...config, plugins,
    android: { ...config.android, ...(androidPackage ? { package: androidPackage } : {}) },
    ios: { ...config.ios, ...(iosBundleId ? { bundleIdentifier: iosBundleId } : {}) },
  };
};
