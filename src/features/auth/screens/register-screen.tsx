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
import { useI18n } from "@/hooks/use-i18n";
import { translateError } from "@/i18n/translations";

export function RegisterScreen() {
  const theme = useAppTheme();
  const { locale, t } = useI18n();
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
          action={t("auth.register.login")}
          label={t("auth.register.hasAccount")}
          onPress={() => router.replace("/(auth)/login")}
        />
      }
      subtitle={t("auth.register.subtitle")}
      title={t("auth.register.title")}
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
              error={translateError(locale, error?.message)}
              label={t("auth.register.fullName")}
              onBlur={onBlur}
              onChangeText={onChange}
              onSubmitEditing={() => emailInputRef.current?.focus()}
              placeholder={t("auth.register.fullNamePlaceholder")}
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
              error={translateError(locale, error?.message)}
              keyboardType="email-address"
              label={t("common.email")}
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
              error={translateError(locale, error?.message)}
              helperText={t("auth.register.passwordHelper")}
              label={t("common.password")}
              onBlur={onBlur}
              onChangeText={onChange}
              onSubmitEditing={handleRegister}
              password
              placeholder={t("auth.register.passwordPlaceholder")}
              returnKeyType="done"
              textContentType="newPassword"
              value={value}
            />
          )}
        />

        <AppButton loading={isSubmitting} onPress={handleRegister}>
          {t("auth.register.submit")}
        </AppButton>

        <AuthDivider />

        <GoogleButton onPress={Keyboard.dismiss} />

        <AppText style={styles.legal} tone="muted" variant="caption">
          {t("auth.register.termsPrefix")}{" "}
          <AppText tone="primary" variant="caption">
            {t("auth.register.terms")}
          </AppText>{" "}
          {t("auth.register.termsJoin")}{" "}
          <AppText tone="primary" variant="caption">
            {t("auth.register.privacy")}
          </AppText>
          {"."}
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
