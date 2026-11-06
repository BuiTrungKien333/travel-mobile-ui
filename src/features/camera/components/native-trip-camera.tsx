import { CameraView, type CameraType } from "expo-camera";
import { Image } from "expo-image";
import { launchImageLibraryAsync } from "expo-image-picker";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useIsFocused, useNavigation, usePreventRemove } from "expo-router/react-navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
import { prepareCameraPhoto } from "../services/camera-photos";
import { useCameraCopy } from "../i18n/camera-copy";
import { CameraLayout, type CameraLayoutProps } from "./camera-layout";
import { CameraIconButton } from "./camera-icon-button";
import { useCameraAccess } from "../hooks/use-camera-access";
import { PhotoActionError } from "@/features/home/services/photo-action-error";
import { usePhotoViewerCopy } from "@/features/home/i18n/photo-viewer-copy";
import { useMemoryActions, useMemoryTrips } from "@/features/memories/hooks/use-memories";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/services/api/api-error";

const CAMERA_READY_TIMEOUT_MS = 15000;

export function NativeTripCamera(
  props: CameraLayoutProps & {
    tripId?: string;
    date: string;
    stopId?: string;
    suspended?: boolean;
    quick?: boolean;
    requestOnOpen?: boolean;
  },
) {
  const theme = useAppTheme();
  const { copy } = useCameraCopy();
  const { copy: photoCopy } = usePhotoViewerCopy();
  const { permission, issue, requesting, request } = useCameraAccess();
  const camera = useRef<CameraView>(null);
  const mounted = useRef(true);
  const operation = useRef(false);
  const requestedOnOpen = useRef(false);
  const [busy, setBusy] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [flashOn, setFlashOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const previewScale = useSharedValue(1);
  const previewMotion = useAnimatedStyle(() => ({
    transform: [{ scale: previewScale.get() }],
  }));
  useEffect(() => {
    previewScale.set(
      withTiming(zoom, {
        duration: theme.motion.tabTransitionDuration,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [zoom, previewScale, theme.motion.tabTransitionDuration]);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [mountError, setMountError] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [deviceSaved, setDeviceSaved] = useState(false);
  const [warning, setWarning] = useState("");
  const [pending, setPending] = useState<{ uri: string; id?: string; deviceSaved?: boolean; width?: number; height?: number; mimeType?: string } | null>(
    null,
  );
  const [foreground, setForeground] = useState(
    AppState.currentState !== "background" &&
      AppState.currentState !== "inactive",
  );
  const focused = useIsFocused();
  const navigation = useNavigation();
  usePreventRemove(busy || (!!pending && !pending.id), ({ data }) => {
    if (operation.current) return;
    Alert.alert(copy.unsavedTitle, copy.unsavedHint, [
      { text: copy.keepPhoto, style: "cancel" },
      { text: copy.leavePhoto, style: "destructive", onPress: () => navigation.dispatch(data.action) },
    ]);
  });
  const panelOpen = useTripPreview((state) => state.panel !== null);
  const savePhoto = useTripPreview((state) => state.saveLocalPhoto);
  const exportPhoto = useTripPreview((state) => state.exportLocalPhoto);
  const memories = useTripPreview((state) => state.memories);
  const { trips } = useMemoryTrips();
  const profile = useProfile();
  const { upload } = useMemoryActions();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const active = foreground && focused && !panelOpen && !props.suspended;
  useEffect(() => {
    if (
      props.requestOnOpen &&
      Platform.OS !== "web" &&
      active &&
      !requestedOnOpen.current &&
      permission?.status === "undetermined" &&
      !issue &&
      !requesting
    ) {
      requestedOnOpen.current = true;
      void request();
    }
  }, [props.requestOnOpen, active, permission?.status, issue, requesting, request]);
  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener("change", (value) => {
      setForeground(value === "active");
    });
    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, []);
  const handleCameraRef = useCallback((instance: CameraView | null) => {
    camera.current = instance;
    if (!instance) setReady(false);
  }, []);
  useEffect(() => {
    if (!active || !permission?.granted || pending || ready || mountError)
      return;
    const timer = setTimeout(
      () => setMountError(true),
      CAMERA_READY_TIMEOUT_MS,
    );
    return () => clearTimeout(timer);
  }, [active, permission?.granted, pending, ready, mountError]);
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(
      () => setSaved(false),
      theme.motion.photoViewerNoticeDuration,
    );
    return () => clearTimeout(timer);
  }, [saved, theme.motion.photoViewerNoticeDuration]);
  async function run(task: () => Promise<void>) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    setWarning("");
    setSaved(false);
    setUploadProgress(null);
    try {
      await task();
    } catch (error) {
      if (mounted.current)
        setError(
          error instanceof PhotoActionError
            ? photoCopy[error.code]
            : error instanceof ApiError
              ? error.code === "UPLOAD_002" ? copy.tooLarge
                : error.code === "UPLOAD_003" ? copy.invalidType
                  : error.code === "UPLOAD_008" ? copy.imageTooLarge
                    : error.code === "MEMORY_FUTURE_DATE" ? copy.futureDate
                    : copy.uploadError
              : copy.photoError,
        );
    } finally {
      operation.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function persistPhoto(photo: { uri: string; id?: string; width?: number; height?: number; mimeType?: string }) {
    const existing = photo.id
      ? memories.find((item) => item.id === photo.id)
      : undefined;
    const memory =
      existing ??
      (await savePhoto({
        uri: photo.uri,
        tripId: props.quick ? undefined : props.tripId,
        date: props.date,
        stopId: props.stopId,
        remoteTrip: props.quick ? undefined : trips.find((trip) => trip.id === props.tripId),
        local: { userId: profile.data?.id, width: photo.width, height: photo.height, mimeType: photo.mimeType,
          placeId: !props.quick && props.stopId ? props.stopId : undefined },
      }));
    if (!memory.photo || typeof memory.photo !== "string")
      throw new Error("Photo unavailable");
    let exported = memory.local?.deviceSaved ?? false;
    if (mounted.current) setPending({ uri: memory.photo, id: memory.id, deviceSaved: exported });
    if (!exported) {
      try { await exportPhoto(memory.id); exported = true; }
      catch { if (mounted.current) setWarning(copy.libraryCopyError); }
    }
    if (mounted.current) {
      setDeviceSaved(exported);
      setPending({ uri: memory.photo, id: memory.id, deviceSaved: exported });
    }
    if (!props.quick && memory.tripId) {
      await upload.mutateAsync({
        memory: { ...memory, local: memory.local ? { ...memory.local, deviceSaved: exported } : undefined },
        onProgress: (value) => { if (mounted.current) setUploadProgress(value); },
      });
    }
    if (mounted.current) {
      setPending(null);
      setReady(false);
      setSaved(true);
      setError("");
    }
  }
  function capture() {
    if (pending) {
      void run(() => persistPhoto(pending));
      return;
    }
    if (!ready || !active || !camera.current) return;
    void run(async () => {
      const photo = await camera.current?.takePictureAsync({
        quality: theme.layout.cameraPhotoQuality,
        exif: false,
      });
      if (!photo) throw new Error("No photo returned");
      if (!mounted.current) return;
      const result = await prepareCameraPhoto(photo, zoom);
      if (mounted.current) {
        setPending(result);
        setReady(false);
        await persistPhoto(result);
      }
    });
  }
  function pick() {
    void run(async () => {
      // Mobile browsers require the picker to open directly from the press event.
      const result = await launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: theme.layout.cameraPhotoQuality,
        exif: false,
      }).catch((error: unknown) => {
        if (error && typeof error === "object" && "code" in error && /permission/i.test(String(error.code))) {
          if (mounted.current) Alert.alert(copy.gallery, copy.galleryDenied, [
            { text: copy.retry, style: "cancel" },
            { text: copy.settings, onPress: () => { void Linking.openSettings().catch(() => setError(copy.galleryDenied)); } },
          ]);
          return null;
        }
        throw error;
      });
      if (!result || result.canceled || !result.assets[0] || !mounted.current) return;
      const photo = await prepareCameraPhoto(result.assets[0]);
      if (mounted.current) {
        setPending(photo);
        setReady(false);
        await persistPhoto(photo);
      }
    });
  }
  function retake() {
    setPending(null);
    setReady(false);
    setError("");
  }
  const notice = (
    title: string,
    hint: string,
    action?: { label: string; onPress: () => void },
  ) => (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
      }}
    >
      <AppText
        variant="label"
        style={{ color: theme.colors.photoViewerText, textAlign: "center" }}
      >
        {title}
      </AppText>
      <AppText
        variant="caption"
        style={{ color: theme.colors.photoViewerMuted, textAlign: "center" }}
      >
        {hint}
      </AppText>
      {action ? (
        <AppButton
          variant="gradient"
          size="small"
          disabled={busy || requesting}
          onPress={action.onPress}
          style={{
            alignSelf: "center",
            minHeight: theme.layout.compactTouchTarget,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.xs,
          }}
        >
          {action.label}
        </AppButton>
      ) : null}
    </View>
  );
  const frame = pending ? (
    <Image
      accessible
      accessibilityLabel={copy.confirmHint}
      source={{ uri: pending.uri }}
      contentFit="cover"
      style={StyleSheet.absoluteFill}
    />
  ) : issue === "insecure" || issue === "unsupported" || issue === "embedded" ? (
    notice(copy.error, copy[issue])
  ) : !permission && !issue ? (
    <ActivityIndicator style={{ flex: 1 }} color={theme.colors.primary} />
  ) : !permission?.granted ? (
    notice(copy.permission, issue ? copy[issue] : copy.permissionHint, {
      label:
        Platform.OS === "web" || permission?.canAskAgain !== false
          ? copy.allow
          : copy.settings,
      onPress: () => {
        if (Platform.OS === "web" || permission?.canAskAgain !== false)
          void request();
        else
          void Linking.openSettings().catch(() =>
            setError(copy.permissionError),
          );
      },
    })
  ) : mountError ? (
    notice(copy.error, copy.startError, {
      label: copy.retry,
      onPress: () => {
        setMountError(false);
        setReady(false);
        setAttempt((value) => value + 1);
      },
    })
  ) : (
    <>
      {active ? (
        <Animated.View style={[StyleSheet.absoluteFill, previewMotion]}>
          <CameraView
            ref={handleCameraRef}
            key={`${facing}:${attempt}`}
            facing={facing}
            mode="picture"
            mirror={facing === "front"}
            flash={flashOn ? (facing === "front" ? "screen" : "on") : "off"}
            ratio="1:1"
            zoom={0}
            style={StyleSheet.absoluteFill}
            onCameraReady={() => setReady(true)}
            onMountError={() => {
              setMountError(true);
              setReady(false);
            }}
          />
        </Animated.View>
      ) : null}
      {!ready ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: "center",
              alignItems: "center",
              gap: theme.spacing.sm,
            },
          ]}
        >
          <ActivityIndicator color={theme.colors.primary} />
          <AppText
            variant="caption"
            style={{ color: theme.colors.photoViewerText }}
          >
            {copy.ready}
          </AppText>
        </View>
      ) : null}
    </>
  );
  return (
    <CameraLayout
      {...props}
      onBack={() => { if (!operation.current) props.onBack(); }}
      onHome={() => { if (!operation.current) props.onHome(); }}
      onJournal={() => { if (!operation.current) props.onJournal(); }}
      onDetails={() => { if (!operation.current) props.onDetails(); }}
      bottomNavigation={props.bottomNavigation ? <View pointerEvents={busy ? "none" : "auto"}>{props.bottomNavigation}</View> : undefined}
      onSelectTrip={pending ? undefined : props.onSelectTrip}
      frame={frame}
      busy={busy}
      pending={!!pending}
      canCapture={
        !!pending || (!!permission?.granted && ready && active && !mountError)
      }
      onCapture={capture}
      onRetake={retake}
      onLibrary={pick}
      onFlip={() => {
        setReady(false);
        setFacing((value) => (value === "back" ? "front" : "back"));
        setZoom(1);
        setMountError(false);
      }}
      error={error || warning}
      status={
        busy
          ? upload.isPending
            ? `${copy.uploading}${uploadProgress === null ? "" : ` ${Math.round(uploadProgress * 100)}%`}`
            : copy.savingDevice
          : pending
          ? pending.id
            ? !props.quick && props.tripId ? copy.savedAwaitingUpload : copy.savedPrivate
            : copy.confirmHint
          : saved
            ? !props.quick && props.tripId
              ? copy.uploaded
              : !deviceSaved ? copy.savedPrivateInbox
              : Platform.OS === "web"
              ? copy.savedDownload
              : props.quick || !props.tripId
                ? copy.savedInbox
                : copy.savedDevice
            : undefined
      }
      frameControls={
        !pending ? (
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              top: theme.spacing.md,
              left: theme.spacing.md,
              right: theme.spacing.md,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <CameraIconButton
              size="tiny"
              icon={flashOn ? "flashOn" : "flashOff"}
              label={flashOn ? copy.flashOff : copy.flashOn}
              active={flashOn}
              disabled={busy || !permission?.granted || Platform.OS === "web"}
              onPress={() => setFlashOn((value) => !value)}
            />
            <CameraIconButton
              size="tiny"
              label={`${copy.zoom}, ${zoom}×`}
              disabled={busy || !permission?.granted}
              active={zoom > 1}
              onPress={() => setZoom((value) => (value >= 3 ? 1 : value + 1))}
            >
              <AppText
                variant="caption"
                style={{ color: theme.colors.photoViewerText }}
              >
                {zoom}×
              </AppText>
            </CameraIconButton>
          </View>
        ) : undefined
      }
    />
  );
}
