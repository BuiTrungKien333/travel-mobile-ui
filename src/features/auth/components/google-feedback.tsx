import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { normalizeApiError } from "@/services/api/api-error";
import { View } from "react-native";
import type { GoogleLoginOutcome } from "../types/auth-types";
import { authErrorMessage } from "../utils/auth-error-message";

export function GoogleFeedback({
  error,
  outcome,
}: {
  error: unknown;
  outcome?: GoogleLoginOutcome;
}) {
  const { t } = useI18n();
  const theme = useAppTheme();
  if (error && normalizeApiError(error).code !== "CANCELLED")
    return (
      <AppText variant="bodyLarge" accessibilityRole="alert" tone="error">
        {authErrorMessage(error, t)}
      </AppText>
    );
  if (outcome?.status !== "VERIFICATION_REQUIRED") return null;

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <AppText variant="bodyLarge" accessibilityLiveRegion="polite">
        {t("auth.google.emailProof")}
      </AppText>
      <AppText variant="bodyLarge" selectable>
        {outcome.email}
      </AppText>
      <AppText tone="muted">{t("auth.email.spamHint")}</AppText>
    </View>
  );
}
