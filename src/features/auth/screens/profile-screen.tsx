import { router } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { useAuthStore } from "@/store/use-auth-store";
import { useLogout, useProfile } from "../hooks/use-auth";
import { authSession } from "../services/auth-session";
import { authErrorMessage } from "../utils/auth-error-message";

export function ProfileScreen() {
  const theme = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { t } = useI18n();
  const profile = useProfile();
  const logout = useLogout();
  const authenticated = useAuthStore(
    (state) => state.status === "authenticated",
  );
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const user = profile.data;
  const roleKey =
    user?.role === "ADMIN"
      ? "auth.profile.adminRole"
      : user?.role === "GUEST"
        ? "auth.profile.guestRole"
        : "auth.profile.memberRole";

  const handleLogout = async () => {
    if (logout.isPending) return;
    setLogoutError(null);
    const version = authSession.getVersion();
    try {
      const revoked = await logout.mutateAsync();
      // A late logout response must not redirect a newly authenticated session.
      if (!revoked && authSession.getVersion() === version + 1)
        router.replace({
          pathname: "/(auth)/login",
          params: { notice: "local-logout" },
        });
    } catch (error) {
      setLogoutError(authErrorMessage(error, t));
    }
  };

  return (
    <ScreenSafeArea
      edges={["top", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: theme.spacing.xl,
            paddingTop: theme.spacing.lg,
            paddingBottom: tabBarHeight + theme.spacing.xl,
          },
        ]}
      >
        <View
          style={[
            styles.container,
            { maxWidth: theme.layout.contentMaxWidth, gap: theme.spacing.xl },
          ]}
        >
          <View style={{ gap: theme.spacing.sm }}>
            <Image
              accessible
              accessibilityLabel={t("common.logoAccessibility")}
              source={require("@/assets/images/logo.png")}
              contentFit="contain"
              style={{
                width: theme.layout.headerLogoWidth,
                height: theme.layout.headerLogoHeight,
              }}
            />
            <AppText accessibilityRole="header" variant="heading">
              {t("auth.profile.title")}
            </AppText>
            <AppText tone="muted">{t("auth.profile.subtitle")}</AppText>
          </View>
          {profile.isLoading ? (
            <View
              style={[
                styles.loading,
                { gap: theme.spacing.md, padding: theme.spacing.xl },
              ]}
            >
              <ActivityIndicator
                color={theme.colors.primary}
                accessibilityLabel={t("auth.profile.loading")}
              />
              <AppText tone="muted" accessibilityLiveRegion="polite">
                {t("auth.profile.loading")}
              </AppText>
            </View>
          ) : null}
          {profile.isError ? (
            <View style={{ gap: theme.spacing.md }}>
              <AppText accessibilityRole="alert" tone="error">
                {authErrorMessage(profile.error, t)}
              </AppText>
              <AppButton
                variant="outline"
                loading={profile.isFetching}
                onPress={() => {
                  void profile.refetch();
                }}
              >
                {t("common.retry")}
              </AppButton>
            </View>
          ) : null}
          {user ? (
            <>
              <View
                style={[
                  styles.hero,
                  {
                    gap: theme.spacing.lg,
                    backgroundColor: theme.colors.heroSurface,
                    borderRadius: theme.radius.lg,
                    padding: theme.spacing.xl,
                  },
                ]}
              >
                <View
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={user.fullName}
                  style={[
                    styles.center,
                    {
                      width: theme.layout.profileAvatarSize,
                      height: theme.layout.profileAvatarSize,
                      borderRadius: theme.radius.full,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                >
                  <AppText
                    variant="heading"
                    style={{ color: theme.colors.onPrimary }}
                  >
                    {getInitials(user.fullName)}
                  </AppText>
                </View>
                <View style={[styles.grow, { gap: theme.spacing.xs }]}>
                  <AppText
                    variant="heading"
                    style={{ color: theme.colors.onHero }}
                  >
                    {user.fullName}
                  </AppText>
                  <AppText
                    selectable
                    style={{ color: theme.colors.onHeroMuted }}
                  >
                    {user.email}
                  </AppText>
                  <AppText
                    variant="caption"
                    style={{ color: theme.colors.onHeroMuted }}
                  >
                    {t(roleKey)}
                  </AppText>
                </View>
              </View>
              <View style={{ gap: theme.spacing.md }}>
                <AppText variant="label">{t("auth.profile.details")}</AppText>
                <View
                  style={[
                    styles.card,
                    {
                      paddingHorizontal: theme.spacing.lg,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.radius.lg,
                    },
                  ]}
                >
                  <DetailRow
                    icon="person"
                    label={t("auth.register.fullName")}
                    value={user.fullName}
                  />
                  <View
                    style={{
                      height: StyleSheet.hairlineWidth,
                      backgroundColor: theme.colors.divider,
                    }}
                  />
                  <DetailRow
                    icon="email"
                    label={t("common.email")}
                    value={user.email}
                  />
                </View>
              </View>
            </>
          ) : !profile.isLoading && !profile.isError ? (
            <AppText tone="muted">{t("auth.profile.empty")}</AppText>
          ) : null}
          <View style={{ gap: theme.spacing.md }}>
            <AppText variant="label">{t("auth.profile.preferences")}</AppText>
            <View
              style={[
                styles.card,
                styles.preferences,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.lg,
                  padding: theme.spacing.lg,
                  gap: theme.spacing.md,
                },
              ]}
            >
              <View
                style={[
                  styles.grow,
                  {
                    flexBasis: theme.layout.profilePreferenceTextMinWidth,
                    gap: theme.spacing.xs,
                  },
                ]}
              >
                <AppText variant="label">{t("auth.profile.language")}</AppText>
                <AppText variant="caption" tone="muted">
                  {t("auth.profile.languageHint")}
                </AppText>
              </View>
              <LanguageSwitcher />
            </View>
          </View>
          {authenticated ? (
            <>
              <View style={{ gap: theme.spacing.md }}>
                <AppText variant="label">{t("auth.profile.security")}</AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("auth.profile.changePassword")}
                  accessibilityHint={t("auth.profile.changePasswordHint")}
                  onPress={() => router.push("/forgot-password")}
                  style={({ pressed }) => [
                    styles.card,
                    styles.action,
                    {
                      minHeight: theme.layout.touchTarget,
                      gap: theme.spacing.md,
                      padding: theme.spacing.lg,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.lg,
                      backgroundColor: theme.colors.glassFallback,
                      opacity: pressed ? theme.motion.pressOpacity : 1,
                    },
                  ]}
                >
                  <GlassBackdrop borderRadius={theme.radius.lg} />
                  <AppIcon
                    name="edit"
                    size={theme.layout.iconMedium}
                    color={theme.colors.primaryText}
                  />
                  <View style={[styles.grow, { gap: theme.spacing.xs }]}>
                    <AppText variant="label">
                      {t("auth.profile.changePassword")}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {t("auth.profile.changePasswordHint")}
                    </AppText>
                  </View>
                  <AppIcon
                    name="chevron"
                    size={theme.layout.iconSmall}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              </View>
              {logoutError ? (
                <AppText accessibilityRole="alert" tone="error">
                  {logoutError}
                </AppText>
              ) : null}
              <AppButton
                variant="outline"
                loading={logout.isPending}
                onPress={() => {
                  void handleLogout();
                }}
                style={{ borderColor: theme.colors.error }}
                leadingIcon={
                  <AppIcon
                    name="logout"
                    size={theme.layout.iconMedium}
                    color={theme.colors.error}
                  />
                }
              >
                <AppText variant="label" tone="error">
                  {t("auth.session.logout")}
                </AppText>
              </AppButton>
            </>
          ) : null}
        </View>
      </ScrollView>
    </ScreenSafeArea>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: "person" | "email";
  label: string;
  value: string;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.action,
        {
          minHeight: theme.layout.touchTarget,
          paddingVertical: theme.spacing.lg,
          gap: theme.spacing.md,
        },
      ]}
    >
      <AppIcon
        name={icon}
        size={theme.layout.iconMedium}
        color={theme.colors.primaryText}
      />
      <View style={[styles.grow, { gap: theme.spacing.xs }]}>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        <AppText selectable>{value}</AppText>
      </View>
    </View>
  );
}
function getInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase() ?? "")
    .join("");
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, alignItems: "center" },
  container: { width: "100%" },
  card: { borderWidth: 1, overflow: "hidden" },
  action: { flexDirection: "row", alignItems: "center" },
  hero: { flexDirection: "row", alignItems: "center" },
  grow: { flex: 1, minWidth: 0 },
  center: { alignItems: "center", justifyContent: "center" },
  loading: { alignItems: "center" },
  preferences: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
});
