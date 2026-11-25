import { svgDataUri } from "@/utils/svg-data-uri";
import { Image } from "expo-image";
import { memo, useState } from "react";
import { PixelRatio, Pressable, StyleSheet, View } from "react-native";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  formatTripDates,
  getTripTitle,
} from "@/features/trip/utils/trip-formatters";
import { getSampleThumbnail } from "@/features/trip/utils/trip-images";
import { useMemoriesCopy } from "../i18n/memories-copy";
import { libraryThumbnail, type MemoryAlbum } from "../utils/memory-library";

export const MemoryLibraryAlbum = memo(function MemoryLibraryAlbum({
  album,
  width,
  onOpen,
}: {
  album: MemoryAlbum;
  width: number;
  onOpen: () => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useMemoriesCopy();
  const [failed, setFailed] = useState(false);
  const scrim = svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="100" preserveAspectRatio="none"><defs><linearGradient id="s" x2="0" y2="1"><stop offset="0.3" stop-color="${theme.colors.photoViewerBackdrop}" stop-opacity="0"/><stop offset="1" stop-color="${theme.colors.photoViewerBackdrop}" stop-opacity="0.55"/></linearGradient></defs><rect width="1" height="100" fill="url(#s)"/></svg>`,
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${getTripTitle(album.trip, locale)}, ${album.photoCount} ${copy.photos}${album.sample ? `, ${copy.samplePhotos}` : ""}`}
      onPress={onOpen}
      style={({ pressed }) => ({
        width,
        aspectRatio: theme.layout.memoryAlbumAspectRatio,
        overflow: "hidden",
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surfaceVariant,
        opacity: pressed ? theme.motion.pressOpacity : 1,
      })}
    >
      <Image
        source={
          failed
            ? getSampleThumbnail(album.trip.id)
            : libraryThumbnail(
                album.photos[0],
                PixelRatio.getPixelSizeForLayoutSize(width),
              )
        }
        recyclingKey={album.trip.id}
        contentFit="cover"
        cachePolicy="memory-disk"
        onError={() => setFailed(true)}
        accessible={false}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={scrim}
        accessible={false}
        contentFit="fill"
        style={StyleSheet.absoluteFill}
      />
      <View
        style={{
          position: "absolute",
          top: theme.spacing.md,
          right: theme.spacing.md,
          minWidth: theme.layout.compactTouchTarget,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.radius.full,
          overflow: "hidden",
          alignItems: "center",
          backgroundColor: theme.colors.cameraControlSurface,
        }}
      >
        <GlassBackdrop
          variant="camera-overlay"
          borderRadius={theme.radius.full}
        />
        <AppText
          variant="label"
          style={{
            color: theme.colors.photoViewerText,
            fontVariant: ["tabular-nums"],
          }}
        >
          {album.photoCount}
        </AppText>
      </View>
      <View
        style={{
          position: "absolute",
          bottom: theme.spacing.lg,
          left: theme.spacing.lg,
          right: theme.spacing.lg,
          gap: theme.spacing.xs,
        }}
      >
        <AppText
          variant="subheading"
          numberOfLines={2}
          style={{ color: theme.colors.photoViewerText }}
        >
          {getTripTitle(album.trip, locale)}
        </AppText>
        <AppText
          variant="caption"
          style={{ color: theme.colors.photoViewerMuted }}
        >
          {formatTripDates(album.trip, locale)}
        </AppText>
      </View>
    </Pressable>
  );
});
