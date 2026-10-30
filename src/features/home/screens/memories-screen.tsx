import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripPlacesQuery, useTripsQuery } from "@/features/trip/api/trip-hooks";
import { useCreateMemoryWithMediaMutation, useMemoriesQuery } from "../api/memory-hooks";
import type { LocalPhoto } from "../api/memory-api";
import { useHomeCopy } from "../i18n/home-copy";
import { Badge, SurfaceCard } from "../components/home-primitives";

export function MemoriesScreen() {
  const theme = useAppTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { copy, locale } = useHomeCopy();
  const tripsQuery = useTripsQuery();
  const memoriesQuery = useMemoriesQuery();
  const createMemory = useCreateMemoryWithMediaMutation();
  const trips = useMemo(() => tripsQuery.data ?? [], [tripsQuery.data]);
  const [selectedTripId, setSelectedTripId] = useState<string>();
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>();
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [formError, setFormError] = useState<string>();
  const activeTripId = trips.some((trip) => trip.id === selectedTripId)
    ? selectedTripId
    : trips[0]?.id;
  const placesQuery = useTripPlacesQuery(activeTripId);
  const activeTrip = trips.find((trip) => trip.id === activeTripId);
  const tripById = useMemo(() => new Map(trips.map((trip) => [trip.id, trip])), [trips]);
  const placeById = useMemo(() => new Map((placesQuery.data ?? []).map((item) => [item.placeId, item.place.name])), [placesQuery.data]);

  async function choosePhotos() {
    setFormError(undefined);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError(copy.photoPermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.85,
    });
    if (result.canceled) return;
    setPhotos(result.assets.slice(0, 5).map((asset, index) => ({
      uri: asset.uri,
      fileName: asset.fileName ?? `memory-${Date.now()}-${index}.jpg`,
      mimeType: asset.mimeType ?? "image/jpeg",
    })));
  }

  async function saveMemory() {
    if (!activeTripId) {
      setFormError(copy.memoryNeedsTrip);
      return;
    }
    if (!note.trim() && photos.length === 0) {
      setFormError(copy.memoryNeedsContent);
      return;
    }
    setFormError(undefined);
    try {
      await createMemory.mutateAsync({
        request: {
          tripId: activeTripId,
          ...(selectedPlaceId ? { placeId: selectedPlaceId } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        },
        photos,
      });
      setNote("");
      setPhotos([]);
    } catch {
      setFormError(copy.memorySaveError);
    }
  }

  const memories = memoriesQuery.data?.content ?? [];
  const stats = useMemo(() => ({
    trips: trips.length,
    memories: memoriesQuery.data?.totalElements ?? 0,
    visited: trips.reduce((sum, trip) => sum + trip.visitedCount, 0),
    places: trips.reduce((sum, trip) => sum + trip.placeCount, 0),
  }), [memoriesQuery.data?.totalElements, trips]);

  return (
    <ScreenSafeArea edges={["top", "left", "right"]} style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={memories}
        keyExtractor={(memory) => memory.id}
        contentContainerStyle={[styles.content, { maxWidth: theme.layout.contentMaxWidth, padding: theme.spacing.lg, paddingBottom: tabBarHeight + theme.spacing.lg, gap: theme.spacing.lg }]}
        refreshing={memoriesQuery.isRefetching || tripsQuery.isRefetching}
        onRefresh={() => { void memoriesQuery.refetch(); void tripsQuery.refetch(); }}
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
            <AppText accessibilityRole="header" variant="heading">{copy.memories}</AppText>
            {tripsQuery.isPending || memoriesQuery.isPending ? (
              <SurfaceCard><ActivityIndicator color={theme.colors.primary} /></SurfaceCard>
            ) : null}
            {tripsQuery.isError || memoriesQuery.isError ? (
              <SurfaceCard>
                <AppText tone="error">{copy.memoriesLoadError}</AppText>
                <AppButton variant="outline" onPress={() => { void tripsQuery.refetch(); void memoriesQuery.refetch(); }}>{copy.retry}</AppButton>
              </SurfaceCard>
            ) : null}
            {!tripsQuery.isPending && !tripsQuery.isError ? (
              <SurfaceCard tinted>
                <AppText variant="label">{copy.journeyStats}</AppText>
                <View style={styles.statsRow}>
                  <Stat value={stats.trips} label={copy.statsTrips} />
                  <Stat value={stats.visited} label={copy.statsVisited} />
                  <Stat value={stats.memories} label={copy.statsMemories} />
                </View>
                <AppText variant="caption" tone="muted">{copy.statsPlaces}: {stats.places}</AppText>
              </SurfaceCard>
            ) : null}
            {!tripsQuery.isPending && trips.length > 0 ? (
              <SurfaceCard>
                <AppText variant="label">{copy.saveMemory}</AppText>
                <View style={styles.chips}>
                  {trips.map((trip) => (
                    <SelectChip key={trip.id} selected={trip.id === activeTripId} label={trip.destination} onPress={() => { setSelectedTripId(trip.id); setSelectedPlaceId(undefined); }} />
                  ))}
                </View>
                {placesQuery.isPending ? <ActivityIndicator color={theme.colors.primary} /> : null}
                {placesQuery.data?.length ? (
                  <View style={styles.chips}>
                    <SelectChip selected={!selectedPlaceId} label={copy.noSpecificPlace} onPress={() => setSelectedPlaceId(undefined)} />
                    {placesQuery.data.map((item) => <SelectChip key={item.placeId} selected={item.placeId === selectedPlaceId} label={item.place.name} onPress={() => setSelectedPlaceId(item.placeId)} />)}
                  </View>
                ) : null}
                <TextInput
                  accessibilityLabel={copy.note}
                  multiline
                  maxLength={2000}
                  placeholder={copy.notePlaceholder}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={note}
                  onChangeText={setNote}
                  style={[styles.note, { color: theme.colors.text, backgroundColor: theme.colors.surface, borderColor: theme.colors.softActionBorder, borderRadius: theme.radius.md }]}
                />
                {photos.length ? (
                  <View style={styles.photoStrip}>
                    {photos.map((photo) => <Image key={photo.uri} source={{ uri: photo.uri }} contentFit="cover" style={{ width: 64, height: 64, borderRadius: theme.radius.sm }} />)}
                    <AppButton variant="outline" size="small" onPress={() => setPhotos([])}>{copy.clearPhotos}</AppButton>
                  </View>
                ) : null}
                <View style={styles.actions}>
                  <AppButton variant="outline" leadingIcon={<AppIcon name="camera" />} onPress={() => void choosePhotos()}>{copy.choosePhotos}</AppButton>
                  <AppButton variant="gradient" disabled={createMemory.isPending || !activeTrip} onPress={() => void saveMemory()}>{createMemory.isPending ? copy.savingMemory : copy.saveMemory}</AppButton>
                </View>
                {formError ? <AppText accessibilityRole="alert" tone="error">{formError}</AppText> : null}
              </SurfaceCard>
            ) : null}
          </View>
        }
        ListEmptyComponent={memoriesQuery.isPending || memoriesQuery.isError ? null : (
          <SurfaceCard tinted>
            <AppIcon name="memories" size={theme.layout.iconLarge} />
            <AppText variant="label">{copy.noMemories}</AppText>
            <AppText tone="muted">{trips.length ? copy.noMemoriesHint : copy.memoryNeedsTrip}</AppText>
          </SurfaceCard>
        )}
        renderItem={({ item }) => {
          const trip = item.tripId ? tripById.get(item.tripId) : undefined;
          const photo = item.coverImageUrl ?? item.media[0]?.url;
          const placeName = item.placeId ? placeById.get(item.placeId) : undefined;
          return (
            <SurfaceCard>
              <Badge label={trip?.destination ?? copy.tripLabel} icon="pin" />
              {photo ? <Image source={{ uri: photo }} accessible accessibilityLabel={placeName ?? trip?.destination ?? copy.memories} contentFit="cover" cachePolicy="memory-disk" style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: theme.radius.md }} /> : null}
              {placeName ? <AppText variant="label">{placeName}</AppText> : null}
              {item.note ? <AppText>{item.note}</AppText> : null}
              <AppText variant="caption" tone="muted">{new Date(item.experiencedAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")}{trip?.name ? ` · ${trip.name}` : ""}</AppText>
            </SurfaceCard>
          );
        }}
      />
    </ScreenSafeArea>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return <View style={styles.stat}><AppText variant="heading">{value}</AppText><AppText variant="caption" tone="muted">{label}</AppText></View>;
}

function SelectChip({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) {
  const theme = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.chip, { backgroundColor: selected ? theme.colors.surfaceTint : theme.colors.surface, borderColor: selected ? theme.colors.primary : theme.colors.softActionBorder, opacity: pressed ? theme.motion.pressOpacity : 1 }]}><AppText variant="caption">{label}</AppText></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: "100%", alignSelf: "center", flexGrow: 1 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  stat: { alignItems: "center", minWidth: 72 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8 },
  note: { minHeight: 84, borderWidth: StyleSheet.hairlineWidth, padding: 12, textAlignVertical: "top" },
  photoStrip: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  actions: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
});
