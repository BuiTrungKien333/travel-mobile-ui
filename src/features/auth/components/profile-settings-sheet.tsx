import { router } from "expo-router";
import { canConfigureServer } from "@/services/api/server-connection";
import Constants from "expo-constants";
import { View } from "react-native";
import { AppBottomSheet } from "@/components/common/app-bottom-sheet";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useProfileCopy } from "../i18n/profile-copy";

export function ProfileSettingsSheet({ panel, onClose }: { panel: "privacy" | "settings"; onClose: () => void; }) {
  const theme = useAppTheme();
  const { copy } = useProfileCopy();
  return (
    <AppBottomSheet title={copy[panel]} closeLabel={copy.close} onClose={onClose} contentGap={theme.spacing.md} footer={<AppButton onPress={onClose}>{panel === "privacy" ? copy.understood : copy.close}</AppButton>}>
      {panel === "privacy" ? (
        <>
          <AppText variant="sectionTitle">{copy.privacyTitle}</AppText>
          <AppText variant="body" tone="muted">{copy.privacyBody}</AppText>
          <AppText variant="sectionTitle">{copy.termsTitle}</AppText>
          <AppText variant="body" tone="muted">{copy.termsBody}</AppText>
        </>
      ) : [[copy.app, "WeGo"], [copy.version, Constants.expoConfig?.version ?? "—"], [copy.appearance, copy.light]].map(([label, value]) => (
        <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md, paddingVertical: theme.spacing.sm }}>
          <AppText variant="body" tone="muted">{label}</AppText>
          <AppText variant="label">{value}</AppText>
        </View>
      ))}
      {panel === "settings" && canConfigureServer ? <AppButton variant="outline" onPress={() => { onClose(); router.push("/connection"); }}>Kết nối máy chủ / Server</AppButton> : null}
    </AppBottomSheet>
  );
}
