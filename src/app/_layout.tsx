import { QueryClientProvider, focusManager } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { ThemeProvider } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

import { UI_PREVIEW_ENABLED } from "@/constants/development";
import { MagicLinkProvider } from "@/features/auth/components/magic-link-provider";
import { authSession } from "@/features/auth/services/auth-session";
import { queryClient } from "@/services/api/query-client";
import { useAuthStore } from "@/store/use-auth-store";

import { lightTheme } from "@/theme";

import { Roboto_400Regular } from "@expo-google-fonts/roboto/400Regular";
import { Roboto_500Medium } from "@expo-google-fonts/roboto/500Medium";
import { Roboto_600SemiBold } from "@expo-google-fonts/roboto/600SemiBold";
import { Roboto_700Bold } from "@expo-google-fonts/roboto/700Bold";

export default function RootLayout() {
  const status = useAuthStore((state) => state.status);
  useEffect(() => {
    // Tạm ngưng khôi phục phiên/gọi refresh API trong bản xem trước UI.
    if (!UI_PREVIEW_ENABLED) void authSession.restore();
    if (Platform.OS === "web") return;
    const subscription = AppState.addEventListener("change", (state) =>
      focusManager.setFocused(state === "active"),
    );
    return () => subscription.remove();
  }, []);
  const [fontsLoaded, fontError] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_600SemiBold,
    Roboto_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={lightTheme}>
            <StatusBar style="dark" />
            <MagicLinkProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: {
                    backgroundColor: lightTheme.colors.background,
                  },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="forgot-password" />
                <Stack.Screen name="verify-email" />
                <Stack.Screen name="reset-password" />
                <Stack.Screen name="change-password" />
                <Stack.Screen name="google-link" />
                <Stack.Protected
                  guard={!UI_PREVIEW_ENABLED && status === "anonymous"}
                >
                  <Stack.Screen name="(auth)" />
                </Stack.Protected>
                <Stack.Protected
                  guard={UI_PREVIEW_ENABLED || status === "authenticated"}
                >
                  <Stack.Screen name="(workspace)" />
                </Stack.Protected>
              </Stack>
            </MagicLinkProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
