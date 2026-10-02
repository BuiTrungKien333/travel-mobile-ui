import { create, isAxiosError, type InternalAxiosRequestConfig } from "axios";

import { publicAuthEndpoints } from "@/features/auth/api/auth-endpoints";
import { useLocaleStore } from "@/store/use-locale-store";
import { ApiError, normalizeApiError } from "./api-error";

type AuthTransport = {
  getAccessToken: () => string | null;
  getVersion: () => number;
  refresh: () => Promise<unknown>;
  expire: () => Promise<void>;
};
type AuthConfig = InternalAxiosRequestConfig & { authRetried?: boolean; authVersion?: number };
let authTransport: AuthTransport | undefined;

export function configureAuthTransport(transport: AuthTransport) { authTransport = transport; }

export function resolveApiUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && (url.protocol !== "http:" || !__DEV__)) return undefined;
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return undefined;
    return url.origin;
  } catch { return undefined; }
}

const baseURL = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL);
export const apiClient = create({ baseURL, timeout: 15000 });

apiClient.interceptors.request.use((config: AuthConfig) => {
  if (!baseURL) throw new ApiError("API_CONFIG");
  config.headers.set("Accept-Language", useLocaleStore.getState().locale);
  if (!publicAuthEndpoints.has(config.url ?? "") && authTransport) {
    config.authVersion ??= authTransport.getVersion();
    if (config.authVersion !== authTransport.getVersion()) throw new ApiError("CANCELLED");
    const token = authTransport.getAccessToken();
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use((response) => response, async (error: unknown) => {
  const failure = normalizeApiError(error);
  const config: AuthConfig | undefined = isAxiosError(error) ? error.config : undefined;
  const protectedRequest = config && !publicAuthEndpoints.has(config.url ?? "");
  if (protectedRequest && authTransport && config.authVersion === authTransport.getVersion()) {
    if (failure.code === "AUTH_007") await authTransport.expire();
    if (failure.status === 401 && failure.code === "AUTH_001" && !config.authRetried) {
      const sentToken = config.headers.get("Authorization");
      const currentToken = authTransport.getAccessToken();
      // Nếu request khác đã refresh, chỉ gửi lại với access token mới.
      if (!currentToken || sentToken === `Bearer ${currentToken}`) await authTransport.refresh();
      return apiClient.request({ ...config, authRetried: true } as AuthConfig);
    }
    if (failure.status === 401 && failure.code === "AUTH_001" && config.authRetried) {
      await authTransport.expire();
    }
  }
  throw failure;
});
