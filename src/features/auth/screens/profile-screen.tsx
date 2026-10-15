import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LanguageSwitcher } from "@/components/common/language-switcher";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { useLogout, useProfile } from "../hooks/use-auth";
import { authErrorMessage } from "../utils/auth-error-message";

export function ProfileScreen() {
  const theme = useAppTheme();
  const { t } = useI18n();
  const profile = useProfile();
  const logout = useLogout();
  const handleLogout = async () => {
    if (logout.isPending) return;
    try {
      const revoked = await logout.mutateAsync();
      if (!revoked)
        Alert.alert(t("auth.session.logout"), t("auth.session.localLogout"));
    } catch (error) {
      Alert.alert(t("auth.session.logout"), authErrorMessage(error, t));
    }
  };
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { padding: theme.spacing.xl }]}
      >
        <View style={[styles.container, { gap: theme.spacing.xl }]}>
          <View style={styles.language}>
            <LanguageSwitcher />
          </View>
          <AppText accessibilityRole="header" variant="heading">
            {t("auth.profile.title")}
          </AppText>
          {profile.isPending ? (
            <ActivityIndicator
              color={theme.colors.primary}
              accessibilityLabel={t("auth.profile.loading")}
            />
          ) : null}
          {profile.isError ? (
            <View style={{ gap: theme.spacing.md }}>
              <AppText accessibilityRole="alert" tone="error">
                {authErrorMessage(profile.error, t)}
              </AppText>
              <AppButton
                loading={profile.isFetching}
                onPress={() => void profile.refetch()}
                variant="outline"
              >
                {t("common.retry")}
              </AppButton>
            </View>
          ) : null}
          {profile.data ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.lg,
                  padding: theme.spacing.xl,
                  gap: theme.spacing.md,
                },
              ]}
            >
              <AppText variant="label">{t("auth.register.fullName")}</AppText>
              <AppText>{profile.data.fullName}</AppText>
              <AppText variant="label">{t("common.email")}</AppText>
              <AppText>{profile.data.email}</AppText>
            </View>
          ) : null}
          <AppButton
            loading={logout.isPending}
            onPress={() => void handleLogout()}
            variant="outline"
          >
            {t("auth.session.logout")}
          </AppButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, alignItems: "center" },
  container: { width: "100%", maxWidth: 480 },
  language: { alignItems: "flex-end" },
  card: { borderWidth: 1 },
});
