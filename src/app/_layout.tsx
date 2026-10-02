import { Stack } from "expo-router";
import { ThemeProvider } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider, focusManager } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { authSession } from "@/features/auth/services/auth-session";
import { MagicLinkProvider } from "@/features/auth/components/magic-link-provider";
import { queryClient } from "@/services/api/query-client";
import { useAuthStore } from "@/store/use-auth-store";

import { lightTheme } from "@/theme";

import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  useFonts,
} from "@expo-google-fonts/roboto";

export default function RootLayout() {
  const status = useAuthStore((state) => state.status);
  useEffect(() => {
    void authSession.restore();
    if (Platform.OS === "web") return;
    const subscription = AppState.addEventListener("change", (state) => focusManager.setFocused(state === "active"));
    return () => subscription.remove();
  }, []);
  const [fontsLoaded, fontError] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
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
              <Stack.Screen name="google-link" />
              <Stack.Protected guard={status === "anonymous"}>
                <Stack.Screen name="(auth)" />
              </Stack.Protected>
              <Stack.Protected guard={status === "authenticated"}>
                <Stack.Screen name="tabs" />
              </Stack.Protected>
            </Stack>
          </MagicLinkProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
