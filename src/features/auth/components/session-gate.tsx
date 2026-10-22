import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";

import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { authSession } from "../services/auth-session";
import { authErrorMessage } from "../utils/auth-error-message";

export function SessionGate({ failed }: { failed: boolean }) {
  const theme = useAppTheme();
  const { t } = useI18n();
  return (
    <ScreenSafeArea
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        {failed ? (
          <>
            <AppText accessibilityRole="alert" tone="error">
              {authErrorMessage(authSession.getRestoreError(), t)}
            </AppText>
            <AppButton onPress={() => void authSession.restore()}>
              {t("common.retry")}
            </AppButton>
          </>
        ) : (
          <>
            <ActivityIndicator
              accessibilityLabel={t("auth.session.restoring")}
              color={theme.colors.primary}
            />
            <AppText>{t("auth.session.restoring")}</AppText>
          </>
        )}
      </View>
    </ScreenSafeArea>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center" },
});
