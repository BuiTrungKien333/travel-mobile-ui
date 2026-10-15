import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";

type AppButtonProps = {
  accessibilityHint?: string;
  children: ReactNode;
  disabled?: boolean;
  leadingIcon?: ReactNode;
  loading?: boolean;
  onPress: () => void;
  variant?: "primary" | "outline" | "hero";
};

export function AppButton({
  accessibilityHint,
  children,
  disabled = false,
  leadingIcon,
  loading = false,
  onPress,
  variant = "primary",
}: AppButtonProps) {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;
  const isPrimary = variant === "primary";
  const isHero = variant === "hero";
  const backgroundColor = isHero
    ? theme.colors.heroSurface
    : isPrimary
      ? theme.colors.primary
      : theme.colors.surface;
  const foregroundColor = isHero
    ? theme.colors.onHero
    : isPrimary
      ? theme.colors.onPrimary
      : theme.colors.text;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={typeof children === "string" ? children : undefined}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor:
            isPrimary || isHero ? backgroundColor : theme.colors.borderStrong,
          borderRadius: isHero ? theme.radius.xl : theme.radius.md,
          opacity: isDisabled ? 0.55 : pressed ? 0.82 : 1,
          paddingHorizontal: theme.spacing.xl,
        },
      ]}
    >
      <View style={[styles.content, { gap: theme.spacing.sm }]}>
        {loading ? (
          <ActivityIndicator
            color={
              isPrimary || isHero ? foregroundColor : theme.colors.primaryText
            }
          />
        ) : (
          leadingIcon
        )}
        <AppText
          style={{
            color: foregroundColor,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.sm,
            lineHeight: theme.typography.lineHeight.sm,
          }}
        >
          {children}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderCurve: "continuous",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
