import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { usePreventRemove } from "expo-router/react-navigation";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { z } from "zod";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppInput } from "@/components/ui/app-input";
import { AppText } from "@/components/ui/app-text";
import { usePhotoViewerCopy } from "@/features/home/i18n/photo-viewer-copy";
import { shareJournalPhoto } from "@/features/home/services/journal-photo-actions";
import { PhotoActionError } from "@/features/home/services/photo-action-error";
import type { Memory, Trip } from "@/features/home/types/home-types";
import { getTripTitle } from "@/features/trip/utils/trip-formatters";
import { useAppTheme } from "@/hooks/use-app-theme";
import { isCalendarDate } from "@/utils/calendar-date";
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
import { ApiError } from "@/services/api/api-error";
import { MEMORY_NOTE_MAX_LENGTH } from "../constants/memory-limits";

const noteSchema = z.object({ text: z.string().trim().max(MEMORY_NOTE_MAX_LENGTH) });

export function MemoryDetailScreen({
  tripId,
  memoryId,
}: {
  tripId?: string;
  memoryId?: string;
}) {
  const [deleted, setDeleted] = useState(false);
  useEffect(() => { if (deleted && tripId) router.dismissTo({ pathname: "/memories/[tripId]", params: { tripId } }); }, [deleted, tripId]);
  const { copy } = useMemoriesCopy();
  const library = useMemories();
  const trip = library.trips.find((item) => item.id === tripId);
  const { memories } = library;
  const photos = trip ? getTripPhotos(memories, trip.id) : [];
  const memory = photos.find((item) => item.id === memoryId);
  if (!trip || !memory)
    return (
      <MemoryPage title={copy.title}>
        {library.isPending || library.isError ? <MemoryLoadState loading={library.isPending} error={library.isError} onRetry={() => void library.refetch()} /> : <MemoryEmpty title={copy.unavailable} hint={copy.unavailableHint} />}
      </MemoryPage>
    );
  return (
    <MemoryDetail key={memory.id} trip={trip} memory={memory} photos={photos} onRemoved={() => setDeleted(true)} />
  );
}

