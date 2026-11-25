import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useHomeCopy } from "../i18n/home-copy";
import { useTripPreview } from "../providers/trip-preview-provider";
import { UI_PREVIEW_ENABLED } from "@/constants/development";

// Align the visible artwork, compensating for logo.png's transparent left inset.
const logoLeftInsetRatio = 307 / 2172;

export function HomeHeader() {
  const theme = useAppTheme();
  const { copy } = useHomeCopy();
  const { openPanel, closePanel } = useTripPreview((state) => ({
    openPanel: state.openPanel,
    closePanel: state.closePanel,
  }));

  const handlePressLogo = () => {
    closePanel();
    router.navigate("/tabs");
  };

  return (
    <View style={[styles.row, { gap: theme.spacing.xs }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.home}
        onPress={handlePressLogo}
        hitSlop={theme.spacing.xs}
        style={({ pressed }) => [
          styles.grow,
          {
            minHeight: theme.layout.touchTarget,
            justifyContent: "center",
            opacity: pressed ? theme.motion.pressOpacity : 1,
          },
        ]}
      >
        <Image
          accessible={false}
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
      </Pressable>
      {UI_PREVIEW_ENABLED ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.notifications}
          onPress={() => openPanel({ kind: "notifications" })}
          hitSlop={theme.spacing.xs}
          style={({ pressed }) => [
            styles.control,
            {
              minWidth: theme.layout.compactTouchTarget,
              minHeight: theme.layout.compactTouchTarget,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              opacity: pressed ? theme.motion.pressOpacity : 1,
            },
          ]}
        >
          <AppIcon
            name="bell"
            variant="outline"
            size={theme.layout.headerActionIconSize}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  grow: { flex: 1, minWidth: 0 },
  control: { alignItems: "center", justifyContent: "center" },
});
