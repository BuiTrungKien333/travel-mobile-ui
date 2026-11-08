import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  PixelRatio,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { getTripTitle } from "@/features/trip/utils/trip-formatters";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  MemoryEmpty,
  MemoryIconButton,
  MemoryPage,
} from "../components/memory-primitives";
import { useMemoriesCopy } from "../i18n/memories-copy";
import { getTripPhotos } from "../utils/memory-albums";
import { useMemories, useMemoryActions } from "../hooks/use-memories";
import { MemoryLoadState } from "../components/memory-load-state";
import { JournalPhotoThumbnail } from "@/features/home/components/journal-photo-thumbnail";
import { JournalPhotoViewer } from "@/features/home/components/journal-photo-viewer";
import { useJournalPhotoGallery } from "@/features/home/hooks/use-journal-photo-gallery";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import {
  isSampleMemory,
  libraryThumbnail,
  sampleTripPhotos,
} from "../utils/memory-library";

export function MemoryAlbumScreen({ tripId }: { tripId?: string }) {
  const theme = useAppTheme();
  const { copy, locale } = useMemoriesCopy();
  const library = useMemories();
  const { upload, remove } = useMemoryActions();
  const gallery = useJournalPhotoGallery();
  const { width } = useWindowDimensions();
  const insets = useScreenInsets();
  const contentWidth = Math.min(
    width - insets.left - insets.right,
    theme.layout.contentMaxWidth,
  );
  const photoSize =
    (contentWidth -
      theme.layout.memoryGridGap * (theme.layout.memoryPhotoColumns - 1)) /
    theme.layout.memoryPhotoColumns;
  const trip = library.trips.find((item) => item.id === tripId);
  const { memories } = library;
  const today = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const captureDay = trip?.days.filter((day) => day.date <= today).at(-1);
  const [place, setPlace] = useState<string | null>(null);
  if (!trip)
    return (
      <MemoryPage title={copy.title}>
        {library.isPending || library.isError ? (
          <MemoryLoadState
            loading={library.isPending}
            error={library.isError}
            onRetry={() => void library.refetch()}
          />
        ) : (
          <MemoryEmpty title={copy.unavailable} hint={copy.unavailableHint} />
        )}
      </MemoryPage>
    );
  const actual = getTripPhotos(memories, trip.id);
  const photos =
    library.isPending || library.isError
      ? []
      : actual.length
        ? actual
        : sampleTripPhotos(trip);
  const places = [
    ...new Set(photos.map((item) => item.place?.[locale] ?? copy.noPlace)),
  ];
  const selectedPlace = place && places.includes(place) ? place : null;
  const filtered = selectedPlace
    ? photos.filter(
        (item) => (item.place?.[locale] ?? copy.noPlace) === selectedPlace,
      )
    : photos;
  const capture = () =>
    router.dismissTo({
      pathname: "/memories/quick-capture",
      params: { tripId: trip.id, day: captureDay?.date, stopId: "" },
    });
  return (
    <MemoryPage
      title={getTripTitle(trip, locale)}
      subtitle={`${actual.length} ${copy.photos} · ${trip.destination}${!actual.length ? ` · ${copy.samplePhotos}` : ""}`}
      action={
        trip.status !== "cancelled" && captureDay ? (
          <MemoryIconButton
            icon="camera"
            label={copy.camera}
            onPress={capture}
          />
        ) : undefined
      }
    >
      <MemoryLoadState
        loading={library.isPending}
        error={library.isError}
        onRetry={() => void library.refetch()}
      />
      {upload.isError ? (
        <AppText accessibilityRole="alert" tone="error">
          {copy.uploadError}
        </AppText>
      ) : null}
      <FlatList
        data={filtered}
        refreshing={library.isRefetching}
        onRefresh={() => void library.refetch()}
        numColumns={theme.layout.memoryPhotoColumns}
        initialNumToRender={18}
        maxToRenderPerBatch={9}
        windowSize={5}
        extraData={gallery.activePhotoId}
        removeClippedSubviews={false}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: "100%",
          maxWidth: theme.layout.contentMaxWidth,
          alignSelf: "center",
          gap: theme.layout.memoryGridGap,
          flexGrow: 1,
        }}
        columnWrapperStyle={{ gap: theme.layout.memoryGridGap }}
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: theme.spacing.sm,
              padding: theme.spacing.sm,
              paddingBottom: theme.spacing.lg,
            }}
          >
            {[null, ...places].map((item) => (
              <Pressable
                key={item ?? "all"}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedPlace === item }}
                onPress={() => setPlace(item)}
                style={({ pressed }) => ({
                  minHeight: theme.layout.compactTouchTarget,
                  justifyContent: "center",
                  borderRadius: theme.radius.full,
                  paddingHorizontal: theme.spacing.lg,
                  backgroundColor:
                    selectedPlace === item
                      ? theme.colors.primary
                      : theme.colors.surfaceTint,
                  opacity: pressed ? theme.motion.pressOpacity : 1,
                })}
              >
                <AppText
                  variant="label"
                  style={{
                    color:
                      selectedPlace === item
                        ? theme.colors.onPrimary
                        : theme.colors.primaryText,
                  }}
                >
                  {item ?? copy.allPlaces}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        }
        ListEmptyComponent={
          !library.isPending && !library.isError ? (
            <MemoryEmpty title={copy.emptyAlbum} hint={copy.emptyAlbumHint}>
              {trip.status !== "cancelled" && captureDay ? (
                <AppButton onPress={capture}>{copy.camera}</AppButton>
              ) : null}
            </MemoryEmpty>
          ) : null
        }
        renderItem={({ item }) => (
          <View
            style={{
              width: photoSize,
              minWidth: 0,
              gap: theme.spacing.xs,
            }}
          >
            <JournalPhotoThumbnail
              memory={item}
              standalone
              variant="grid"
              hidden={gallery.activePhotoId === item.id}
              registerPhoto={gallery.registerPhoto}
              onOpen={(selection) => gallery.openPhoto(selection, filtered)}
              thumbnailSource={libraryThumbnail(
                item,
                PixelRatio.getPixelSizeForLayoutSize(photoSize),
              )}
              label={`${isSampleMemory(item) ? copy.samplePhotos : copy.viewPhoto}: ${item.place?.[locale] ?? trip.destination}`}
            />
            {item.local && !item.local.uploaded ? (
              <AppButton
                size="small"
                loading={
                  upload.isPending && upload.variables?.memory.id === item.id
                }
                disabled={upload.isPending}
                onPress={() => upload.mutate({ memory: item })}
              >
                {copy.upload}
              </AppButton>
            ) : null}
          </View>
        )}
      />
      {gallery.opened ? (
        <JournalPhotoViewer
          memories={gallery.opened.memories}
          selection={gallery.opened.selection}
          getSelection={gallery.getSelection}
          onActiveChange={gallery.setActivePhotoId}
          onClose={gallery.closePhoto}
          canDelete={(memory) => !isSampleMemory(memory)}
          onDelete={async (id) => {
            const memory = actual.find((photo) => photo.id === id);
            if (memory) await remove.mutateAsync(memory);
          }}
        />
      ) : null}
    </MemoryPage>
  );
}
