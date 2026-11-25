import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import { ActivityIndicator } from "react-native";
import { AuthScaffold } from "./auth-scaffold";

export function MagicLinkLoading() {
  const theme = useAppTheme();
  const { t } = useI18n();

  return (
    <AuthScaffold title={t("auth.email.openingLink")} subtitle="" footer={null}>
      <ActivityIndicator
        color={theme.colors.primary}
        accessibilityLabel={t("auth.email.openingLink")}
      />
    </AuthScaffold>
  );
}
