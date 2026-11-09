import { Image } from "expo-image";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { LanguageSwitcher } from "@/components/common/language-switcher";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { useScreenInsets } from "@/hooks/use-screen-insets";

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
  const { t } = useI18n();
  const insets = useScreenInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: theme.spacing.xl,
            paddingTop: theme.spacing.xxl + insets.top,
            paddingBottom: theme.spacing.xxl + insets.bottom,
          },
        ]}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.container,
            {
              maxWidth: theme.layout.authContentMaxWidth,
              gap: theme.spacing.xxl,
            },
          ]}
        >
          <View style={styles.languageRow}>
            <LanguageSwitcher />
          </View>
          <View style={[styles.header, { gap: theme.spacing.sm }]}>
            {showLogo ? (
              <View style={{ marginBottom: theme.spacing.md }}>
                <Image
                  accessibilityLabel={t("common.logoAccessibility")}
                  contentFit="contain"
                  source={require("@/assets/images/logo.png")}
                  style={{
                    width: theme.layout.authLogoWidth,
                    height: theme.layout.authLogoHeight,
                  }}
                />
              </View>
            ) : null}
            <AppText
              accessibilityRole="header"
              style={styles.title}
              variant="title"
            >
              {title}
            </AppText>
            {subtitle ? (
              <AppText
                variant="bodyLarge"
                style={[
                  styles.subtitle,
                  { maxWidth: theme.layout.authDescriptionMaxWidth },
                ]}
                tone="muted"
              >
                {subtitle}
              </AppText>
            ) : null}
          </View>

          {children}

          {footer != null ? <View style={styles.footer}>{footer}</View> : null}
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
  },
  header: {
    alignItems: "center",
  },
  languageRow: {
    alignItems: "flex-end",
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
  },
});
