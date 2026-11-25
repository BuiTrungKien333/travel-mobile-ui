import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { router } from "expo-router";
import { View } from "react-native";
import { AuthReturnButton } from "../components/auth-return-button";
import { AuthScaffold } from "../components/auth-scaffold";
import { MagicLinkLoading } from "../components/magic-link-loading";
import { useGoogleEmailConfirmation } from "../hooks/use-google-login";
import { useMagicLinkToken } from "../hooks/use-magic-link-token";
import { authErrorMessage } from "../utils/auth-error-message";

export function GoogleLinkScreen() {
  const { token, isLoading } = useMagicLinkToken("google-link");
  if (isLoading) return <MagicLinkLoading />;
  return <GoogleLinkConfirmation key={token ?? "missing"} token={token} />;
}

function GoogleLinkConfirmation({ token }: { token: string | null }) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const mutation = useGoogleEmailConfirmation();
  const confirm = async () => {
    if (!token || mutation.isPending || mutation.isSuccess) return;
    try {
      await mutation.mutateAsync(token);
      router.replace("/");
    } catch {
      /* Translated mutation error below. */
    }
  };

  return (
    <AuthScaffold
      title={t("auth.google.confirmTitle")}
      subtitle={t("auth.google.confirmHint")}
      footer={<AuthReturnButton />}
    >
      <View style={{ gap: theme.spacing.lg }}>
        {!token ? (
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
            <AppButton
              loading={mutation.isPending}
              disabled={mutation.isSuccess}
              onPress={() => void confirm()}
            >
              {t("common.continueWithGoogle")}
            </AppButton>
          </>
        )}
      </View>
    </AuthScaffold>
  );
}
