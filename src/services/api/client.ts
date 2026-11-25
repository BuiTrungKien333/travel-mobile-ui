import { create, isAxiosError, type InternalAxiosRequestConfig } from "axios";
import Constants from "expo-constants";
import { isDevice } from "expo-device";
import { Platform } from "react-native";

import { isPublicApiRequest } from "./public-endpoints";
import { useLocaleStore } from "@/store/use-locale-store";
import { ApiError, normalizeApiError } from "./api-error";
import { resolveApiUrl as resolveDeviceApiUrl } from "./api-url";

type AuthTransport = {
  getAccessToken: () => string | null;
  getVersion: () => number;
  refresh: () => Promise<unknown>;
  expire: () => Promise<void>;
};

type AuthConfig = InternalAxiosRequestConfig & {
  authRetried?: boolean;
  authVersion?: number;
};

let authTransport: AuthTransport | undefined;

export function configureAuthTransport(transport: AuthTransport) {
  authTransport = transport;
}

export function resolveApiUrl(value: string | undefined) {
  return resolveDeviceApiUrl(value, {
    development: __DEV__,
    allowLanHttp: process.env.EXPO_PUBLIC_LAN_DEMO === "true",
    platform: "web",
    isDevice: false,
  });
}

const baseURL = resolveDeviceApiUrl(process.env.EXPO_PUBLIC_API_URL, {
  development: __DEV__,
  allowLanHttp: process.env.EXPO_PUBLIC_LAN_DEMO === "true",
  platform: Platform.OS,
  isDevice,
  metroHost: Constants.expoConfig?.hostUri,
});

export const apiClient = create({ baseURL, timeout: 15000 });

apiClient.interceptors.request.use((config: AuthConfig) => {
  if (!apiClient.defaults.baseURL) throw new ApiError("API_CONFIG");
  config.headers.set("Accept-Language", useLocaleStore.getState().locale);
  if (!isPublicApiRequest(config.url ?? "", config.method) && authTransport) {
    config.authVersion ??= authTransport.getVersion();
    if (config.authVersion !== authTransport.getVersion())
      throw new ApiError("CANCELLED");
    const token = authTransport.getAccessToken();
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const failure = normalizeApiError(error);
    const config: AuthConfig | undefined = isAxiosError(error)
      ? error.config
      : undefined;
    const protectedRequest =
      config && !isPublicApiRequest(config.url ?? "", config.method);
    if (
      protectedRequest &&
      authTransport &&
      config.authVersion === authTransport.getVersion()
    ) {
      if (failure.code === "AUTH_007") await authTransport.expire();
      if (
        failure.status === 401 &&
        failure.code === "AUTH_001" &&
        !config.authRetried
      ) {
        const sentToken = config.headers.get("Authorization");
        const currentToken = authTransport.getAccessToken();
        // Nếu request khác đã refresh, chỉ gửi lại với access token mới.
        if (!currentToken || sentToken === `Bearer ${currentToken}`)
          await authTransport.refresh();

        return apiClient.request({
          ...config,
          authRetried: true,
        } as AuthConfig);
      }

      if (
        failure.status === 401 &&
        failure.code === "AUTH_001" &&
        config.authRetried
      ) {
        await authTransport.expire();
      }
    }
    throw failure;
  },
);
