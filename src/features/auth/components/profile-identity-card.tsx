import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import type { AuthUser } from "../types/auth-types";

export function ProfileIdentityCard({ user, onEdit }: { user: AuthUser; onEdit?: () => void; }) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const role = user.role === "ADMIN" ? "auth.profile.adminRole" : user.role === "GUEST" ? "auth.profile.guestRole" : "auth.profile.memberRole";
  const initials = user.fullName.trim().split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.lg, borderRadius: theme.radius.lg, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
      <GlassBackdrop borderRadius={theme.radius.lg} />
      <View style={{ width: theme.layout.profileAvatarSize, height: theme.layout.profileAvatarSize, borderRadius: theme.radius.full, backgroundColor: theme.colors.surfaceTint, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
        {user.avatarUrl ? <Image source={{ uri: user.avatarUrl }} contentFit="cover" style={StyleSheet.absoluteFill} accessible={false} /> : <AppText variant="subheading" tone="primary">{initials}</AppText>}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: theme.spacing.xxs }}>
        <AppText variant="sectionTitle">{user.fullName}</AppText>
        <AppText variant="caption" tone="muted" selectable>{user.email}</AppText>
        <AppText variant="caption" tone="primary">{t(role)}</AppText>
      </View>
      {onEdit ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t("auth.profile.edit")} onPress={onEdit} style={({ pressed }) => ({ width: theme.layout.compactTouchTarget, minHeight: theme.layout.compactTouchTarget, alignItems: "center", justifyContent: "center", opacity: pressed ? theme.motion.pressOpacity : 1 })}>
          <AppIcon name="edit" size={theme.layout.iconMedium} color={theme.colors.primaryText} />
        </Pressable>
      ) : null}
    </View>
  );
}
