import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useMemoriesCopy } from "../i18n/memories-copy";

export type MemoryLibraryMode = "photos" | "albums";
export function MemoryLibrarySwitcher({
  mode,
  onChange,
  onLater,
}: {
  mode: MemoryLibraryMode;
  onChange: (mode: MemoryLibraryMode) => void;
  onLater: () => void;
}) {
  const theme = useAppTheme();
  const { copy } = useMemoriesCopy();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.md,
      }}
    >
      <View
        role="tablist"
        style={{
          flexDirection: "row",
          padding: theme.spacing.xs,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.surfaceTint,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          overflow: "hidden",
        }}
      >
        <GlassBackdrop borderRadius={theme.radius.full} />
        {(["photos", "albums"] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === value }}
            onPress={() => onChange(value)}
            style={({ pressed }) => ({
              minWidth: theme.layout.touchTarget + theme.spacing.xxl,
              minHeight: theme.layout.compactTouchTarget,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: theme.spacing.lg,
              borderRadius: theme.radius.full,
              overflow: "hidden",
              opacity: pressed ? theme.motion.pressOpacity : 1,
            })}
          >
            {mode === value ? (
              <Animated.View
                pointerEvents="none"
                entering={FadeIn.duration(
                  theme.motion.enterDuration,
                ).reduceMotion(ReduceMotion.System)}
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radius.full,
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                  },
                ]}
              />
            ) : null}
            <AppText
              variant="label"
              tone={mode === value ? "primary" : "muted"}
            >
              {value === "photos" ? copy.photoMode : copy.albumMode}
            </AppText>
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.later}
        onPress={onLater}
        style={({ pressed }) => ({
          width: theme.layout.compactTouchTarget,
          height: theme.layout.compactTouchTarget,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: theme.radius.full,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.glassInset,
          opacity: pressed ? theme.motion.pressOpacity : 1,
        })}
      >
        <AppIcon
          name="cameraGallery"
          variant="light"
          size={theme.layout.iconMedium}
        />
      </Pressable>
    </View>
  );
}
