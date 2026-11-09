import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/js-tabs";

import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { useAuthStore } from "@/store/use-auth-store";
import { ProfileEditor } from "../components/profile-editor";
import { ProfileIdentityCard } from "../components/profile-identity-card";
import { ProfilePreferences } from "../components/profile-preferences";
import { ProfileMenuRow, ProfileSection } from "../components/profile-section";
import { ProfileSettingsSheet } from "../components/profile-settings-sheet";
import { useLogout, useProfile } from "../hooks/use-auth";
import { useProfileCopy } from "../i18n/profile-copy";
import { authSession } from "../services/auth-session";
import type { AuthUser } from "../types/auth-types";
import { authErrorMessage } from "../utils/auth-error-message";

const logoLeftInsetRatio = 307 / 2172;
const previewUser: AuthUser = {
  id: "profile-preview",
  fullName: "Kiên Bùi Trung",
  email: "travel-demo@example.com",
  role: "USER",
};

export function ProfileScreen({ isPreview = false }: { isPreview?: boolean; } = {}) {
  const theme = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { t } = useI18n();
  const { copy } = useProfileCopy();
  const profile = useProfile();
  const logout = useLogout();
  const authenticated = useAuthStore((state) => state.status === "authenticated");
  const user = profile.data ?? (isPreview ? previewUser : undefined);
  const [panel, setPanel] = useState<"privacy" | "settings" | null>(null);
  const [editing, setEditing] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    if (logout.isPending) return;
    setLogoutError(null);
    const version = authSession.getVersion();
    try {
      const revoked = await logout.mutateAsync();
      if (!revoked && authSession.getVersion() === version + 1) {
        router.replace({ pathname: "/(auth)/login", params: { notice: "local-logout" } });
      }
    } catch (error) {
      setLogoutError(authErrorMessage(error, t));
    }
  }

  return (
    <ScreenSafeArea edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xs, paddingBottom: tabBarHeight + theme.spacing.xl }}
      >
        <View style={{ width: "100%", maxWidth: theme.layout.contentMaxWidth, gap: theme.spacing.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Image accessible={false} source={require("@/assets/images/logo.png")} contentFit="contain" style={{ width: theme.layout.headerLogoWidth, height: theme.layout.headerLogoHeight, marginLeft: -theme.layout.headerLogoWidth * logoLeftInsetRatio }} />
            <Pressable accessibilityRole="button" accessibilityLabel={copy.settings} onPress={() => setPanel("settings")} style={({ pressed }) => ({ width: theme.layout.compactTouchTarget, minHeight: theme.layout.compactTouchTarget, alignItems: "center", justifyContent: "center", opacity: pressed ? theme.motion.pressOpacity : 1 })}>
              <AppIcon name="tune" size={theme.layout.iconMedium} color={theme.colors.primaryText} />
            </Pressable>
          </View>
          <AppText accessibilityRole="header" variant="subheading">{t("auth.profile.title")}</AppText>
          {!isPreview && profile.isLoading ? (
            <View style={{ alignItems: "center", gap: theme.spacing.sm, padding: theme.spacing.lg }}>
              <ActivityIndicator color={theme.colors.primary} accessibilityLabel={t("auth.profile.loading")} />
              <AppText tone="muted" accessibilityLiveRegion="polite">{t("auth.profile.loading")}</AppText>
            </View>
          ) : null}
          {!isPreview && profile.isError ? (
            <View style={{ gap: theme.spacing.sm }}>
              <AppText accessibilityRole="alert" tone="error">{authErrorMessage(profile.error, t)}</AppText>
              <AppButton variant="outline" loading={profile.isFetching} onPress={() => void profile.refetch()}>{t("common.retry")}</AppButton>
            </View>
          ) : null}
          {user ? <ProfileIdentityCard user={user} onEdit={isPreview ? undefined : () => setEditing((value) => !value)} /> : null}
          {!user && !profile.isLoading && !profile.isError ? <AppText tone="muted">{t("auth.profile.empty")}</AppText> : null}
          {editing && user && !isPreview ? (
            <ProfileSection title={t("auth.profile.edit")}>
              <View style={{ padding: theme.spacing.md }}>
                <ProfileEditor key={user.id} user={user} onDone={() => setEditing(false)} />
              </View>
            </ProfileSection>
          ) : null}
          <ProfilePreferences key={user?.id ?? "anonymous"} />
          <ProfileSection title={copy.security}>
            <ProfileMenuRow icon="edit" title={t("auth.profile.changePassword")} onPress={() => router.push("/forgot-password")} />
            <ProfileMenuRow icon="info" title={copy.privacy} onPress={() => setPanel("privacy")} divider={false} />
          </ProfileSection>
          {logoutError ? <AppText accessibilityRole="alert" tone="error">{logoutError}</AppText> : null}
          {authenticated || isPreview ? (
            <AppButton variant="outline" loading={logout.isPending} onPress={() => void handleLogout()} style={{ borderColor: theme.colors.error }} leadingIcon={<AppIcon name="logout" size={theme.layout.iconMedium} color={theme.colors.error} />}>
              <AppText variant="label" tone="error">{t("auth.session.logout")}</AppText>
            </AppButton>
          ) : null}
        </View>
      </ScrollView>
      {panel ? <ProfileSettingsSheet panel={panel} onClose={() => setPanel(null)} /> : null}
    </ScreenSafeArea>
  );
}
