import { router } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { todayCalendarDate } from "@/utils/calendar-date";
import type { Trip, TripStop } from "@/features/home/types/home-types";
import { useOngoingCopy } from "@/features/home/i18n/ongoing-copy";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useScreenInsets } from "@/hooks/use-screen-insets";
import { PlaceDetailsContent } from "../components/place-details-content";
import { StopDetailsForm } from "../components/trip-details-forms";
import { TripDeleteAlert } from "../components/trip-delete-alert";
import { TripDetailsSheet } from "../components/trip-details-sheet";
import { TripVisitCard } from "../components/trip-visit-card";
import { SharePlaceButton } from "../components/share-place-button";
import {
  PlaceAmenities,
  PlaceClassification,
  PlaceIntroduction,
} from "../components/place-details-editorial";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import type { TripMutation } from "../types/trip-details-types";
import { getTripDetailsMode } from "../utils/trip-details-layout";
import { getPlaceMapRegion } from "../utils/place-search";
import { useDeleteTripPlaceMutation, useTripPlacesQuery, useTripQuery, useUpdateTripPlaceMutation } from "../api/trip-hooks";
import { useSaveItineraryMutation, useTripItineraryQuery } from "../api/itinerary-hooks";
import { toSaveItineraryRequest, toTrip } from "../api/trip-adapters";
import { applyTripMutation } from "../utils/trip-mutations";
import { ApiError } from "@/services/api/api-error";
import { clockPattern } from "../schemas/trip-details-schema";

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/tabs/trips");
}

export function TripStopDetailsScreen({
  tripId,
  stopId,
  day,
}: {
  tripId?: string;
  stopId?: string;
  day?: string;
}) {
  const tripQuery = useTripQuery(tripId);
  const placesQuery = useTripPlacesQuery(tripId);
  const itineraryQuery = useTripItineraryQuery(tripId);
  const trip = tripQuery.data ? toTrip(tripQuery.data, placesQuery.data ?? [], itineraryQuery.data) : undefined;
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();
  if (tripQuery.isPending || placesQuery.isPending || itineraryQuery.isPending)
    return <ScreenSafeArea style={[styles.fill, { backgroundColor: theme.colors.background }]}><View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator color={theme.colors.primary} /></View></ScreenSafeArea>;
  const stop = (
    day
      ? trip?.days.find((entry) => entry.date === day)?.stops
      : trip?.unscheduledStops
  )?.find((entry) => entry.id === stopId);
  if (tripQuery.isError || placesQuery.isError || itineraryQuery.isError)
    return <ScreenSafeArea style={[styles.fill, { backgroundColor: theme.colors.background }]}><View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}><AppText accessibilityRole="alert" tone="error">{copy.itineraryLoadError}</AppText><AppButton variant="outline" onPress={() => { void tripQuery.refetch(); void placesQuery.refetch(); void itineraryQuery.refetch(); }}>{copy.retry}</AppButton></View></ScreenSafeArea>;
  if (!trip || !stop)
    return (
      <ScreenSafeArea
        style={[styles.fill, { backgroundColor: theme.colors.background }]}
      >
        <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
          <AppText variant="heading">{copy.stopNotFound}</AppText>
          <AppButton onPress={goBack}>{copy.back}</AppButton>
        </View>
      </ScreenSafeArea>
    );
  return (
    <StopDetailsContent
      key={`${trip.id}:${day ?? "pool"}:${stop.id}`}
      trip={trip}
      stop={stop}
      date={day ?? null}
    />
  );
}

