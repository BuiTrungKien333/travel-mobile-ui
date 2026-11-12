import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";

export function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const theme = useAppTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <AppText variant="caption" tone="muted" accessibilityRole="header">
        {title}
      </AppText>
      <View
        style={{
          borderRadius: theme.radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          overflow: "hidden",
          backgroundColor: theme.colors.surface,
        }}
      >
        <GlassBackdrop borderRadius={theme.radius.lg} />
        {children}
      </View>
    </View>
  );
}

export function ProfileMenuRow({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
  divider = true,
}: {
  icon: AppIconName;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  divider?: boolean;
}) {
  const theme = useAppTheme();
  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        minHeight: theme.layout.touchTarget,
        borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
        borderBottomColor: theme.colors.border,
      }}
    >
      <AppIcon
        name={icon}
        size={theme.layout.iconMedium}
        color={theme.colors.primaryText}
      />
      <View style={{ flex: 1, minWidth: 0, gap: theme.spacing.xxs }}>
        <AppText variant="label">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing ??
        (onPress ? (
          <AppIcon
            name="chevron"
            size={theme.layout.iconSmall}
            color={theme.colors.textSecondary}
          />
        ) : null)}
    </View>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ""}`}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? theme.motion.pressOpacity : 1,
      })}
    >
      {content}
    </Pressable>
  ) : (
    content
  );
}
