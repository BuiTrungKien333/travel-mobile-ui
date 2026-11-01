import { router } from "expo-router";
import { FlatList, Pressable, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import {
  formatTripDates,
  getTripTitle,
} from "@/features/trip/utils/trip-formatters";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  MemoryEmpty,
  MemoryIconButton,
  MemoryPage,
  MemoryPicture,
} from "../components/memory-primitives";
import { useMemoriesCopy } from "../i18n/memories-copy";
import { getTripPhotos } from "../utils/memory-albums";

export function MemoriesHistoryScreen() {
  const theme = useAppTheme();
  const { copy, locale } = useMemoriesCopy();
  const trips = useTripPreview((state) => state.trips);
  const memories = useTripPreview((state) => state.memories);
  const openPanel = useTripPreview((state) => state.openPanel);
  const albums = trips
    .map((trip) => ({ trip, photos: getTripPhotos(memories, trip.id) }))
    .sort((a, b) =>
      (b.trip.startDate ?? "").localeCompare(a.trip.startDate ?? ""),
    );
  return (
    <MemoryPage
      title={copy.history}
      subtitle={`${trips.length} ${copy.trips} · ${memories.filter((item) => !!item.photo).length} ${copy.photos}`}
      action={
        <MemoryIconButton
          icon="camera"
          label={copy.camera}
          onPress={() => router.dismissTo("/tabs/memories")}
        />
      }
    >
      <FlatList
        data={albums}
        numColumns={theme.layout.memoryTripColumns}
        keyExtractor={({ trip }) => trip.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: "100%",
          maxWidth: theme.layout.contentMaxWidth,
          alignSelf: "center",
          padding: theme.spacing.lg,
          gap: theme.spacing.lg,
          flexGrow: 1,
        }}
        columnWrapperStyle={{ gap: theme.spacing.md }}
        ListHeaderComponent={
          <View
            style={{ gap: theme.spacing.lg, marginBottom: theme.spacing.lg }}
          >
            <AppButton
              variant="soft"
              leadingIcon={<AppIcon name="cameraGallery" variant="light" />}
              onPress={() => router.push("/memories/saved-later")}
            >
              {`${copy.later} · ${memories.filter((memory) => memory.local && (!memory.tripId || !trips.some((trip) => trip.id === memory.tripId))).length}`}
            </AppButton>
            <AppText tone="muted" style={{ marginBottom: theme.spacing.sm }}>
              {copy.historyHint}
            </AppText>
          </View>
        }
        ListEmptyComponent={
          <MemoryEmpty title={copy.emptyTrips} hint={copy.emptyTripsHint}>
            <AppButton onPress={() => openPanel({ kind: "create" })}>
              {copy.createTrip}
            </AppButton>
          </MemoryEmpty>
        }
        renderItem={({ item: { trip, photos } }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${getTripTitle(trip, locale)}, ${photos.length} ${copy.photos}`}
            onPress={() =>
              router.push({
                pathname: "/memories/[tripId]",
                params: { tripId: trip.id },
              })
            }
            style={({ pressed }) => ({
              width: `${100 / theme.layout.memoryTripColumns}%`,
              flex: 1 / theme.layout.memoryTripColumns,
              borderRadius: theme.radius.xxl,
              overflow: "hidden",
              backgroundColor: theme.colors.surface,
              opacity: pressed ? theme.motion.pressOpacity : 1,
            })}
          >
            <View>
              {photos[0]?.photo ? (
                <MemoryPicture
                  key={photos[0].id}
                  source={photos[0].photo}
                  label={trip.destination}
                  aspectRatio={theme.layout.memoryTripCoverAspectRatio}
                />
              ) : (
                <View
                  style={{
                    aspectRatio: theme.layout.memoryTripCoverAspectRatio,
                    backgroundColor: theme.colors.surfaceTint,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: theme.spacing.sm,
                  }}
                >
                  <AppIcon
                    name="memories"
                    variant="outline"
                    size={theme.layout.iconLarge}
                  />
                  <AppText variant="caption" tone="primary">
                    {copy.emptyAlbum}
                  </AppText>
                </View>
              )}
              <View
                style={{
                  position: "absolute",
                  top: theme.spacing.md,
                  right: theme.spacing.md,
                  paddingVertical: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  backgroundColor: theme.colors.photoViewerBar,
                  borderRadius: theme.radius.full,
                }}
              >
                <AppText
                  variant="caption"
                  style={{ color: theme.colors.photoViewerText }}
                >
                  {photos.length} {copy.photos}
                </AppText>
              </View>
            </View>
            <View style={{ padding: theme.spacing.md, gap: theme.spacing.xs }}>
              <AppText variant="label">{getTripTitle(trip, locale)}</AppText>
              <AppText variant="caption" tone="muted">
                {formatTripDates(trip, locale)}
              </AppText>
            </View>
          </Pressable>
        )}
      />
    </MemoryPage>
  );
}
