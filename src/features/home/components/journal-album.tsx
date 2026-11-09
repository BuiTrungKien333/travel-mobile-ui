import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import { useMemoryActions } from "@/features/memories/hooks/use-memories";
import type { Memory } from "../types/home-types";
import { homeStyles, TextAction } from "./home-primitives";
import { JourneyCard } from "./journey-card";
import { JournalPhotoViewer } from "./journal-photo-viewer";
import { JournalPhotoThumbnail } from "./journal-photo-thumbnail";
import { useJournalPhotoGallery } from "../hooks/use-journal-photo-gallery";

const JOURNAL_PREVIEW_LIMIT = 6;

export function JournalAlbum({
  memories,
  onOpen,
  onCapture,
  variant = "today",
  title,
  onDeletePhoto,
  showAllPhotos = false,
}: {
  memories: Memory[];
  onOpen?: () => void;
  onCapture?: () => void;
  variant?: "today" | "recent";
  title?: string;
  onDeletePhoto?: (memory: Memory) => Promise<void>;
  showAllPhotos?: boolean;
}) {
  const theme = useAppTheme();
  const photos = showAllPhotos
    ? memories
    : memories.slice(0, JOURNAL_PREVIEW_LIMIT);
  const { copy } = useOngoingCopy();
  const gallery = useJournalPhotoGallery();
  const { remove } = useMemoryActions();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
        <AppText
          accessibilityRole="header"
          variant="sectionTitle"
          style={homeStyles.grow}
        >
          {title ?? (variant === "recent" ? copy.recentJournal : copy.journal)}
        </AppText>
        {onOpen ? (
          <TextAction
            label={variant === "recent" ? copy.allMemories : copy.allJournal}
            onPress={onOpen}
          />
        ) : null}
      </View>
      {memories.length ? (
        <View style={{ gap: theme.spacing.xs }}>
          {Array.from(
            {
              length: Math.ceil(photos.length / 2),
            },
            (_, row) => {
              const pair = photos.slice(row * 2, row * 2 + 2);
              return (
                <View
                  key={pair[0].id}
                  style={[
                    homeStyles.row,
                    { alignItems: "stretch", gap: theme.spacing.xs },
                  ]}
                >
                  {pair.map((memory) => (
                    <JournalPhotoThumbnail
                      key={memory.id}
                      memory={memory}
                      hidden={gallery.activePhotoId === memory.id}
                      registerPhoto={gallery.registerPhoto}
                      onOpen={(photo) => gallery.openPhoto(photo, photos)}
                    />
                  ))}
                  {pair.length === 1 ? (
                    <View style={styles.actionColumn} />
                  ) : null}
                </View>
              );
            },
          )}
        </View>
      ) : (
        <JourneyCard>
          <AppText variant="label">
            {variant === "recent" ? copy.recentEmpty : copy.journalEmpty}
          </AppText>
          <AppText variant="caption" tone="muted">
            {variant === "recent"
              ? copy.recentEmptyHint
              : copy.journalEmptyHint}
          </AppText>
          {onCapture ? (
            <TextAction
              label={copy.capture}
              icon="camera"
              onPress={onCapture}
            />
          ) : null}
        </JourneyCard>
      )}
      {gallery.opened ? (
        <JournalPhotoViewer
          key={gallery.opened.selection.id}
          memories={gallery.opened.memories}
          selection={gallery.opened.selection}
          getSelection={gallery.getSelection}
          onActiveChange={gallery.setActivePhotoId}
          onClose={gallery.closePhoto}
          onDelete={async (id) => {
            const memory = memories.find((item) => item.id === id);
            if (memory) {
              if (onDeletePhoto) await onDeletePhoto(memory);
              else await remove.mutateAsync(memory);
            }
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionColumn: { flex: 1, flexBasis: 0, minWidth: 0 },
});