function StopDetailsContent({
  trip,
  stop,
  date,
}: {
  trip: Trip;
  stop: TripStop;
  date: string | null;
}) {
  const theme = useAppTheme();
  const insets = useScreenInsets();
  const { copy } = useTripDetailsCopy();
  const { copy: ongoingCopy } = useOngoingCopy();
  const today = todayCalendarDate();
  const updatePlace = useUpdateTripPlaceMutation(trip.id);
  const removePlace = useDeleteTripPlaceMutation(trip.id);
  const saveItinerary = useSaveItineraryMutation(trip.id);
  const visited = stop.visited ?? false;
  const [expandRequest, setExpandRequest] = useState(0);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removeError, setRemoveError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTrip, setEditTrip] = useState(trip);
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const editable = getTripDetailsMode(trip, today) !== "cancelled";
  const canVisit = editable;
  const place = stop;
  const mapPlaces = place.location ? [place] : [];
  const region = getPlaceMapRegion(mapPlaces);
  function finishMutation() { inFlight.current = false; setSaving(false); }
  function failedMutation(error: unknown) {
    setRemoveError(true);
    setMutationError(error instanceof ApiError && error.status === 409 ? copy.daySettingsConflict : copy.itinerarySaveError);
  }
  function commit(mutation: TripMutation, source = trip) {
    if (!editable || inFlight.current || (mutation.kind !== "remove" && mutation.kind !== "stop")) return false;
    inFlight.current = true;
    setSaving(true);
    setMutationError(null);
    setRemoveError(false);
    if (mutation.kind === "remove") {
      const remove = async () => {
        if (date !== null) {
          const candidate = applyTripMutation(source, mutation);
          if (!candidate) throw new Error("INVALID_TRIP_MUTATION");
          await updatePlace.mutateAsync({
            placeId: stop.id,
            request: {
              estimatedDuration: stop.durationMinutes ?? 45,
              notes: stop.note?.trim() ?? "",
            },
          });
          await saveItinerary.mutateAsync(toSaveItineraryRequest(candidate));
        } else {
          await removePlace.mutateAsync(mutation.stopId);
        }
      };
      void remove().then(() => {
        setEditing(false);
        setRemoveError(false);
        goBack();
      }).catch(failedMutation).finally(finishMutation);
      return true;
    }
    if (mutation.kind !== "stop") return false;
    const save = async () => {
      if (date !== null || mutation.targetDate !== null) {
        const candidate = applyTripMutation(source, mutation);
        if (!candidate) throw new Error("INVALID_TRIP_MUTATION");
        if (date !== null && mutation.targetDate === null) {
          await updatePlace.mutateAsync({
            placeId: stop.id,
            request: {
              estimatedDuration: mutation.values.durationMinutes ?? 45,
              notes: mutation.values.note?.trim() ?? "",
            },
          });
        }
        await saveItinerary.mutateAsync(toSaveItineraryRequest(candidate));
      } else {
        await updatePlace.mutateAsync({
          placeId: stop.id,
          request: {
            estimatedDuration: mutation.values.durationMinutes,
            notes: mutation.values.note,
          },
        });
      }
    };
    void save().then(() => {
      setEditing(false);
      setRemoveError(false);
    }).catch(failedMutation).finally(finishMutation);
    return true;
  }
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
            places={mapPlaces}
            region={region}
            showSavedName
            expandMapRequest={expandRequest}
            onBack={goBack}
            backLabel={copy.back}
            topInset={insets.top}
            mapAction={<SharePlaceButton place={place} />}
            classification={<PlaceClassification place={place} />}
            afterInfo={<PlaceAmenities place={place} />}
            status={
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: theme.spacing.sm,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    gap: theme.spacing.xs,
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: theme.spacing.xs,
                    borderRadius: theme.radius.sm,
                    backgroundColor: visited
                      ? theme.colors.successSurface
                      : theme.colors.surfaceTint,
                  }}
                >
                  <AppIcon
                    name={visited ? "tick" : "clock"}
                    size={theme.layout.iconSmall}
                    color={
                      visited ? theme.colors.success : theme.colors.primaryText
                    }
                  />
                  <AppText
                    variant="caption"
                    style={{
                      color: visited
                        ? theme.colors.success
                        : theme.colors.primaryText,
                    }}
                  >
                    {visited ? copy.visited : copy.stopNotVisited}
                  </AppText>
                </View>
              </View>
            }
          >
            <TripVisitCard
              trip={trip}
              stop={stop}
              date={date}
              onEdit={editable && !saving ? () => { setEditTrip(trip); setMutationError(null); setEditing(true); } : undefined}
              onRemove={editable && !saving ? () => setConfirmRemove(true) : undefined}
              onPin={editable && !saving && date && clockPattern.test(stop.time) ? (pinned) => {
                commit({ kind: "stop", date, stopId: stop.id, targetDate: date,
                  values: { time: stop.time, durationMinutes: stop.durationMinutes, note: stop.note, pinned } });
              } : undefined}
            />
            {!date || !clockPattern.test(stop.time) ? <AppText variant="caption" tone="muted">{copy.pinTimeRequired}</AppText> : null}
            <PlaceIntroduction place={place} />
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
            {!region ? (
              <AppText variant="caption" tone="muted">
                {copy.stopMapUnavailable}
              </AppText>
            ) : null}
            <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
              <AppButton
                variant="raised"
                size="small"
                disabled={!region}
                accessibilityHint={copy.expandMap}
                style={[
                  styles.action,
                  { flexGrow: 60, paddingHorizontal: theme.spacing.sm },
                ]}
                leadingIcon={
                  <AppIcon
                    name="navigation"
                    size={theme.layout.iconSmall}
                    color={theme.colors.onRaisedAction}
                  />
                }
                onPress={() => setExpandRequest((value) => value + 1)}
              >
                {ongoingCopy.directions}
              </AppButton>
              <AppButton
                variant="outline"
                size="small"
                disabled={!canVisit || saving || updatePlace.isPending}
                accessibilityHint={
                  canVisit
                    ? visited
                      ? copy.stopVisitHint
                      : copy.markVisited
                    : copy.stopVisitUnavailable
                }
                accessibilityState={{ selected: visited }}
                style={[
                  styles.action,
                  {
                    flexGrow: 40,
                    paddingHorizontal: theme.spacing.sm,
                    backgroundColor: visited
                      ? theme.colors.successSurface
                      : theme.colors.glassInset,
                    borderColor: visited
                      ? theme.colors.success
                      : theme.colors.softActionBorder,
                  },
                ]}
                leadingIcon={
                  <AppIcon
                    name={visited ? "tick" : "check"}
                    size={theme.layout.iconSmall}
                    color={
                      visited ? theme.colors.success : theme.colors.primaryText
                    }
                  />
                }
                onPress={() => {
                  if (canVisit)
                    void updatePlace.mutateAsync({
                      placeId: stop.id,
                      request: { visited: !visited },
                    }).catch(() => setRemoveError(true));
                }}
              >
                {copy.visited}
              </AppButton>
            </View>
            {saving ? <AppText accessibilityLiveRegion="polite" variant="caption" tone="muted">{copy.savingChanges}</AppText> : null}
            {removeError ? (
              <AppText accessibilityRole="alert" tone="error">
                {mutationError ?? copy.stopUpdateError}
              </AppText>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </ScreenSafeArea>
      {editing ? (
        <TripDetailsSheet
          title={copy.editVisit}
          onClose={() => { if (!saving) setEditing(false); }}
          dismissible={!saving}
          topSpacing={theme.spacing.xxl}
          contentKey={stop.id}
          contentGap={theme.spacing.sm}
        >
          {mutationError ? <AppText accessibilityRole="alert" tone="error">{mutationError}</AppText> : null}
          <View pointerEvents={saving ? "none" : "auto"}>
          <StopDetailsForm
            trip={editTrip}
            stop={stop}
            date={date}
            onCommit={(mutation) => commit(mutation, editTrip)}
            saving={saving}
          />
          </View>
        </TripDetailsSheet>
      ) : null}
      {confirmRemove ? (
        <TripDeleteAlert
          title={copy.stopRemoveTitle}
          hint={date ? copy.stopRemoveDayHint : copy.stopRemovePoolHint}
          onCancel={() => {
            if (saving) return;
            setConfirmRemove(false);
            setRemoveError(false);
          }}
          onConfirm={() => {
            if (inFlight.current) return;
            if (!commit({ kind: "remove", date, stopId: stop.id })) {
              setConfirmRemove(false);
              setRemoveError(true);
            }
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
