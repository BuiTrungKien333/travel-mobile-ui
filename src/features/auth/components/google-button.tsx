import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import { AppButton } from "@/components/ui/app-button";

type GoogleButtonProps = {
  onPress: () => void;
};

export function GoogleButton({ onPress }: GoogleButtonProps) {
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
      Tiếp tục với Google
    </AppButton>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 20,
    aspectRatio: 200 / 204,
  },
});
