import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { useState } from "react";
import { View } from "react-native";
import { AuthReturnButton } from "../components/auth-return-button";
import { AuthScaffold } from "../components/auth-scaffold";
import { MagicLinkLoading } from "../components/magic-link-loading";
import { useVerifyEmail } from "../hooks/use-auth";
import { useMagicLinkToken } from "../hooks/use-magic-link-token";
import { authErrorMessage } from "../utils/auth-error-message";
import { EmailRequestScreen } from "./email-request-screen";

export function VerifyEmailScreen() {
  const { token, isLoading } = useMagicLinkToken("verify-email");
  if (isLoading) return <MagicLinkLoading />;
  if (!token) return <EmailRequestScreen purpose="verify" />;
  return <VerifyEmailConfirmation key={token} token={token} />;
}

function VerifyEmailConfirmation({ token }: { token: string }) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const verify = useVerifyEmail();
  const [requestNew, setRequestNew] = useState(false);
  if (requestNew) return <EmailRequestScreen purpose="verify" />;
  const confirm = async () => {
    if (verify.isPending || verify.isSuccess) return;
    try {
      await verify.mutateAsync(token);
    } catch {
      /* Mutation error appears below. GET/link preview never redeems the token. */
    }
  };
  return (
    <AuthScaffold
      title={t("auth.verify.title")}
      subtitle={t("auth.verify.subtitle")}
      footer={<AuthReturnButton />}
    >
      <View style={{ gap: theme.spacing.lg }}>
        {verify.isSuccess ? (
          <AppText variant="bodyLarge" accessibilityLiveRegion="polite">
            {t("auth.verify.success")}
          </AppText>
        ) : (
          <>
            {verify.error ? (
              <AppText
                variant="bodyLarge"
                accessibilityRole="alert"
                tone="error"
              >
                {authErrorMessage(verify.error, t)}
              </AppText>
            ) : null}
            <AppButton
              loading={verify.isPending}
              onPress={() => void confirm()}
            >
              {t("auth.verify.confirm")}
            </AppButton>
            {verify.error ? (
              <AppButton variant="outline" onPress={() => setRequestNew(true)}>
                {t("auth.reset.requestNew")}
              </AppButton>
            ) : null}
          </>
        )}
      </View>
    </AuthScaffold>
  );
}
