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
  const backdrop = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="800" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="mist"><stop stop-color="${theme.colors.surfaceTint}"/><stop offset="1" stop-color="${theme.colors.background}"/></radialGradient></defs><rect width="400" height="800" fill="${theme.colors.background}"/><ellipse cx="200" cy="330" rx="300" ry="340" fill="url(#mist)"/></svg>`,
  )}`;

  return (
    <ScreenSafeArea
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <Image
        accessible={false}
        pointerEvents="none"
        source={{ uri: backdrop }}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
      />
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
          <View
            style={{
              alignSelf: "center",
              padding: theme.spacing.xl,
              backgroundColor: theme.colors.glassFallback,
              borderRadius: theme.radius.xl,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.glassBorder,
              boxShadow: [
                { ...theme.elevation.glass, color: theme.colors.glassShadow },
              ],
            }}
          >
            <Image
              accessibilityLabel={t("common.logoAccessibility")}
              contentFit="contain"
              source={require("@/assets/images/logo.png")}
              style={{
                width: theme.layout.sessionLogoWidth,
                height:
                  theme.layout.sessionLogoWidth *
                  (theme.layout.headerLogoHeight /
                    theme.layout.headerLogoWidth),
              }}
            />
          </View>
          <View style={{ gap: theme.spacing.sm }}>
            <AppText
              accessibilityRole="header"
              variant="subheading"
              style={styles.centered}
            >
              {t(failed ? "auth.session.restoreFailed" : "auth.login.title")}
            </AppText>
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
