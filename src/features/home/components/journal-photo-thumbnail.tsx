import { Image } from "expo-image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import type { Memory } from "../types/home-types";
import type { PhotoSelection } from "../utils/photo-viewer-geometry";

export function JournalPhotoThumbnail({
  memory,
  hidden,
  onOpen,
  registerPhoto,
  standalone = false,
  disabled = false,
  label,
}: {
  memory: Memory;
  hidden: boolean;
  onOpen: (selection: PhotoSelection) => void;
  registerPhoto: (id: string, read: () => PhotoSelection | null) => () => void;
  standalone?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useOngoingCopy();
  const [imageFailed, setImageFailed] = useState(false);
  const frame = useRef<ComponentRef<typeof View>>(null);
  const [photoInfo, setPhotoInfo] = useState<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);
  const readSelection = useCallback((): PhotoSelection | null => {
    const rect = frame.current?.getBoundingClientRect();
    if (
      imageFailed ||
      !photoInfo ||
      !rect ||
      rect.width <= 0 ||
      rect.height <= 0
    )
      return null;
    return {
      id: memory.id,
      uri: photoInfo.uri,
      size: { width: photoInfo.width, height: photoInfo.height },
      origin: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    };
  }, [memory.id, photoInfo, imageFailed]);
  useEffect(
    () => registerPhoto(memory.id, readSelection),
    [registerPhoto, memory.id, readSelection],
  );
  const unavailable = !memory.photo || imageFailed;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        label ??
        [
          memory.place?.[locale] ?? memory.destination,
          memory.time,
          unavailable ? copy.photoUnavailable : undefined,
        ]
          .filter(Boolean)
          .join(", ")
      }
      accessibilityHint={copy.viewJournal}
      accessibilityState={{
        busy: !photoInfo && !unavailable,
        disabled: disabled || !photoInfo || unavailable,
      }}
      disabled={disabled || !photoInfo || unavailable}
      onPress={() => {
        const photo = readSelection();
        if (photo) onOpen(photo);
      }}
      style={({ pressed }) => [
        standalone ? styles.standalone : styles.actionColumn,
        {
          padding: theme.spacing.none,
          borderRadius: theme.radius.none,
          backgroundColor: theme.colors.journalFrameSurface,
          borderWidth: theme.layout.journalFrameBorderWidth,
          borderColor: theme.colors.journalFrameBorder,
          boxShadow: [
            {
              ...theme.elevation.glass,
              color: theme.colors.journalFrameShadow,
            },
          ],
          opacity: hidden ? 0 : pressed ? theme.motion.pressOpacity : 1,
        },
      ]}
    >
      <View
        ref={frame}
        collapsable={false}
        style={[
          styles.marker,
          {
            width: "100%",
            aspectRatio: standalone ? 1 : theme.layout.journalPhotoAspectRatio,
            backgroundColor: theme.colors.surfaceTint,
          },
        ]}
      >
        {unavailable ? (
          <AppIcon name="memories" size={theme.layout.iconLarge} />
        ) : (
          <Image
            accessible={false}
            source={memory.photo}
            contentFit="cover"
            cachePolicy="memory-disk"
            onError={() => setImageFailed(true)}
            onLoad={(event) => {
              const { url, width, height } = event.source;
              if (width > 0 && height > 0)
                setPhotoInfo({ uri: url, width, height });
            }}
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: theme.radius.none },
            ]}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionColumn: { flex: 1, flexBasis: 0, minWidth: 0 },
  standalone: { width: "100%", minWidth: 0 },
  marker: { alignItems: "center", justifyContent: "center" },
});
