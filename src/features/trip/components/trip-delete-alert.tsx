import { useRef } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

/** Centered confirmation shares the app's glass material across platforms. */
export function TripDeleteAlert({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const theme = useAppTheme();
  const insets = useScreenInsets();
  const { copy } = useTripDetailsCopy();
  const cancelRef = useRef<View>(null);
  return (
    <Modal
      transparent
      visible
      animationType="none"
      onRequestClose={onCancel}
      onShow={() => cancelRef.current?.focus()}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: insets.top + theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          paddingLeft: insets.left + theme.spacing.lg,
          paddingRight: insets.right + theme.spacing.lg,
          backgroundColor: theme.colors.overlay,
        }}
      >
        <View
          role="alertdialog"
          aria-modal
          accessibilityViewIsModal
          accessibilityLabel={copy.deleteTitle}
          accessibilityHint={copy.deleteHint}
          onAccessibilityEscape={onCancel}
          style={{
            width: "100%",
            maxWidth: theme.layout.confirmationAlertMaxWidth,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.weatherGlassSurface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.glassClockBorder,
            boxShadow: [
              { ...theme.elevation.glass, color: theme.colors.glassShadow },
            ],
            overflow: "hidden",
          }}
        >
          <View
            pointerEvents="none"
            aria-hidden
            style={[
              StyleSheet.absoluteFill,
              { overflow: "hidden", borderRadius: theme.radius.lg },
            ]}
          >
            <View
              style={{
                position: "absolute",
                top: -theme.spacing.xxl,
                left: -theme.spacing.xl,
                width: theme.layout.confirmationAlertMaxWidth / 2,
                height: theme.layout.confirmationAlertMaxWidth / 2,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.glassGlow,
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: -theme.spacing.xxl,
                right: -theme.spacing.xl,
                width: theme.layout.confirmationAlertMaxWidth / 2,
                height: theme.layout.confirmationAlertMaxWidth / 2,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.weatherRainSurface,
              }}
            />
          </View>
          <GlassBackdrop borderRadius={theme.radius.lg} variant="photo" />
          <View style={{ padding: theme.spacing.xl, gap: theme.spacing.md }}>
            <AppText
              variant="label"
              tone="primary"
              style={{ fontSize: theme.typography.fontSize.md }}
            >
              {copy.deleteTitle}
            </AppText>
            <AppText tone="muted">{copy.deleteHint}</AppText>
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              paddingBottom: theme.spacing.md,
            }}
          >
            <Pressable
              ref={cancelRef}
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: theme.layout.touchTarget,
                padding: theme.spacing.md,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: theme.radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.softActionBorder,
                outlineColor: theme.colors.focus,
                backgroundColor: pressed
                  ? theme.colors.surfaceTint
                  : theme.colors.glassInset,
              })}
            >
              <AppText variant="label" tone="primary">
                {copy.deleteNo}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: theme.layout.touchTarget,
                padding: theme.spacing.md,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: theme.radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.error,
                outlineColor: theme.colors.error,
                backgroundColor: theme.colors.glassInset,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              })}
            >
              <AppText variant="label" tone="error">
                {copy.deleteYes}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
