import { router } from "expo-router";
import { canConfigureServer } from "@/services/api/server-connection";
import { Image } from "expo-image";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { ScreenSafeArea } from "@/components/common/screen-safe-area";

import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAmbientMotion } from "@/hooks/use-ambient-motion";
import { useI18n } from "@/hooks/use-i18n";
import { authSession } from "../services/auth-session";
import { authErrorMessage } from "../utils/auth-error-message";

export function SessionGate({ failed }: { failed: boolean }) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const progress = useAmbientMotion(!failed, {
    duration: theme.motion.sessionRestoreDuration,
    reverse: true,
  });
  const travelDistance = theme.layout.sessionProgressWidth * (2 / 3);
  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.get() * travelDistance }],
  }));

  return (
    <ScreenSafeArea
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { padding: theme.spacing.xl }]}
      >
        <View
          style={[
            styles.body,
            {
              maxWidth: theme.layout.sessionContentMaxWidth,
              gap: theme.spacing.xl,
            },
          ]}
        >
          <Image
            accessibilityLabel={t("common.logoAccessibility")}
            contentFit="contain"
            source={require("@/assets/images/wego-wordmark.png")}
            style={{ width: theme.layout.sessionLogoWidth, height: theme.layout.headerLogoHeight * 2, alignSelf: "center" }}
          />
          <View style={{ gap: theme.spacing.sm }}>
            {failed ? <AppText accessibilityRole="header" variant="subheading" style={styles.centered}>{t("auth.session.restoreFailed")}</AppText> : null}
            <AppText
              accessibilityRole={failed ? "alert" : undefined}
              accessibilityLiveRegion="polite"
              variant={failed ? "bodyLarge" : "body"}
              tone="muted"
              style={styles.centered}
            >
              {failed
                ? authErrorMessage(authSession.getRestoreError(), t)
                : t("auth.session.restoring")}
            </AppText>
          </View>
          {failed ? (
            <AppButton
              size="small"
              variant="soft"
              onPress={() => void authSession.restore()}
            >
              {t("common.retry")}
            </AppButton>
          ) : (
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={t("auth.session.restoring")}
              accessibilityState={{ busy: true }}
              style={[
                styles.progress,
                {
                  width: theme.layout.sessionProgressWidth,
                  height: theme.layout.sessionProgressHeight,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.colors.softActionSurface,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressSegment,
                  {
                    width: theme.layout.sessionProgressWidth / 3,
                    borderRadius: theme.radius.full,
                    backgroundColor: theme.colors.primaryText,
                  },
                  progressStyle,
                ]}
              />
            </View>
          )}
          {failed && canConfigureServer ? <AppButton variant="outline" size="small" onPress={() => router.push("/connection")}>Kết nối máy chủ / Server</AppButton> : null}
        </View>
      </ScrollView>
    </ScreenSafeArea>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  body: { width: "100%" },
  centered: { textAlign: "center" },
  progress: { alignSelf: "center", overflow: "hidden" },
  progressSegment: { height: "100%" },
});
