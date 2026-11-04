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
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useOngoingCopy } from "../i18n/ongoing-copy";
import { useMemoryActions } from "@/features/memories/hooks/use-memories";
import type { Memory } from "../types/home-types";
import type { PhotoSelection } from "../utils/photo-viewer-geometry";
import { homeStyles, TextAction } from "./home-primitives";
import { JourneyCard } from "./journey-card";
import { JournalPhotoViewer } from "./journal-photo-viewer";

const JOURNAL_PREVIEW_LIMIT = 6;

export function JournalAlbum({
  memories,
  onOpen,
  onCapture,
  variant = "today",
  title,
}: {
  memories: Memory[];
  onOpen: () => void;
  onCapture?: () => void;
  variant?: "today" | "recent";
  title?: string;
}) {
  const theme = useAppTheme();
  const { copy } = useOngoingCopy();
  const [selection, setSelection] = useState<PhotoSelection | null>(null);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const photoReaders = useRef(new Map<string, () => PhotoSelection | null>());
  const registerPhoto = useCallback(
    (id: string, read: () => PhotoSelection | null) => {
      photoReaders.current.set(id, read);
      return () => {
        photoReaders.current.delete(id);
      };
    },
    [],
  );
  const getSelection = useCallback(
    (id: string) => photoReaders.current.get(id)?.() ?? null,
    [],
  );
  const { remove } = useMemoryActions();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={[homeStyles.row, { gap: theme.spacing.sm }]}>
        <AppText
          accessibilityRole="header"
          variant="label"
          style={homeStyles.grow}
        >
          {title ?? (variant === "recent" ? copy.recentJournal : copy.journal)}
        </AppText>
        <TextAction
          label={variant === "recent" ? copy.allMemories : copy.allJournal}
          onPress={onOpen}
        />
      </View>
      {memories.length ? (
        <View style={{ gap: theme.spacing.xs }}>
          {Array.from(
            {
              length: Math.ceil(
                Math.min(memories.length, JOURNAL_PREVIEW_LIMIT) / 2,
              ),
            },
            (_, row) => {
              const pair = memories.slice(row * 2, row * 2 + 2);
              return (
                <View
                  key={pair[0].id}
                  style={[
                    homeStyles.row,
                    { alignItems: "stretch", gap: theme.spacing.xs },
                  ]}
                >
                  {pair.map((memory) => (
                    <JournalAlbumPhoto
                      key={memory.id}
                      memory={memory}
                      hidden={activePhotoId === memory.id}
                      registerPhoto={registerPhoto}
                      onOpen={(photo) => {
                        setActivePhotoId(photo.id);
                        setSelection(photo);
                      }}
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
      {selection ? (
        <JournalPhotoViewer
          key={selection.id}
          memories={memories.slice(0, JOURNAL_PREVIEW_LIMIT)}
          selection={selection}
          getSelection={getSelection}
          onActiveChange={setActivePhotoId}
          onClose={() => {
            setSelection(null);
            setActivePhotoId(null);
          }}
          onDelete={async (id) => {
            const memory = memories.find((item) => item.id === id);
            if (memory) await remove.mutateAsync(memory);
          }}
        />
      ) : null}
    </View>
  );
}

function JournalAlbumPhoto({
  memory,
  hidden,
  onOpen,
  registerPhoto,
}: {
  memory: Memory;
  hidden: boolean;
  onOpen: (selection: PhotoSelection) => void;
  registerPhoto: (id: string, read: () => PhotoSelection | null) => () => void;
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
      accessibilityLabel={[
        memory.place?.[locale] ?? memory.destination,
        memory.time,
        unavailable ? copy.photoUnavailable : undefined,
      ]
        .filter(Boolean)
        .join(", ")}
      accessibilityHint={copy.viewJournal}
      accessibilityState={{
        busy: !photoInfo && !unavailable,
        disabled: !photoInfo || unavailable,
      }}
      disabled={!photoInfo || unavailable}
      onPress={() => {
        const photo = readSelection();
        if (photo) onOpen(photo);
      }}
      style={({ pressed }) => [
        styles.actionColumn,
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
            aspectRatio: theme.layout.journalPhotoAspectRatio,
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
  marker: { alignItems: "center", justifyContent: "center" },
});
