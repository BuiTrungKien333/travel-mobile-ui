import { nativeCredentials } from "./native-credentials";
import { Platform } from "react-native";

import { configureAuthTransport } from "@/services/api/client";
import { queryClient } from "@/services/api/query-client";
import { useAuthStore } from "@/store/use-auth-store";
import { authApi } from "../api/auth-api";
import { authQueryKeys } from "../api/auth-query-keys";
import { SessionManager } from "./session-manager";

// Preview web dùng memory: không lưu bearer token vào localStorage/sessionStorage.
let webRefreshToken: string | null = null;

export const authSession = new SessionManager({
  read: () =>
    Platform.OS === "web"
      ? Promise.resolve(webRefreshToken)
      : nativeCredentials.read(),
  write: async (token) => {
    if (Platform.OS === "web") {
      webRefreshToken = token;
      return;
    }
    await nativeCredentials.write(token);
  },
  remove: async () => {
    if (Platform.OS === "web") {
      webRefreshToken = null;
      return;
    }
    await nativeCredentials.remove();
  },
  requestRefresh: authApi.refresh,
  requestLogout: authApi.logout,
  onStatus: (status) => useAuthStore.setState({ status }),
  onUser: (user) => {
    useAuthStore.setState({ user });
    queryClient.setQueryData(authQueryKeys.profile, user, { updatedAt: 0 });
  },
  onClear: () => {
    useAuthStore.setState({ user: null });
    queryClient.clear();
  },
});

configureAuthTransport(authSession);
