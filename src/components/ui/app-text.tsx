import type { ComponentProps } from "react";
import { StyleSheet, Text } from "react-native";

import { useAppTheme } from "@/hooks/use-app-theme";

type TextVariant =
  | "body"
  | "bodyLarge"
  | "caption"
  | "heading"
  | "title"
  | "subheading"
  | "label"
  | "link";

type AppTextProps = ComponentProps<typeof Text> & {
  variant?: TextVariant;
  tone?: "default" | "muted" | "primary" | "error";
};

export function AppText({
  style,
  variant = "body",
  tone = "default",
  ...props
}: AppTextProps) {
  const theme = useAppTheme();

  const variantStyle = {
    body: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.sm,
    },
    bodyLarge: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.md,
      lineHeight: theme.typography.lineHeight.md,
    },
    caption: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.xs,
      lineHeight: theme.typography.lineHeight.xs,
    },
    heading: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: theme.typography.fontSize.xxl,
      lineHeight: theme.typography.lineHeight.xxl,
    },
    title: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: theme.typography.fontSize.xxl,
      lineHeight: theme.typography.lineHeight.xxl,
    },
    subheading: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: theme.typography.fontSize.lg,
      lineHeight: theme.typography.lineHeight.lg,
    },
    label: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.sm,
    },
    link: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.sm,
    },
  }[variant];

  const color = {
    default: theme.colors.text,
    muted: theme.colors.textSecondary,
    primary: theme.colors.primaryText,
    error: theme.colors.error,
  }[tone];

  return (
    <Text {...props} style={[styles.base, variantStyle, { color }, style]} />
  );
}

const styles = StyleSheet.create({
  base: {
    flexShrink: 1,
  },
});
