import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TripStop } from "@/features/home/types/home-types";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { useItineraryCopy } from "../i18n/itinerary-copy";
import { decodeRoutePolyline } from "../utils/decode-route-polyline";
import {
  tripMapPins,
  tripMapToken,
  tripStaticMapUri,
  type TripMapPosition,
} from "../utils/trip-mapbox";
import { TripMapboxView } from "./trip-mapbox-view";
import { TripMapPreview } from "./trip-map-preview";
import type { DaySettings } from "../api/itinerary-types";

export function TripDayMap({
  stops,
  polyline,
  pathCoordinates,
  focusedId,
  onSelect,
  origin,
}: {
  stops: TripStop[];
  polyline?: string;
  pathCoordinates?: TripMapPosition[];
  focusedId?: string;
  onSelect: (id: string) => void;
  origin?: DaySettings["origin"];
}) {
  const theme = useAppTheme();
  const { locale } = useTripDetailsCopy();
  const { copy: integration } = useItineraryCopy();
  const [staticOnly, setStaticOnly] = useState(false);
  const [failedImage, setFailedImage] = useState<string>();
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  }>();
  const resizeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(resizeTimer.current), []);
  const showStatic = useCallback(() => setStaticOnly(true), []);
  const pins = useMemo(() => {
    const points = tripMapPins(stops, locale);
    if (
      origin?.latitude != null &&
      origin.longitude != null &&
      Math.abs(origin.latitude) <= 85.0511
    )
      points.unshift({
        id: "trip-origin",
        number: 0,
        label: "S",
        name: origin.name,
        latitude: origin.latitude,
        longitude: origin.longitude,
      });
    return points;
  }, [stops, locale, origin]);
  const path = useMemo(
    () =>
      pathCoordinates ?? (polyline
        ? decodeRoutePolyline(polyline).map((point): TripMapPosition => [
            point.longitude,
            point.latitude,
          ])
        : []),
    [pathCoordinates, polyline],
  );

  if (tripMapToken && !staticOnly)
    return (
      <TripMapboxView
        token={tripMapToken}
        pins={pins}
        path={path}
        focusedId={focusedId}
        onSelect={onSelect}
        onUnavailable={showStatic}
      />
    );

  const uri =
    tripMapToken &&
    tripStaticMapUri(
      pins,
      path.length > 1 ? polyline : undefined,
      tripMapToken,
      theme.colors.primaryText,
      imageSize,
    );
  if (uri && failedImage !== uri)
    return (
      <View
        style={{ flex: 1, minHeight: 0 }}
        onLayout={({ nativeEvent }) => {
          const width = Math.round(nativeEvent.layout.width);
          const height = Math.round(nativeEvent.layout.height);
          clearTimeout(resizeTimer.current);
          if (width <= 0 || height <= 0) return;
          // Fetch once the drag settles, rather than one image per animation frame.
          resizeTimer.current = setTimeout(() => {
            setImageSize((previous) =>
              previous?.width === width && previous.height === height
                ? previous
                : { width, height },
            );
          }, theme.motion.tabTransitionDuration);
        }}
      >
        <Image
          source={uri}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory"
          accessibilityLabel={integration.staticMap}
          accessible
          onError={() => setFailedImage(uri)}
        />
      </View>
    );

  return stops.length ? (
    <TripMapPreview
      stops={stops}
      showStart={false}
      selectedId={focusedId}
      startLabel=""
      onSelect={(stop) => onSelect(stop.id)}
      fitContainer
    />
  ) : (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing.lg,
      }}
    >
      <AppText variant="caption" tone="muted">
        {integration.mapEmpty}
      </AppText>
    </View>
  );
}
