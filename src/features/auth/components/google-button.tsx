import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { useI18n } from "@/hooks/use-i18n";

type GoogleButtonProps = {
  onPress: () => void;
};

export function GoogleButton({ onPress }: GoogleButtonProps) {
  const { t } = useI18n();

  return (
    <AppButton
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
