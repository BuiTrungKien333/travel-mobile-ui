import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import { AuthDivider } from "@/features/auth/components/auth-divider";
import { AuthFooterLink } from "@/features/auth/components/auth-footer-link";
import { AuthScaffold } from "@/features/auth/components/auth-scaffold";
import { GoogleButton } from "@/features/auth/components/google-button";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/auth-schemas";
import { useAppTheme } from "@/hooks/use-app-theme";

export function LoginScreen() {
  const theme = useAppTheme();
  const passwordInputRef = useRef<TextInput>(null);
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
    resolver: zodResolver(loginSchema),
  });

  const handleLogin = handleSubmit(() => {
    Keyboard.dismiss();
  });

  return (
    <AuthScaffold
      footer={
        <AuthFooterLink
          action="Đăng ký"
          label="Chưa có tài khoản?"
          onPress={() => router.push("/(auth)/register")}
        />
      }
      showLogo
      subtitle="Đăng nhập để tiếp tục hành trình của bạn."
      title="Chào mừng bạn trở lại"
    >
      <View style={{ gap: theme.spacing.lg }}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
            <AppInput
              ref={ref}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              error={error?.message}
              keyboardType="email-address"
              label="Email"
              onBlur={onBlur}
              onChangeText={onChange}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              placeholder="name@example.com"
              returnKeyType="next"
              textContentType="emailAddress"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
            <AppInput
              ref={passwordInputRef}
              autoCapitalize="none"
              autoComplete="current-password"
              error={error?.message}
              label="Mật khẩu"
              onBlur={onBlur}
              onChangeText={onChange}
              onSubmitEditing={handleLogin}
              password
              placeholder="Nhập mật khẩu"
              returnKeyType="done"
              textContentType="password"
              value={value}
            />
          )}
        />

        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={Keyboard.dismiss}
          style={({ pressed }) => [
            styles.forgotPassword,
            { marginVertical: -theme.spacing.sm },
            pressed && styles.pressed,
          ]}
        >
          <AppText tone="primary" variant="link">
            Quên mật khẩu?
          </AppText>
        </Pressable>

        <AppButton loading={isSubmitting} onPress={handleLogin}>
          Đăng nhập
        </AppButton>

        <AuthDivider />

        <GoogleButton onPress={Keyboard.dismiss} />
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  forgotPassword: {
    minHeight: 48,
    alignSelf: "flex-end",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.62,
  },
});
