import { useState, type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useScreenInsets } from "@/hooks/use-screen-insets";

import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { usePhotoViewerCopy } from "../i18n/photo-viewer-copy";
import type { Memory } from "../types/home-types";

function captureDate(memory: Memory, locale: string, unknown: string) {
  return memory.date
    ? new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${memory.date}T12:00:00Z`))
    : unknown;
}

export function PhotoViewerToolbar({
  memory,
  visible,
  animatedStyle,
  busy,
  photoReady,
  onClose,
  onShare,
  onSave,
  onDelete,
  onInfo,
}: {
  memory: Memory;
  visible: boolean;
  animatedStyle: ComponentProps<typeof Animated.View>["style"];
  busy: "share" | "save" | null;
  photoReady: boolean;
  onClose: () => void;
  onShare: () => void;
  onSave: () => void;
  onDelete?: () => void;
  onInfo: () => void;
}) {
  const theme = useAppTheme();
  const insets = useScreenInsets();
  const { copy, locale } = usePhotoViewerCopy();
  // Preview favorites belong to this album viewing session.
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const favorite = favorites.has(memory.id);
  const disabled = !visible || busy !== null;
  return (
    <Animated.View
      pointerEvents={visible ? "box-none" : "none"}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
      style={[StyleSheet.absoluteFill, animatedStyle]}
    >
      <View
        style={[
          styles.header,
          {
            top: 0,
            left: 0,
            right: 0,
            paddingTop: insets.top + theme.spacing.lg,
            paddingBottom: theme.spacing.md,
            paddingLeft: insets.left + theme.spacing.sm,
            paddingRight: insets.right + theme.spacing.lg,
            gap: theme.spacing.xxs,
            backgroundColor: theme.colors.photoViewerBar,
          },
        ]}
      >
        <PhotoIconButton
          icon="back"
          iconSize={theme.layout.photoViewerBackIconSize}
          label={copy.back}
          onPress={onClose}
          disabled={!visible}
          surface="none"
        />
        <View style={{ flex: 1, minWidth: 0, gap: theme.spacing.xxs }}>
          <AppText
            variant="label"
            style={{
              color: theme.colors.photoViewerText,
              fontFamily: theme.typography.fontFamily.semibold,
              fontSize: theme.typography.fontSize.sm,
              lineHeight: theme.typography.lineHeight.sm,
            }}
          >
            {captureDate(memory, locale, copy.dateUnknown)}
          </AppText>
          <AppText
            variant="caption"
            style={{
              color: theme.colors.photoViewerMuted,
              fontVariant: ["tabular-nums"],
            }}
          >
            {memory.time ?? copy.timeUnknown}
          </AppText>
        </View>
      </View>
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + theme.spacing.md,
            paddingTop: theme.spacing.lg,
            paddingLeft: insets.left + theme.spacing.lg,
            paddingRight: insets.right + theme.spacing.lg,
            backgroundColor: theme.colors.photoViewerBar,
          },
        ]}
      >
        <View
          style={[
            styles.actions,
            {
              width: "100%",
              maxWidth: theme.layout.tabBarMaxWidth,
              gap: theme.spacing.sm,
            },
          ]}
        >
          <PhotoIconButton
            icon="share"
            label={copy.share}
            onPress={onShare}
            disabled={disabled || !photoReady}
            loading={busy === "share"}
          />
          <View
            style={{
              flexDirection: "row",
              borderRadius: theme.radius.full,
              paddingHorizontal: theme.spacing.xs,
              backgroundColor: theme.colors.photoViewerButton,
            }}
          >
            <PhotoIconButton
              icon={favorite ? "heartFilled" : "heart"}
              label={favorite ? copy.unfavorite : copy.favorite}
              selected={favorite}
              disabled={disabled}
              surface="none"
              onPress={() =>
                setFavorites((old) => {
                  const next = new Set(old);
                  if (next.has(memory.id)) next.delete(memory.id);
                  else next.add(memory.id);
                  return next;
                })
              }
            />
            <PhotoIconButton
              icon="download"
              label={copy.save}
              onPress={onSave}
              disabled={disabled || !photoReady}
              loading={busy === "save"}
              surface="none"
            />
            {onDelete ? (
              <PhotoIconButton
                icon="trash"
                label={copy.remove}
                onPress={onDelete}
                disabled={disabled}
                surface="none"
              />
            ) : null}
          </View>
          <PhotoIconButton
            icon="info"
            label={copy.info}
            onPress={onInfo}
            disabled={disabled}
          />
        </View>
      </View>
    </Animated.View>
  );
}

function PhotoIconButton({
  icon,
  label,
  onPress,
  disabled = false,
  loading = false,
  selected,
  iconSize,
  surface = "circle",
}: {
  icon: AppIconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  iconSize?: number;
  surface?: "circle" | "none";
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: loading, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: theme.layout.touchTarget,
        height: theme.layout.touchTarget,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: theme.radius.full,
        backgroundColor:
          surface === "circle" ? theme.colors.photoViewerButton : undefined,
        opacity: pressed || disabled ? theme.motion.pressOpacity : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.photoViewerText} />
      ) : (
        <AppIcon
          name={icon}
          variant="light"
          color={theme.colors.photoViewerText}
          size={iconSize ?? theme.layout.iconMedium}
        />
      )}
    </Pressable>
  );
}

export function PhotoInfoPanel({
  memory,
  index,
  count,
  onClose,
}: {
  memory: Memory;
  index: number;
  count: number;
  onClose: () => void;
}) {
  const theme = useAppTheme();
  const insets = useScreenInsets();
  const { copy, locale } = usePhotoViewerCopy();
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          justifyContent: "flex-end",
          backgroundColor: theme.colors.overlay,
          paddingBottom: insets.bottom + theme.spacing.md,
          paddingLeft: insets.left + theme.spacing.lg,
          paddingRight: insets.right + theme.spacing.lg,
          paddingTop: insets.top + theme.spacing.lg,
        },
      ]}
    >
      <Pressable
        accessible={false}
        style={StyleSheet.absoluteFill}
        onPress={onClose}
      />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onClose}
        style={{
          maxHeight: "100%",
          width: "100%",
          maxWidth: theme.layout.contentMaxWidth,
          alignSelf: "center",
          backgroundColor: theme.colors.photoViewerButton,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
          }}
        >
          <AppText
            variant="label"
            style={{ flex: 1, color: theme.colors.photoViewerText }}
          >
            {copy.info} · {index + 1}/{count}
          </AppText>
          <PhotoIconButton
            icon="close"
            label={copy.closeInfo}
            onPress={onClose}
            surface="none"
          />
        </View>
        <ScrollView contentContainerStyle={{ gap: theme.spacing.sm }}>
          <AppText
            variant="label"
            style={{ color: theme.colors.photoViewerText }}
          >
            {memory.place?.[locale] ?? memory.destination}
          </AppText>
          <AppText
            variant="caption"
            style={{ color: theme.colors.photoViewerMuted }}
          >
            {captureDate(memory, locale, copy.dateUnknown)} ·{" "}
            {memory.time ?? copy.timeUnknown}
          </AppText>
          {memory.text ? (
            <AppText style={{ color: theme.colors.photoViewerText }}>
              {memory.text}
            </AppText>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

export function PhotoDeleteConfirmation({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const theme = useAppTheme();
  const { copy } = usePhotoViewerCopy();
  const button = (
    text: string,
    onPress: () => void,
    destructive = false,
  ): ReactNode => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: theme.layout.touchTarget,
        padding: theme.spacing.sm,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: theme.radius.md,
        backgroundColor: destructive
          ? theme.colors.error
          : theme.colors.glassClockInset,
        opacity: pressed ? theme.motion.pressOpacity : 1,
      })}
    >
      <AppText variant="label" style={{ color: theme.colors.photoViewerText }}>
        {text}
      </AppText>
    </Pressable>
  );
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.confirmation,
        { backgroundColor: theme.colors.overlay, padding: theme.spacing.xl },
      ]}
    >
      <Pressable
        accessible={false}
        style={StyleSheet.absoluteFill}
        onPress={onCancel}
      />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onCancel}
        style={{
          width: "100%",
          maxWidth: theme.layout.contentMaxWidth,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.photoViewerControls,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.glassBorder,
          gap: theme.spacing.md,
        }}
      >
        <AppText
          accessibilityRole="header"
          variant="label"
          style={{ color: theme.colors.photoViewerText }}
        >
          {copy.deleteTitle}
        </AppText>
        <AppText
          variant="caption"
          style={{ color: theme.colors.photoViewerMuted }}
        >
          {copy.deleteHint}
        </AppText>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          {button(copy.cancel, onCancel)}
          {button(copy.remove, onConfirm, true)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: "absolute", flexDirection: "row", alignItems: "center" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmation: { alignItems: "center", justifyContent: "center" },
});
