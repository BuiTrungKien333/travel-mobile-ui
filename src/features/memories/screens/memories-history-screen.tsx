import { router } from "expo-router";
import { BottomTabBarHeightContext } from "expo-router/js-tabs";
import { useContext } from "react";
import { FlatList, Pressable, View, useWindowDimensions } from "react-native";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { HomeHeader } from "@/features/home/components/home-header";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import {
  formatTripDates,
  getTripTitle,
} from "@/features/trip/utils/trip-formatters";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import {
  MemoryEmpty,
  MemoryIconButton,
  MemoryPage,
  MemoryPicture,
} from "../components/memory-primitives";
import { useMemoriesCopy } from "../i18n/memories-copy";
import { getTripPhotos } from "../utils/memory-albums";
import { useMemories } from "../hooks/use-memories";
import { MemoryLoadState } from "../components/memory-load-state";

export function MemoriesHistoryScreen(
  { embedded = false }: { embedded?: boolean } = {},
) {
  const theme = useAppTheme();
  const bottomInset = useContext(BottomTabBarHeightContext) ?? 0;
  const insets = useScreenInsets();
  const { width } = useWindowDimensions();
  const { copy, locale } = useMemoriesCopy();
  const library = useMemories();
  const { trips, memories } = library;
  const openPanel = useTripPreview((state) => state.openPanel);
  const columns = theme.layout.memoryTripColumns;
  const cardWidth =
    (Math.min(width - insets.left - insets.right, theme.layout.contentMaxWidth) -
      theme.spacing.lg * 2 -
      theme.spacing.md * (columns - 1)) / columns;
  const subtitle = `${trips.length} ${copy.trips} · ${memories.filter((item) => !!item.photo).length} ${copy.photos}`;
  const albums = trips
    .map((trip) => ({ trip, photos: getTripPhotos(memories, trip.id) }))
    .sort((a, b) =>
      (b.trip.startDate ?? "").localeCompare(a.trip.startDate ?? ""),
    );
  const content = (
    <>
      <MemoryLoadState
        loading={library.isPending}
        error={library.isError}
        onRetry={() => void library.refetch()}
      />
      <FlatList
        data={albums}
        refreshing={library.isRefetching}
        onRefresh={() => void library.refetch()}
        numColumns={columns}
        keyExtractor={({ trip }) => trip.id}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{
          width: "100%",
          maxWidth: theme.layout.contentMaxWidth,
          alignSelf: "center",
          padding: theme.spacing.lg,
          paddingBottom: (embedded ? bottomInset : 0) + theme.spacing.xl,
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
              {`${copy.later} · ${memories.filter((memory) => !memory.tripId || !trips.some((trip) => trip.id === memory.tripId)).length}`}
            </AppButton>
            <AppText tone="muted" style={{ marginBottom: theme.spacing.sm }}>
              {copy.historyHint}
            </AppText>
          </View>
        }
        ListEmptyComponent={
          !library.isPending && !library.isError ? (
            <MemoryEmpty title={copy.emptyTrips} hint={copy.emptyTripsHint}>
              <AppButton onPress={() => openPanel({ kind: "create" })}>
                {copy.createTrip}
              </AppButton>
            </MemoryEmpty>
          ) : null
        }
        renderItem={({ item: { trip, photos } }) => {
          const cover = photos[0]?.photo ?? trip.coverImage;
          return (
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
                width: cardWidth,
                minHeight: theme.layout.touchTarget,
                borderRadius: theme.radius.lg,
                overflow: "hidden",
                backgroundColor: theme.colors.surface,
                opacity: pressed ? theme.motion.pressOpacity : 1,
              })}
            >
              <View>
                {cover ? (
                  <MemoryPicture
                    key={photos[0]?.id ?? trip.id}
                    source={cover}
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
                    {photos.length}
                  </AppText>
                </View>
              </View>
              <View style={{ padding: theme.spacing.sm, gap: theme.spacing.xs }}>
                <AppText variant="label" numberOfLines={2}>
                  {getTripTitle(trip, locale)}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {formatTripDates(trip, locale)}
                </AppText>
                {photos.length === 0 ? (
                  <AppText variant="caption" tone="muted">
                    {copy.emptyAlbum}
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />
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
        <HomeHeader />
        <View style={{ gap: theme.spacing.xs }}>
          <AppText accessibilityRole="header" variant="screenTitle">
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
    <MemoryPage
      title={copy.history}
      subtitle={subtitle}
      action={
        <MemoryIconButton
          icon="camera"
          label={copy.camera}
          onPress={() => router.push("/memories/quick-capture")}
        />
      }
    >
      {content}
    </MemoryPage>
  );
}
