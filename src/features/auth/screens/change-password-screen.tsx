import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { translateError } from "@/i18n/translations";
import { useAuthStore } from "@/store/use-auth-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Redirect, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, View } from "react-native";
import { AuthReturnButton } from "../components/auth-return-button";
import { AuthScaffold } from "../components/auth-scaffold";
import { MagicLinkLoading } from "../components/magic-link-loading";
import { useChangePassword } from "../hooks/use-auth";
import { changePasswordSchema, type ChangePasswordFormValues } from "../schemas/auth-schemas";
import { authErrorMessage } from "../utils/auth-error-message";

export function ChangePasswordScreen() {
  const theme = useAppTheme();
  const { t, locale } = useI18n();
  const status = useAuthStore((state) => state.status);
  const mutation = useChangePassword();
  const { control, handleSubmit, reset, setFocus, formState: { isSubmitting } } = useForm<ChangePasswordFormValues>({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    resolver: zodResolver(changePasswordSchema),
    mode: "onTouched",
  });
  const submit = handleSubmit(async ({ currentPassword, newPassword }) => {
    if (mutation.isPending) return;
    Keyboard.dismiss();
    try {
      await mutation.mutateAsync({ currentPassword, newPassword });
      reset();
    } catch {
      // Retain form values and show the translated mutation error.
    }
  });

  if (status === "restoring") return <MagicLinkLoading />;
  if (status !== "authenticated" && !isSubmitting && !mutation.isSuccess)
    return <Redirect href="/(auth)/login" />;

  const fields = [
    { name: "currentPassword", label: "auth.change.current", next: "newPassword" },
    { name: "newPassword", label: "auth.change.new", next: "confirmPassword" },
    { name: "confirmPassword", label: "auth.reset.confirmPassword", next: null },
  ] as const;

  return (
    <AuthScaffold title={t("auth.change.title")} subtitle={t("auth.change.subtitle")} footer={<AuthReturnButton />}>
      <View style={{ gap: theme.spacing.lg }}>
        {mutation.isSuccess ? (
          <AppText variant="bodyLarge" accessibilityLiveRegion="polite">{t("auth.change.success")}</AppText>
        ) : (
          <>
            {mutation.error ? (
              <AppText variant="bodyLarge" accessibilityRole="alert" tone="error">
                {authErrorMessage(mutation.error, t)}
              </AppText>
            ) : null}
            {fields.map(({ name, label, next }) => (
              <Controller key={name} control={control} name={name} render={({ field, fieldState: { error } }) => (
                <AppInput
                  ref={field.ref} label={t(label)} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
                  password autoCapitalize="none" autoCorrect={false}
                  autoComplete={name === "currentPassword" ? "current-password" : "new-password"}
                  textContentType={name === "currentPassword" ? "password" : "newPassword"}
                  returnKeyType={next ? "next" : "done"} editable={!isSubmitting}
                  helperText={name === "newPassword" ? t("auth.register.passwordHelper") : undefined}
                  error={translateError(locale, error?.message)}
                  onSubmitEditing={next ? () => setFocus(next) : submit}
                />
              )} />
            ))}
            <AppButton loading={isSubmitting} onPress={submit}>{t("auth.change.submit")}</AppButton>
            <AppButton variant="outline" disabled={isSubmitting} onPress={() => router.push("/forgot-password")}>
              {t("auth.forgot.title")}
            </AppButton>
          </>
        )}
      </View>
    </AuthScaffold>
  );
}
