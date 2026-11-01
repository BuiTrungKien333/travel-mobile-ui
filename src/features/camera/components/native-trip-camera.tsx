import { CameraView, type CameraType } from "expo-camera";
import { Image } from "expo-image";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useIsFocused } from "expo-router/react-navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

const CAMERA_READY_TIMEOUT_MS = 15000;

export function NativeTripCamera(
  props: CameraLayoutProps & {
    tripId?: string;
    date: string;
    stopId?: string;
    suspended?: boolean;
    quick?: boolean;
  },
) {
  const theme = useAppTheme();
  const { copy } = useCameraCopy();
  const { copy: photoCopy } = usePhotoViewerCopy();
  const { permission, issue, requesting, request } = useCameraAccess();
  const camera = useRef<CameraView>(null);
  const mounted = useRef(true);
  const operation = useRef(false);
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
  const [pending, setPending] = useState<{ uri: string; id?: string } | null>(
    null,
  );
  const [foreground, setForeground] = useState(
    AppState.currentState !== "background" &&
      AppState.currentState !== "inactive",
  );
  const focused = useIsFocused();
  const panelOpen = useTripPreview((state) => state.panel !== null);
  const savePhoto = useTripPreview((state) => state.saveLocalPhoto);
  const exportPhoto = useTripPreview((state) => state.exportLocalPhoto);
  const memories = useTripPreview((state) => state.memories);
  const active = foreground && focused && !panelOpen && !props.suspended;
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
  useEffect(() => {
    if (!pending) operation.current = false;
  }, [pending]);
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
    setSaved(false);
    try {
      await task();
    } catch (error) {
      if (mounted.current)
        setError(
          error instanceof PhotoActionError
            ? photoCopy[error.code]
            : copy.photoError,
        );
    } finally {
      operation.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function persistPhoto(photo: { uri: string; id?: string }) {
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
      }));
    if (!memory.photo || typeof memory.photo !== "string")
      throw new Error("Photo unavailable");
    if (mounted.current) setPending({ uri: memory.photo, id: memory.id });
    await exportPhoto(memory.id);
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
        if (props.quick) await persistPhoto(result);
      }
    });
  }
  function pick() {
    void run(async () => {
      const { launchImageLibraryAsync } = await import("expo-image-picker");
      const result = await launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: theme.layout.cameraPhotoQuality,
        exif: false,
      });
      if (result.canceled || !result.assets[0] || !mounted.current) return;
      const photo = await prepareCameraPhoto(result.assets[0]);
      if (mounted.current) {
        setPending(photo);
        setReady(false);
        if (props.quick) await persistPhoto(photo);
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
  ) : issue === "insecure" || issue === "unsupported" ? (
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
      error={error}
      status={
        pending
          ? pending.id
            ? copy.savedPrivate
            : copy.confirmHint
          : saved
            ? Platform.OS === "web"
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
