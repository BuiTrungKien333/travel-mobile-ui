import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, StyleSheet, TextInput, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import { AuthDivider } from "@/features/auth/components/auth-divider";
import { AuthFooterLink } from "@/features/auth/components/auth-footer-link";
import { AuthScaffold } from "@/features/auth/components/auth-scaffold";
import { GoogleButton } from "@/features/auth/components/google-button";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/schemas/auth-schemas";
import { useAppTheme } from "@/hooks/use-app-theme";

export function RegisterScreen() {
  const theme = useAppTheme();
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<RegisterFormValues>({
    defaultValues: { email: "", fullName: "", password: "" },
    mode: "onTouched",
    resolver: zodResolver(registerSchema),
  });

  const handleRegister = handleSubmit(() => {
    Keyboard.dismiss();
  });

  return (
    <AuthScaffold
      footer={
        <AuthFooterLink
          action="Đăng nhập"
          label="Đã có tài khoản?"
          onPress={() => router.replace("/(auth)/login")}
        />
      }
      subtitle="Bắt đầu lên kế hoạch cho hành trình của bạn."
      title="Tạo tài khoản"
    >
      <View style={{ gap: theme.spacing.lg }}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
            <AppInput
              ref={ref}
              autoCapitalize="words"
              autoComplete="name"
              error={error?.message}
              label="Họ và tên"
              onBlur={onBlur}
              onChangeText={onChange}
              onSubmitEditing={() => emailInputRef.current?.focus()}
              placeholder="Nguyễn Văn An"
              returnKeyType="next"
              textContentType="name"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
            <AppInput
              ref={emailInputRef}
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
              autoComplete="new-password"
              error={error?.message}
              helperText="Sử dụng ít nhất 8 ký tự."
              label="Mật khẩu"
              onBlur={onBlur}
              onChangeText={onChange}
              onSubmitEditing={handleRegister}
              password
              placeholder="Tạo mật khẩu"
              returnKeyType="done"
              textContentType="newPassword"
              value={value}
            />
          )}
        />

        <AppButton loading={isSubmitting} onPress={handleRegister}>
          Tạo tài khoản
        </AppButton>

        <AuthDivider />

        <GoogleButton onPress={Keyboard.dismiss} />

        <AppText style={styles.legal} tone="muted" variant="caption">
          Bằng việc tạo tài khoản, bạn đồng ý với{" "}
          <AppText tone="primary" variant="caption">Điều khoản sử dụng</AppText>{" "}
          và{" "}
          <AppText tone="primary" variant="caption">Chính sách quyền riêng tư</AppText>{"."}
        </AppText>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  legal: {
    textAlign: "center",
  },
});
