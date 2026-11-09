import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { usePreventRemove } from "expo-router/react-navigation";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { ApiError } from "@/services/api/api-error";
import { authSession } from "@/features/auth/services/auth-session";
import { useCameraCopy } from "@/features/camera/i18n/camera-copy";
import { JournalPhotoViewer } from "@/features/home/components/journal-photo-viewer";
import { JournalPhotoThumbnail } from "@/features/home/components/journal-photo-thumbnail";
import { useJournalPhotoGallery } from "@/features/home/hooks/use-journal-photo-gallery";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import { usePhotoViewerCopy } from "@/features/home/i18n/photo-viewer-copy";
import { PhotoActionError } from "@/features/home/services/photo-action-error";
import type { Memory, Trip } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { travelDateTime } from "@/utils/calendar-date";
import { MemoryCapturePicker } from "../components/memory-capture-picker";
import {
  MemoryEmpty,
  MemoryIconButton,
  MemoryPage,
} from "../components/memory-primitives";
import { useMemoriesCopy } from "../i18n/memories-copy";
import { useLocalMemories, useMemoryActions } from "../hooks/use-memories";
import type { LocalMemory } from "../schemas/local-memory-schema";

type Selection = { tripId: string; day: string; stopId: string };
type Action = {
  id: string;
  kind: "assign" | "upload" | "export";
  progress?: number;
};

