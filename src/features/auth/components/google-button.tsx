import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { useI18n } from "@/hooks/use-i18n";
import type { GoogleCredential } from "../types/auth-types";

export type GoogleButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  onCredential?: (credential: GoogleCredential) => Promise<unknown>;
};

export function GoogleButton({
  onPress,
  disabled,
  loading,
}: GoogleButtonProps) {
  const { t } = useI18n();

  return (
    <AppButton
      disabled={disabled}
      loading={loading}
      leadingIcon={
        <Image
          accessible={false}
          contentFit="contain"
          source={require("@/assets/images/google-g-logo.png")}
          style={styles.logo}
        />
      }
      onPress={onPress}
      variant="outline"
    >
      {t("common.continueWithGoogle")}
    </AppButton>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 20,
    aspectRatio: 200 / 204,
  },
});
