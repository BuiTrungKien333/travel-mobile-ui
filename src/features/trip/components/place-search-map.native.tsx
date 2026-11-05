import type { ReactNode } from "react";
import { Platform, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TripStop, TravelMode } from "@/features/home/types/home-types";
import { routePoints } from "../utils/day-route";
import { usePlaceRouteQuery } from "../api/maps-hooks";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import type { PlaceCoordinate, PlaceMapRegion } from "../utils/place-search";

function decodePolyline(encoded: string) {
  const points: PlaceCoordinate[] = [];
  let index = 0, latitude = 0, longitude = 0;
  while (index < encoded.length) {
    let result = 0, shift = 0, value: number;
    do { value = encoded.charCodeAt(index++) - 63; result |= (value & 0x1f) << shift; shift += 5; } while (value >= 0x20 && index < encoded.length);
    latitude += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0; shift = 0;
    do { value = encoded.charCodeAt(index++) - 63; result |= (value & 0x1f) << shift; shift += 5; } while (value >= 0x20 && index < encoded.length);
    longitude += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
  }
  return points;
}

export function PlaceSearchMap({
  places, region, focused, custom, onMove, fitContainer = false, controlsTop, extraControl, showRoute = false,
  origin, originLabel, returnToStart = false, travelMode = "car",
}: {
  places: TripStop[]; region: PlaceMapRegion; focused?: TripStop; custom: boolean;
  onMove?: (coordinate: PlaceCoordinate) => void; fitContainer?: boolean;
  controlsTop?: number; extraControl?: ReactNode;
  showRoute?: boolean;
  origin?: PlaceCoordinate; originLabel?: string; returnToStart?: boolean; travelMode?: TravelMode;
}) {
  const theme = useAppTheme();
  const { copy, locale } = usePlaceSearchCopy();
  const coordinates = routePoints(places, origin, returnToStart);
  const canRoute = showRoute && !custom && coordinates !== null && coordinates.length >= 2;
  const route = usePlaceRouteQuery(coordinates ?? [], canRoute, travelMode);
  const routeData = canRoute ? route.data : undefined;
  const routeCoordinates = routeData?.encodedPolyline ? decodePolyline(routeData.encodedPolyline) : [];
  const center = focused?.location ?? { latitude: region.latitude, longitude: region.longitude };
  const span = focused?.location ? 0.02 : Math.max(region.span, 0.02);
  const initialRegion: Region = { ...center, latitudeDelta: span * 1.5, longitudeDelta: span * 1.5 };
  const mapStyle = { flex: fitContainer ? 1 : undefined, height: fitContainer ? undefined : theme.layout.tripMapPreviewHeight, minHeight: fitContainer ? 0 : undefined, overflow: "hidden" as const, borderRadius: fitContainer ? theme.radius.none : theme.radius.lg };
  const onMapClick = custom && onMove ? (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    onMove(event.nativeEvent.coordinate);
  } : undefined;

  return (
    <View style={[mapStyle, { backgroundColor: theme.colors.surfaceTint }]}>
      {Platform.OS === "android" || Platform.OS === "ios" ? (
        <MapView
          key={`${center.latitude}:${center.longitude}:${places.map((place) => place.id).join(",")}`}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          onPress={onMapClick}
          onLongPress={onMapClick}
          showsCompass
          showsUserLocation={false}
          toolbarEnabled={false}
        >
          {origin ? <Marker identifier="day-origin" coordinate={origin} title={originLabel} pinColor={theme.colors.primary} /> : null}
          {places.flatMap((place, index) => place.location ? [
            <Marker key={place.id} identifier={place.id} coordinate={place.location}
              title={place.name[locale]} description={place.address?.[locale]}
              pinColor={index === 0 ? theme.colors.primary : undefined} draggable={custom && place.id === focused?.id}
              onDragEnd={custom && onMove ? (event) => onMove(event.nativeEvent.coordinate) : undefined} />,
          ] : [])}
          {routeCoordinates.length > 1 ? <Polyline coordinates={routeCoordinates} strokeColor={theme.colors.primary} strokeWidth={5} /> : null}
        </MapView>
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: theme.spacing.lg, gap: theme.spacing.sm }}>
          <AppIcon name="pin" size={theme.layout.iconLarge} color={theme.colors.textSecondary} />
          <AppText variant="caption" tone="muted">{copy.nativeMapRequired}</AppText>
        </View>
      )}
      {custom ? (
        <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
          <AppIcon name="pin" size={theme.layout.iconLarge} color={theme.colors.primaryText} />
        </View>
      ) : null}
      {extraControl ? <View style={{ position: "absolute", left: theme.spacing.sm, top: controlsTop ?? theme.spacing.sm }}>{extraControl}</View> : null}
      <View pointerEvents="none" style={{ position: "absolute", top: theme.spacing.sm, left: theme.spacing.sm, maxWidth: "55%", padding: theme.spacing.xs, backgroundColor: theme.colors.glassFallback, borderRadius: theme.radius.sm }}>
        <AppText variant="caption" tone="muted">
          {canRoute && route.isError ? copy.routeUnavailable : routeData ? `${(routeData.distanceMeters / 1000).toFixed(1)} km · ${Math.max(1, Math.round(routeData.durationSeconds / 60))} min` : copy.liveMapLabel} · Geoapify · © OpenStreetMap contributors
        </AppText>
      </View>
    </View>
  );
}
