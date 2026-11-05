import { router } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import { ProfileEditor } from "../components/profile-editor";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { useLogout, useProfile } from "../hooks/use-auth";
import { authErrorMessage } from "../utils/auth-error-message";

export function ProfileScreen() {
  const theme = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { t } = useI18n();
  const profile = useProfile();
  const logout = useLogout();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const handleLogout = async () => {
    if (logout.isPending) return;
    setLogoutError(null);
    try {
      const revoked = await logout.mutateAsync();
      if (!revoked)
        Alert.alert(t("auth.session.logout"), t("auth.session.localLogout"));
    } catch (error) {
      setLogoutError(authErrorMessage(error, t));
    }
  };

  const roleLabel =
    profile.data?.role === "ADMIN"
      ? t("auth.profile.adminRole")
      : profile.data?.role === "GUEST"
        ? t("auth.profile.guestRole")
        : t("auth.profile.memberRole");
  const displayName = profile.data?.fullName.replace(/\s+—\s*Demo$/i, "");

  return (
    <ScreenSafeArea
      edges={["top", "left", "right"]}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: theme.spacing.xl,
            paddingTop: theme.spacing.md,
            paddingBottom: tabBarHeight + theme.spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { gap: theme.spacing.xl }]}>
          <View style={styles.topBar}>
            <View style={{ gap: theme.spacing.xxs }}>
              <Image
                accessible
                accessibilityLabel="Wego"
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
            </View>
          </View>

          <AppText tone="muted">{t("auth.profile.subtitle")}</AppText>

          {profile.isPending ? (
            <View
              accessibilityLabel={t("auth.profile.loading")}
              accessibilityRole="progressbar"
              style={[
                styles.loadingCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.xl,
                  padding: theme.spacing.xl,
                  gap: theme.spacing.md,
                },
              ]}
            >
              <ActivityIndicator color={theme.colors.primary} />
              <AppText tone="muted">{t("auth.profile.loading")}</AppText>
            </View>
          ) : null}

          {profile.isError ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.xl,
                  padding: theme.spacing.xl,
                  gap: theme.spacing.md,
                },
              ]}
            >
              <AppText accessibilityRole="alert" tone="error">
                {authErrorMessage(profile.error, t)}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ busy: profile.isFetching }}
                disabled={profile.isFetching}
                onPress={() => void profile.refetch()}
                style={({ pressed }) => [
                  styles.retry,
                  {
                    backgroundColor: theme.colors.surfaceTint,
                    borderRadius: theme.radius.md,
                    opacity: pressed || profile.isFetching ? 0.7 : 1,
                  },
                ]}
              >
                {profile.isFetching ? (
                  <ActivityIndicator color={theme.colors.primaryText} />
                ) : null}
                <AppText style={{ color: theme.colors.primaryText }}>
                  {t("common.retry")}
                </AppText>
              </Pressable>
            </View>
          ) : null}

          {profile.data ? (
            <>
              <View
                style={[
                  styles.hero,
                  {
                    backgroundColor: theme.colors.heroSurface,
                    borderRadius: theme.radius.xl,
                    padding: theme.spacing.xl,
                    gap: theme.spacing.lg,
                  },
                ]}
              >
                <View
                  accessibilityLabel={displayName}
                  accessibilityRole="image"
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.onHeroMuted,
                    },
                  ]}
                >
                  <AppText
                    style={{
                      color: theme.colors.onPrimary,
                      fontFamily: theme.typography.fontFamily.bold,
                    }}
                    variant="heading"
                  >
                    {getInitials(displayName ?? profile.data.fullName)}
                  </AppText>
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: theme.spacing.xs }}>
                  <AppText
                    numberOfLines={2}
                    style={{ color: theme.colors.onHero }}
                    variant="heading"
                  >
                    {displayName}
                  </AppText>
                  <AppText
                    numberOfLines={2}
                    style={{ color: theme.colors.onHeroMuted }}
                  >
                    {profile.data.email}
                  </AppText>
                  <View
                    style={[
                      styles.roleBadge,
                      {
                        backgroundColor: theme.colors.navigationTint,
                        borderRadius: theme.radius.full,
                        marginTop: theme.spacing.xs,
                      },
                    ]}
                  >
                    <AppIcon
                      name="check"
                      color={theme.colors.onHero}
                      size={theme.layout.iconSmall}
                    />
                    <AppText
                      style={{ color: theme.colors.onHero }}
                      variant="caption"
                    >
                      {roleLabel}
                    </AppText>
                  </View>
                </View>
              </View>

              <View style={{ gap: theme.spacing.md }}>
                <AppText variant="label">
                  {t("auth.profile.details")}
                </AppText>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.xl,
                      paddingHorizontal: theme.spacing.lg,
                    },
                  ]}
                >
                  <DetailRow
                    icon="person"
                    label={t("auth.register.fullName")}
                    value={displayName ?? profile.data.fullName}
                  />
                  <View
                    style={{
                      height: StyleSheet.hairlineWidth,
                      backgroundColor: theme.colors.divider,
                      marginLeft: theme.layout.compactTouchTarget + theme.spacing.md,
                    }}
                  />
                  <DetailRow
                    icon="email"
                    label={t("common.email")}
                    value={profile.data.email}
                  />
                </View>
                {editing ? <ProfileEditor user={profile.data} onDone={() => setEditing(false)} /> : (
                  <AppButton variant="outline" onPress={() => setEditing(true)}>{t("auth.profile.edit")}</AppButton>
                )}
              </View>

              <View style={{ gap: theme.spacing.md }}>
                <AppText variant="label">
                  {t("auth.profile.preferences")}
                </AppText>
                <View
                  style={[
                    styles.card,
                    styles.preferenceCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.xl,
                      padding: theme.spacing.lg,
                      gap: theme.spacing.md,
                    },
                  ]}
                >
                  <View style={styles.preferenceCopy}>
                    <AppText variant="label">
                      {t("auth.profile.language")}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {t("auth.profile.languageHint")}
                    </AppText>
                  </View>
                  <LanguageSwitcher />
                </View>
              </View>

              <View style={{ gap: theme.spacing.md }}>
                <AppText variant="label">
                  {t("auth.profile.security")}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("auth.profile.changePassword")}
                  onPress={() => router.push("/forgot-password")}
                  style={({ pressed }) => [
                    styles.actionRow,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.xl,
                      minHeight: theme.layout.touchTarget + theme.spacing.md,
                      opacity: pressed ? theme.motion.pressOpacity : 1,
                      paddingHorizontal: theme.spacing.lg,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconFrame,
                      {
                        backgroundColor: theme.colors.surfaceTint,
                        borderRadius: theme.radius.md,
                      },
                    ]}
                  >
                    <AppIcon
                      name="edit"
                      color={theme.colors.primaryText}
                      size={theme.layout.iconMedium}
                    />
                  </View>
                  <View style={{ flex: 1, gap: theme.spacing.xxs }}>
                    <AppText variant="label">
                      {t("auth.profile.changePassword")}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {t("auth.profile.changePasswordHint")}
                    </AppText>
                  </View>
                  <AppIcon
                    name="chevron"
                    color={theme.colors.textSecondary}
                    size={theme.layout.iconSmall}
                  />
                </Pressable>
              </View>
            </>
          ) : null}

          {logoutError ? (
            <AppText accessibilityRole="alert" tone="error">
              {logoutError}
            </AppText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: logout.isPending, disabled: logout.isPending }}
            disabled={logout.isPending}
            onPress={() => void handleLogout()}
            style={({ pressed }) => [
              styles.logout,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.borderStrong,
                borderRadius: theme.radius.md,
                minHeight: theme.layout.touchTarget + theme.spacing.xs,
                opacity: pressed || logout.isPending ? 0.7 : 1,
              },
            ]}
          >
            {logout.isPending ? (
              <ActivityIndicator color={theme.colors.error} />
            ) : (
              <AppIcon
                name="back"
                color={theme.colors.error}
                size={theme.layout.iconMedium}
              />
            )}
            <AppText style={{ color: theme.colors.error }} variant="label">
              {t("auth.session.logout")}
            </AppText>
          </Pressable>
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
        styles.detailRow,
        {
          gap: theme.spacing.md,
          minHeight: theme.layout.touchTarget + theme.spacing.md,
          paddingVertical: theme.spacing.md,
        },
      ]}
    >
      <View
        style={[
          styles.iconFrame,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <AppIcon
          name={icon}
          color={theme.colors.primaryText}
          size={theme.layout.iconMedium}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: theme.spacing.xxs }}>
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
  container: { width: "100%", maxWidth: 560 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  card: { borderWidth: 1, overflow: "hidden" },
  hero: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  roleBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5 },
  detailRow: { flexDirection: "row", alignItems: "center" },
  iconFrame: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  preferenceCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" },
  preferenceCopy: { flex: 1, minWidth: 150, gap: 4 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1 },
  loadingCard: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1 },
  retry: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16 },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1 },
});
