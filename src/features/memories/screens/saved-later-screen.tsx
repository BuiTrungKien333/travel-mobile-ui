import { router } from "expo-router";
import { useRef, useState } from "react";
import { usePreventRemove } from "expo-router/react-navigation";
import { ActivityIndicator, Alert, FlatList, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useCameraCopy } from "@/features/camera/i18n/camera-copy";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import { usePhotoViewerCopy } from "@/features/home/i18n/photo-viewer-copy";
import { PhotoActionError } from "@/features/home/services/photo-action-error";
import { useAppTheme } from "@/hooks/use-app-theme";
import { MemoryCapturePicker } from "../components/memory-capture-picker";
import {
  MemoryEmpty,
  MemoryIconButton,
  MemoryPage,
  MemoryPicture,
} from "../components/memory-primitives";
import { useMemoriesCopy } from "../i18n/memories-copy";
import { useMemories, useMemoryActions } from "../hooks/use-memories";
import { MemoryLoadState } from "../components/memory-load-state";

export function SavedLaterScreen() {
  const theme = useAppTheme();
  const { copy } = useMemoriesCopy();
  const { copy: cameraCopy } = useCameraCopy();
  const { copy: photoCopy } = usePhotoViewerCopy();
  const library = useMemories();
  const { memories, trips } = library;
  const { upload } = useMemoryActions();
  const status = useTripPreview((state) => state.localPhotoStatus);
  const load = useTripPreview((state) => state.loadLocalPhotos);
  const assign = useTripPreview((state) => state.assignLocalPhoto);
  const exportPhoto = useTripPreview((state) => state.exportLocalPhoto);
  const [choosing, setChoosing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [assignedTripId, setAssignedTripId] = useState<string | null>(null);
  usePreventRemove(busy, () => undefined);
  const [error, setError] = useState("");
  const photos = memories.filter(
    (memory) =>
      (!memory.tripId || !trips.some((trip) => trip.id === memory.tripId)),
  );
  return (
    <MemoryPage
      title={copy.later}
      subtitle={copy.laterHint}
      action={
        <MemoryIconButton
          icon="camera"
          label={cameraCopy.quick}
          onPress={() => router.push("/memories/quick-capture")}
        />
      }
    >
      <MemoryLoadState loading={library.isPending} error={library.isError} onRetry={() => void library.refetch()} />
      {status === "idle" || status === "loading" ? (
        <ActivityIndicator color={theme.colors.primaryText} />
      ) : status === "error" ? (
        <MemoryEmpty title={copy.storageError} hint="">
          <AppButton onPress={() => void load()}>{copy.retry}</AppButton>
        </MemoryEmpty>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            gap: theme.spacing.xl,
            width: "100%",
            maxWidth: theme.layout.contentMaxWidth,
            alignSelf: "center",
          }}
          ListEmptyComponent={
            <MemoryEmpty title={copy.laterEmpty} hint={copy.laterEmptyHint}>
              <AppButton onPress={() => router.push("/memories/quick-capture")}>
                {cameraCopy.quick}
              </AppButton>
            </MemoryEmpty>
          }
          ListHeaderComponent={
            <View style={{ gap: theme.spacing.sm }}>
              {error ? <AppText accessibilityRole="alert" tone="error">{error}</AppText>
                : assignedTripId && !busy ? <AppText accessibilityLiveRegion="polite">{cameraCopy.uploaded}</AppText> : null}
              {assignedTripId ? <AppButton variant="outline" disabled={busy} onPress={() => router.push({
                pathname: "/memories/[tripId]", params: { tripId: assignedTripId },
              })}>{copy.openAssignedAlbum}</AppButton> : null}
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={{
                gap: theme.spacing.md,
                padding: theme.spacing.md,
                borderRadius: theme.radius.xxl,
                backgroundColor: theme.colors.surface,
              }}
            >
              <View
                style={{ borderRadius: theme.radius.xl, overflow: "hidden" }}
              >
                {item.photo ? (
                  <MemoryPicture
                    retryable
                    source={item.photo}
                    label={`${copy.later}, ${item.date}, ${item.time}`}
                  />
                ) : null}
              </View>
              <AppText variant="caption" tone="muted">
                {item.date} · {item.time}
              </AppText>
              {item.local && !item.local.deviceSaved ? (
                <>
                  <AppText variant="caption" tone="muted">
                    {copy.savedPrivate}
                  </AppText>
                  <AppButton
                    variant="outline"
                    loading={busy}
                    onPress={() => {
                      if (busyRef.current || typeof item.photo !== "string") return;
                      busyRef.current = true;
                      setBusy(true);
                      setError("");
                      void exportPhoto(item.id)
                        .catch((error: unknown) =>
                          setError(
                            error instanceof PhotoActionError
                              ? photoCopy[error.code]
                              : photoCopy.actionError,
                          ),
                        )
                        .finally(() => { busyRef.current = false; setBusy(false); });
                    }}
                  >
                    {copy.saveDevice}
                  </AppButton>
                </>
              ) : null}
              {item.local ? <AppButton
                disabled={busy}
                onPress={() => {
                  setError("");
                  setChoosing(item.id);
                }}
              >
                {copy.assign}
              </AppButton> : null}
            </View>
          )}
        />
      )}
      {choosing ? (
        <MemoryCapturePicker
          onClose={() => setChoosing(null)}
          onSelect={(selection) => {
            if (busyRef.current) return;
            const id = choosing;
            const trip = trips.find((item) => item.id === selection.tripId);
            const memory = memories.find((item) => item.id === id);
            if (!trip || !memory) { setError(copy.assignmentError); return; }
            const timestamp = new Date(`${selection.day}T${memory.time ?? "00:00"}:00`).getTime();
            if (!Number.isFinite(timestamp) || timestamp > Date.now()) {
              Alert.alert(cameraCopy.futureDate);
              return;
            }
            busyRef.current = true;
            setAssignedTripId(null);
            setChoosing(null);
            setBusy(true);
            setError("");
            let assigned = false;
            void assign(id, selection, trip)
              .then(() => {
                assigned = true;
                setAssignedTripId(trip.id);
                return upload.mutateAsync({ memory: { ...memory, tripId: trip.id, date: selection.day,
                destination: trip.destination,
                local: memory.local ? { ...memory.local, placeId: selection.stopId || undefined } : undefined } });
              })
              .catch(() => setError(assigned ? copy.assignedUploadError : copy.assignmentError))
              .finally(() => { busyRef.current = false; setBusy(false); });
          }}
        />
      ) : null}
    </MemoryPage>
  );
}
