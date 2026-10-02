import { View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { normalizeApiError } from "@/services/api/api-error";
import type { GoogleLoginOutcome } from "../types/auth-types";
import { authErrorMessage } from "../utils/auth-error-message";

export function GoogleFeedback({ error, outcome }: { error: unknown; outcome?: GoogleLoginOutcome }) {
  const { t } = useI18n();
  const theme = useAppTheme();
  if (error && normalizeApiError(error).code !== "CANCELLED")
    return <AppText accessibilityRole="alert" tone="error">{authErrorMessage(error, t)}</AppText>;
  if (outcome?.status !== "VERIFICATION_REQUIRED") return null;
  return <View style={{ gap: theme.spacing.sm }}>
    <AppText accessibilityLiveRegion="polite">{t("auth.google.emailProof")}</AppText>
    <AppText variant="label">{outcome.email}</AppText>
    <AppText variant="caption" tone="muted">{t("auth.email.spamHint")}</AppText>
  </View>;
}
