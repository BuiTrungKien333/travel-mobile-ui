import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { View } from "react-native";
import { useEmailRequest } from "../hooks/use-auth";
import { useResendCooldown } from "../hooks/use-resend-cooldown";
import { authErrorMessage } from "../utils/auth-error-message";

export function CheckEmail({
  email,
  purpose,
  resendAfterSeconds,
}: {
  email: string;
  purpose: "verify" | "reset";
  resendAfterSeconds: number;
}) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const request = useEmailRequest(purpose);
  const cooldown = useResendCooldown(resendAfterSeconds);
  const resend = async () => {
    if (request.isPending || cooldown.remaining > 0) return;
    try {
      const result = await request.mutateAsync(email);
      cooldown.start(result.resendAfterSeconds);
    } catch {
      /* Mutation error is displayed below. */
    }
  };
  return (
    <View style={{ gap: theme.spacing.lg }}>
      <AppText accessibilityLiveRegion="polite">
        {t(
          purpose === "verify"
            ? "auth.email.verifyInstructions"
            : "auth.email.resetInstructions",
        )}
      </AppText>
      <AppText variant="label" style={{ textAlign: "center" }}>
        {email}
      </AppText>
      <AppText tone="muted">{t("auth.email.spamHint")}</AppText>
      {request.error ? (
        <AppText accessibilityRole="alert" tone="error">
          {authErrorMessage(request.error, t)}
        </AppText>
      ) : null}
      {request.isSuccess ? (
        <AppText accessibilityLiveRegion="polite" tone="muted">
          {t("auth.email.requestAccepted")}
        </AppText>
      ) : null}
      <AppButton
        disabled={cooldown.remaining > 0}
        loading={request.isPending}
        variant="outline"
        onPress={() => void resend()}
      >
        {cooldown.remaining > 0
          ? t("auth.email.resendWait").replace(
              "{seconds}",
              String(cooldown.remaining),
            )
          : t("auth.email.resend")}
      </AppButton>
    </View>
  );
}