function MemoryDetail({
  trip,
  memory,
  photos,
  onRemoved,
}: {
  trip: Trip;
  memory: Memory;
  photos: Memory[];
  onRemoved: () => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useMemoriesCopy();
  const { copy: photoCopy } = usePhotoViewerCopy();
  const { update, remove } = useMemoryActions();
  const [editing, setEditing] = useState(false);
  const [editingMemory, setEditingMemory] = useState(memory);
  const [fullPhoto, setFullPhoto] = useState(false);
  const [uri, setUri] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [notice, setNotice] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(noteSchema),
    defaultValues: { text: memory.text },
  });
  const writing = isSubmitting || update.isPending || remove.isPending;
  usePreventRemove(writing, () => undefined);
  const index = photos.findIndex((item) => item.id === memory.id);
  const date =
    memory.date && isCalendarDate(memory.date)
      ? new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(`${memory.date}T12:00:00`))
      : copy.noDate;
  const album = () =>
    router.dismissTo({
      pathname: "/memories/[tripId]",
      params: { tripId: trip.id },
    });
  const capture = () =>
    router.dismissTo({
      pathname: "/memories/quick-capture",
      params: {
        tripId: trip.id,
        day: memory.date ?? trip.days.at(-1)?.date,
        stopId: "",
      },
    });
  async function handleShare(x: number, y: number) {
    if (!uri || sharing) return;
    setSharing(true);
    setNotice(null);
    try {
      await shareJournalPhoto(uri, getTripTitle(trip, locale), {
        x: Math.max(0, x - theme.layout.touchTarget / 2),
        y: Math.max(0, y - theme.layout.touchTarget / 2),
        width: theme.layout.touchTarget,
        height: theme.layout.touchTarget,
      });
    } catch (error) {
      setNotice({
        text:
          error instanceof PhotoActionError
            ? photoCopy[error.code]
            : photoCopy.actionError,
        error: true,
      });
    } finally {
      setSharing(false);
    }
  }
  return (
    <MemoryPage
      title={trip.destination}
      subtitle={getTripTitle(trip, locale)}
      onBack={album}
      action={
        <MemoryIconButton
          icon="memories"
          label={photoCopy.back}
          onPress={album}
          disabled={sharing}
        />
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            width: "100%",
            maxWidth: theme.layout.cameraContentMaxWidth,
            alignSelf: "center",
            padding: theme.spacing.lg,
            gap: theme.spacing.xl,
            justifyContent: "space-between",
          }}
        >
          <View style={{ gap: theme.spacing.lg }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: theme.spacing.xs,
              }}
            >
              <AppIcon name="pin" size={theme.layout.iconSmall} />
              <AppText variant="label" tone="primary">
                {memory.place?.[locale] ?? copy.noPlace}
              </AppText>
            </View>
            <View
              style={{
                borderRadius: theme.layout.cameraViewfinderRadius,
                overflow: "hidden",
              }}
            >
              {memory.photo ? (
                <MemoryPicture
                  retryable
                  source={memory.photo}
                  label={memory.place?.[locale] ?? trip.destination}
                  contentFit={fullPhoto ? "contain" : "cover"}
                  onLoad={setUri}
                />
              ) : null}
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: theme.spacing.md,
              }}
            >
              <View
                style={{
                  padding: theme.spacing.sm,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.colors.surfaceTint,
                }}
              >
                <AppIcon name="person" variant="outline" />
              </View>
              <View style={{ flexShrink: 1 }}>
                <AppText variant="label">{copy.you}</AppText>
                <AppText variant="caption" tone="muted">
                  {date}
                  {memory.time ? ` · ${memory.time}` : ""}
                </AppText>
              </View>
              <MemoryIconButton
                icon={fullPhoto ? "collapse" : "expand"}
                label={copy.fullPhoto}
                onPress={() => setFullPhoto((value) => !value)}
              />
            </View>
          </View>
          <View style={{ gap: theme.spacing.md }}>
            {editing ? (
              <View style={{ gap: theme.spacing.md }}>
                <Controller
                  control={control}
                  name="text"
                  render={({
                    field: { value, onChange, onBlur, ref },
                    fieldState: { error },
                  }) => (
                    <AppInput
                      ref={ref}
                      autoFocus
                      label={copy.note}
                      placeholder={copy.noteHint}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      multiline
                      maxLength={MEMORY_NOTE_MAX_LENGTH}
                      error={error ? copy.noteTooLong : undefined}
                    />
                  )}
                />
                <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                  <AppButton
                    variant="soft"
                    disabled={writing}
                    style={{ flex: 1 }}
                    onPress={() => {
                      reset({ text: memory.text });
                      setEditing(false);
                    }}
                  >
                    {copy.cancel}
                  </AppButton>
                  <AppButton
                    style={{ flex: 1 }}
                    loading={isSubmitting}
                    onPress={handleSubmit(async ({ text }) => {
                      try {
                        await update.mutateAsync({ memory: editingMemory, text });
                        setEditing(false);
                        setNotice({ text: copy.saved });
                      } catch (error) {
                        setNotice({ text: error instanceof ApiError && error.code === "MEMORY_003" ? copy.noteConflict
                          : error instanceof ApiError && error.code === "MEMORY_VERSION_REQUIRED" ? copy.noteVersionRequired
                            : error instanceof ApiError && error.code === "MEMORY_LOCAL_SYNC" ? copy.noteLocalSync
                              : error instanceof ApiError && error.code === "MEMORY_BUSY" ? copy.operationBusy
                                : error instanceof ApiError && error.code === "MEMORY_004" ? copy.uploadFrozen : copy.loadError, error: true });
                      }
                    })}
                  >
                    {copy.save}
                  </AppButton>
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.edit}
                disabled={writing || !!memory.pendingDeletion}
                onPress={() => {
                  setNotice(null);
                  reset({ text: memory.text });
                  setEditingMemory(memory);
                  setEditing(true);
                }}
                style={({ pressed }) => ({
                  minHeight: theme.layout.touchTarget,
                  padding: theme.spacing.lg,
                  borderRadius: theme.radius.xxl,
                  backgroundColor: theme.colors.surfaceTint,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.spacing.md,
                  opacity: pressed ? theme.motion.pressOpacity : 1,
                })}
              >
                <AppText
                  tone={memory.text ? "default" : "muted"}
                  style={{ flex: 1 }}
                >
                  {memory.text || copy.noteHint}
                </AppText>
                <AppIcon name="edit" color={theme.colors.primaryText} />
              </Pressable>
            )}
            {memory.pendingDeletion ? <AppText accessibilityRole="alert" tone="muted">{copy.pendingDelete}</AppText> : null}
            <AppButton variant="outline" loading={remove.isPending} disabled={writing || editing} onPress={() => {
              Alert.alert(copy.deleteTitle, copy.deleteHint, [
                { text: copy.cancel, style: "cancel" },
                { text: copy.deletePhoto, style: "destructive", onPress: () => {
                  void remove.mutateAsync(memory).then(onRemoved).catch((error: unknown) => {
                    setNotice({ text: error instanceof ApiError && error.code === "MEMORY_BUSY" ? copy.operationBusy : copy.deleteError, error: true });
                  });
                } },
              ]);
            }}>{memory.pendingDeletion ? copy.retryDelete : copy.deletePhoto}</AppButton>
            {notice ? (
              <AppText
                accessibilityLiveRegion="polite"
                accessibilityRole={notice.error ? "alert" : undefined}
                tone={notice.error ? "error" : "primary"}
                style={{ textAlign: "center" }}
              >
                {notice.text}
              </AppText>
            ) : null}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-around",
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.full,
              }}
            >
              <MemoryIconButton
                icon="back"
                label={photoCopy.previous}
                disabled={index === 0 || editing || sharing}
                onPress={() =>
                  router.setParams({ memoryId: photos[index - 1].id })
                }
              />
              <AppText variant="caption" tone="muted">
                {index + 1}/{photos.length}
              </AppText>
              <MemoryIconButton
                icon="camera"
                label={copy.camera}
                disabled={trip.localOnly || trip.status === "cancelled" || editing || sharing}
                onPress={capture}
              />
              <MemoryIconButton
                icon="share"
                label={photoCopy.share}
                disabled={!uri || sharing || editing}
                onPress={(event) =>
                  void handleShare(
                    event.nativeEvent.pageX,
                    event.nativeEvent.pageY,
                  )
                }
              />
              <MemoryIconButton
                icon="chevron"
                label={photoCopy.next}
                disabled={index === photos.length - 1 || editing || sharing}
                onPress={() =>
                  router.setParams({ memoryId: photos[index + 1].id })
                }
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </MemoryPage>
  );
}
