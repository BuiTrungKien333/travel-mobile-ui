import { CameraView, useCameraPermissions, type CameraType } from "expo-camera";
import { Image } from "expo-image";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useFocusEffect } from "expo-router";
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
import { useCreateMemoryWithMediaMutation } from "@/features/home/api/memory-hooks";
import { prepareCameraPhoto } from "../services/camera-photos";
import { useCameraCopy } from "../i18n/camera-copy";
import { CameraLayout, type CameraLayoutProps } from "./camera-layout";
import { CameraIconButton } from "./camera-icon-button";

export function NativeTripCamera(
  props: CameraLayoutProps & { tripId: string; date: string; stopId?: string },
) {
  const theme = useAppTheme();
  const { copy } = useCameraCopy();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
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
  const [pending, setPending] = useState<{ uri: string } | null>(null);
  const [foreground, setForeground] = useState(
    AppState.currentState === "active",
  );
  const [focused, setFocused] = useState(true);
  const createMemory = useCreateMemoryWithMediaMutation();
  const active = foreground && focused;
  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener("change", (value) => {
      setForeground(value === "active");
      if (value === "active")
        void getPermission().catch(() => {
          if (mounted.current) setError(copy.error);
        });
    });
    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, [getPermission, copy.error]);
  useEffect(() => {
    if (!pending) operation.current = false;
  }, [pending]);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        setReady(false);
      };
    }, []),
  );
  useEffect(() => {
    if (!active) setReady(false);
  }, [active]);
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
    } catch {
      if (mounted.current) setError(copy.photoError);
    } finally {
      operation.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  function capture() {
    if (pending) {
      if (operation.current) return;
      void run(async () => {
        await createMemory.mutateAsync({
          request: {
            tripId: props.tripId,
            ...(props.stopId ? { placeId: props.stopId } : {}),
            experiencedAt: new Date().toISOString(),
          },
          photos: [{ uri: pending.uri, fileName: `wego-${Date.now()}.jpg`, mimeType: "image/jpeg" }],
        });
        if (!mounted.current) return;
        setPending(null);
        setReady(false);
        setSaved(true);
        setError("");
      });
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
          disabled={busy}
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
  ) : !permission ? (
    <ActivityIndicator style={{ flex: 1 }} color={theme.colors.primary} />
  ) : !permission.granted ? (
    notice(copy.permission, copy.permissionHint, {
      label: permission.canAskAgain ? copy.allow : copy.settings,
      onPress: () => {
        void run(async () => {
          if (permission.canAskAgain) await requestPermission();
          else await Linking.openSettings();
        });
      },
    })
  ) : mountError ? (
    notice(copy.error, copy.permissionHint, {
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
            ref={camera}
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
      status={pending ? copy.confirmHint : saved ? copy.saved : undefined}
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
