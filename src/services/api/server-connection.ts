import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { apiClient, resolveApiUrl } from "./client";

const key = "wego.server-origin";
export const canConfigureServer = __DEV__ || process.env.EXPO_PUBLIC_LAN_DEMO === "true";

export function getServerOrigin() {
  return apiClient.defaults.baseURL ?? "";
}

export async function restoreServerConnection() {
  if (!canConfigureServer) return;
  try {
    const saved = Platform.OS === "web"
      ? globalThis.localStorage?.getItem(key)
      : await SecureStore.getItemAsync(key);
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
  else await SecureStore.setItemAsync(key, origin);
  apiClient.defaults.baseURL = origin;
}
