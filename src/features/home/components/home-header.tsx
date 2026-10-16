import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";

// Align the visible artwork, compensating for logo.png's transparent left inset.
const logoLeftInsetRatio = 307 / 2172;

export function HomeHeader() {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const openPanel = useTripPreview((state) => state.openPanel);
  return (
    <View style={[styles.row, { gap: theme.spacing.md }]}>
      <View style={styles.grow}>
        <Image
          accessible
          accessibilityLabel="WeGo"
          source={require("@/assets/images/logo.png")}
          contentFit="contain"
          cachePolicy="memory-disk"
          style={{
            width: theme.layout.headerLogoWidth,
            height: theme.layout.headerLogoHeight,
            marginLeft: -theme.layout.headerLogoWidth * logoLeftInsetRatio,
            maxWidth: "100%",
          }}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.preview}
        onPress={() => openPanel({ kind: "scenarios" })}
        style={({ pressed }) => [
          styles.control,
          {
            minWidth: theme.layout.touchTarget,
            minHeight: theme.layout.touchTarget,
            opacity: pressed ? theme.motion.pressOpacity : 1,
          },
        ]}
      >
        <AppIcon name="tune" />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.profile}
        onPress={() => router.push("/tabs/profile")}
        style={({ pressed }) => [
          styles.control,
          {
            minWidth: theme.layout.touchTarget,
            minHeight: theme.layout.touchTarget,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.surfaceTint,
            opacity: pressed ? theme.motion.pressOpacity : 1,
          },
        ]}
      >
        <AppIcon name="person" size={theme.layout.iconLarge} />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  grow: { flex: 1, minWidth: 0 },
  control: { alignItems: "center", justifyContent: "center" },
});