export function SavedLaterScreen() {
  const theme = useAppTheme();
  const { copy } = useMemoriesCopy();
  const { copy: cameraCopy } = useCameraCopy();
  const { copy: photoCopy } = usePhotoViewerCopy();
  const memories = useLocalMemories();
  const { upload, remove } = useMemoryActions();
  const status = useTripPreview((state) => state.localPhotoStatus);
  const load = useTripPreview((state) => state.loadLocalPhotos);
  const assign = useTripPreview((state) => state.assignLocalPhoto);
  const exportPhoto = useTripPreview((state) => state.exportLocalPhoto);
  const gallery = useJournalPhotoGallery();
  const list = useRef<FlatList<Memory>>(null);
  const unassigned = memories.filter((memory) => !memory.tripId);
  const pending = memories.filter(
    (memory) => memory.tripId && !memory.local?.uploaded,
  );
  const photos = [...unassigned, ...pending];
  const [choosing, setChoosing] = useState<string | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [notice, setNotice] = useState<{
    text: string;
    error?: boolean;
    tripId?: string;
  } | null>(null);
  const busyRef = useRef(false);
  const mounted = useRef(true);
  const busy = action !== null || remove.isPending;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  usePreventRemove(busy, () => undefined);

  async function perform(
    memory: Memory,
    kind: Action["kind"],
    task: (assertSession: () => void) => Promise<void>,
    errorMessage: (error: unknown) => string,
  ) {
    if (busyRef.current || remove.isPending) return;
    busyRef.current = true;
    const version = authSession.getVersion();
    const assertSession = () => {
      if (!mounted.current || version !== authSession.getVersion())
        throw new ApiError("CANCELLED");
    };
    setAction({ id: memory.id, kind });
    setNotice(null);
    try {
      await task(assertSession);
    } catch (error) {
      if (mounted.current && version === authSession.getVersion())
        setNotice({
          text: errorMessage(error),
          error: true,
          tripId: memory.tripId,
        });
    } finally {
      busyRef.current = false;
      if (mounted.current) setAction(null);
    }
  }

  async function sync(memory: Memory, assertSession: () => void) {
    assertSession();
    setAction({ id: memory.id, kind: "upload" });
    await upload.mutateAsync({
      memory,
      onProgress: (progress) => {
        try {
          assertSession();
        } catch {
          return;
        }
        setAction({ id: memory.id, kind: "upload", progress });
      },
    });
    assertSession();
    setNotice({ text: cameraCopy.uploaded, tripId: memory.tripId });
  }

  function handleAssign(selection: Selection, trip: Trip) {
    if (busyRef.current) return;
    const memory = memories.find((item) => item.id === choosing);
    if (!memory || memory.tripId || trip.id !== selection.tripId) {
      setNotice({ text: copy.assignmentError, error: true });
      return;
    }
    const timestamp = travelDateTime(
      selection.day,
      memory.time ?? "00:00",
    ).getTime();
    if (!Number.isFinite(timestamp) || timestamp > Date.now()) {
      Alert.alert(cameraCopy.futureDate);
      return;
    }
    setChoosing(null);
    let saved: LocalMemory | undefined;
    void perform(
      memory,
      "assign",
      async (assertSession) => {
        assertSession();
        saved = await assign(memory.id, selection, trip);
        assertSession();
        await sync(saved, assertSession);
      },
      () => (saved ? copy.assignedUploadError : copy.assignmentError),
    );
  }

  function handleExport(memory: Memory) {
    void perform(
      memory,
      "export",
      async (assertSession) => {
        assertSession();
        await exportPhoto(memory.id);
        assertSession();
        setNotice({
          text: Platform.OS === "web" ? photoCopy.downloaded : photoCopy.saved,
        });
      },
      (error) =>
        error instanceof PhotoActionError
          ? photoCopy[error.code]
          : photoCopy.actionError,
    );
  }

  function showPhoto(id: string) {
    gallery.setActivePhotoId(id);
    const index = photos.findIndex((item) => item.id === id);
    if (index >= 0)
      list.current?.scrollToIndex({
        index,
        animated: false,
        viewPosition: 0.5,
      });
  }

  function openAlbum(tripId: string | undefined) {
    if (tripId)
      router.push({ pathname: "/memories/[tripId]", params: { tripId } });
  }

  return (
    <MemoryPage
      title={copy.later}
      subtitle={copy.laterHint}
      action={
        <MemoryIconButton
          icon="camera"
          label={cameraCopy.quick}
          disabled={busy}
          onPress={() => router.push("/memories/quick-capture")}
        />
      }
    >
      {status === "idle" || status === "loading" ? (
        <ActivityIndicator
          color={theme.colors.primaryText}
          accessibilityLabel={copy.loading}
        />
      ) : status === "error" ? (
        <MemoryEmpty title={copy.storageError} hint="">
          <AppButton onPress={() => void load()}>{copy.retry}</AppButton>
        </MemoryEmpty>
      ) : (
        <FlatList
          ref={list}
          data={photos}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={({ index, averageItemLength }) => {
            list.current?.scrollToOffset({
              offset: index * averageItemLength,
              animated: false,
            });
          }}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            gap: theme.spacing.xl,
            width: "100%",
            maxWidth: theme.layout.contentMaxWidth,
            alignSelf: "center",
            flexGrow: 1,
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
              {notice ? (
                <AppText
                  accessibilityRole={notice.error ? "alert" : undefined}
                  accessibilityLiveRegion="polite"
                  tone={notice.error ? "error" : "primary"}
                >
                  {notice.text}
                </AppText>
              ) : null}
              {notice?.tripId ? (
                <AppButton
                  variant="outline"
                  disabled={busy}
                  onPress={() => openAlbum(notice.tripId)}
                >
                  {copy.openAssignedAlbum}
                </AppButton>
              ) : null}
              {action ? (
                <View style={{ gap: theme.spacing.xs }}>
                  <AppText variant="caption" accessibilityLiveRegion="polite">
                    {action.kind === "upload"
                      ? cameraCopy.uploading
                      : cameraCopy.savingDevice}
                    {action.progress === undefined
                      ? ""
                      : ` ${Math.round(action.progress * 100)}%`}
                  </AppText>
                  {action.kind === "upload" ? (
                    <View
                      accessibilityRole="progressbar"
                      accessibilityValue={
                        action.progress === undefined
                          ? undefined
                          : {
                              min: 0,
                              max: 100,
                              now: Math.round(action.progress * 100),
                            }
                      }
                      style={{
                        height: theme.spacing.xs,
                        overflow: "hidden",
                        borderRadius: theme.radius.full,
                        backgroundColor: theme.colors.surfaceVariant,
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${Math.round((action.progress ?? 0) * 100)}%`,
                          backgroundColor: theme.colors.primary,
                        }}
                      />
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={{ gap: theme.spacing.md }}>
              {index === unassigned.length && item.tripId ? (
                <View style={{ gap: theme.spacing.xs }}>
                  <AppText variant="sectionTitle">
                    {copy.pendingUploadTitle}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {copy.pendingUploadHint}
                  </AppText>
                </View>
              ) : null}
              <View
                style={{
                  gap: theme.spacing.md,
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.colors.surface,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.colors.border,
                }}
              >
                <JournalPhotoThumbnail
                  standalone
                  memory={item}
                  hidden={gallery.activePhotoId === item.id}
                  disabled={busy}
                  label={`${copy.viewPhoto}, ${item.date ?? copy.noDate}, ${item.time ?? ""}`}
                  registerPhoto={gallery.registerPhoto}
                  onOpen={(selection) => gallery.openPhoto(selection, photos)}
                />
                <AppText variant="caption" tone="muted">
                  {item.date ?? copy.noDate} · {item.time}
                </AppText>
                <AppText variant="caption" tone="primary">
                  {item.tripId ? copy.pendingUpload : copy.localOnly}
                </AppText>
                {item.local && !item.local.deviceSaved ? (
                  <AppButton
                    variant="outline"
                    size="small"
                    loading={action?.kind === "export" && action.id === item.id}
                    disabled={busy}
                    onPress={() => handleExport(item)}
                  >
                    {copy.saveDevice}
                  </AppButton>
                ) : null}
                {item.tripId ? (
                  <>
                    <AppButton
                      loading={
                        action?.id === item.id && action.kind === "upload"
                      }
                      disabled={busy}
                      onPress={() =>
                        void perform(
                          item,
                          "upload",
                          (assertSession) => sync(item, assertSession),
                          () => copy.uploadError,
                        )
                      }
                    >
                      {copy.retryUpload}
                    </AppButton>
                    <AppButton
                      variant="outline"
                      size="small"
                      disabled={busy}
                      onPress={() => openAlbum(item.tripId)}
                    >
                      {copy.openAssignedAlbum}
                    </AppButton>
                  </>
                ) : (
                  <AppButton
                    disabled={busy}
                    onPress={() => {
                      setNotice(null);
                      setChoosing(item.id);
                    }}
                  >
                    {copy.assign}
                  </AppButton>
                )}
              </View>
            </View>
          )}
        />
      )}
      {choosing ? (
        <MemoryCapturePicker
          onClose={() => setChoosing(null)}
          onSelect={handleAssign}
        />
      ) : null}
      {gallery.opened ? (
        <JournalPhotoViewer
          key={gallery.opened.selection.id}
          memories={gallery.opened.memories}
          selection={gallery.opened.selection}
          getSelection={gallery.getSelection}
          onActiveChange={showPhoto}
          onClose={gallery.closePhoto}
          onSave={(memory) => exportPhoto(memory.id)}
          onDelete={async (id) => {
            const memory = memories.find((item) => item.id === id);
            if (memory && !busyRef.current) await remove.mutateAsync(memory);
          }}
        />
      ) : null}
    </MemoryPage>
  );
}
