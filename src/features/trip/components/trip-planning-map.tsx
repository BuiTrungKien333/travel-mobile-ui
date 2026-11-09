import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useAppTheme } from "@/hooks/use-app-theme";
import { AppText } from "@/components/ui/app-text";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import type { TripStop } from "@/features/home/types/home-types";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { getPlanningMapBounds } from "../utils/planning-map-layout";
import { TripMapPreview } from "./trip-map-preview";
import { DetailIconButton } from "./trip-details-header";

/** Resizes a real split layout on the UI thread, without JS updates per drag frame. */
export function TripPlanningMap({
  header,
  viewportHeight,
  selectorHeight,
  stops,
  selectedId,
  startLabel,
  onSelect,
  onStart,
  onGeometryChange,
  resizeLock,
  showStart = true,
  collapsedByScroll = false,
  expandRequest = 0,
  mapContent,
  showLocationControl = true,
  overlayHeader = false,
}: {
  header: ReactNode;
  viewportHeight: number;
  selectorHeight: number;
  stops?: TripStop[];
  selectedId?: string;
  startLabel?: string;
  onSelect?: (stop: TripStop) => void;
  onStart?: () => void;
  onGeometryChange?: (geometry: PlanningMapGeometry) => void;
  resizeLock: SharedValue<number>;
  showStart?: boolean;
  collapsedByScroll?: boolean;
  expandRequest?: number;
  mapContent?: ReactNode;
  showLocationControl?: boolean;
  overlayHeader?: boolean;
}) {
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();
  const { height: screenHeight } = useWindowDimensions();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [locationNotice, setLocationNotice] = useState(false);
  const noticeDuration = theme.motion.photoViewerNoticeDuration;
  useEffect(() => {
    if (!locationNotice) return;
    const timer = setTimeout(() => setLocationNotice(false), noticeDuration);
    return () => clearTimeout(timer);
  }, [locationNotice, noticeDuration]);
  const { collapsed, expanded: maximum } = getPlanningMapBounds({
    screenHeight,
    viewportHeight: viewportHeight || screenHeight,
    headerHeight,
    selectorHeight,
  });
  const height = useSharedValue(collapsed);
  const startHeight = useSharedValue(collapsed);
  const targetExpanded = useSharedValue(false);
  const previouslyHidden = useRef(collapsedByScroll);
  const handledExpandRequest = useRef(0);
  const suppressTap = useSharedValue(0);
  const resizeSettleDuration = theme.motion.tripMapScrollSettleDuration;
  const tapGuardDuration = theme.motion.shutterPressDuration;
  const spring = {
    ...theme.motion.photoViewerSpring,
    reduceMotion: ReduceMotion.System,
  };
  useEffect(() => {
    const restored = previouslyHidden.current && !collapsedByScroll;
    previouslyHidden.current = collapsedByScroll;
    if (restored) {
      targetExpanded.set(false);
      setExpanded(false);
      height.set(collapsed);
    }
  }, [collapsedByScroll, collapsed, targetExpanded, height]);
  useEffect(() => {
    onGeometryChange?.({
      height: expanded ? maximum : collapsed,
      headerHeight,
    });
  }, [collapsed, maximum, expanded, headerHeight, onGeometryChange]);
  useEffect(() => {
    // Rotation/font scaling changes the available pane, not the selected day or scroll.
    cancelAnimation(height);
    height.set(targetExpanded.get() ? maximum : collapsed);
    return () => {
      cancelAnimation(height);
      cancelAnimation(resizeLock);
      resizeLock.set(0);
    };
  }, [collapsed, maximum, height, targetExpanded, resizeLock]);
  const releaseResizeLock = useCallback(() => {
    "worklet";
    resizeLock.set(
      withDelay(
        resizeSettleDuration,
        withTiming(0, { duration: 0, reduceMotion: ReduceMotion.Never }),
        ReduceMotion.Never,
      ),
    );
  }, [resizeLock, resizeSettleDuration]);
  useEffect(() => {
    if (handledExpandRequest.current === expandRequest) return;
    handledExpandRequest.current = expandRequest;
    cancelAnimation(resizeLock);
    resizeLock.set(1);
    targetExpanded.set(true);
    setExpanded(true);
    height.set(
      withSpring(
        maximum,
        {
          ...theme.motion.photoViewerSpring,
          reduceMotion: ReduceMotion.System,
        },
        (finished) => {
          if (finished) releaseResizeLock();
        },
      ),
    );
  }, [
    expandRequest,
    maximum,
    height,
    targetExpanded,
    resizeLock,
    theme.motion.photoViewerSpring,
    releaseResizeLock,
  ]);
  const motion = useAnimatedStyle(() => ({ height: height.get() }));
  const projection = theme.motion.tripMapVelocityProjection;
  const drag = Gesture.Pan()
    .activeOffsetY([-theme.spacing.sm, theme.spacing.sm])
    .failOffsetX([-theme.spacing.lg, theme.spacing.lg])
    .onStart(() => {
      cancelAnimation(height);
      cancelAnimation(resizeLock);
      resizeLock.set(1);
      suppressTap.set(1);
      startHeight.set(height.get());
    })
    .onUpdate((event) => {
      height.set(
        Math.max(
          collapsed,
          Math.min(maximum, startHeight.get() + event.translationY),
        ),
      );
    })
    .onEnd((event) => {
      const next =
        height.get() + event.velocityY * projection > (collapsed + maximum) / 2;
      targetExpanded.set(next);
      height.set(
        withSpring(next ? maximum : collapsed, spring, (finished) => {
          if (finished) releaseResizeLock();
        }),
      );
      scheduleOnRN(setExpanded, next);
    })
    .onFinalize((_event, success) => {
      // Input gate only: a released pan must not trigger the Pressable's tap as well.
      suppressTap.set(
        withTiming(0, {
          duration: tapGuardDuration,
          reduceMotion: ReduceMotion.Never,
        }),
      );
      if (!success)
        height.set(
          withSpring(
            targetExpanded.get() ? maximum : collapsed,
            spring,
            (finished) => {
              if (finished) releaseResizeLock();
            },
          ),
        );
    });
  function toggle() {
    if (suppressTap.get() > 0) return;
    cancelAnimation(resizeLock);
    resizeLock.set(1);
    const next = !targetExpanded.get();
    targetExpanded.set(next);
    setExpanded(next);
    height.set(
      withSpring(next ? maximum : collapsed, spring, (finished) => {
        if (finished) releaseResizeLock();
      }),
    );
  }
  return (
    <Animated.View
      aria-hidden={collapsedByScroll}
      accessibilityElementsHidden={collapsedByScroll}
      importantForAccessibility={
        collapsedByScroll ? "no-hide-descendants" : "auto"
      }
      pointerEvents={collapsedByScroll ? "none" : "auto"}
      style={[
        { overflow: "hidden", backgroundColor: theme.colors.surfaceTint },
        motion,
      ]}
    >
      {!overlayHeader ? (
        <View
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
          style={{ paddingHorizontal: theme.spacing.lg }}
        >
          {header}
        </View>
      ) : null}
      {mapContent ??
        (onSelect && onStart ? (
          <TripMapPreview
            stops={stops ?? []}
            showStart={showStart}
            selectedId={selectedId}
            startLabel={startLabel ?? ""}
            onSelect={onSelect}
            onStart={onStart}
            fitContainer
          />
        ) : null)}
      <GestureDetector gesture={drag}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? copy.collapseMap : copy.expandMap}
          accessibilityHint={copy.mapResizeHint}
          accessibilityState={{ expanded }}
          onPress={toggle}
          style={({ pressed }) => ({
            position: "absolute",
            bottom: 0,
            alignSelf: "center",
            width: theme.layout.touchTarget * 2,
            minHeight: theme.layout.compactTouchTarget,
            paddingVertical: theme.spacing.xs,
            alignItems: "center",
            justifyContent: "center",
            gap: theme.spacing.xs,
            opacity: pressed ? theme.motion.pressOpacity : 1,
          })}
        >
          <View
            style={{
              width: theme.layout.sheetDragHandleWidth + theme.spacing.sm,
              height: theme.layout.sheetDragHandleHeight,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.borderStrong,
            }}
          />
        </Pressable>
      </GestureDetector>
      {locationNotice ? (
        <View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={{
            position: "absolute",
            left: theme.spacing.lg,
            right: theme.layout.compactTouchTarget + theme.spacing.xl,
            bottom: theme.spacing.sm,
            padding: theme.spacing.sm,
            borderRadius: theme.radius.md,
            overflow: "hidden",
          }}
        >
          <GlassBackdrop borderRadius={theme.radius.md} />
          <AppText variant="caption">{copy.locationPreview}</AppText>
        </View>
      ) : null}
      <View
        style={{
          position: "absolute",
          right: theme.spacing.sm,
          bottom: theme.spacing.sm,
          gap: theme.spacing.xs,
        }}
      >
        {showLocationControl ? (
          <DetailIconButton
            compact
            name="locate"
            label={copy.locateMe}
            onPress={() => setLocationNotice((shown) => !shown)}
          />
        ) : null}
        <DetailIconButton
          compact
          name={expanded ? "collapse" : "expand"}
          label={expanded ? copy.collapseMap : copy.expandMap}
          accessibilityState={{ expanded }}
          onPress={toggle}
        />
      </View>
      {overlayHeader ? (
        <View
          pointerEvents="box-none"
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            paddingHorizontal: theme.spacing.lg,
          }}
        >
          {header}
        </View>
      ) : null}
    </Animated.View>
  );
}

export type PlanningMapGeometry = { height: number; headerHeight: number };
