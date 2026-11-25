import { useEffect } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useAppTheme } from "@/hooks/use-app-theme";
import {
  clampPhoto,
  fitPhoto,
  panLimits,
  photoPageDestination,
  rubberBand,
  zoomOffset,
  type PhotoRect,
  type PhotoSize,
} from "../utils/photo-viewer-geometry";

export function usePhotoViewerMotion({
  origin,
  size,
  viewport,
  blocked,
  controlsVisible,
  onDismiss,
  onToggleControls,
  pageIndex,
  pageCount,
  onPageChange,
}: {
  origin: PhotoRect;
  size: PhotoSize;
  viewport: PhotoSize;
  blocked: boolean;
  controlsVisible: boolean;
  onDismiss: () => void;
  onToggleControls: () => void;
  pageIndex: number;
  pageCount: number;
  onPageChange: (index: number) => void;
}) {
  const theme = useAppTheme();
  const { layout, motion } = theme;
  const fitted = fitPhoto(size, viewport);
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const translationStartX = useSharedValue(0);
  const translationStartY = useSharedValue(0);
  const anchorX = useSharedValue(0);
  const anchorY = useSharedValue(0);
  const pinching = useSharedValue(false);
  const panActive = useSharedValue(false);
  const panNeedsReset = useSharedValue(false);
  const panningZoom = useSharedValue(false);
  const closing = useSharedValue(false);
  const opened = useSharedValue(false);
  const chrome = useSharedValue(0);
  const currentPage = useSharedValue(pageIndex);
  const pageX = useSharedValue(-pageIndex * viewport.width);
  const pageStart = useSharedValue(-pageIndex * viewport.width);
  // 0 undecided, 1 horizontal paging, 2 vertical dismissal.
  const direction = useSharedValue(0);
  const spring = {
    ...motion.photoViewerSpring,
    reduceMotion: ReduceMotion.System,
  };

  const zoomSpring = {
    ...motion.photoViewerZoomSpring,
    reduceMotion: ReduceMotion.System,
  };
  const maximum = layout.photoViewerMaxScale;
  const threshold = layout.photoViewerZoomThreshold;
  const resistance = layout.photoViewerRubberFactor;
  const dismissDistance = viewport.height * layout.photoViewerDismissRatio;

  useEffect(
    () => () => {
      [progress, scale, x, y, dragX, dragY, chrome, pageX].forEach(
        cancelAnimation,
      );
    },
    [progress, scale, x, y, dragX, dragY, chrome, pageX],
  );

  useEffect(() => {
    cancelAnimation(pageX);
    pageX.value = -currentPage.value * viewport.width;
  }, [viewport.width, pageX, currentPage]);

  function goToPage(index: number) {
    "worklet";
    if (closing.value) return;
    const target = clampPhoto(index, 0, pageCount - 1);
    const changed = target !== currentPage.value;
    currentPage.value = target;
    pageX.value = withSpring(-target * viewport.width, spring);
    scale.value = 1;
    x.value = 0;
    y.value = 0;
    if (changed) scheduleOnRN(onPageChange, target);
  }

  function open() {
    if (opened.value) return;
    opened.value = true;
    progress.value = withSpring(1, spring);
  }

  function close() {
    if (closing.value) return;
    closing.value = true;
    pageX.value = withSpring(-currentPage.value * viewport.width, spring);
    chrome.value = withTiming(0, {
      duration: motion.shutterPressDuration,
      reduceMotion: ReduceMotion.System,
    });
    scale.value = withSpring(1, spring);
    x.value = withSpring(0, spring);
    y.value = withSpring(0, spring);
    dragX.value = withSpring(0, spring);
    dragY.value = withSpring(0, spring);
    progress.value = withSpring(0, spring, (finished) => {
      if (finished) scheduleOnRN(onDismiss);
    });
  }

  function resetZoom() {
    scale.value = withSpring(1, zoomSpring);
    x.value = withSpring(0, zoomSpring);
    y.value = withSpring(0, zoomSpring);
  }

  useEffect(() => {
    if (closing.value) return;
    chrome.value = withTiming(controlsVisible ? 1 : 0, {
      duration: motion.shutterPressDuration,
      reduceMotion: ReduceMotion.System,
    });
  }, [chrome, closing, controlsVisible, motion.shutterPressDuration]);

  function settleZoom() {
    "worklet";
    const target = clampPhoto(scale.value, 1, maximum);
    const bounds = panLimits(fitted, viewport, target);
    scale.value = withSpring(target, zoomSpring);
    x.value = withSpring(clampPhoto(x.value, -bounds.x, bounds.x), zoomSpring);
    y.value = withSpring(clampPhoto(y.value, -bounds.y, bounds.y), zoomSpring);
  }

  const pinch = Gesture.Pinch()
    .enabled(!blocked)
    .onStart((event) => {
      if (closing.value) return;
      pinching.value = true;
      [scale, x, y, dragX, dragY, pageX].forEach(cancelAnimation);
      pageX.value = -currentPage.value * viewport.width;
      dragX.value = 0;
      dragY.value = 0;
      startScale.value = scale.value;
      anchorX.value =
        (event.focalX - viewport.width / 2 - x.value) / scale.value;
      anchorY.value =
        (event.focalY - viewport.height / 2 - y.value) / scale.value;
    })
    .onUpdate((event) => {
      if (closing.value) return;
      const next = rubberBand(
        startScale.value * event.scale,
        1,
        maximum,
        maximum,
        resistance,
      );
      const bounds = panLimits(fitted, viewport, next);
      scale.value = next;
      x.value = rubberBand(
        event.focalX - viewport.width / 2 - anchorX.value * next,
        -bounds.x,
        bounds.x,
        viewport.width,
        resistance,
      );

      y.value = rubberBand(
        event.focalY - viewport.height / 2 - anchorY.value * next,
        -bounds.y,
        bounds.y,
        viewport.height,
        resistance,
      );
    })
    .onFinalize(() => {
      if (!pinching.value) return;
      pinching.value = false;
      if (!closing.value) settleZoom();
    });

  const pan = Gesture.Pan()
    .enabled(!blocked)
    .maxPointers(2)
    .minDistance(layout.photoViewerMinimumPanDistance)
    .onStart(() => {
      if (closing.value) return;
      panActive.value = true;
      panNeedsReset.value = pinching.value;
      [x, y, dragX, dragY, pageX].forEach(cancelAnimation);
      pageStart.value = pageX.value;
      direction.value = 0;
      startX.value = x.value;
      startY.value = y.value;
      translationStartX.value = 0;
      translationStartY.value = 0;
      panningZoom.value = scale.value > threshold;
    })
    .onUpdate((event) => {
      if (closing.value) return;
      if (pinching.value || event.numberOfPointers > 1) {
        panNeedsReset.value = true;
        return;
      }

      // Continue panning with the remaining finger after a pinch, without a centroid jump.
      if (panNeedsReset.value) {
        startX.value = x.value;
        startY.value = y.value;
        translationStartX.value = event.translationX;
        translationStartY.value = event.translationY;
        panningZoom.value = scale.value > threshold;
        panNeedsReset.value = false;
      }
      const dx = event.translationX - translationStartX.value;
      const dy = event.translationY - translationStartY.value;
      if (panningZoom.value) {
        const bounds = panLimits(fitted, viewport, scale.value);
        x.value = rubberBand(
          startX.value + dx,
          -bounds.x,
          bounds.x,
          viewport.width,
          resistance,
        );

        y.value = rubberBand(
          startY.value + dy,
          -bounds.y,
          bounds.y,
          viewport.height,
          resistance,
        );
      } else {
        if (direction.value === 0 && Math.max(Math.abs(dx), Math.abs(dy)) > 0) {
          direction.value = Math.abs(dx) > Math.abs(dy) ? 1 : 2;
        }

        if (direction.value === 1) {
          pageX.value = rubberBand(
            pageStart.value + dx,
            -(pageCount - 1) * viewport.width,
            0,
            viewport.width,
            resistance,
          );
        } else {
          dragX.value = dx * resistance;
          dragY.value = dy >= 0 ? dy : dy * resistance;
        }
      }
    })
    .onEnd((event) => {
      if (closing.value || pinching.value) return;
      if (panningZoom.value || scale.value > threshold) {
        settleZoom();
        return;
      }

      if (direction.value === 1) {
        const displacement = pageX.value + currentPage.value * viewport.width;
        const target = photoPageDestination(
          currentPage.value,
          pageCount,
          displacement,
          event.velocityX,
          viewport.width,
          layout.photoViewerPageRatio,
          layout.photoViewerPageVelocity,
          layout.photoViewerMinimumFlingDistance,
        );
        goToPage(target);

        return;
      }
      pageX.value = withSpring(-currentPage.value * viewport.width, spring);
      if (
        dragY.value > dismissDistance ||
        (dragY.value > layout.photoViewerMinimumFlingDistance &&
          event.velocityY > layout.photoViewerDismissVelocity)
      ) {
        scheduleOnRN(close);
      } else {
        dragX.value = withSpring(0, zoomSpring);
        dragY.value = withSpring(0, zoomSpring);
      }
    })
    .onFinalize((_event, success) => {
      if (!panActive.value) return;
      panActive.value = false;
      if (!success && !closing.value && !pinching.value) {
        pageX.value = withSpring(-currentPage.value * viewport.width, spring);
        dragX.value = withSpring(0, zoomSpring);
        dragY.value = withSpring(0, zoomSpring);
        settleZoom();
      }
    });

  function zoomToPoint(focalX: number, focalY: number) {
    "worklet";
    if (closing.value) return;
    const target =
      scale.value > threshold ? 1 : layout.photoViewerDoubleTapScale;
    const bounds = panLimits(fitted, viewport, target);
    x.value = withSpring(
      clampPhoto(
        zoomOffset(focalX, viewport.width / 2, x.value, scale.value, target),
        -bounds.x,
        bounds.x,
      ),
      zoomSpring,
    );

    y.value = withSpring(
      clampPhoto(
        zoomOffset(focalY, viewport.height / 2, y.value, scale.value, target),
        -bounds.y,
        bounds.y,
      ),
      zoomSpring,
    );
    scale.value = withSpring(target, zoomSpring);
  }

  const doubleTap = Gesture.Tap()
    .enabled(!blocked)
    .numberOfTaps(2)
    .maxDelay(layout.photoViewerDoubleTapDelay)
    .onEnd((event, success) => {
      if (success) zoomToPoint(event.x, event.y);
    });

  const singleTap = Gesture.Tap()
    .enabled(!blocked)
    .maxDistance(theme.spacing.sm)
    .onEnd((_event, success) => {
      if (success && !closing.value) scheduleOnRN(onToggleControls);
    });

  const gesture = Gesture.Race(
    Gesture.Simultaneous(pan, pinch),
    Gesture.Exclusive(doubleTap, singleTap),
  );

  const imageStyle = useAnimatedStyle(() => {
    const p = clampPhoto(progress.value, 0, 1);
    const sx = (origin.width / fitted.width) * (1 - p) + p;
    const sy = (origin.height / fitted.height) * (1 - p) + p;
    const dragScale =
      1 -
      Math.min(1, Math.max(0, dragY.value) / viewport.height) *
        (1 - layout.photoViewerMinimumDismissScale);

    return {
      transform: [
        {
          translateX:
            (origin.x + origin.width / 2 - viewport.width / 2) * (1 - p) +
            x.value +
            dragX.value,
        },
        {
          translateY:
            (origin.y + origin.height / 2 - viewport.height / 2) * (1 - p) +
            y.value +
            dragY.value,
        },
        { scaleX: sx * scale.value * dragScale },
        { scaleY: sy * scale.value * dragScale },
      ],
    };
  });

  // Counter-scale inside the clipping frame: cover thumbnail -> uncropped original, without stretching pixels.
  const contentStyle = useAnimatedStyle(() => {
    const p = clampPhoto(progress.value, 0, 1);
    const sx = (origin.width / fitted.width) * (1 - p) + p;
    const sy = (origin.height / fitted.height) * (1 - p) + p;
    const cover = Math.max(sx, sy);

    return { transform: [{ scaleX: cover / sx }, { scaleY: cover / sy }] };
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity:
      clampPhoto(progress.value, 0, 1) *
      (1 - clampPhoto(dragY.value / (viewport.height / 2), 0, 1)),
  }));

  const controlsStyle = useAnimatedStyle(() => ({
    opacity:
      chrome.value *
      clampPhoto(progress.value, 0, 1) *
      (1 - clampPhoto(dragY.value / dismissDistance, 0, 1)),
  }));

  const carouselStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pageX.value }],
  }));

  return {
    fitted,
    gesture,
    imageStyle,
    contentStyle,
    backdropStyle,
    controlsStyle,
    carouselStyle,
    previous: () => goToPage(currentPage.value - 1),
    next: () => goToPage(currentPage.value + 1),
    open,
    close,
    resetZoom,
    zoomAtCenter: () => zoomToPoint(viewport.width / 2, viewport.height / 2),
  };
}
