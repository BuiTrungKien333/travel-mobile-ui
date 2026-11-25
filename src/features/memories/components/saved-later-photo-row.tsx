import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { JournalPhotoThumbnail } from "@/features/home/components/journal-photo-thumbnail";
import type { Memory } from "@/features/home/types/home-types";
import type { PhotoSelection } from "@/features/home/utils/photo-viewer-geometry";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useMemoriesCopy } from "../i18n/memories-copy";

/** Compact local photo row; persistence and upload remain owned by the screen. */
export function SavedLaterPhotoRow({
  memory,
  hidden,
  busy,
  exporting,
  uploading,
  registerPhoto,
  onOpen,
  onAssign,
  onRetry,
  onExport,
  onAlbum,
}: {
  memory: Memory;
  hidden: boolean;
  busy: boolean;
  exporting: boolean;
  uploading: boolean;
  registerPhoto: (id: string, read: () => PhotoSelection | null) => () => void;
  onOpen: (selection: PhotoSelection) => void;
  onAssign: () => void;
  onRetry: () => void;
  onExport: () => void;
  onAlbum: () => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useMemoriesCopy();
  const date = memory.date
    ? new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${memory.date}T12:00:00Z`))
    : copy.noDate;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
      }}
    >
      <View
        style={{
          width: theme.layout.savedLaterThumbnailSize,
          height: theme.layout.savedLaterThumbnailSize,
          borderRadius: theme.radius.sm,
          overflow: "hidden",
        }}
      >
        <JournalPhotoThumbnail
          standalone
          variant="grid"
          memory={memory}
          hidden={hidden}
          disabled={busy}
          label={`${copy.viewPhoto}, ${date}, ${memory.time ?? ""}`}
          registerPhoto={registerPhoto}
          onOpen={onOpen}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: theme.spacing.xs }}>
        <AppText variant="label">
          {date}
          {memory.time ? ` · ${memory.time}` : ""}
        </AppText>
        <AppText variant="caption" tone="muted">
          {memory.tripId ? copy.pendingUpload : copy.localOnly}
        </AppText>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: theme.spacing.xs,
          }}
        >
          <AppButton
            size="small"
            variant="outline"
            disabled={busy}
            loading={uploading}
            onPress={memory.tripId ? onRetry : onAssign}
            style={{
              flexShrink: 1,
              paddingHorizontal: theme.spacing.md,
              backgroundColor: "transparent",
              borderColor: theme.colors.softActionBorder,
            }}
          >
            {memory.tripId ? copy.retryUpload : copy.assign}
          </AppButton>
          {!memory.local?.deviceSaved ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.saveDevice}
              accessibilityState={{ disabled: busy, busy: exporting }}
              disabled={busy}
              onPress={onExport}
              style={({ pressed }) => ({
                minWidth: theme.layout.compactTouchTarget,
                minHeight: theme.layout.compactTouchTarget,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed || busy ? theme.motion.pressOpacity : 1,
              })}
            >
              {exporting ? (
                <ActivityIndicator color={theme.colors.primaryText} />
              ) : (
                <AppIcon
                  name="download"
                  variant="light"
                  size={theme.layout.iconMedium}
                />
              )}
            </Pressable>
          ) : null}
        </View>
        {memory.tripId ? (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            accessibilityState={{ disabled: busy }}
            onPress={onAlbum}
            style={({ pressed }) => ({
              alignSelf: "flex-start",
              minHeight: theme.layout.compactTouchTarget,
              justifyContent: "center",
              opacity: busy || pressed ? theme.motion.pressOpacity : 1,
            })}
          >
            <AppText variant="caption" tone="primary">
              {copy.openAssignedAlbum}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
