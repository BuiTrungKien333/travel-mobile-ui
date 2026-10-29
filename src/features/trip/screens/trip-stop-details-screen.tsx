import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ScreenSafeArea } from "@/components/common/screen-safe-area";
import { GlassBackdrop } from "@/components/common/glass-backdrop";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";
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
import { getPlaceSearchPreview } from "../data/place-search-preview";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import type { TripMutation } from "../types/trip-details-types";
import { getTripDetailsMode } from "../utils/trip-details-layout";
import { getPlaceMapRegion } from "../utils/place-search";

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
  const trip = useTripPreview((state) =>
    state.trips.find((entry) => entry.id === tripId),
  );
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();
  const stop = (
    day
      ? trip?.days.find((entry) => entry.date === day)?.stops
      : trip?.unscheduledStops
  )?.find((entry) => entry.id === stopId);
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
  const today = useTripPreview((state) => state.today);
  const visited = useTripPreview(
    (state) =>
      !!date && (state.visited[`${trip.id}:${date}`] ?? []).includes(stop.id),
  );
  const setVisited = useTripPreview((state) => state.setVisited);
  const mutateTrip = useTripPreview((state) => state.mutateTrip);
  const [expandRequest, setExpandRequest] = useState(0);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removeError, setRemoveError] = useState(false);
  const [editing, setEditing] = useState(false);
  const editable = getTripDetailsMode(trip, today) !== "cancelled";
  const canVisit = editable && !!date && date <= today;
  const catalogue = getPlaceSearchPreview(trip.destination);
  // Enrich legacy preview stops without overwriting saved coordinates or addresses.
  const place = { ...catalogue.find((entry) => entry.id === stop.id), ...stop };
  const mapPlaces = place.location ? [place] : [];
  const region = getPlaceMapRegion(mapPlaces);
  function commit(mutation: TripMutation) {
    if (!editable) return false;
    const success = mutateTrip(trip.id, mutation);
    if (success) {
      setEditing(false);
      setRemoveError(false);
      if (mutation.kind === "remove") goBack();
      else if (mutation.kind === "stop" && mutation.targetDate !== date)
        router.setParams({ day: mutation.targetDate ?? undefined });
    }
    return success;
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
              onEdit={editable ? () => setEditing(true) : undefined}
              onRemove={editable ? () => setConfirmRemove(true) : undefined}
              onPin={
                editable
                  ? (pinned) => {
                      setRemoveError(
                        !mutateTrip(trip.id, {
                          kind: "stop",
                          date,
                          stopId: stop.id,
                          targetDate: date,
                          values: {
                            time: stop.time,
                            durationMinutes: stop.durationMinutes,
                            note: stop.note,
                            pinned,
                          },
                        }),
                      );
                    }
                  : undefined
              }
            />
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
                disabled={!canVisit}
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
                  if (canVisit && date)
                    setVisited(trip.id, date, stop.id, !visited);
                }}
              >
                {copy.visited}
              </AppButton>
            </View>
            {removeError ? (
              <AppText accessibilityRole="alert" tone="error">
                {copy.stopUpdateError}
              </AppText>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </ScreenSafeArea>
      {editing ? (
        <TripDetailsSheet
          title={copy.editVisit}
          onClose={() => setEditing(false)}
          topSpacing={theme.spacing.xxl}
          contentKey={stop.id}
          contentGap={theme.spacing.sm}
        >
          <StopDetailsForm
            trip={trip}
            stop={stop}
            date={date}
            onCommit={commit}
          />
        </TripDetailsSheet>
      ) : null}
      {confirmRemove ? (
        <TripDeleteAlert
          title={copy.stopRemoveTitle}
          hint={date ? copy.stopRemoveDayHint : copy.stopRemovePoolHint}
          onCancel={() => {
            setConfirmRemove(false);
            setRemoveError(false);
          }}
          onConfirm={() => {
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
