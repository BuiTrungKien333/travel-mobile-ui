import { useRef } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ColorValue,
} from "react-native";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";

/** Centered confirmation with a solid surface across platforms. */
export function TripDeleteAlert({
  onCancel,
  onConfirm,
  title,
  hint,
  busy = false,
  error,
  confirmLabel,
  cancelLabel,
  destructive = true,
  confirmBorderColor,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  hint?: string;
  busy?: boolean;
  error?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  confirmBorderColor?: ColorValue;
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
      onRequestClose={() => {
        if (!busy) onCancel();
      }}
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
          accessibilityLabel={title ?? copy.deleteTitle}
          accessibilityHint={hint ?? copy.deleteHint}
          onAccessibilityEscape={() => {
            if (!busy) onCancel();
          }}
          style={{
            width: "100%",
            maxWidth: theme.layout.confirmationAlertMaxWidth,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.glassClockBorder,
            boxShadow: [
              { ...theme.elevation.glass, color: theme.colors.glassShadow },
            ],
            overflow: "hidden",
          }}
        >
          <View style={{ padding: theme.spacing.xl, gap: theme.spacing.md }}>
            <AppText
              accessibilityRole="header"
              variant="sectionTitle"
              tone="primary"
            >
              {title ?? copy.deleteTitle}
            </AppText>
            <AppText tone="muted">{hint ?? copy.deleteHint}</AppText>
            {error ? (
              <AppText variant="caption" tone="error" accessibilityRole="alert">
                {error}
              </AppText>
            ) : null}
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
              disabled={busy}
              accessibilityState={{ disabled: busy }}
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
                {cancelLabel ?? copy.deleteNo}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              disabled={busy}
              accessibilityState={{ disabled: busy, busy }}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: theme.layout.touchTarget,
                padding: theme.spacing.md,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: theme.radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor:
                  confirmBorderColor ??
                  (destructive
                    ? theme.colors.error
                    : theme.colors.softActionBorder),
                outlineColor: destructive
                  ? theme.colors.error
                  : theme.colors.focus,
                backgroundColor: theme.colors.glassInset,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              })}
            >
              {busy ? (
                <ActivityIndicator
                  color={
                    destructive ? theme.colors.error : theme.colors.primaryText
                  }
                />
              ) : (
                <AppText
                  variant="label"
                  tone={destructive ? "error" : "primary"}
                >
                  {confirmLabel ?? copy.deleteYes}
                </AppText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
