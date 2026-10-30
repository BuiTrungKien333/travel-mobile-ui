import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? "",
      },
    },
  },
  plugins: [
    ...(config.plugins ?? []).filter((plugin) => !(Array.isArray(plugin) && plugin[0] === "react-native-maps")),
    ["react-native-maps", { iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY ?? "" }],
  ],
});
