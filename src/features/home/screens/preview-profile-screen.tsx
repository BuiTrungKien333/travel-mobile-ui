import { View } from "react-native";

import { LanguageSwitcher } from "@/components/common/language-switcher";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useI18n } from "@/hooks/use-i18n";
import {
  HomePage,
  PreviewNotice,
  SurfaceCard,
} from "../components/home-primitives";
import { mockProfile } from "../data/home-mocks";
import { useHomeCopy } from "../i18n/home-copy";

/** UI-only account preview: never mounts profile queries or logout mutations. */
export function PreviewProfileScreen() {
  const theme = useAppTheme();
  const { t } = useI18n();
  const { copy } = useHomeCopy();
  return (
    <HomePage>
      <View style={{ alignItems: "flex-end" }}>
        <LanguageSwitcher />
      </View>
      <AppText accessibilityRole="header" variant="heading">
        {copy.profile}
      </AppText>
      <SurfaceCard>
        <AppIcon name="person" size={theme.layout.iconLarge} />
        <AppText variant="label">{t("auth.register.fullName")}</AppText>
        <AppText>{mockProfile.fullName}</AppText>
        <AppText variant="label">{t("common.email")}</AppText>
        <AppText>{mockProfile.email}</AppText>
        <AppText variant="caption" tone="muted">
          {copy.sampleHint}
        </AppText>
      </SurfaceCard>
      <PreviewNotice />
    </HomePage>
  );
}
