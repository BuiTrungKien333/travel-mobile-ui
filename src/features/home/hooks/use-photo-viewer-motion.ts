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
import { useDismissLifecycle } from "@/hooks/use-dismiss-lifecycle";

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
  const dismissal = useDismissLifecycle(onDismiss);

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
    pageX.set(-currentPage.get() * viewport.width);
  }, [viewport.width, pageX, currentPage]);

  function goToPage(index: number) {
    "worklet";
    if (closing.get()) return;
    const target = clampPhoto(index, 0, pageCount - 1);
    const changed = target !== currentPage.get();
    currentPage.set(target);
    pageX.set(withSpring(-target * viewport.width, spring));
    scale.set(1);
    x.set(0);
    y.set(0);
    if (changed) scheduleOnRN(onPageChange, target);
  }

  function open() {
    if (opened.get()) return;
    opened.set(true);
    progress.set(withSpring(1, spring));
  }

  function close() {
    const serial = dismissal.begin();
    if (serial === undefined) return;
    closing.set(true);
    pageX.set(withSpring(-currentPage.get() * viewport.width, spring));
    chrome.set(withTiming(0, {
      duration: motion.shutterPressDuration,
      reduceMotion: ReduceMotion.System,
    }));
    scale.set(withSpring(1, spring));
    x.set(withSpring(0, spring));
    y.set(withSpring(0, spring));
    dragX.set(withSpring(0, spring));
    dragY.set(withSpring(0, spring));
    progress.set(withSpring(0, spring, (finished) => {
      if (finished) scheduleOnRN(dismissal.complete, serial);
      else scheduleOnRN(cancelClose, serial);
    }));
  }
  function cancelClose(serial: number) {
    if (!dismissal.cancel(serial)) return;
    closing.set(false);
    progress.set(withSpring(1, spring));
    chrome.set(withTiming(controlsVisible ? 1 : 0, { duration: motion.shutterPressDuration, reduceMotion: ReduceMotion.System }));
  }

  function resetZoom() {
    scale.set(withSpring(1, zoomSpring));
    x.set(withSpring(0, zoomSpring));
    y.set(withSpring(0, zoomSpring));
  }

  useEffect(() => {
    if (closing.get()) return;
    chrome.set(withTiming(controlsVisible ? 1 : 0, {
      duration: motion.shutterPressDuration,
      reduceMotion: ReduceMotion.System,
    }));
  }, [chrome, closing, controlsVisible, motion.shutterPressDuration]);

  function settleZoom() {
    "worklet";
    const target = clampPhoto(scale.get(), 1, maximum);
    const bounds = panLimits(fitted, viewport, target);
    scale.set(withSpring(target, zoomSpring));
    x.set(withSpring(clampPhoto(x.get(), -bounds.x, bounds.x), zoomSpring));
    y.set(withSpring(clampPhoto(y.get(), -bounds.y, bounds.y), zoomSpring));
  }

  const pinch = Gesture.Pinch()
    .enabled(!blocked)
    .onStart((event) => {
      if (closing.get()) return;
      pinching.set(true);
      [scale, x, y, dragX, dragY, pageX].forEach(cancelAnimation);
      pageX.set(-currentPage.get() * viewport.width);
      dragX.set(0);
      dragY.set(0);
      startScale.set(scale.get());
      anchorX.set((event.focalX - viewport.width / 2 - x.get()) / scale.get());
      anchorY.set((event.focalY - viewport.height / 2 - y.get()) / scale.get());
    })
    .onUpdate((event) => {
      if (closing.get()) return;
      const next = rubberBand(
        startScale.get() * event.scale,
        1,
        maximum,
        maximum,
        resistance,
      );
      const bounds = panLimits(fitted, viewport, next);
      scale.set(next);
      x.set(rubberBand(
        event.focalX - viewport.width / 2 - anchorX.get() * next,
        -bounds.x,
        bounds.x,
        viewport.width,
        resistance,
      ));
      y.set(rubberBand(
        event.focalY - viewport.height / 2 - anchorY.get() * next,
        -bounds.y,
        bounds.y,
        viewport.height,
        resistance,
      ));
    })
    .onFinalize(() => {
      if (!pinching.get()) return;
      pinching.set(false);
      if (!closing.get()) settleZoom();
    });

  const pan = Gesture.Pan()
    .enabled(!blocked)
    .maxPointers(2)
    .minDistance(layout.photoViewerMinimumPanDistance)
    .onStart(() => {
      if (closing.get()) return;
      panActive.set(true);
      panNeedsReset.set(pinching.get());
      [x, y, dragX, dragY, pageX].forEach(cancelAnimation);
      pageStart.set(pageX.get());
      direction.set(0);
      startX.set(x.get());
      startY.set(y.get());
      translationStartX.set(0);
      translationStartY.set(0);
      panningZoom.set(scale.get() > threshold);
    })
    .onUpdate((event) => {
      if (closing.get()) return;
      if (pinching.get() || event.numberOfPointers > 1) {
        panNeedsReset.set(true);
        return;
      }
      // Continue panning with the remaining finger after a pinch, without a centroid jump.
      if (panNeedsReset.get()) {
        startX.set(x.get());
        startY.set(y.get());
        translationStartX.set(event.translationX);
        translationStartY.set(event.translationY);
        panningZoom.set(scale.get() > threshold);
        panNeedsReset.set(false);
      }
      const dx = event.translationX - translationStartX.get();
      const dy = event.translationY - translationStartY.get();
      if (panningZoom.get()) {
        const bounds = panLimits(fitted, viewport, scale.get());
        x.set(rubberBand(
          startX.get() + dx,
          -bounds.x,
          bounds.x,
          viewport.width,
          resistance,
        ));
        y.set(rubberBand(
          startY.get() + dy,
          -bounds.y,
          bounds.y,
          viewport.height,
          resistance,
        ));
      } else {
        if (direction.get() === 0 && Math.max(Math.abs(dx), Math.abs(dy)) > 0) {
          direction.set(Math.abs(dx) > Math.abs(dy) ? 1 : 2);
        }
        if (direction.get() === 1) {
          pageX.set(rubberBand(
            pageStart.get() + dx,
            -(pageCount - 1) * viewport.width,
            0,
            viewport.width,
            resistance,
          ));
        } else {
          dragX.set(dx * resistance);
          dragY.set(dy >= 0 ? dy : dy * resistance);
        }
      }
    })
    .onEnd((event) => {
      if (closing.get() || pinching.get()) return;
      if (panningZoom.get() || scale.get() > threshold) {
        settleZoom();
        return;
      }
      if (direction.get() === 1) {
        const displacement = pageX.get() + currentPage.get() * viewport.width;
        const target = photoPageDestination(
          currentPage.get(),
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
      pageX.set(withSpring(-currentPage.get() * viewport.width, spring));
      if (
        dragY.get() > dismissDistance ||
        (dragY.get() > layout.photoViewerMinimumFlingDistance &&
          event.velocityY > layout.photoViewerDismissVelocity)
      ) {
        scheduleOnRN(close);
      } else {
        dragX.set(withSpring(0, zoomSpring));
        dragY.set(withSpring(0, zoomSpring));
      }
    })
    .onFinalize((_event, success) => {
      if (!panActive.get()) return;
      panActive.set(false);
      if (!success && !closing.get() && !pinching.get()) {
        pageX.set(withSpring(-currentPage.get() * viewport.width, spring));
        dragX.set(withSpring(0, zoomSpring));
        dragY.set(withSpring(0, zoomSpring));
        settleZoom();
      }
    });

  function zoomToPoint(focalX: number, focalY: number) {
    "worklet";
    if (closing.get()) return;
    const target =
      scale.get() > threshold ? 1 : layout.photoViewerDoubleTapScale;
    const bounds = panLimits(fitted, viewport, target);
    x.set(withSpring(
      clampPhoto(
        zoomOffset(focalX, viewport.width / 2, x.get(), scale.get(), target),
        -bounds.x,
        bounds.x,
      ),
      zoomSpring,
    ));
    y.set(withSpring(
      clampPhoto(
        zoomOffset(focalY, viewport.height / 2, y.get(), scale.get(), target),
        -bounds.y,
        bounds.y,
      ),
      zoomSpring,
    ));
    scale.set(withSpring(target, zoomSpring));
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
      if (success && !closing.get()) scheduleOnRN(onToggleControls);
    });
  const gesture = Gesture.Race(
    Gesture.Simultaneous(pan, pinch),
    Gesture.Exclusive(doubleTap, singleTap),
  );

  const imageStyle = useAnimatedStyle(() => {
    const p = clampPhoto(progress.get(), 0, 1);
    const sx = (origin.width / fitted.width) * (1 - p) + p;
    const sy = (origin.height / fitted.height) * (1 - p) + p;
    const dragScale =
      1 -
      Math.min(1, Math.max(0, dragY.get()) / viewport.height) *
        (1 - layout.photoViewerMinimumDismissScale);
    return {
      transform: [
        {
          translateX:
            (origin.x + origin.width / 2 - viewport.width / 2) * (1 - p) +
            x.get() +
            dragX.get(),
        },
        {
          translateY:
            (origin.y + origin.height / 2 - viewport.height / 2) * (1 - p) +
            y.get() +
            dragY.get(),
        },
        { scaleX: sx * scale.get() * dragScale },
        { scaleY: sy * scale.get() * dragScale },
      ],
    };
  });
  // Counter-scale inside the clipping frame: cover thumbnail -> uncropped original, without stretching pixels.
  const contentStyle = useAnimatedStyle(() => {
    const p = clampPhoto(progress.get(), 0, 1);
    const sx = (origin.width / fitted.width) * (1 - p) + p;
    const sy = (origin.height / fitted.height) * (1 - p) + p;
    const cover = Math.max(sx, sy);
    return { transform: [{ scaleX: cover / sx }, { scaleY: cover / sy }] };
  });
  const backdropStyle = useAnimatedStyle(() => ({
    opacity:
      clampPhoto(progress.get(), 0, 1) *
      (1 - clampPhoto(dragY.get() / (viewport.height / 2), 0, 1)),
  }));
  const controlsStyle = useAnimatedStyle(() => ({
    opacity:
      chrome.get() *
      clampPhoto(progress.get(), 0, 1) *
      (1 - clampPhoto(dragY.get() / dismissDistance, 0, 1)),
  }));
  const carouselStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pageX.get() }],
  }));

  return {
    fitted,
    gesture,
    imageStyle,
    contentStyle,
    backdropStyle,
    controlsStyle,
    carouselStyle,
    previous: () => goToPage(currentPage.get() - 1),
    next: () => goToPage(currentPage.get() + 1),
    open,
    close,
    resetZoom,
    zoomAtCenter: () => zoomToPoint(viewport.width / 2, viewport.height / 2),
  };
}
