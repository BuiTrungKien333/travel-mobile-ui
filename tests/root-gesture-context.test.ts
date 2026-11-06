import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Node = { type: unknown; props: Record<string, unknown> };

test("the root navigator remains inside a full-height gesture root for signed-in and signed-out routes", () => {
  const Stack = Object.assign(() => null, {
    Screen: "Screen",
    Protected: "Protected",
  });
  let status = "authenticated";
  const load = tripModuleLoader({
    react: { useEffect() {} },
    "react/jsx-runtime": {
      jsx: (type: unknown, props: Node["props"]) => ({ type, props }),
      jsxs: (type: unknown, props: Node["props"]) => ({ type, props }),
    },
    "react-native": { Platform: { OS: "android" }, AppState: {} },
    "react-native-gesture-handler": {
      GestureHandlerRootView: "GestureHandlerRootView",
    },
    "react-native-safe-area-context": {
      SafeAreaProvider: "SafeAreaProvider",
      initialWindowMetrics: {},
    },
    "@tanstack/react-query": {
      QueryClientProvider: "QueryClientProvider",
      focusManager: {},
    },
    "expo-router": { Stack },
    "expo-router/react-navigation": { ThemeProvider: "ThemeProvider" },
    "expo-status-bar": { StatusBar: "StatusBar" },
    "expo-font": { useFonts: () => [true, null] },
    "@expo-google-fonts/roboto/400Regular": { Roboto_400Regular: 1 },
    "@expo-google-fonts/roboto/500Medium": { Roboto_500Medium: 1 },
    "@expo-google-fonts/roboto/600SemiBold": { Roboto_600SemiBold: 1 },
    "@expo-google-fonts/roboto/700Bold": { Roboto_700Bold: 1 },
    "@/constants/development": { UI_PREVIEW_ENABLED: false },
    "@/features/auth/components/magic-link-provider": {
      MagicLinkProvider: "MagicLinkProvider",
    },
    "@/features/auth/services/auth-session": { authSession: {} },
    "@/services/api/query-client": { queryClient: {} },
    "@/store/use-auth-store": {
      useAuthStore: (select: (state: { status: string }) => unknown) =>
        select({ status }),
    },
    "@/theme": { lightTheme: { colors: { background: "white" } } },
  });
  const { default: RootLayout } = load<typeof import("../src/app/_layout.tsx")>(
    "src/app/_layout.tsx",
  );
  for (status of ["authenticated", "anonymous"]) {
    const tree = RootLayout() as Node;
    assert.equal(tree.type, "GestureHandlerRootView");
    assert.equal((tree.props.style as { flex: number }).flex, 1);
    let foundNavigator = false;
    function visit(value: unknown, inGestureRoot = false) {
      if (Array.isArray(value)) {
        value.forEach((child) => visit(child, inGestureRoot));
        return;
      }
      if (!value || typeof value !== "object" || !("props" in value)) return;
      const node = value as Node;
      const inside = inGestureRoot || node.type === "GestureHandlerRootView";
      if (node.type === Stack) {
        foundNavigator = true;
        assert.equal(inside, true);
      }
      visit(node.props.children, inside);
    }
    visit(tree);
    assert.equal(foundNavigator, true);
  }
});
