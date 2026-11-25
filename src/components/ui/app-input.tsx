import { SymbolView } from "expo-symbols";
import type { ComponentProps, ReactNode } from "react";
import { forwardRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextStyle,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";

type AppInputProps = ComponentProps<typeof TextInput> & {
  error?: string;
  helperText?: string;
  label: string;
  hideLabel?: boolean;
  compact?: boolean;
  labelVariant?: "label" | "caption";
  password?: boolean;
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
};

const webInputReset: TextStyle = Platform.select({
  web: { outlineWidth: 0, outlineStyle: "solid" },
  default: {},
});

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  {
    error,
    helperText,
    label,
    hideLabel = false,
    compact = false,
    labelVariant,
    leadingIcon,
    trailingAction,
    onBlur,
    onFocus,
    password = false,
    style,
    ...props
  },
  ref,
) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const supportingText = error ?? helperText;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      {!hideLabel ? (
        <AppText variant={labelVariant ?? (compact ? "caption" : "label")}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.inputShell,
          {
            ...(compact ? { minHeight: theme.layout.compactTouchTarget } : {}),
            backgroundColor: theme.colors.surface,
            borderColor: error
              ? theme.colors.error
              : focused
                ? theme.colors.focus
                : theme.colors.borderStrong,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        {leadingIcon ? (
          <View
            pointerEvents="none"
            aria-hidden
            style={{ paddingLeft: theme.spacing.md }}
          >
            {leadingIcon}
          </View>
        ) : null}
        <TextInput
          {...props}
          ref={ref}
          accessibilityLabel={label}
          allowFontScaling
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={theme.colors.textDisabled}
          secureTextEntry={password && !passwordVisible}
          selectionColor={theme.colors.primary}
          underlineColorAndroid="transparent"
          style={[
            styles.input,
            webInputReset,
            {
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.fontSize.sm,
              lineHeight: theme.typography.lineHeight.sm,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
            },
            compact
              ? {
                  minHeight:
                    theme.layout.compactTouchTarget - theme.spacing.xxs,
                  paddingVertical: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.md,
                }
              : null,
            style,
          ]}
        />
        {trailingAction}
        {password ? (
          <Pressable
            accessibilityLabel={
              passwordVisible
                ? t("common.hidePassword")
                : t("common.showPassword")
            }
            accessibilityRole="button"
            accessibilityState={{ expanded: passwordVisible }}
            hitSlop={8}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={({ pressed }) => [
              styles.passwordAction,
              pressed && styles.pressed,
            ]}
          >
            <SymbolView
              name={{
                ios: passwordVisible ? "eye.slash" : "eye",
                android: passwordVisible ? "visibility_off" : "visibility",
                web: passwordVisible ? "visibility_off" : "visibility",
              }}
              size={22}
              tintColor={theme.colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {supportingText ? (
        <AppText
          accessibilityLiveRegion={error ? "polite" : "none"}
          tone={error ? "error" : "muted"}
          variant="caption"
        >
          {supportingText}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  inputShell: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderCurve: "continuous",
  },

  input: {
    minWidth: 0,
    flex: 1,
    minHeight: 50,
  },

  passwordAction: {
    width: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.62,
  },
});
