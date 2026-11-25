import { AppButton } from "@/components/ui/app-button";
import { useI18n } from "@/hooks/use-i18n";
import { useAuthStore } from "@/store/use-auth-store";
import { router } from "expo-router";

export function AuthReturnButton() {
  const { t } = useI18n();
  const authenticated = useAuthStore(
    (state) => state.status === "authenticated",
  );

  return (
    <AppButton
      variant="outline"
      onPress={() => router.replace(authenticated ? "/tabs/profile" : "/")}
    >
      {t(authenticated ? "auth.email.backToAccount" : "auth.register.login")}
    </AppButton>
  );
}
