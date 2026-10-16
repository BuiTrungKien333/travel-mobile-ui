import type { ReactNode } from "react";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import { HomeHeader } from "./home-header";

export function HomePage({
  children,
  showHeader = false,
  backdrop,
}: {
  children: ReactNode;
  showHeader?: boolean;
  backdrop?: ReactNode;
}) {
  const theme = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      {backdrop ? (
        <View pointerEvents="none" aria-hidden style={StyleSheet.absoluteFill}>
          {backdrop}
        </View>
      ) : null}
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            padding: theme.spacing.lg,
            paddingBottom: tabBarHeight + theme.spacing.lg,
          },
        ]}
      >
        <View
          style={[
            styles.width,
            { maxWidth: theme.layout.contentMaxWidth, gap: theme.spacing.xl },
          ]}
        >
          {showHeader ? <HomeHeader /> : null}
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function EnterSection({
  children,
  animated = true,
}: {
  children: ReactNode;
  animated?: boolean;
}) {
  const theme = useAppTheme();
  const style = [styles.section, { gap: theme.spacing.lg }];
  if (!animated) return <View style={style}>{children}</View>;

  const entering = FadeInDown.duration(theme.motion.enterDuration).reduceMotion(
    ReduceMotion.System,
  );
  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}

export function SurfaceCard({
  children,
  tinted = false,
}: {
  children: ReactNode;
  tinted?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        {
          padding: theme.spacing.lg,
          gap: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          borderColor: theme.colors.border,
          backgroundColor: tinted
            ? theme.colors.surfaceTint
            : theme.colors.surface,
        },
      ]}
    >
      {children}
    </View>
  );
}

export function SectionHeading({
  title,
  action,
  onPress,
  variant = "title",
}: {
  title: string;
  action?: string;
  onPress?: () => void;
  variant?: "title" | "eyebrow";
}) {
  const theme = useAppTheme();
  const isEyebrow = variant === "eyebrow";
  return (
    <View style={[styles.row, { gap: theme.spacing.sm }]}>
      <AppText
        accessibilityRole="header"
        tone={isEyebrow ? "muted" : "default"}
        style={[
          styles.grow,
          {
            fontFamily: isEyebrow
              ? theme.typography.fontFamily.semibold
              : theme.typography.fontFamily.bold,
            fontSize: isEyebrow
              ? theme.typography.fontSize.xs
              : theme.typography.fontSize.md,
            lineHeight: isEyebrow
              ? theme.typography.lineHeight.xs
              : theme.typography.lineHeight.md,
          },
        ]}
      >
        {title}
      </AppText>
      {action && onPress ? (
        <TextAction label={action} onPress={onPress} />
      ) : null}
    </View>
  );
}

export function TextAction({
  label,
  onPress,
  icon = "chevron",
  compact = false,
}: {
  label: string;
  onPress: () => void;
  icon?: AppIconName;
  compact?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={compact ? theme.spacing.sm : undefined}
      style={({ pressed }) => [
        styles.row,
        {
          minHeight: compact ? theme.spacing.xxl : theme.layout.touchTarget,
          paddingHorizontal: theme.spacing.none,
          paddingVertical: compact
            ? theme.layout.compactTextActionPaddingVertical
            : theme.spacing.none,
          maxWidth: "100%",
          gap: compact ? theme.spacing.xxs : theme.spacing.xs,
          opacity: pressed ? theme.motion.pressOpacity : 1,
        },
      ]}
    >
      <AppText
        variant="link"
        tone="primary"
        style={
          compact
            ? { includeFontPadding: false, textAlignVertical: "center" }
            : undefined
        }
      >
        {label}
      </AppText>
      <AppIcon
        name={icon}
        size={compact ? theme.spacing.lg : theme.layout.iconSmall}
      />
    </Pressable>
  );
}

export function Badge({
  label,
  dark = false,
  icon,
}: {
  label: string;
  dark?: boolean;
  icon?: AppIconName;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.badge,
        {
          borderRadius: theme.radius.full,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          gap: theme.spacing.xs,
          backgroundColor: dark
            ? theme.colors.heroSurface
            : theme.colors.surfaceTint,
        },
      ]}
    >
      {icon ? (
        <AppIcon
          name={icon}
          color={dark ? theme.colors.onHero : theme.colors.primaryText}
          size={theme.layout.iconSmall}
        />
      ) : null}
      <AppText
        variant="caption"
        style={{
          fontFamily: theme.typography.fontFamily.medium,
          color: dark ? theme.colors.onHero : theme.colors.primaryText,
        }}
      >
        {label}
      </AppText>
    </View>
  );
}

export function PreviewNotice() {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const { openPanel } = useTripPreview((state) => ({
    openPanel: state.openPanel,
  }));
  return (
    <View style={[styles.row, { gap: theme.spacing.sm, flexWrap: "wrap" }]}>
      <View style={styles.grow}>
        <AppText variant="caption" tone="muted">
          {copy.sample}
        </AppText>
        <AppText variant="caption" tone="muted">
          {copy.mockDate}
        </AppText>
      </View>
      <TextAction
        label={copy.preview}
        icon="tune"
        onPress={() => openPanel({ kind: "scenarios" })}
      />
    </View>
  );
}

export const homeStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  grow: { flex: 1, minWidth: 0 },
});
const styles = StyleSheet.create({
  ...homeStyles,
  flex: { flex: 1 },
  scroll: { alignItems: "center", flexGrow: 1 },
  width: { width: "100%" },
  section: { width: "100%", flexShrink: 0 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderCurve: "continuous" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    flexShrink: 1,
  },
});
