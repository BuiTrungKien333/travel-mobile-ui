import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { translateError } from "@/i18n/translations";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, TextInput, View } from "react-native";
import { AuthReturnButton } from "../components/auth-return-button";
import { AuthScaffold } from "../components/auth-scaffold";
import { MagicLinkLoading } from "../components/magic-link-loading";
import { useResetPassword } from "../hooks/use-auth";
import { useMagicLinkToken } from "../hooks/use-magic-link-token";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "../schemas/auth-schemas";
import { authErrorMessage } from "../utils/auth-error-message";

export function ResetPasswordScreen() {
  const { token, isLoading } = useMagicLinkToken("reset-password");
  if (isLoading) return <MagicLinkLoading />;
  return <ResetPasswordForm key={token ?? "missing"} token={token} />;
}

function ResetPasswordForm({ token }: { token: string | null }) {
  const theme = useAppTheme();
  const { t, locale } = useI18n();
  const mutation = useResetPassword();
  const confirmRef = useRef<TextInput>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: { password: "", confirmPassword: "" },
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
  });

  const submit = handleSubmit(async ({ password }) => {
    if (!token || mutation.isPending) return;
    Keyboard.dismiss();
    try {
      await mutation.mutateAsync({ token, password });
      reset();
    } catch {
      /* Render translated mutation error. */
    }
  });

  return (
    <AuthScaffold
      title={t("auth.reset.title")}
      subtitle={t("auth.reset.subtitle")}
      footer={<AuthReturnButton />}
    >
      <View style={{ gap: theme.spacing.lg }}>
        {mutation.isSuccess ? (
          <AppText variant="bodyLarge" accessibilityLiveRegion="polite">
            {t("auth.reset.success")}
          </AppText>
        ) : !token ? (
          <AppText variant="bodyLarge" accessibilityRole="alert" tone="error">
            {t("auth.error.invalidLink")}
          </AppText>
        ) : (
          <>
            {mutation.error ? (
              <AppText
                variant="bodyLarge"
                accessibilityRole="alert"
                tone="error"
              >
                {authErrorMessage(mutation.error, t)}
              </AppText>
            ) : null}
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState: { error } }) => (
                <AppInput
                  ref={field.ref}
                  label={t("common.password")}
                  placeholder={t("auth.register.passwordPlaceholder")}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  password
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="next"
                  helperText={t("auth.register.passwordHelper")}
                  editable={!isSubmitting}
                  error={translateError(locale, error?.message)}
                  onSubmitEditing={() => confirmRef.current?.focus()}
                />
              )}
            />
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field, fieldState: { error } }) => (
                <AppInput
                  ref={confirmRef}
                  label={t("auth.reset.confirmPassword")}
                  placeholder={t("auth.reset.confirmPlaceholder")}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  password
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  editable={!isSubmitting}
                  error={translateError(locale, error?.message)}
                  onSubmitEditing={submit}
                />
              )}
            />
            <AppButton loading={isSubmitting} onPress={submit}>
              {t("auth.reset.submit")}
            </AppButton>
          </>
        )}
        {!mutation.isSuccess && (!token || mutation.isError) ? (
          <AppButton
            variant="outline"
            onPress={() => router.replace("/forgot-password")}
          >
            {t("auth.reset.requestNew")}
          </AppButton>
        ) : null}
      </View>
    </AuthScaffold>
  );
}
