import { Image } from "expo-image";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";

type AuthScaffoldProps = {
  children: ReactNode;
  footer: ReactNode;
  showLogo?: boolean;
  subtitle: string;
  title: string;
};

export function AuthScaffold({
  children,
  footer,
  showLogo = false,
  subtitle,
  title,
}: AuthScaffoldProps) {
  const theme = useAppTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.xxl,
          },
        ]}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { gap: theme.spacing.xxl }]}>
          <View style={[styles.header, { gap: theme.spacing.sm }]}>
            {showLogo ? (
              <View
                style={[
                  styles.logoFrame,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.xl,
                    marginBottom: theme.spacing.md,
                  },
                ]}
              >
                <Image
                  accessibilityLabel="Logo Tripzy"
                  contentFit="contain"
                  source={require("@/assets/images/react-logo.png")}
                  style={styles.logo}
                />
              </View>
            ) : null}
            <AppText accessibilityRole="header" style={styles.title} variant="heading">
              {title}
            </AppText>
            <AppText style={styles.subtitle} tone="muted">
              {subtitle}
            </AppText>
          </View>

          {children}

          <View style={styles.footer}>{footer}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    width: "100%",
    maxWidth: 480,
  },
  header: {
    alignItems: "center",
  },
  logoFrame: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderCurve: "continuous",
  },
  logo: {
    width: 46,
    height: 42,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    maxWidth: 340,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
  },
});
