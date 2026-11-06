import type { ReactNode } from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
  type AccessibilityState,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";

type AppButtonProps = {
  accessibilityState?: AccessibilityState;
  accessibilityHint?: string;
  children: ReactNode;
  disabled?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  size?: "default" | "small";
  labelSize?: "default" | "large";
  variant?: "primary" | "outline" | "hero" | "soft" | "raised" | "gradient";
};

export function AppButton({
  accessibilityState,
  accessibilityHint,
  children,
  disabled = false,
  leadingIcon,
  trailingIcon,
  loading = false,
  onPress,
  style,
  size = "default",
  labelSize = "default",
  variant = "primary",
}: AppButtonProps) {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;
  const isPrimary = variant === "primary";
  const isHero = variant === "hero";
  const isSoft = variant === "soft";
  const isRaised = variant === "raised";
  const isGradient = variant === "gradient";
  const isSmall = size === "small";
  const gradientUri = isGradient
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="action" x1="0%" y1="0%" x2="100%" y2="0%"><stop stop-color="${theme.colors.gradientActionStart}"/><stop offset="1" stop-color="${theme.colors.gradientActionEnd}"/></linearGradient></defs><rect width="100" height="100" fill="url(#action)"/></svg>`,
      )}`
    : undefined;
  const backgroundColor = isGradient
    ? theme.colors.gradientActionStart
    : isRaised
      ? theme.colors.raisedActionSurface
      : isSoft
        ? theme.colors.softActionSurface
        : isHero
          ? theme.colors.heroSurface
          : isPrimary
            ? theme.colors.primary
            : theme.colors.surface;
  const foregroundColor = isGradient
    ? theme.colors.onGradientAction
    : isRaised
      ? theme.colors.onRaisedAction
      : isSoft
        ? theme.colors.onSoftAction
        : isHero
          ? theme.colors.onHero
          : isPrimary
            ? theme.colors.onPrimary
            : theme.colors.text;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={typeof children === "string" ? children : undefined}
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        busy: loading,
        disabled: isDisabled,
      }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor:
            isRaised && pressed
              ? theme.colors.raisedActionPressed
              : isSoft && pressed
                ? theme.colors.softActionPressed
                : backgroundColor,
          borderColor: isRaised
            ? theme.colors.raisedActionBorder
            : isSoft
              ? theme.colors.softActionBorder
              : isPrimary || isHero || isGradient
                ? backgroundColor
                : theme.colors.borderStrong,
          borderRadius: isRaised
            ? theme.radius.lg
            : isHero
              ? theme.radius.xl
              : theme.radius.md,
          boxShadow: isRaised
            ? [
                {
                  ...theme.elevation.raisedActionHighlight,
                  color: theme.colors.raisedActionHighlight,
                },
                {
                  ...theme.elevation.raisedAction,
                  offsetY: pressed ? 0 : theme.elevation.raisedAction.offsetY,
                  color: theme.colors.raisedActionBorder,
                },
              ]
            : undefined,
          opacity: isDisabled ? 0.55 : pressed ? 0.82 : 1,
          minHeight: isSmall
            ? theme.layout.touchTarget
            : theme.layout.buttonHeight,
          paddingHorizontal: isSmall ? theme.spacing.lg : theme.spacing.xl,
          paddingVertical: isSmall ? theme.spacing.sm : theme.spacing.none,
        },
        isGradient ? styles.clipped : null,
        style,
      ]}
    >
      {gradientUri ? (
        <Image
          accessible={false}
          pointerEvents="none"
          source={{ uri: gradientUri }}
          contentFit="fill"
          cachePolicy="memory"
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View
        style={[
          styles.content,
          trailingIcon && !isGradient ? styles.fullWidth : null,
          { gap: theme.spacing.sm },
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={
              isPrimary || isHero || isSoft || isRaised || isGradient
                ? foregroundColor
                : theme.colors.primaryText
            }
          />
        ) : (
          leadingIcon
        )}
        <AppText
          style={{
            color: foregroundColor,
            flexShrink: 1,
            fontFamily: isGradient
              ? theme.typography.fontFamily.semibold
              : isRaised
                ? theme.typography.fontFamily.bold
                : isSoft
                  ? theme.typography.fontFamily.semibold
                  : theme.typography.fontFamily.medium,
            flex: trailingIcon && !isGradient ? 1 : undefined,
            textAlign: isRaised ? "center" : undefined,
            paddingHorizontal:
              isRaised && trailingIcon ? theme.spacing.xl : undefined,
            fontSize:
              labelSize === "large"
                ? theme.typography.fontSize.md
                : isSmall
                  ? theme.typography.fontSize.compactAction
                  : theme.typography.fontSize.sm,
            lineHeight:
              labelSize === "large"
                ? theme.typography.lineHeight.md
                : isSmall
                  ? theme.typography.lineHeight.compactAction
                  : theme.typography.lineHeight.sm,
          }}
        >
          {children}
        </AppText>
        {isRaised && trailingIcon ? (
          <View style={styles.raisedTrailing}>{trailingIcon}</View>
        ) : (
          trailingIcon
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  clipped: { overflow: "hidden" },
  fullWidth: { width: "100%" },
  raisedTrailing: { position: "absolute", right: 0 },
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderCurve: "continuous",
  },
  content: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
