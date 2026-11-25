import assert from "node:assert/strict";
import { test } from "node:test";

import { translate, type AppLocale } from "../src/i18n/translations.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Element = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const element = value as Element;
  return [element, ...nodes(element.props.children)];
}

for (const locale of ["vi", "en"] as const satisfies readonly AppLocale[]) {
  test(`route failure offers retry in ${locale} without exposing exception details`, () => {
    const jsx = (type: unknown, props: Record<string, unknown>) => ({
      type,
      props,
    });
    let retries = 0;
    const load = tripModuleLoader({
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": {
        ScrollView: "ScrollView",
        View: "View",
        StyleSheet: { create: (styles: unknown) => styles },
      },
      "react-native-safe-area-context": {
        SafeAreaProvider: "SafeAreaProvider",
      },
      "expo-router/react-navigation": { ThemeProvider: "ThemeProvider" },
      "expo-status-bar": { StatusBar: "StatusBar" },
      "@/components/ui/app-button": { AppButton: "AppButton" },
      "@/components/ui/app-text": { AppText: "AppText" },
      "./screen-safe-area": { ScreenSafeArea: "ScreenSafeArea" },
      "@/hooks/use-i18n": {
        useI18n: () => ({
          t: (key: Parameters<typeof translate>[1]) => translate(locale, key),
        }),
      },
      "@/theme": {
        lightTheme: {
          colors: { background: "background" },
          spacing: { xl: 24, lg: 16 },
          layout: { sessionContentMaxWidth: 400 },
        },
      },
    });
    const { RouteErrorScreen } = load<{
      RouteErrorScreen: (props: {
        error: Error;
        retry: () => Promise<void>;
      }) => Element;
    }>("src/components/common/route-error-screen.tsx");
    const tree = RouteErrorScreen({
      error: new Error("private-token=secret; /internal/route.ts:123"),
      retry: async () => {
        retries++;
      },
    });
    const elements = nodes(tree);
    assert.ok(
      elements.some(
        (node) =>
          node.props.children === translate(locale, "common.screenErrorTitle"),
      ),
    );
    assert.ok(
      elements.some((node) => node.props.accessibilityRole === "alert"),
    );
    assert.doesNotMatch(
      JSON.stringify(tree),
      /private-token|secret|internal\/route/,
    );
    const retry = elements.find((node) => node.type === "AppButton");
    assert.ok(retry);
    assert.equal(retry.props.children, translate(locale, "common.retry"));
    (retry.props.onPress as () => void)();
    assert.equal(retries, 1);
  });
}
