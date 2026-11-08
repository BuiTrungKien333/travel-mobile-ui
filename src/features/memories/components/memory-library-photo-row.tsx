import { memo } from "react";
import { PixelRatio, View } from "react-native";
import { JournalPhotoThumbnail } from "@/features/home/components/journal-photo-thumbnail";
import type { Memory } from "@/features/home/types/home-types";
import type { PhotoSelection } from "@/features/home/utils/photo-viewer-geometry";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useMemoriesCopy } from "../i18n/memories-copy";
import { isSampleMemory, libraryThumbnail } from "../utils/memory-library";

export const MemoryLibraryPhotoRow = memo(function MemoryLibraryPhotoRow({
  photos,
  size,
  activeId,
  registerPhoto,
  onOpen,
}: {
  photos: Memory[];
  size: number;
  activeId: string | null;
  registerPhoto: (id: string, read: () => PhotoSelection | null) => () => void;
  onOpen: (selection: PhotoSelection) => void;
}) {
  const theme = useAppTheme();
  const { copy } = useMemoriesCopy();
  return (
    <View style={{ flexDirection: "row", gap: theme.layout.memoryGridGap }}>
      {photos.map((photo) => (
        <View key={photo.id} style={{ width: size, height: size }}>
          <JournalPhotoThumbnail
            memory={photo}
            hidden={activeId === photo.id}
            registerPhoto={registerPhoto}
            onOpen={onOpen}
            standalone
            variant="grid"
            label={`${isSampleMemory(photo) ? copy.samplePhotos : copy.viewPhoto}: ${photo.destination}`}
            thumbnailSource={libraryThumbnail(
              photo,
              PixelRatio.getPixelSizeForLayoutSize(size),
            )}
          />
        </View>
      ))}
    </View>
  );
});
