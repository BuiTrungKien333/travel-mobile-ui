import type { ErrorBoundaryProps } from "expo-router";
import { ThemeProvider } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useI18n } from "@/hooks/use-i18n";
import { lightTheme as theme } from "@/theme";
import { ScreenSafeArea } from "./screen-safe-area";

/** Also works when the root layout (and its providers) failed to render. */
export function RouteErrorScreen({ retry }: ErrorBoundaryProps) {
  const { t } = useI18n();

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider value={theme}>
        <StatusBar style="dark" />
        <ScreenSafeArea style={styles.screen}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.message}>
              <AppText accessibilityRole="header" variant="subheading">
                {t("common.screenErrorTitle")}
              </AppText>
              <AppText
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                tone="muted"
              >
                {t("common.screenErrorHint")}
              </AppText>
              <AppButton onPress={() => void retry()}>
                {t("common.retry")}
              </AppButton>
            </View>
          </ScrollView>
        </ScreenSafeArea>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },

  message: {
    width: "100%",
    maxWidth: theme.layout.sessionContentMaxWidth,
    gap: theme.spacing.lg,
  },
});
