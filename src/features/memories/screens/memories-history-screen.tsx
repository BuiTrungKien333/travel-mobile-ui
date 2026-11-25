import { router } from "expo-router";
import { BottomTabBarHeightContext } from "expo-router/js-tabs";
import { useCallback, useContext, useMemo, useState } from "react";
import { FlatList, SectionList, View, useWindowDimensions } from "react-native";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { JournalPhotoViewer } from "@/features/home/components/journal-photo-viewer";
import { useJournalPhotoGallery } from "@/features/home/hooks/use-journal-photo-gallery";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import type { PhotoSelection } from "@/features/home/utils/photo-viewer-geometry";
import {
  formatTripDates,
  getTripTitle,
} from "@/features/trip/utils/trip-formatters";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { MemoryEmpty, MemoryPage } from "../components/memory-primitives";
import { MemoryLoadState } from "../components/memory-load-state";
import {
  MemoryLibrarySwitcher,
  type MemoryLibraryMode,
} from "../components/memory-library-switcher";
import { MemoryLibraryAlbum } from "../components/memory-library-album";
import { MemoryLibraryPhotoRow } from "../components/memory-library-photo-row";
import { useMemoriesCopy } from "../i18n/memories-copy";
import { useMemories, useMemoryActions } from "../hooks/use-memories";
import {
  buildMemoryAlbums,
  isSampleMemory,
  photoRows,
} from "../utils/memory-library";

export function MemoriesHistoryScreen({
  embedded = false,
}: { embedded?: boolean } = {}) {
  const theme = useAppTheme();
  const bottomInset = useContext(BottomTabBarHeightContext) ?? 0;
  const insets = useScreenInsets();
  const { width } = useWindowDimensions();
  const { copy, locale } = useMemoriesCopy();
  const library = useMemories(false);
  const actions = useMemoryActions();
  const openPanel = useTripPreview((state) => state.openPanel);
  const [mode, setMode] = useState<MemoryLibraryMode>("photos");
  const gallery = useJournalPhotoGallery();
  const albums = useMemo(
    () =>
      library.isPending || library.isError
        ? []
        : buildMemoryAlbums(library.trips, library.memories),
    [library.trips, library.memories, library.isPending, library.isError],
  );

  const photos = useMemo(
    () => albums.flatMap((album) => album.photos),
    [albums],
  );

  const sections = useMemo(
    () =>
      albums.map((album) => ({
        ...album,
        key: album.trip.id,
        data: photoRows(album.photos),
      })),
    [albums],
  );

  const contentWidth = Math.min(
    width - insets.left - insets.right,
    theme.layout.contentMaxWidth,
  );

  const size =
    (contentWidth -
      theme.layout.memoryGridGap * (theme.layout.memoryPhotoColumns - 1)) /
    theme.layout.memoryPhotoColumns;
  const { openPhoto: openGallery } = gallery;
  const openPhoto = useCallback(
    (selection: PhotoSelection) => openGallery(selection, photos),
    [openGallery, photos],
  );
  const subtitle = `${albums.length} ${copy.trips} · ${albums.reduce((total, album) => total + album.photoCount, 0)} ${copy.photos}`;
  const empty =
    !library.isPending && !library.isError ? (
      <View style={{ padding: theme.spacing.lg }}>
        <MemoryEmpty title={copy.emptyTrips} hint={copy.emptyTripsHint}>
          <AppButton onPress={() => openPanel({ kind: "create" })}>
            {copy.createTrip}
          </AppButton>
        </MemoryEmpty>
      </View>
    ) : null;

  const content = (
    <>
      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
          width: "100%",
          maxWidth: theme.layout.contentMaxWidth,
          alignSelf: "center",
        }}
      >
        <MemoryLibrarySwitcher
          mode={mode}
          onChange={setMode}
          onLater={() => router.push("/memories/saved-later")}
        />
      </View>
      <MemoryLoadState
        loading={library.isPending}
        error={library.isError}
        onRetry={() => void library.refetch()}
      />
      {mode === "photos" ? (
        <SectionList
          sections={sections}
          keyExtractor={(row) => row[0].id}
          extraData={gallery.activePhotoId}
          stickySectionHeadersEnabled={false}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
          refreshing={library.isRefetching}
          onRefresh={() => void library.refetch()}
          style={{ flex: 1 }}
          contentContainerStyle={{
            width: contentWidth,
            alignSelf: "center",
            paddingBottom: (embedded ? bottomInset : 0) + theme.spacing.xl,
            flexGrow: 1,
          }}
          ListEmptyComponent={empty}
          renderSectionHeader={({ section }) => (
            <View
              style={{
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
                gap: theme.spacing.xs,
              }}
            >
              <AppText variant="label">
                {getTripTitle(section.trip, locale)}
              </AppText>
              <AppText variant="caption" tone="muted">
                {formatTripDates(section.trip, locale)}
                {section.sample ? ` · ${copy.samplePhotos}` : ""}
              </AppText>
            </View>
          )}
          renderItem={({ item }) => (
            <MemoryLibraryPhotoRow
              photos={item}
              size={size}
              activeId={gallery.activePhotoId}
              registerPhoto={gallery.registerPhoto}
              onOpen={openPhoto}
            />
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: theme.layout.memoryGridGap }} />
          )}
        />
      ) : (
        <FlatList
          data={albums}
          keyExtractor={(album) => album.trip.id}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={5}
          showsVerticalScrollIndicator={false}
          refreshing={library.isRefetching}
          onRefresh={() => void library.refetch()}
          style={{ flex: 1 }}
          contentContainerStyle={{
            width: contentWidth,
            alignSelf: "center",
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: (embedded ? bottomInset : 0) + theme.spacing.xl,
            gap: theme.spacing.lg,
            flexGrow: 1,
          }}
          ListEmptyComponent={empty}
          renderItem={({ item }) => (
            <MemoryLibraryAlbum
              album={item}
              width={contentWidth - theme.spacing.lg * 2}
              onOpen={() =>
                router.push({
                  pathname: "/memories/[tripId]",
                  params: { tripId: item.trip.id },
                })
              }
            />
          )}
        />
      )}
      {gallery.opened ? (
        <JournalPhotoViewer
          memories={gallery.opened.memories}
          selection={gallery.opened.selection}
          getSelection={gallery.getSelection}
          onActiveChange={gallery.setActivePhotoId}
          onClose={gallery.closePhoto}
          canDelete={(memory) => !isSampleMemory(memory)}
          onDelete={async (id) => {
            const memory = library.memories.find((photo) => photo.id === id);
            if (memory && !isSampleMemory(memory))
              await actions.remove.mutateAsync(memory);
          }}
        />
      ) : null}
    </>
  );

  return embedded ? (
    <ScreenSafeArea
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: theme.layout.contentMaxWidth,
          alignSelf: "center",
          padding: theme.spacing.lg,
          gap: theme.spacing.lg,
        }}
      >
        <View style={{ gap: theme.spacing.xs }}>
          <AppText
            accessibilityRole="header"
            variant="title"
            style={{
              fontSize: theme.typography.fontSize.xl,
              lineHeight: theme.typography.lineHeight.xl,
            }}
          >
            {copy.title}
          </AppText>
          <AppText variant="caption" tone="muted">
            {library.isPending ? copy.loading : subtitle}
          </AppText>
        </View>
      </View>
      {content}
    </ScreenSafeArea>
  ) : (
    <MemoryPage title={copy.title} subtitle={subtitle}>
      {content}
    </MemoryPage>
  );
}
