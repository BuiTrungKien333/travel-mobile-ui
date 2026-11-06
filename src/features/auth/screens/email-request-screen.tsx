import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { translateError } from "@/i18n/translations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, View } from "react-native";
import { AuthReturnButton } from "../components/auth-return-button";
import { AuthScaffold } from "../components/auth-scaffold";
import { CheckEmail } from "../components/check-email";
import { useEmailRequest } from "../hooks/use-auth";
import {
  emailRequestSchema,
  type EmailRequestFormValues,
} from "../schemas/auth-schemas";
import { authErrorMessage } from "../utils/auth-error-message";

export function EmailRequestScreen({
  purpose,
}: {
  purpose: "verify" | "reset";
}) {
  const theme = useAppTheme();
  const { t, locale } = useI18n();
  const request = useEmailRequest(purpose);
  const [pendingEmail, setPendingEmail] = useState<{
    email: string;
    resendAfterSeconds: number;
  } | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<EmailRequestFormValues>({
    defaultValues: { email: "" },
    resolver: zodResolver(emailRequestSchema),
    mode: "onTouched",
  });
  const submit = handleSubmit(async ({ email }) => {
    if (request.isPending) return;
    Keyboard.dismiss();
    try {
      setPendingEmail({ email, ...(await request.mutateAsync(email)) });
    } catch {
      /* Render mutation error without exposing the raw server message. */
    }
  });
  return (
    <AuthScaffold
      title={t(
        pendingEmail
          ? "auth.email.title"
          : purpose === "verify"
            ? "auth.verify.title"
            : "auth.forgot.title",
      )}
      subtitle={t(
        pendingEmail
          ? "auth.email.subtitle"
          : purpose === "verify"
            ? "auth.verify.requestHint"
            : "auth.forgot.subtitle",
      )}
      footer={<AuthReturnButton />}
    >
      {pendingEmail ? (
        <View style={{ gap: theme.spacing.lg }}>
          <CheckEmail {...pendingEmail} purpose={purpose} />
          <AppButton
            variant="outline"
            onPress={() => {
              setPendingEmail(null);
              request.reset();
            }}
          >
            {t("auth.email.differentEmail")}
          </AppButton>
        </View>
      ) : (
        <View style={{ gap: theme.spacing.lg }}>
          {request.error ? (
            <AppText variant="bodyLarge" accessibilityRole="alert" tone="error">
              {authErrorMessage(request.error, t)}
            </AppText>
          ) : null}
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState: { error } }) => (
              <AppInput
                ref={field.ref}
                label={t("common.email")}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={translateError(locale, error?.message)}
                placeholder="name@example.com"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
                returnKeyType="done"
                editable={!isSubmitting}
                onSubmitEditing={submit}
              />
            )}
          />
          <AppButton loading={isSubmitting} onPress={submit}>
            {t(
              purpose === "verify"
                ? "auth.verify.request"
                : "auth.forgot.submit",
            )}
          </AppButton>
        </View>
      )}
    </AuthScaffold>
  );
}
