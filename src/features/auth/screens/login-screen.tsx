import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";

import { canConfigureServer } from "@/services/api/server-connection";
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
import { useI18n } from "@/hooks/use-i18n";
import { translateError } from "@/i18n/translations";
import { normalizeApiError } from "@/services/api/api-error";
import { GoogleFeedback } from "../components/google-feedback";
import { useLogin } from "../hooks/use-auth";
import { useGoogleLogin } from "../hooks/use-google-login";
import { authErrorMessage } from "../utils/auth-error-message";

export function LoginScreen() {
  const theme = useAppTheme();
  const { locale, t } = useI18n();
  const { notice } = useLocalSearchParams<{ notice?: string | string[] }>();
  const login = useLogin();
  const google = useGoogleLogin();
  const passwordInputRef = useRef<TextInput>(null);
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    setError,
    clearErrors,
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
    resolver: zodResolver(loginSchema),
  });

  const handleLogin = handleSubmit(async (values) => {
    if (login.isPending || google.isPending) return;
    Keyboard.dismiss();
    google.reset();
    clearErrors();
    try {
      await login.mutateAsync(values);
    } catch (error) {
      const failure = normalizeApiError(error);
      if (failure.code === "AUTH_003" || failure.fields?.email) {
        setError("email", {
          message:
            failure.code === "AUTH_003"
              ? "auth.error.emailExists"
              : "validation.emailInvalid",
        });
      }
    }
  });

  return (
    <AuthScaffold
      footer={
        <AuthFooterLink
          action={t("auth.login.register")}
          label={t("auth.login.noAccount")}
          disabled={isSubmitting || google.isPending}
          onPress={() => router.push("/(auth)/register")}
        />
      }
      showLogo
      subtitle={t("auth.login.subtitle")}
      title={t("auth.login.title")}
    >
      <View style={{ gap: theme.spacing.lg }}>
        {notice === "local-logout" ? (
          <AppText variant="bodyLarge" accessibilityRole="alert" tone="muted">
            {t("auth.session.localLogout")}
          </AppText>
        ) : null}
        {login.error ? (
          <AppText variant="bodyLarge" accessibilityRole="alert" tone="error">
            {authErrorMessage(login.error, t)}
          </AppText>
        ) : null}
        {login.error && normalizeApiError(login.error).code === "AUTH_008" ? (
          <AppButton
            variant="outline"
            onPress={() => router.push("/verify-email")}
          >
            {t("auth.verify.request")}
          </AppButton>
        ) : null}
        <Controller
          control={control}
          name="email"
          render={({
            field: { onBlur, onChange, ref, value },
            fieldState: { error },
          }) => (
            <AppInput
              ref={ref}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              error={translateError(locale, error?.message)}
              editable={!isSubmitting && !google.isPending}
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
          render={({
            field: { onBlur, onChange, value },
            fieldState: { error },
          }) => (
            <AppInput
              ref={passwordInputRef}
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect={false}
              editable={!isSubmitting && !google.isPending}
              error={translateError(locale, error?.message)}
              label={t("common.password")}
              onBlur={onBlur}
              onChangeText={onChange}
              onSubmitEditing={handleLogin}
              password
              placeholder={t("auth.login.passwordPlaceholder")}
              returnKeyType="done"
              textContentType="password"
              value={value}
            />
          )}
        />

        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          disabled={isSubmitting || google.isPending}
          onPress={() => {
            Keyboard.dismiss();
            router.push("/forgot-password");
          }}
          style={({ pressed }) => [
            styles.forgotPassword,
            { marginVertical: -theme.spacing.sm },
            pressed && styles.pressed,
          ]}
        >
          <AppText tone="primary" variant="link">
            {t("auth.login.forgotPassword")}
          </AppText>
        </Pressable>

        <AppButton
          disabled={google.isPending}
          loading={isSubmitting}
          labelSize="large"
          onPress={handleLogin}
        >
          {t("auth.login.submit")}
        </AppButton>

        <AuthDivider />

        <GoogleButton
          disabled={isSubmitting}
          loading={google.isPending}
          onPress={() => {
            Keyboard.dismiss();
            login.reset();
            clearErrors();
            google.mutate(undefined);
          }}
          onCredential={(credential) => {
            login.reset();
            clearErrors();
            return google.mutateAsync(credential);
          }}
        />
        <GoogleFeedback error={google.error} outcome={google.data} />
        {canConfigureServer ? (
          <AppButton
            variant="outline"
            size="small"
            onPress={() => router.push("/connection")}
          >
            {locale === "vi" ? "Kết nối máy chủ" : "Server connection"}
          </AppButton>
        ) : null}
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
