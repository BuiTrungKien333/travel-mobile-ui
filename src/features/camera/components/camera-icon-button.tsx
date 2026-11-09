import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { useAppTheme } from "@/hooks/use-app-theme";

export function CameraIconButton({
  icon,
  label,
  onPress,
  disabled = false,
  active = false,
  children,
  size = "default",
  bare = false,
}: {
  icon?: AppIconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
  children?: ReactNode;
  size?: "tiny" | "small" | "default" | "large";
  bare?: boolean;
}) {
  const theme = useAppTheme();
  const targetSize =
    size === "small" || size === "tiny"
      ? theme.layout.compactTouchTarget
      : size === "large"
        ? theme.layout.cameraActionSize
        : theme.layout.cameraIconButtonSize;
  const surfaceSize =
    size === "tiny"
      ? theme.layout.cameraTinyControlSurface
      : size === "small"
        ? theme.layout.compactIconButtonSurfaceSize
        : size === "large"
          ? theme.layout.cameraActionSurfaceSize
          : targetSize;
  const iconSize =
    size === "tiny"
      ? theme.layout.cameraTinyControlIcon
      : size === "small"
        ? theme.layout.iconSmall
        : size === "large"
          ? theme.layout.cameraActionIconSize
          : theme.layout.iconMedium;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: targetSize,
        minHeight: targetSize,
        borderRadius: theme.radius.full,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled
          ? theme.motion.packingReminderOpacity
          : pressed
            ? theme.motion.pressOpacity
            : 1,
      })}
    >
      <View
        style={{
          width: surfaceSize,
          height: surfaceSize,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: theme.radius.full,
        }}
      >
        {!bare ? (
          <GlassBackdrop
            variant={size === "tiny" ? "camera-overlay" : "camera"}
            borderRadius={theme.radius.full}
          />
        ) : null}
        {children ??
          (icon ? (
            <AppIcon
              name={icon}
              variant="light"
              size={iconSize}
              color={
                active ? theme.colors.primary : theme.colors.photoViewerText
              }
            />
          ) : null)}
      </View>
    </Pressable>
  );
}
