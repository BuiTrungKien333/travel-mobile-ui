import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  cancelAnimation,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TripStop } from "@/features/home/types/home-types";
import { DetailIconButton } from "./trip-details-header";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import {
  projectPlace,
  unprojectPlace,
  type PlaceCoordinate,
  type PlaceMapRegion,
} from "../utils/place-search";

/** Preview renderer only: the screen owns the selected place, independently of the map provider. */
export function PlaceSearchMap({
  places,
  region,
  focused,
  custom,
  onMove,
}: {
  places: TripStop[];
  region: PlaceMapRegion;
  focused?: TripStop;
  custom: boolean;
  onMove: (coordinate: PlaceCoordinate) => void;
}) {
  const theme = useAppTheme();
  const { copy } = usePlaceSearchCopy();
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const initialZoom = focused ? 2.5 : 1;
  const x = useSharedValue(0),
    y = useSharedValue(0),
    scale = useSharedValue(1);
  const startX = useSharedValue(0),
    startY = useSharedValue(0);
  const duration = theme.motion.tabTransitionDuration;
  useEffect(() => {
    const point = focused?.location
      ? projectPlace(focused.location, region)
      : { x: 0.5, y: 0.5 };
    x.set(
      withTiming((0.5 - point.x) * frame.width * initialZoom, {
        duration,
        reduceMotion: ReduceMotion.System,
      }),
    );
    y.set(
      withTiming((0.5 - point.y) * frame.height * initialZoom, {
        duration,
        reduceMotion: ReduceMotion.System,
      }),
    );
    scale.set(
      withTiming(initialZoom, { duration, reduceMotion: ReduceMotion.System }),
    );
  }, [
    focused,
    region,
    frame.width,
    frame.height,
    initialZoom,
    x,
    y,
    scale,
    duration,
  ]);
  const motion = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { translateY: y.get() },
      { scale: scale.get() },
    ],
  }));
  function commitPosition(
    offsetX: number,
    offsetY: number,
    currentScale: number,
  ) {
    if (custom && frame.width && frame.height)
      onMove(
        unprojectPlace(
          0.5 - offsetX / (frame.width * currentScale),
          0.5 - offsetY / (frame.height * currentScale),
          region,
        ),
      );
  }
  function changeZoom(step: number) {
    const current = scale.get();
    const next = Math.max(1, Math.min(4, current + step));
    const ratio = next / current;
    const config = { duration, reduceMotion: ReduceMotion.System };
    x.set(withTiming(x.get() * ratio, config));
    y.set(withTiming(y.get() * ratio, config));
    scale.set(withTiming(next, config));
  }
  const pan = Gesture.Pan()
    .minDistance(theme.spacing.sm)
    .onStart(() => {
      cancelAnimation(x);
      cancelAnimation(y);
      startX.set(x.get());
      startY.set(y.get());
    })
    .onUpdate((event) => {
      x.set(
        Math.max(
          (-frame.width * scale.get()) / 2,
          Math.min(
            (frame.width * scale.get()) / 2,
            startX.get() + event.translationX,
          ),
        ),
      );
      y.set(
        Math.max(
          (-frame.height * scale.get()) / 2,
          Math.min(
            (frame.height * scale.get()) / 2,
            startY.get() + event.translationY,
          ),
        ),
      );
    })
    .onEnd(() => {
      if (custom) scheduleOnRN(commitPosition, x.get(), y.get(), scale.get());
    });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="none"><rect width="400" height="300" fill="${theme.colors.surfaceTint}"/><path d="M260 0Q210 90 290 150T300 300H400V0Z" fill="${theme.colors.weatherGlassTint}"/><path d="M20 20H130V120H20ZM40 190H170V280H40Z" fill="${theme.colors.successSurface}"/><g fill="none" stroke="${theme.colors.surface}" stroke-width="10"><path d="M-50 50L450 240M70 -30L230 350M330 -30L100 350M-30 220L430 40"/></g><g fill="none" stroke="${theme.colors.border}" stroke-width="1"><path d="M-50 50L450 240M70 -30L230 350M330 -30L100 350M-30 220L430 40"/></g></svg>`;
  return (
    <View
      style={{
        height: theme.layout.tripMapPreviewHeight,
        overflow: "hidden",
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surfaceTint,
      }}
      onLayout={(event) =>
        setFrame({
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
        })
      }
    >
      <GestureDetector gesture={pan}>
        <Animated.View
          style={StyleSheet.absoluteFill}
          accessible
          accessibilityLabel={custom ? copy.mapHint : copy.mapTitle}
          accessibilityActions={
            custom
              ? [
                  { name: "north", label: copy.moveNorth },
                  { name: "south", label: copy.moveSouth },
                  { name: "east", label: copy.moveEast },
                  { name: "west", label: copy.moveWest },
                ]
              : undefined
          }
          onAccessibilityAction={(event) => {
            if (!custom) return;
            const name = event.nativeEvent.actionName;
            const step = theme.spacing.xl;
            const nextX =
              x.get() + (name === "east" ? -step : name === "west" ? step : 0);
            const nextY =
              y.get() +
              (name === "north" ? step : name === "south" ? -step : 0);
            const boundedX = Math.max(
              (-frame.width * scale.get()) / 2,
              Math.min((frame.width * scale.get()) / 2, nextX),
            );
            const boundedY = Math.max(
              (-frame.height * scale.get()) / 2,
              Math.min((frame.height * scale.get()) / 2, nextY),
            );
            x.set(boundedX);
            y.set(boundedY);
            commitPosition(boundedX, boundedY, scale.get());
          }}
        >
          <Animated.View style={[StyleSheet.absoluteFill, motion]}>
            <Image
              accessible={false}
              source={{
                uri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
              }}
              contentFit="fill"
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          {!custom
            ? places.flatMap((place) =>
                place.location
                  ? [
                      <PlaceMapMarker
                        key={place.id}
                        point={projectPlace(place.location, region)}
                        frame={frame}
                        active={place.id === focused?.id}
                        x={x}
                        y={y}
                        scale={scale}
                      />,
                    ]
                  : [],
              )
            : null}
        </Animated.View>
      </GestureDetector>
      {custom ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { alignItems: "center", justifyContent: "center" },
          ]}
        >
          <AppIcon
            name="pin"
            size={theme.layout.iconLarge}
            color={theme.colors.primaryText}
          />
        </View>
      ) : null}
      <View
        style={{
          position: "absolute",
          right: theme.spacing.sm,
          top: theme.spacing.sm,
          gap: theme.spacing.xs,
        }}
      >
        <DetailIconButton
          name="plus"
          label={copy.zoomIn}
          onPress={() => changeZoom(0.5)}
        />
        <DetailIconButton
          name="minus"
          label={copy.zoomOut}
          onPress={() => changeZoom(-0.5)}
        />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: theme.spacing.xs,
          left: theme.spacing.sm,
          right: theme.spacing.sm,
          padding: theme.spacing.xs,
          backgroundColor: theme.colors.glassFallback,
          borderRadius: theme.radius.sm,
        }}
      >
        <AppText variant="caption" tone="muted">
          {copy.preview}
        </AppText>
      </View>
    </View>
  );
}

function PlaceMapMarker({
  point,
  frame,
  active,
  x,
  y,
  scale,
}: {
  point: { x: number; y: number };
  frame: { width: number; height: number };
  active: boolean;
  x: SharedValue<number>;
  y: SharedValue<number>;
  scale: SharedValue<number>;
}) {
  const theme = useAppTheme();
  const motion = useAnimatedStyle(() => ({
    transform: [
      { translateX: (point.x - 0.5) * frame.width * scale.get() + x.get() },
      { translateY: (point.y - 0.5) * frame.height * scale.get() + y.get() },
    ],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: "50%",
          top: "50%",
          marginLeft: -theme.layout.iconMedium / 2,
          marginTop: -theme.layout.iconMedium,
        },
        motion,
      ]}
    >
      <AppIcon
        name="pin"
        size={theme.layout.iconMedium}
        color={active ? theme.colors.primaryText : theme.colors.textSecondary}
      />
    </Animated.View>
  );
}
