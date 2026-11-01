import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useScreenInsets } from "@/hooks/use-screen-insets";

import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { usePhotoViewerMotion } from "../hooks/use-photo-viewer-motion";
import { usePhotoViewerKeyboard } from "../hooks/use-photo-viewer-keyboard";
import { usePhotoViewerCopy } from "../i18n/photo-viewer-copy";
import {
  saveJournalPhoto,
  shareJournalPhoto,
} from "../services/journal-photo-actions";
import { PhotoActionError } from "../services/photo-action-error";
import type { Memory } from "../types/home-types";
import {
  fitPhoto,
  type PhotoSelection,
  type PhotoSize,
} from "../utils/photo-viewer-geometry";
import {
  PhotoDeleteConfirmation,
  PhotoInfoPanel,
  PhotoViewerToolbar,
} from "./photo-viewer-toolbar";

export function JournalPhotoViewer({
  memories,
  selection,
  getSelection,
  onActiveChange,
  onClose,
  onDelete,
}: {
  memories: Memory[];
  selection: PhotoSelection;
  getSelection: (id: string) => PhotoSelection | null;
  onActiveChange: (id: string) => void;
  onClose: () => void;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const theme = useAppTheme();
  const insets = useScreenInsets();
  const window = useWindowDimensions();
  const [viewport, setViewport] = useState({
    width: window.width,
    height: window.height,
  });
  const { copy, locale } = usePhotoViewerCopy();
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      memories.findIndex((item) => item.id === selection.id),
    ),
  );
  const memory = memories[index];
  const [photoInfo, setPhotoInfo] = useState<
    Record<string, { uri: string; size: PhotoSize }>
  >({
    [selection.id]: { uri: selection.uri, size: selection.size },
  });
  const [selections, setSelections] = useState<Record<string, PhotoSelection>>({
    [selection.id]: selection,
  });
  const [photoStates, setPhotoStates] = useState<
    Record<string, "loaded" | "failed">
  >({});
  const currentSelection = selections[memory.id];
  const info = photoInfo[memory.id] ?? currentSelection;
  const [controls, setControls] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [busy, setBusy] = useState<"share" | "save" | null>(null);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const failed = photoStates[memory.id] === "failed";
  const loading = !photoStates[memory.id];
  const [showSpinner, setShowSpinner] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (failed) setControls(true);
  }, [failed]);
  const active = useRef(true);
  const actionInFlight = useRef(false);
  const removeAfterClose = useRef(false);
  const presented = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(
      () => setNotice(null),
      theme.motion.photoViewerNoticeDuration,
    );
    return () => clearTimeout(timer);
  }, [notice, theme.motion.photoViewerNoticeDuration]);
  useEffect(() => {
    if (!loading) {
      setShowSpinner(false);
      return;
    }
    const timer = setTimeout(
      () => setShowSpinner(true),
      theme.motion.enterDuration,
    );
    return () => clearTimeout(timer);
  }, [loading, theme.motion.enterDuration]);

  function toggleControls() {
    setControls((value) => !value);
  }
  function changePage(next: number) {
    const photo = getSelection(memories[next].id);
    if (photo) setSelections((old) => ({ ...old, [photo.id]: photo }));
    setIndex(next);
    onActiveChange(memories[next].id);
    setNotice(null);
  }
  const motion = usePhotoViewerMotion({
    origin: currentSelection?.origin ?? selection.origin,
    size: info?.size ?? viewport,
    viewport,
    pageIndex: index,
    pageCount: memories.length,
    onPageChange: changePage,
    blocked: confirming || showInfo || busy !== null,
    controlsVisible: controls,
    onToggleControls: toggleControls,
    onDismiss: () => {
      onClose();
      if (removeAfterClose.current)
        void Promise.resolve(onDelete(memory.id)).catch(() =>
          Alert.alert(copy.actionError),
        );
    },
  });

  function handleBack() {
    if (confirming) setConfirming(false);
    else if (showInfo) setShowInfo(false);
    else motion.close();
  }

  usePhotoViewerKeyboard({
    blocked: confirming || showInfo || busy !== null,
    onBack: handleBack,
    onPrevious: motion.previous,
    onNext: motion.next,
    onToggleControls: toggleControls,
  });

  async function handleAction(action: "share" | "save") {
    if (actionInFlight.current || !info?.uri || failed) return;
    actionInFlight.current = true;
    setBusy(action);
    setNotice(null);
    try {
      if (action === "share") {
        await shareJournalPhoto(info.uri, copy.share, {
          x: viewport.width / 2,
          y: viewport.height - insets.bottom - theme.layout.touchTarget,
          width: theme.layout.touchTarget,
          height: theme.layout.touchTarget,
        });
      } else {
        await saveJournalPhoto(info.uri);
        if (active.current)
          setNotice({
            text: Platform.OS === "web" ? copy.downloaded : copy.saved,
            error: false,
          });
      }
    } catch (error) {
      if (active.current)
        setNotice({
          text:
            error instanceof PhotoActionError
              ? copy[error.code]
              : copy.actionError,
          error: true,
        });
    } finally {
      actionInFlight.current = false;
      if (active.current) setBusy(null);
    }
  }

  return (
    <Modal
      visible
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onShow={() => {
        // React Native Web can re-deliver onShow when its callback changes.
        // Do not enqueue another state update after this modal has opened.
        if (presented.current) return;
        presented.current = true;
        // Measure thumbnails in an event, never while rendering. The modal keeps
        // the underlying album still until the returning photo has landed.
        const measured: Record<string, PhotoSelection> = {
          [selection.id]: selection,
        };
        for (const photo of memories) {
          const value = getSelection(photo.id);
          if (value) measured[photo.id] = value;
        }
        setSelections(measured);
        motion.open();
      }}
      onRequestClose={handleBack}
    >
      <GestureHandlerRootView style={styles.flex}>
        <StatusBar style="light" />
        <View
          style={styles.flex}
          accessibilityViewIsModal
          onAccessibilityEscape={handleBack}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setViewport((current) =>
              current.width === width && current.height === height
                ? current
                : { width, height },
            );
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.colors.photoViewerBackdrop },
              motion.backdropStyle,
            ]}
          />
          <GestureDetector gesture={motion.gesture}>
            <View
              collapsable={false}
              style={styles.flex}
              accessible={!confirming && !showInfo}
              focusable={!confirming && !showInfo}
              accessibilityRole="image"
              onAccessibilityTap={toggleControls}
              accessibilityLabel={memory.place?.[locale] ?? memory.destination}
              accessibilityHint={copy.imageHint}
              accessibilityActions={[
                { name: "activate", label: copy.controls },
                { name: "zoom", label: copy.zoomIn },
                { name: "reset", label: copy.zoomOut },
                { name: "escape", label: copy.back },
                ...(index > 0
                  ? [{ name: "previous", label: copy.previous }]
                  : []),
                ...(index < memories.length - 1
                  ? [{ name: "next", label: copy.next }]
                  : []),
              ]}
              onAccessibilityAction={(event) => {
                switch (event.nativeEvent.actionName) {
                  case "activate":
                    toggleControls();
                    break;
                  case "zoom":
                    motion.zoomAtCenter();
                    break;
                  case "reset":
                    motion.resetZoom();
                    break;
                  case "escape":
                    motion.close();
                    break;
                  case "previous":
                    motion.previous();
                    break;
                  case "next":
                    motion.next();
                    break;
                }
              }}
            >
              <Animated.View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, motion.carouselStyle]}
              >
                {memories.map((photo, page) => {
                  // Decode only the current photo and its immediate neighbours.
                  if (Math.abs(page - index) > 1) return null;
                  const selected = page === index;
                  const metadata = photoInfo[photo.id] ?? selections[photo.id];
                  const fitted = fitPhoto(metadata?.size ?? viewport, viewport);
                  return (
                    <View
                      key={photo.id}
                      style={{
                        position: "absolute",
                        left: page * viewport.width,
                        width: viewport.width,
                        height: viewport.height,
                      }}
                    >
                      <Animated.View
                        style={[
                          styles.imageFrame,
                          {
                            left: fitted.x,
                            top: fitted.y,
                            width: fitted.width,
                            height: fitted.height,
                          },
                          selected ? motion.imageStyle : undefined,
                        ]}
                      >
                        <Animated.View
                          style={[
                            StyleSheet.absoluteFill,
                            selected ? motion.contentStyle : undefined,
                          ]}
                        >
                          <Image
                            key={attempt}
                            source={photo.photo}
                            accessible={false}
                            contentFit={metadata ? "fill" : "contain"}
                            cachePolicy="memory-disk"
                            allowDownscaling={false}
                            transition={0}
                            style={[
                              StyleSheet.absoluteFill,
                              {
                                opacity:
                                  photoStates[photo.id] === "failed" ? 0 : 1,
                              },
                            ]}
                            onLoad={(event) => {
                              const { url, width, height } = event.source;
                              if (width > 0 && height > 0)
                                setPhotoInfo((old) =>
                                  old[photo.id]?.uri === url &&
                                  old[photo.id]?.size.width === width &&
                                  old[photo.id]?.size.height === height
                                    ? old
                                    : {
                                        ...old,
                                        [photo.id]: {
                                          uri: url,
                                          size: { width, height },
                                        },
                                      },
                                );
                              setPhotoStates((old) =>
                                old[photo.id] === "loaded"
                                  ? old
                                  : { ...old, [photo.id]: "loaded" },
                              );
                            }}
                            onError={() => {
                              setPhotoStates((old) => ({
                                ...old,
                                [photo.id]: "failed",
                              }));
                            }}
                          />
                        </Animated.View>
                      </Animated.View>
                    </View>
                  );
                })}
              </Animated.View>
            </View>
          </GestureDetector>
          {showSpinner && !failed ? (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, styles.center]}
            >
              <ActivityIndicator color={theme.colors.photoViewerText} />
            </View>
          ) : null}
          {failed ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.center,
                { padding: theme.spacing.xl, gap: theme.spacing.md },
              ]}
            >
              <AppText style={{ color: theme.colors.photoViewerText }}>
                {copy.unavailable}
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setPhotoStates((old) => {
                    const next = { ...old };
                    delete next[memory.id];
                    return next;
                  });
                  setAttempt((value) => value + 1);
                }}
                style={{
                  minHeight: theme.layout.touchTarget,
                  justifyContent: "center",
                  paddingHorizontal: theme.spacing.lg,
                }}
              >
                <AppText
                  variant="label"
                  style={{ color: theme.colors.photoViewerText }}
                >
                  {copy.retry}
                </AppText>
              </Pressable>
            </View>
          ) : null}
          {notice ? (
            <View
              pointerEvents="none"
              style={[
                styles.notice,
                {
                  left: insets.left + theme.spacing.lg,
                  right: insets.right + theme.spacing.lg,
                  bottom:
                    insets.bottom +
                    theme.layout.touchTarget +
                    theme.spacing.section,
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.photoViewerControls,
                },
              ]}
            >
              <AppText
                accessibilityRole={notice.error ? "alert" : "text"}
                accessibilityLiveRegion="polite"
                variant="caption"
                style={{
                  color: theme.colors.photoViewerText,
                  textAlign: "center",
                }}
              >
                {notice.text}
              </AppText>
            </View>
          ) : null}
          <PhotoViewerToolbar
            memory={memory}
            visible={controls && !confirming && !showInfo}
            animatedStyle={motion.controlsStyle}
            busy={busy}
            photoReady={!!info?.uri && !failed}
            onInfo={() => setShowInfo(true)}
            onClose={motion.close}
            onShare={() => void handleAction("share")}
            onSave={() => void handleAction("save")}
            onDelete={() => setConfirming(true)}
          />
          {showInfo ? (
            <PhotoInfoPanel
              memory={memory}
              index={index}
              count={memories.length}
              onClose={() => setShowInfo(false)}
            />
          ) : null}
          {confirming ? (
            <PhotoDeleteConfirmation
              onCancel={() => setConfirming(false)}
              onConfirm={() => {
                setConfirming(false);
                removeAfterClose.current = true;
                motion.close();
              }}
            />
          ) : null}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, overflow: "hidden" },
  imageFrame: { position: "absolute", overflow: "hidden" },
  center: { alignItems: "center", justifyContent: "center" },
  notice: { position: "absolute" },
});
