import { useEffect, useRef, useState } from "react";
import { NativeModules, Platform, Pressable, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import type { Camera as CameraRef } from "@rnmapbox/maps";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import {
  TRIP_MAP_STYLE,
  TRIP_MAP_DEFAULT_CENTER,
  TRIP_MAP_DEFAULT_ZOOM,
  tripMapBounds,
  type TripMapPosition,
  type TripMapViewProps,
} from "../utils/trip-mapbox";
import { DetailIconButton } from "./trip-details-header";

// Existing development builds can use the static map without importing the native module.
const sdk: typeof import("@rnmapbox/maps") | undefined =
  NativeModules.RNMBXModule ? require("@rnmapbox/maps") : undefined;

export function TripMapboxView({
  token,
  pins,
  path,
  focusedId,
  onSelect,
  onUnavailable,
}: TripMapViewProps) {
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();
  const reduceMotion = useReducedMotion();
  const camera = useRef<CameraRef>(null);
  const [configured, setConfigured] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const centerOnLocation = useRef(false);

  useEffect(() => {
    if (!sdk) {
      onUnavailable();
      return;
    }
    let active = true;
    void sdk.setAccessToken(token).then(
      () => {
        if (active) setConfigured(true);
      },
      () => {
        if (active) onUnavailable();
      },
    );
    return () => {
      active = false;
    };
  }, [token, onUnavailable]);

  useEffect(() => {
    if (!loaded) return;
    const duration = reduceMotion ? 0 : theme.motion.tabTransitionDuration;
    const focus = pins.find((p) => p.id === focusedId);
    const bounds = tripMapBounds(pins, path);
    if (focus)
      camera.current?.setCamera({
        centerCoordinate: [focus.longitude, focus.latitude],
        zoomLevel: 15,
        animationDuration: duration,
      });
    else if (bounds) {
      const [sw, ne] = bounds;
      if (sw[0] === ne[0] && sw[1] === ne[1])
        camera.current?.setCamera({
          centerCoordinate: sw,
          zoomLevel: 14,
          animationDuration: duration,
        });
      else camera.current?.fitBounds(ne, sw, theme.spacing.section, duration);
    } else
      camera.current?.setCamera({
        centerCoordinate: TRIP_MAP_DEFAULT_CENTER,
        zoomLevel: TRIP_MAP_DEFAULT_ZOOM,
        animationDuration: duration,
      });
  }, [
    focusedId,
    loaded,
    path,
    pins,
    reduceMotion,
    theme.motion.tabTransitionDuration,
    theme.spacing.section,
  ]);

  if (!sdk || !configured) return null;
  const {
    MapView,
    Camera,
    MarkerView,
    ShapeSource,
    LineLayer,
    UserLocation,
    requestAndroidLocationPermissions,
  } = sdk;
  const first = pins[0];
  const centerMap = (centerCoordinate: TripMapPosition) => {
    centerOnLocation.current = false;
    camera.current?.setCamera({
      centerCoordinate,
      zoomLevel: 15,
      animationDuration: reduceMotion ? 0 : theme.motion.tabTransitionDuration,
    });
  };
  const locate = async () => {
    try {
      if (
        Platform.OS === "android" &&
        !(await requestAndroidLocationPermissions())
      )
        return;
      centerOnLocation.current = true;
      if (!showLocation) setShowLocation(true);
      else {
        const location = await sdk.locationManager.getLastKnownLocation();
        if (location)
          centerMap([location.coords.longitude, location.coords.latitude]);
      }
    } catch {
      centerOnLocation.current = false;
    }
  };
  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        styleURL={TRIP_MAP_STYLE}
        rotateEnabled={false}
        pitchEnabled={false}
        onDidFinishLoadingMap={() => setLoaded(true)}
        onMapLoadingError={(error) => {
          if (error?.type === "style" || !error?.type) onUnavailable();
        }}
      >
        <Camera
          ref={camera}
          defaultSettings={{
            centerCoordinate: first
              ? [first.longitude, first.latitude]
              : TRIP_MAP_DEFAULT_CENTER,
            zoomLevel: first ? 14 : TRIP_MAP_DEFAULT_ZOOM,
          }}
        />
        {showLocation ? (
          <UserLocation
            onUpdate={({ coords }) => {
              if (!centerOnLocation.current) return;
              centerMap([coords.longitude, coords.latitude]);
            }}
          />
        ) : null}
        {path.length > 1 ? (
          <ShapeSource
            id="trip-route"
            shape={{ type: "LineString", coordinates: path }}
          >
            <LineLayer
              id="trip-route-line"
              style={{
                lineColor: theme.colors.primaryText,
                lineWidth: 5,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </ShapeSource>
        ) : null}
        {pins.map((pin) => (
          <MarkerView
            key={pin.id}
            coordinate={[pin.longitude, pin.latitude]}
            allowOverlap
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${pin.number}. ${pin.name}`}
              accessibilityState={{ selected: pin.id === focusedId }}
              onPress={() => onSelect(pin.id)}
              style={{
                width: theme.layout.touchTarget,
                height: theme.layout.touchTarget,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: theme.layout.tripMapMarkerSize,
                  height: theme.layout.tripMapMarkerSize,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: theme.radius.full,
                  backgroundColor:
                    pin.id === focusedId
                      ? theme.colors.primaryText
                      : theme.colors.heroSurface,
                  borderWidth: 2,
                  borderColor: theme.colors.onHero,
                }}
              >
                <AppText
                  variant="caption"
                  style={{
                    color: theme.colors.onHero,
                    fontFamily: theme.typography.fontFamily.semibold,
                  }}
                >
                  {pin.number}
                </AppText>
              </View>
            </Pressable>
          </MarkerView>
        ))}
      </MapView>
      {loaded ? (
        <View
          style={{
            position: "absolute",
            right: theme.spacing.sm,
            bottom: theme.spacing.sm,
          }}
        >
          <DetailIconButton
            compact
            name="locate"
            label={copy.locateMe}
            onPress={() => void locate()}
          />
        </View>
      ) : null}
    </View>
  );
}
