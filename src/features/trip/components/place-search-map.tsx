import type { ReactNode } from "react";
import { View } from "react-native";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import type { TripStop, TravelMode } from "@/features/home/types/home-types";
import { routePoints } from "../utils/day-route";
import { useAppTheme } from "@/hooks/use-app-theme";
import { usePlaceRouteQuery } from "../api/maps-hooks";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import type { PlaceCoordinate, PlaceMapRegion } from "../utils/place-search";

/** Web fallback: the native map package is intentionally not loaded by SSR. */
export function PlaceSearchMap({
  places,
  custom,
  fitContainer = false,
  controlsTop,
  extraControl,
  showRoute = false,
  origin,
  returnToStart = false,
  travelMode = "car",
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
  origin?: PlaceCoordinate; originLabel?: string; returnToStart?: boolean; travelMode?: TravelMode;
}) {
  const theme = useAppTheme();
  const { copy } = usePlaceSearchCopy();
  const coordinates = routePoints(places, origin, returnToStart);
  const canRoute = showRoute && !custom && coordinates !== null && coordinates.length >= 2;
  const route = usePlaceRouteQuery(coordinates ?? [], canRoute, travelMode);
  const routeData = canRoute ? route.data : undefined;
  const routeLabel = canRoute && route.isError
    ? copy.routeUnavailable
    : routeData
      ? (routeData.distanceMeters / 1000).toFixed(1) + " km · " +
        Math.max(1, Math.round(routeData.durationSeconds / 60)) + " min"
      : copy.liveMapLabel;

  return (
    <View
      style={{
        flex: fitContainer ? 1 : undefined,
        height: fitContainer ? undefined : theme.layout.tripMapPreviewHeight,
        minHeight: fitContainer ? 0 : undefined,
        overflow: "hidden",
        borderRadius: fitContainer ? theme.radius.none : theme.radius.lg,
        backgroundColor: theme.colors.surfaceTint,
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
      {custom ? (
        <View pointerEvents="none" style={{ position: "absolute" }}>
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
          {routeLabel} · Geoapify · © OpenStreetMap contributors
        </AppText>
      </View>
    </View>
  );
}
