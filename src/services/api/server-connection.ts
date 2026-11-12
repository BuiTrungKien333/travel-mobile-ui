import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { apiClient, resolveApiUrl } from "./client";

const key = "wego.server-origin";
const preferenceFile = "wego-server-origin.json";
export const canConfigureServer =
  __DEV__ || process.env.EXPO_PUBLIC_LAN_DEMO === "true";

export function getServerOrigin() {
  return apiClient.defaults.baseURL ?? "";
}

export async function restoreServerConnection() {
  if (!canConfigureServer) return;
  try {
    let saved: string | null | undefined;
    if (Platform.OS === "web") saved = globalThis.localStorage?.getItem(key);
    else {
      const { File, Paths } = await import("expo-file-system");
      const file = new File(Paths.document, preferenceFile);
      if (file.exists) {
        const value: unknown = JSON.parse(await file.text());
        if (typeof value === "string") saved = value;
      } else saved = await SecureStore.getItemAsync(key);
    }
    const origin = resolveApiUrl(saved ?? undefined);
    if (origin) apiClient.defaults.baseURL = origin;
  } catch {
    // An unavailable preference store must not block startup with the packaged URL.
  }
}

/** Caller expires the old session before switching servers. Never persist credentials here. */
export async function saveServerConnection(value: string) {
  const origin = canConfigureServer && resolveApiUrl(value);
  if (!origin) throw new Error("INVALID_SERVER");
  if (Platform.OS === "web") globalThis.localStorage.setItem(key, origin);
  else {
    // A public server origin is a preference, not a credential. Avoid coupling
    // Wi-Fi changes to Android Keystore availability; tokens stay in SecureStore.
    const { File, Paths } = await import("expo-file-system");
    await new File(Paths.document, preferenceFile).write(
      JSON.stringify(origin),
    );
  }
  apiClient.defaults.baseURL = origin;
}
