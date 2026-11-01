import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
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

export function MemoryAlbumScreen({ tripId }: { tripId?: string }) {
  const theme = useAppTheme();
  const { copy, locale } = useMemoriesCopy();
  const trip = useTripPreview((state) =>
    state.trips.find((item) => item.id === tripId),
  );
  const memories = useTripPreview((state) => state.memories);
  const [place, setPlace] = useState<string | null>(null);
  if (!trip)
    return (
      <MemoryPage title={copy.title}>
        <MemoryEmpty title={copy.unavailable} hint={copy.unavailableHint} />
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
      pathname: "/tabs/memories",
      params: { tripId: trip.id, day: trip.days.at(-1)?.date, stopId: "" },
    });
  return (
    <MemoryPage
      title={getTripTitle(trip, locale)}
      subtitle={`${photos.length} ${copy.photos} · ${trip.destination}`}
      action={
        trip.status !== "cancelled" && trip.days.length ? (
          <MemoryIconButton
            icon="camera"
            label={copy.camera}
            onPress={capture}
          />
        ) : undefined
      }
    >
      <FlatList
        data={filtered}
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
          <MemoryEmpty title={copy.emptyAlbum} hint={copy.emptyAlbumHint}>
            {trip.status !== "cancelled" && trip.days.length ? (
              <AppButton onPress={capture}>{copy.camera}</AppButton>
            ) : null}
          </MemoryEmpty>
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
          </View>
        )}
      />
    </MemoryPage>
  );
}
