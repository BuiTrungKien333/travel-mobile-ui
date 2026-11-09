import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { configureAuthTransport } from "@/services/api/client";
import { queryClient } from "@/services/api/query-client";
import { useAuthStore } from "@/store/use-auth-store";
import { authApi } from "../api/auth-api";
import { authQueryKeys } from "../api/auth-query-keys";
import { SessionManager } from "./session-manager";

const refreshTokenKey = "tripzy.auth.refresh-token";
// Preview web dùng memory: không lưu bearer token vào localStorage/sessionStorage.
let webRefreshToken: string | null = null;

export const authSession = new SessionManager({
  read: () =>
    Platform.OS === "web"
      ? Promise.resolve(webRefreshToken)
      : SecureStore.getItemAsync(refreshTokenKey),
  write: async (token) => {
    if (Platform.OS === "web") {
      webRefreshToken = token;
      return;
    }
    await SecureStore.setItemAsync(refreshTokenKey, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  remove: async () => {
    if (Platform.OS === "web") {
      webRefreshToken = null;
      return;
    }
    await SecureStore.deleteItemAsync(refreshTokenKey);
  },
  requestRefresh: authApi.refresh,
  requestLogout: authApi.logout,
  onStatus: (status) => useAuthStore.setState({ status }),
  onUser: (user) => {
    queryClient.setQueryData(authQueryKeys.profile, user, { updatedAt: 0 });
  },
  onClear: () => queryClient.clear(),
});

configureAuthTransport(authSession);
