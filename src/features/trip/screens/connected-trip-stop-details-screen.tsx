import { useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { useOngoingCopy } from "@/features/home/i18n/ongoing-copy";
import type { TripStop } from "@/features/home/types/home-types";
import { ApiError } from "@/services/api/api-error";
import { useTripQuery } from "../api/trip-queries";
import {
  useTripPlacesQuery,
  useUpdateTripPlaceMutation,
} from "../api/trip-hooks";
import {
  useTripItineraryQuery,
  useSaveItineraryDayMutation,
} from "../api/itinerary-hooks";
import { usePlaceDetail } from "../api/place-discovery-queries";
import { discoveryStop } from "../api/place-discovery-api";
import { toTrip, toDayStops } from "../api/trip-adapters";
import type {
  ItineraryResponse,
  SaveItineraryDayRequest,
} from "../api/itinerary-types";
import { PlaceDetailsContent } from "../components/place-details-content";
import {
  PlaceAmenities,
  PlaceClassification,
  PlaceIntroduction,
} from "../components/place-details-editorial";
import { TripDayMap } from "../components/trip-day-map";
import { TripVisitCard } from "../components/trip-visit-card";
import { SharePlaceButton } from "../components/share-place-button";
import { ConnectedStopScheduleSheet } from "../components/connected-stop-schedule-sheet";
import { TripDeleteAlert } from "../components/trip-delete-alert";
import { DetailIconButton } from "../components/trip-details-header";
import { getSampleImage } from "../utils/trip-images";
import { getPlaceMapRegion } from "../utils/place-search";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { useItineraryCopy } from "../i18n/itinerary-copy";
import { useTripDirections } from "../hooks/use-trip-directions";
import { usePlaceSearchCopy } from "../i18n/place-search-copy";
import {
  tripApiErrorMessage,
  useTripIntegrationCopy,
} from "../i18n/trip-integration-copy";

type VisitAction = {
  kind: "edit" | "remove";
  base: ItineraryResponse;
  tripVersion: number;
  stop: TripStop;
};

export function ConnectedTripStopDetailsScreen({
  tripId,
  stopId,
  day,
}: {
  tripId?: string;
  stopId?: string;
  day?: string;
}) {
  const theme = useAppTheme();
  const directions = useTripDirections();
  const insets = useScreenInsets();
  const { copy, locale } = useTripDetailsCopy();
  const { copy: ongoing } = useOngoingCopy();
  const { copy: itineraryCopy } = useItineraryCopy();
  const { copy: placeCopy } = usePlaceSearchCopy();
  const { copy: errors } = useTripIntegrationCopy();
  const query = useTripQuery(tripId);
  const places = useTripPlacesQuery(tripId);
  const itinerary = useTripItineraryQuery(tripId);
  const save = useSaveItineraryDayMutation(tripId ?? "");
  const visit = useUpdateTripPlaceMutation(tripId ?? "");
  const [action, setAction] = useState<VisitAction>();
  const [expandRequest, setExpandRequest] = useState(0);
  const saving = useRef(false);
  const visiting = useRef(false);
  const read = query.data;
  const trip = useMemo(
    () => (read ? toTrip(read.trip, places.data, itinerary.data) : undefined),
    [read, places.data, itinerary.data],
  );
  const stop = (
    day
      ? trip?.days.find((entry) => entry.date === day)?.stops
      : trip?.unscheduledStops
  )?.find((entry) => entry.itineraryItemId === stopId || entry.id === stopId);
  const detail = usePlaceDetail(stop?.placeId, locale);
  const place = useMemo(() => {
    if (!stop) return undefined;
    return detail.data
      ? {
          ...discoveryStop(detail.data),
          ...stop,
          location: detail.data.location,
          address: detail.data.formattedAddress
            ? {
                vi: detail.data.formattedAddress,
                en: detail.data.formattedAddress,
              }
            : stop.address,
        }
      : stop;
  }, [stop, detail.data]);
  const mapStops = useMemo(() => (place ? [place] : []), [place]);
  const samplePhotoSeed = stop ? (stop.placeId ?? stop.id) : null;
  const samplePhotos = useMemo(
    () =>
      samplePhotoSeed !== null
        ? [0, 1, 2].map((index) =>
            getSampleImage(`${samplePhotoSeed}:photo:${index}`),
          )
        : [],
    [samplePhotoSeed],
  );
  const ready = !!read && !!places.data && !!itinerary.data;
  const loadError = query.isError || places.isError || itinerary.isError;
  const editable =
    ready &&
    !loadError &&
    !!day &&
    !!stop?.tripPlaceId &&
    (read.trip.mode === "PLANNING" ||
      (read.trip.mode === "LIVE" && day >= read.context.evaluatedDate));
  const canVisit =
    ready &&
    !loadError &&
    !!stop?.tripPlaceId &&
    !!day &&
    read.trip.mode === "LIVE" &&
    day <= read.context.evaluatedDate;
  const conflict =
    save.error instanceof ApiError &&
    ["TRIP_007", "TRIP_008"].includes(save.error.code);
  const problem =
    save.error instanceof ApiError
      ? ({
          TRIP_005: itineraryCopy.invalid,
          TRIP_006: itineraryCopy.readOnly,
          TRIP_007: itineraryCopy.membership,
          TRIP_008: itineraryCopy.conflict,
        }[save.error.code] ?? itineraryCopy.error)
      : save.error
        ? itineraryCopy.error
        : undefined;
  const back = () => {
    if (saving.current) return;
    if (router.canGoBack()) router.back();
    else if (tripId)
      router.replace({
        pathname: "/trip/[tripId]",
        params: {
          tripId,
          ...(day ? { day } : {}),
        },
      });
    else router.replace("/tabs/trips");
  };
  const reload = async () => {
    const refreshed = await Promise.all([
      query.refetch(),
      places.refetch(),
      itinerary.refetch(),
    ]);
    if (refreshed.every((result) => !result.isError)) {
      save.reset();
      setAction(undefined);
    }
  };
  const openAction = (kind: VisitAction["kind"]) => {
    if (!editable || !read || !itinerary.data || !stop) return;
    save.reset();
    setAction({
      kind,
      base: itinerary.data,
      tripVersion: read.trip.version,
      stop,
    });
  };
  const persist = async (stops: SaveItineraryDayRequest["stops"]) => {
    if (!action || !day || saving.current || conflict) return;
    saving.current = true;
    try {
      await save.mutateAsync({
        date: day,
        request: {
          expectedTripVersion: action.tripVersion,
          expectedUpdatedAt: action.base.updatedAt,
          stops: stops.map((entry, sequence) => ({ ...entry, sequence })),
        },
      });
      setAction(undefined);
      // Removing this day entry makes its detail route invalid.
      if (action.kind === "remove") {
        if (router.canGoBack()) router.back();
        else
          router.replace({
            pathname: "/trip/[tripId]",
            params: { tripId: tripId!, day },
          });
      }
    } catch {
      // The mutation error is displayed while preserving the current form.
    } finally {
      saving.current = false;
    }
  };
  const toggleVisited = async () => {
    if (!canVisit || !stop?.placeId || visiting.current) return;
    visiting.current = true;
    try {
      await visit.mutateAsync({
        placeId: stop.placeId,
        request: { visited: !stop.visited },
      });
    } catch {
      /* Mutation state supplies the retryable error below. */
    } finally {
      visiting.current = false;
    }
  };

  if (!tripId || !stopId || !ready || !trip || !stop || !place)
    return (
      <ScreenSafeArea
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
          <DetailIconButton name="back" label={copy.back} onPress={back} />
          <AppText accessibilityRole={loadError || ready ? "alert" : undefined}>
            {loadError
              ? tripApiErrorMessage(
                  query.error ?? places.error ?? itinerary.error,
                  errors,
                )
              : !tripId || !stopId || ready
                ? copy.stopNotFound
                : errors.loading}
          </AppText>
          {loadError ? (
            <AppButton
              size="small"
              variant="outline"
              onPress={() => void reload()}
            >
              {errors.retry}
            </AppButton>
          ) : null}
        </View>
      </ScreenSafeArea>
    );

  return (
    <GestureHandlerRootView style={styles.fill}>
      <ScreenSafeArea
        edges={["left", "right"]}
        style={[styles.fill, { backgroundColor: theme.colors.background }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[
            styles.fill,
            {
              width: "100%",
              maxWidth: theme.layout.contentMaxWidth,
              alignSelf: "center",
            },
          ]}
        >
          <PlaceDetailsContent
            place={place}
            places={mapStops}
            region={getPlaceMapRegion(mapStops)}
            showSavedName
            onBack={back}
            backLabel={copy.back}
            topInset={insets.top + theme.spacing.lg}
            expandMapRequest={expandRequest}
            mapAction={<SharePlaceButton place={place} />}
            mapContent={
              <TripDayMap
                stops={mapStops}
                focusedId={place.id}
                onSelect={() => setExpandRequest((value) => value + 1)}
              />
            }
            suppliedDetails={{
              photo: getSampleImage(place.placeId ?? place.id),
              hours: detail.data?.openingHours?.displayLines.join(" · "),
              admission: detail.data?.admission
                ? {
                    vi: detail.data.admission.text,
                    en: detail.data.admission.text,
                  }
                : undefined,
            }}
            classification={
              <PlaceClassification
                place={place}
                category={
                  detail.data?.category?.label ??
                  (place.kind[locale] || undefined)
                }
                openingStatus={detail.data?.openingStatus ?? "UNKNOWN"}
              />
            }
            afterInfo={<PlaceAmenities place={place} />}
            status={
              <View
                style={{
                  alignSelf: "flex-start",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  borderRadius: theme.radius.sm,
                  backgroundColor: stop.visited
                    ? theme.colors.successSurface
                    : theme.colors.surfaceTint,
                }}
              >
                <AppIcon
                  name={stop.visited ? "tick" : "clock"}
                  size={theme.layout.iconSmall}
                  color={
                    stop.visited
                      ? theme.colors.success
                      : theme.colors.primaryText
                  }
                />
                <AppText
                  variant="caption"
                  style={{
                    color: stop.visited
                      ? theme.colors.success
                      : theme.colors.primaryText,
                  }}
                >
                  {stop.visited ? copy.visited : copy.stopNotVisited}
                </AppText>
              </View>
            }
          >
            {detail.isError ? (
              <View style={{ gap: theme.spacing.sm }}>
                <AppText variant="caption" accessibilityRole="alert">
                  {placeCopy.requestFailed}
                </AppText>
                <AppButton
                  size="small"
                  variant="outline"
                  onPress={() => void detail.refetch()}
                >
                  {errors.retry}
                </AppButton>
              </View>
            ) : null}
            {loadError ? (
              <AppText accessibilityRole="alert">{itineraryCopy.error}</AppText>
            ) : null}
            <TripVisitCard
              trip={trip}
              stop={stop}
              date={day ?? null}
              onEdit={editable ? () => openAction("edit") : undefined}
              onRemove={editable ? () => openAction("remove") : undefined}
            />
            <PlaceIntroduction place={place} samplePhotos={samplePhotos} />
          </PlaceDetailsContent>
          <View
            style={{
              padding: theme.spacing.lg,
              paddingBottom: insets.bottom + theme.spacing.xl,
              gap: theme.spacing.sm,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: theme.colors.softActionBorder,
            }}
          >
            <GlassBackdrop borderRadius={theme.radius.none} />
            {directions.error ? (
              <AppText accessibilityRole="alert">{directions.error}</AppText>
            ) : null}
            {!place.location ? (
              <AppText variant="caption" tone="muted">
                {copy.stopMapUnavailable}
              </AppText>
            ) : null}
            <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
              <AppButton
                size="small"
                variant="raised"
                loading={directions.busy}
                style={[
                  styles.action,
                  { flexGrow: 60, paddingHorizontal: theme.spacing.sm },
                ]}
                accessibilityHint={ongoing.directionsHint}
                onPress={() => void directions.open(place, trip.destination)}
                leadingIcon={
                  <AppIcon
                    name="navigation"
                    size={theme.layout.iconSmall}
                    color={theme.colors.onRaisedAction}
                  />
                }
              >
                {ongoing.directions}
              </AppButton>
              <AppButton
                size="small"
                variant="outline"
                disabled={!canVisit}
                loading={visit.isPending}
                accessibilityHint={
                  canVisit
                    ? stop.visited
                      ? copy.stopVisitHint
                      : copy.markVisited
                    : copy.stopVisitUnavailable
                }
                accessibilityState={{ selected: !!stop.visited }}
                style={[
                  styles.action,
                  {
                    flexGrow: 40,
                    paddingHorizontal: theme.spacing.sm,
                    backgroundColor: stop.visited
                      ? theme.colors.successSurface
                      : theme.colors.glassInset,
                    borderColor: stop.visited
                      ? theme.colors.success
                      : theme.colors.softActionBorder,
                  },
                ]}
                leadingIcon={
                  <AppIcon
                    name={stop.visited ? "tick" : "check"}
                    size={theme.layout.iconSmall}
                    color={
                      stop.visited
                        ? theme.colors.success
                        : theme.colors.primaryText
                    }
                  />
                }
                onPress={() => void toggleVisited()}
              >
                {copy.visited}
              </AppButton>
            </View>
            {visit.isError ? (
              <AppText variant="caption" tone="error" accessibilityRole="alert">
                {itineraryCopy.visitFailed}
              </AppText>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </ScreenSafeArea>
      {action?.kind === "edit" && day ? (
        <ConnectedStopScheduleSheet
          stop={action.stop}
          date={day}
          days={read.trip.days}
          editable={editable}
          pending={save.isPending}
          problem={problem}
          onReload={conflict ? () => void reload() : undefined}
          onClose={() => {
            if (!saving.current) setAction(undefined);
          }}
          onSave={async (draft) => {
            const stops = toDayStops(action.base, day);
            const index = stops.findIndex(
              (entry) => entry.placeId === action.stop.placeId,
            );
            if (index < 0) return;
            const previous = stops[index];
            stops[index] = {
              ...previous,
              arrivalTime: draft.time
                ? previous.arrivalTime?.slice(11, 16) === draft.time
                  ? previous.arrivalTime
                  : `${day}T${draft.time}:00`
                : null,
              durationMinutes: Number(draft.duration),
              note: draft.note.trim() || null,
            };
            await persist(stops);
          }}
        />
      ) : null}
      {action?.kind === "remove" && day ? (
        <TripDeleteAlert
          title={copy.stopRemoveTitle}
          hint={itineraryCopy.removeDayHint}
          busy={save.isPending}
          error={problem}
          confirmLabel={conflict ? itineraryCopy.reload : copy.unschedule}
          onCancel={() => {
            if (!saving.current) setAction(undefined);
          }}
          onConfirm={() => {
            if (conflict) {
              void reload();
              return;
            }
            void persist(
              toDayStops(action.base, day).filter(
                (entry) => entry.placeId !== action.stop.placeId,
              ),
            );
          }}
        />
      ) : null}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 0 },
  action: { flexBasis: 0, minWidth: 0 },
});
