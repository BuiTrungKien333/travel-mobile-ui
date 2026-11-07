import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
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

export function TripDayMap({
  stops,
  polyline,
  focusedId,
  onSelect,
}: {
  stops: TripStop[];
  polyline?: string;
  focusedId?: string;
  onSelect: (id: string) => void;
}) {
  const theme = useAppTheme();
  const { locale } = useTripDetailsCopy();
  const { copy: integration } = useItineraryCopy();
  const [staticOnly, setStaticOnly] = useState(false);
  const [failedImage, setFailedImage] = useState<string>();
  const showStatic = useCallback(() => setStaticOnly(true), []);
  const pins = useMemo(() => tripMapPins(stops, locale), [stops, locale]);
  const path = useMemo(
    () =>
      polyline
        ? decodeRoutePolyline(polyline).map(
            (point): TripMapPosition => [point.longitude, point.latitude],
          )
        : [],
    [polyline],
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
    );
  if (uri && failedImage !== uri)
    return (
      <Image
        source={uri}
        style={{ flex: 1 }}
        contentFit="contain"
        cachePolicy="memory"
        accessibilityLabel={integration.staticMap}
        accessible
        onError={() => setFailedImage(uri)}
      />
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
