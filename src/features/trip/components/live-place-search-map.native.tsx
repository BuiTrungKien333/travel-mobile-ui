import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "react-native-reanimated";
import { decodeRoutePolyline } from "../utils/decode-route-polyline";
import { Platform, View } from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TripStop } from "@/features/home/types/home-types";
import { usePlaceRouteQuery } from "../api/maps-hooks";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import type { PlaceCoordinate, PlaceMapRegion } from "../utils/place-search";

export function PlaceSearchMap({
  places,
  region,
  focused,
  custom,
  onMove,
  fitContainer = false,
  controlsTop,
  extraControl,
  showRoute = false,
}: {
  places: TripStop[];
  region: PlaceMapRegion;
  focused?: TripStop;
  custom: boolean;
  onMove?: (coordinate: PlaceCoordinate) => void;
  fitContainer?: boolean;
  controlsTop?: number;
  extraControl?: ReactNode;
  showRoute?: boolean;
}) {
  const theme = useAppTheme();
  const map = useRef<MapView | null>(null);
  const reducedMotion = useReducedMotion();
  const { copy, locale } = usePlaceSearchCopy();
  const coordinates = places.flatMap((place) =>
    place.location ? [place.location] : [],
  );
  const route = usePlaceRouteQuery(coordinates, showRoute && !custom);
  const routeCoordinates = route.data?.encodedPolyline
    ? decodeRoutePolyline(route.data.encodedPolyline)
    : [];

  const center = focused?.location ?? {
    latitude: region.latitude,
    longitude: region.longitude,
  };
  const span = focused?.location ? 0.02 : Math.max(region.span, 0.02);
  const initialRegion: Region = {
    ...center,
    latitudeDelta: span * 1.5,
    longitudeDelta: span * 1.5,
  };

  useEffect(() => {
    map.current?.animateToRegion(
      {
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: span * 1.5,
        longitudeDelta: span * 1.5,
      },
      reducedMotion ? 0 : theme.motion.tabTransitionDuration,
    );
  }, [
    center.latitude,
    center.longitude,
    span,
    reducedMotion,
    theme.motion.tabTransitionDuration,
  ]);

  const mapStyle = {
    flex: fitContainer ? 1 : undefined,
    height: fitContainer ? undefined : theme.layout.tripMapPreviewHeight,
    minHeight: fitContainer ? 0 : undefined,
    overflow: "hidden" as const,
    borderRadius: fitContainer ? theme.radius.none : theme.radius.lg,
  };

  const onMapClick =
    custom && onMove
      ? (event: {
          nativeEvent: { coordinate: { latitude: number; longitude: number } };
        }) => {
          onMove(event.nativeEvent.coordinate);
        }
      : undefined;

  return (
    <View style={[mapStyle, { backgroundColor: theme.colors.surfaceTint }]}>
      {Platform.OS === "android" || Platform.OS === "ios" ? (
        <MapView
          ref={map}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          onPress={onMapClick}
          onLongPress={onMapClick}
          showsCompass
          showsUserLocation={false}
          toolbarEnabled={false}
        >
          {places.flatMap((place, index) =>
            place.location
              ? [
                  <Marker
                    key={place.id}
                    identifier={place.id}
                    coordinate={place.location}
                    title={place.name[locale]}
                    description={place.address?.[locale]}
                    pinColor={index === 0 ? theme.colors.primary : undefined}
                    draggable={custom && place.id === focused?.id}
                    onDragEnd={
                      custom && onMove
                        ? (event) => onMove(event.nativeEvent.coordinate)
                        : undefined
                    }
                  />,
                ]
              : [],
          )}
          {routeCoordinates.length > 1 ? (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={theme.colors.primary}
              strokeWidth={5}
            />
          ) : null}
        </MapView>
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: theme.spacing.lg,
            gap: theme.spacing.sm,
          }}
        >
          <AppIcon
            name="pin"
            size={theme.layout.iconLarge}
            color={theme.colors.textSecondary}
          />
          <AppText variant="caption" tone="muted">
            {copy.nativeMapRequired}
          </AppText>
        </View>
      )}
      {custom ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon
            name="pin"
            size={theme.layout.iconLarge}
            color={theme.colors.primaryText}
          />
        </View>
      ) : null}
      {extraControl ? (
        <View
          style={{
            position: "absolute",
            left: theme.spacing.sm,
            top: controlsTop ?? theme.spacing.sm,
          }}
        >
          {extraControl}
        </View>
      ) : null}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: theme.spacing.sm,
          left: theme.spacing.sm,
          maxWidth: "55%",
          padding: theme.spacing.xs,
          backgroundColor: theme.colors.glassFallback,
          borderRadius: theme.radius.sm,
        }}
      >
        <AppText variant="caption" tone="muted">
          {route.isError
            ? copy.routeUnavailable
            : route.data
              ? `${(route.data.distanceMeters / 1000).toFixed(1)} km · ${Math.max(1, Math.round(route.data.durationSeconds / 60))} min · ${route.data.provider}`
              : copy.liveMapLabel}
        </AppText>
      </View>
    </View>
  );
}
