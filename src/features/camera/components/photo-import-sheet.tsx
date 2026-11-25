import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  View,
} from "react-native";
import { Image } from "expo-image";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { UI_PREVIEW_ENABLED } from "@/constants/development";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { authSession } from "@/features/auth/services/auth-session";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import type { Trip } from "@/features/home/types/home-types";
import { getTripTitle } from "@/features/trip/utils/trip-formatters";
import { useMemoryActions } from "@/features/memories/hooks/use-memories";
import { localMemorySchema } from "@/features/memories/schemas/local-memory-schema";
import {
  importPhotos,
  type ImportSource,
  type PhotoImportItem,
} from "@/features/memories/services/import-photos";
import { ApiError } from "@/services/api/api-error";
import { prepareCameraPhoto } from "../services/camera-photos";
import { useCameraCopy } from "../i18n/camera-copy";
import { CameraIconButton } from "./camera-icon-button";

export function PhotoImportSheet({
  sources,
  trip,
  date,
  stopId,
  onClose,
}: {
  sources: readonly ImportSource[];
  trip?: Trip;
  date: string;
  stopId?: string;
  onClose: () => void;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useCameraCopy();
  const profile = useProfile();
  const session = useRef({
    version: authSession.getVersion(),
    owner: profile.data?.id,
  });
  const save = useTripPreview((state) => state.saveLocalPhoto);
  const local = useTripPreview((state) => state.memories);
  const { upload, refresh } = useMemoryActions();
  const [items, setItems] = useState<PhotoImportItem[]>(() =>
    sources.map((source, index) => ({
      id: String(index),
      source,
      state: "waiting",
      progress: 0,
    })),
  );
  const latest = useRef(items);
  const mounted = useRef(true);
  const started = useRef(false);
  const operation = useRef(false);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  function assertSession() {
    if (
      !mounted.current ||
      authSession.getVersion() !== session.current.version ||
      (!UI_PREVIEW_ENABLED && !session.current.owner)
    )
      throw new ApiError("CANCELLED");
  }

  async function execute(selected: readonly PhotoImportItem[]) {
    if (operation.current) return;
    operation.current = true;
    setRunning(true);
    try {
      // Upload persists server/request IDs before completion. Retry from that durable record,
      // including when the create/upload response was lost after the server saved it.
      const current = selected.map((item) => {
        const stored = local.find((photo) => photo.id === item.memory?.id);
        return stored?.local
          ? { ...item, memory: localMemorySchema.parse(stored) }
          : item;
      });

      await importPhotos(current, {
        assertSession,
        save: async (source) => {
          assertSession();
          // Preserve gallery aspect ratio; prepare one bitmap at a time, never all ten.
          const photo = await prepareCameraPhoto(source, 1, false);
          assertSession();

          return save({
            uri: photo.uri,
            tripId: trip?.id,
            remoteTrip: trip,
            date,
            stopId,
            local: {
              userId: session.current.owner,
              width: photo.width,
              height: photo.height,
              mimeType: photo.mimeType,
              placeId: trip?.days
                .flatMap((day) => day.stops)
                .find((stop) => stop.id === stopId)?.placeId,
            },
          });
        },
        upload:
          trip && !UI_PREVIEW_ENABLED
            ? async (memory, onProgress) => {
                assertSession();

                return upload.mutateAsync({
                  memory,
                  onProgress,
                  refreshQueries: false,
                });
              }
            : undefined,
        onChange: (item) => {
          if (!mounted.current) return;
          latest.current = latest.current.map((current) =>
            current.id === item.id ? item : current,
          );
          setItems(latest.current);
        },
      });
    } finally {
      operation.current = false;
      if (
        trip &&
        !UI_PREVIEW_ENABLED &&
        session.current.version === authSession.getVersion()
      )
        refresh();
      if (mounted.current) setRunning(false);
    }
  }

  function errorLabel(item: PhotoImportItem) {
    if (item.error instanceof ApiError) {
      if (item.error.code === "CANCELLED") return copy.importSessionChanged;
      if (item.error.code === "UPLOAD_002") return copy.tooLarge;
      if (item.error.code === "UPLOAD_003") return copy.invalidType;
      if (item.error.code === "UPLOAD_008") return copy.imageTooLarge;
      if (item.error.code === "MEMORY_FUTURE_DATE") return copy.futureDate;
    }

    return item.memory ? copy.importUploadFailed : copy.importSaveFailed;
  }
  const saved = items.filter((item) => item.memory).length;
  const synced = items.filter((item) => item.state === "uploaded").length;
  const failed = items.filter((item) => item.state === "error");
  const close = () => {
    if (!operation.current && !running) onClose();
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={close}
      onShow={() => {
        if (started.current) return;
        started.current = true;
        void execute(latest.current);
      }}
    >
      <ScreenSafeArea
        style={{ flex: 1, backgroundColor: theme.colors.photoViewerBackdrop }}
      >
        <View
          style={{
            flex: 1,
            width: "100%",
            alignSelf: "center",
            maxWidth: theme.layout.contentMaxWidth,
            padding: theme.spacing.lg,
            gap: theme.spacing.md,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.sm,
            }}
          >
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <AppText
                variant="subheading"
                style={{ color: theme.colors.photoViewerText }}
              >
                {copy.importTitle}
              </AppText>
              {trip ? (
                <AppText
                  variant="label"
                  style={{ color: theme.colors.photoViewerText }}
                >
                  {getTripTitle(trip, locale)}
                </AppText>
              ) : null}
              <AppText
                variant="caption"
                style={{ color: theme.colors.photoViewerMuted }}
              >
                {trip ? copy.importLocalHint : copy.importInboxHint}
              </AppText>
            </View>
            <CameraIconButton
              icon="close"
              label={copy.importDone}
              disabled={running}
              onPress={close}
            />
          </View>
          <AppText
            accessibilityLiveRegion="polite"
            variant="caption"
            style={{ color: theme.colors.photoViewerText }}
          >
            {saved}/{items.length} {copy.importSummary}
            {trip ? ` · ${synced}/${items.length} ${copy.importSynced}` : ""}
          </AppText>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: theme.spacing.sm }}
            renderItem={({ item, index }) => (
              <View
                style={{
                  paddingVertical: theme.spacing.sm,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.colors.glassBorder,
                  flexDirection: "row",
                  gap: theme.spacing.md,
                  alignItems: "center",
                }}
              >
                <Image
                  source={item.memory?.photo ?? item.source.uri}
                  contentFit="cover"
                  recyclingKey={item.id}
                  accessibilityLabel={`${copy.importPhoto} ${index + 1}`}
                  style={{
                    width: theme.layout.cameraActionSize,
                    height: theme.layout.cameraActionSize,
                    borderRadius: theme.radius.sm,
                  }}
                />
                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                  <AppText
                    variant="label"
                    style={{ color: theme.colors.photoViewerText }}
                  >
                    {copy.importPhoto} {index + 1}
                  </AppText>
                  <AppText
                    accessibilityRole={
                      item.state === "error" ? "alert" : undefined
                    }
                    variant="caption"
                    style={{
                      color:
                        item.state === "error"
                          ? theme.colors.photoViewerDanger
                          : theme.colors.photoViewerMuted,
                    }}
                  >
                    {item.state === "error"
                      ? errorLabel(item)
                      : item.state === "uploading"
                        ? `${copy.uploading} ${item.progress}%`
                        : item.state === "uploaded"
                          ? copy.importUploaded
                          : item.state === "saved"
                            ? copy.importSaved
                            : item.state === "saving"
                              ? copy.importSaving
                              : copy.importWaiting}
                  </AppText>
                  {item.state === "uploading" ? (
                    <View
                      accessibilityRole="progressbar"
                      accessibilityValue={{
                        min: 0,
                        max: 100,
                        now: item.progress,
                      }}
                      style={{
                        height: theme.spacing.xxs,
                        backgroundColor: theme.colors.photoViewerControls,
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${item.progress}%`,
                          backgroundColor: theme.colors.primary,
                        }}
                      />
                    </View>
                  ) : null}
                </View>
                {item.state === "saving" || item.state === "uploading" ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : item.state === "error" ? (
                  <CameraIconButton
                    icon="cameraRotate"
                    label={`${copy.retry} ${copy.importPhoto.toLowerCase()} ${index + 1}`}
                    disabled={running}
                    onPress={() => void execute([item])}
                  />
                ) : null}
              </View>
            )}
          />
          {failed.length ? (
            <AppButton
              disabled={running}
              size="small"
              onPress={() => void execute(failed)}
            >
              {copy.importRetry}
            </AppButton>
          ) : null}
          <AppButton
            disabled={running}
            variant="outline"
            size="small"
            onPress={close}
            style={{ borderColor: theme.colors.glassBorder }}
          >
            <AppText
              variant="label"
              style={{ color: theme.colors.photoViewerText }}
            >
              {copy.importDone}
            </AppText>
          </AppButton>
        </View>
      </ScreenSafeArea>
    </Modal>
  );
}
