import { useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/ui/app-text";
import { TextAction } from "@/features/home/components/home-primitives";
import type { Trip, TripDay } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { usePlaceDiscovery } from "../api/place-discovery-queries";
import { discoveryStop } from "../api/place-discovery-api";
import type { UpdateDayScheduleRequest } from "../api/itinerary-types";
import type { RouteMode } from "../api/trip-day-route";
import { currentTripPosition } from "../services/current-trip-position";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { useItineraryCopy } from "../i18n/itinerary-copy";
import { TripDetailsSheet } from "./trip-details-sheet";
import { TripDayScheduleForm } from "./trip-day-schedule-form";

export function ConnectedDayScheduleSheet({
  trip,
  day,
  routeMode,
  pending,
  problem,
  onReload,
  onClose,
  onSave,
}: {
  trip: Trip;
  day: TripDay;
  routeMode: RouteMode;
  pending: boolean;
  problem?: string;
  onReload?: () => void;
  onClose: () => void;
  onSave: (
    draft: Pick<UpdateDayScheduleRequest, "settings" | "durations">,
  ) => Promise<void>;
}) {
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const { copy: integration } = useItineraryCopy();
  const [search, setSearch] = useState("");
  const { query, isDebouncing } = usePlaceDiscovery(
    { tripId: trip.id },
    search,
    locale,
    search.trim().length > 1,
  );
  const candidates = [
    ...trip.days.flatMap((entry) => entry.stops),
    ...(trip.unscheduledStops ?? []),
    ...(!isDebouncing
      ? (query.data?.pages.flatMap((page) => page.content.map(discoveryStop)) ??
        [])
      : []),
  ];
  const dayNumber = trip.days.findIndex((entry) => entry.date === day.date) + 1;
  const displayDate = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${day.date}T12:00:00Z`));
  return (
    <TripDetailsSheet
      title={`${copy.daySettings} ${dayNumber} (${displayDate})`}
      onClose={onClose}
      dismissDisabled={pending}
      heightRatio={theme.layout.tripDayEditorSheetHeightRatio}
      contentGap={theme.spacing.sm}
    >
      {problem ? (
        <AppText accessibilityRole="alert" variant="caption" tone="error">
          {problem}
        </AppText>
      ) : null}
      {onReload ? (
        <TextAction label={integration.reload} onPress={onReload} />
      ) : null}
      <View
        pointerEvents={pending || !!onReload ? "none" : "auto"}
        style={{ gap: theme.spacing.sm }}
      >
        <TripDayScheduleForm
          trip={trip}
          day={day}
          pending={pending}
          integration={{
            matches: candidates,
            onSearch: setSearch,
            currentPosition: () => currentTripPosition(copy.originCurrent),
            notice: query.isError
              ? integration.originSearchError
              : search.length > 1 && (isDebouncing || query.isFetching)
                ? integration.originSearchLoading
                : undefined,
            noCoordinates: integration.originNoCoordinates,
            locationError: integration.originLocationError,
            emptySearch: integration.originSearchEmpty,
          }}
          onSave={async (draft) => {
            const stops = new Map(
              day.stops.map((stop) => [stop.id, stop.placeId]),
            );
            const durations = draft.durations.map((duration) => {
              const placeId = stops.get(duration.stopId);
              if (!placeId) throw new Error("INVALID_ITINERARY");
              return { placeId, minutes: duration.minutes };
            });
            await onSave({
              settings: {
                origin: draft.startLocation
                  ? {
                      name: draft.startLocation,
                      address: draft.startAddress ?? null,
                      latitude: draft.startCoordinate?.latitude ?? null,
                      longitude: draft.startCoordinate?.longitude ?? null,
                    }
                  : null,
                departureTime: draft.startTime,
                returnToStart: draft.returnToStart,
                travelMode: routeMode,
              },
              durations,
            });
          }}
        />
      </View>
    </TripDetailsSheet>
  );
}
