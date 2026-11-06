import { MemorySyncBadge } from "../components/memory-sync-badge";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { getTripTitle } from "@/features/trip/utils/trip-formatters";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  MemoryEmpty,
  MemoryIconButton,
  MemoryPage,
  MemoryPicture,
} from "../components/memory-primitives";
import { useMemoriesCopy } from "../i18n/memories-copy";
import { getTripPhotos } from "../utils/memory-albums";
import { useMemories, useMemoryActions } from "../hooks/use-memories";
import { MemoryLoadState } from "../components/memory-load-state";

export function MemoryAlbumScreen({ tripId }: { tripId?: string }) {
  const theme = useAppTheme();
  const { copy, locale } = useMemoriesCopy();
  const library = useMemories();
  const { upload, remove } = useMemoryActions();
  const trip = library.trips.find((item) => item.id === tripId);
  const { memories } = library;
  const today = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const captureDay = trip?.days.filter((day) => day.date <= today).at(-1);
  const [place, setPlace] = useState<string | null>(null);
  if (!trip)
    return (
      <MemoryPage title={copy.title}>
        {library.isPending || library.isError ? <MemoryLoadState loading={library.isPending} error={library.isError} onRetry={() => void library.refetch()} /> : <MemoryEmpty title={copy.unavailable} hint={copy.unavailableHint} />}
      </MemoryPage>
    );
  const photos = getTripPhotos(memories, trip.id);
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
      subtitle={`${photos.length} ${copy.photos} · ${trip.destination}`}
      action={
        !trip.localOnly && trip.status !== "cancelled" && captureDay ? (
          <MemoryIconButton
            icon="camera"
            label={copy.camera}
            onPress={capture}
          />
        ) : undefined
      }
    >
      <MemoryLoadState loading={library.isPending} error={library.isError} onRetry={() => void library.refetch()} />
      {trip.localOnly ? <AppText variant="caption" tone="muted">{copy.localAlbumOnly}</AppText> : null}
      {upload.isError ? <AppText accessibilityRole="alert" tone="error">{copy.uploadError}</AppText> : null}
      {remove.isError ? <AppText accessibilityRole="alert" tone="error">{copy.deleteError}</AppText> : null}
      <FlatList
        data={filtered}
        refreshing={library.isRefetching}
        onRefresh={() => void library.refetch()}
        numColumns={theme.layout.memoryPhotoColumns}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: "100%",
          maxWidth: theme.layout.contentMaxWidth,
          alignSelf: "center",
          padding: theme.spacing.sm,
          gap: theme.spacing.sm,
          flexGrow: 1,
        }}
        columnWrapperStyle={{ gap: theme.spacing.sm }}
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
          !library.isPending && !library.isError ? <MemoryEmpty title={copy.emptyAlbum} hint={copy.emptyAlbumHint}>
            {!trip.localOnly && trip.status !== "cancelled" && captureDay ? (
              <AppButton onPress={capture}>{copy.camera}</AppButton>
            ) : null}
          </MemoryEmpty> : null
        }
        renderItem={({ item }) => (
          <View
            style={{
              flex: 1 / theme.layout.memoryPhotoColumns,
              minWidth: 0,
              gap: theme.spacing.xs,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${copy.viewPhoto}: ${item.place?.[locale] ?? copy.noPlace}, ${item.date ?? copy.noDate}, ${item.time ?? ""}`}
              onPress={() =>
                router.push({
                  pathname: "/memories/photo/[memoryId]",
                  params: { memoryId: item.id, tripId: trip.id },
                })
              }
              style={({ pressed }) => ({
                borderRadius: theme.radius.xl,
                overflow: "hidden",
                opacity: pressed ? theme.motion.pressOpacity : 1,
              })}
            >
              {item.photo ? (
                <MemoryPicture
                  source={item.photo}
                  label={item.place?.[locale] ?? trip.destination}
                />
              ) : null}
            </Pressable>
            <AppText
              variant="caption"
              style={{ paddingHorizontal: theme.spacing.xs }}
            >
              {item.place?.[locale] ?? copy.noPlace}
            </AppText>
            <MemorySyncBadge memory={item} syncing={upload.isPending && upload.variables?.memory.id === item.id} failed={upload.isError && upload.variables?.memory.id === item.id} />
            {item.pendingDeletion ? <>
              <AppButton size="small" loading={remove.isPending} disabled={remove.isPending} onPress={() => remove.mutate(item)}>{copy.retryDelete}</AppButton>
            </> : item.local && !item.local.uploaded ? <AppButton variant="outline" size="small" loading={upload.isPending && upload.variables?.memory.id === item.id} disabled={upload.isPending} onPress={() => upload.mutate({ memory: item })}>{copy.upload}</AppButton> : null}
          </View>
        )}
      />
    </MemoryPage>
  );
}
