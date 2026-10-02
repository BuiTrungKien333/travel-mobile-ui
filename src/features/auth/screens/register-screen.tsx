import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useRef, useState } from "react";
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
import { useGoogleLogin } from "../hooks/use-google-login";
import { GoogleFeedback } from "../components/google-feedback";
import { useRegister } from "../hooks/use-auth";
import { authErrorMessage } from "../utils/auth-error-message";
import { normalizeApiError } from "@/services/api/api-error";
import { CheckEmail } from "../components/check-email";

export function RegisterScreen() {
  const theme = useAppTheme();
  const { locale, t } = useI18n();
  const register = useRegister();
  const [pendingEmail, setPendingEmail] = useState<{ email: string; resendAfterSeconds: number } | null>(null);
  const google = useGoogleLogin();
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    setError,
    clearErrors,
    reset,
  } = useForm<RegisterFormValues>({
    defaultValues: { email: "", fullName: "", password: "" },
    mode: "onTouched",
    resolver: zodResolver(registerSchema),
  });

  const handleRegister = handleSubmit(async (values) => {
    if (register.isPending || google.isPending) return;
    Keyboard.dismiss();
    google.reset();
    clearErrors();
    try {
      const result = await register.mutateAsync(values);
      setPendingEmail({ email: values.email, resendAfterSeconds: result.resendAfterSeconds });
      reset();
    }
    catch (error) {
      const failure = normalizeApiError(error);
      if (failure.code === "AUTH_003") setError("email", { message: "auth.error.emailExists" });
      for (const field of ["email", "password", "fullName"] as const) {
        if (failure.fields?.[field]) setError(field, { message: "auth.error.fieldInvalid" });
      }
    }
  });

  if (pendingEmail) return (
    <AuthScaffold title={t("auth.email.title")} subtitle={t("auth.email.subtitle")}
      footer={<AppButton variant="outline" onPress={() => router.replace("/(auth)/login")}>{t("auth.register.login")}</AppButton>}>
      <CheckEmail {...pendingEmail} purpose="verify" />
    </AuthScaffold>
  );

  return (
    <AuthScaffold
      footer={
        <AuthFooterLink
          action={t("auth.register.login")}
          label={t("auth.register.hasAccount")}
          disabled={isSubmitting || google.isPending}
          onPress={() => router.replace("/(auth)/login")}
        />
      }
      subtitle={t("auth.register.subtitle")}
      title={t("auth.register.title")}
    >
      <View style={{ gap: theme.spacing.lg }}>
        {register.error ? <AppText accessibilityRole="alert" tone="error">{authErrorMessage(register.error, t)}</AppText> : null}
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onBlur, onChange, ref, value }, fieldState: { error } }) => (
            <AppInput
              ref={ref}
              autoCapitalize="words"
              autoComplete="name"
              editable={!isSubmitting && !google.isPending}
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
              editable={!isSubmitting && !google.isPending}
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
              autoCorrect={false}
              editable={!isSubmitting && !google.isPending}
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

        <AppButton disabled={google.isPending} loading={isSubmitting} onPress={handleRegister}>
          {t("auth.register.submit")}
        </AppButton>

        <AuthDivider />

        <GoogleButton disabled={isSubmitting} loading={google.isPending}
          onPress={() => { Keyboard.dismiss(); register.reset(); clearErrors(); google.mutate(undefined); }}
          onCredential={(credential) => { register.reset(); clearErrors(); return google.mutateAsync(credential); }} />
        <GoogleFeedback error={google.error} outcome={google.data} />

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
