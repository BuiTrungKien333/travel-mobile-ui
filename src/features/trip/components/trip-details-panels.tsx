import { useState } from "react";
import { Pressable, View } from "react-native";
import { AppButton } from "@/components/ui/app-button";
import { AppIcon } from "@/components/ui/app-icon";
import { AppText } from "@/components/ui/app-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { Trip, TripDay } from "@/features/home/types/home-types";
import { OngoingWeatherDetails } from "@/features/home/components/ongoing-weather-details";
import { ongoingWeatherSnapshot } from "@/features/home/data/ongoing-preview";
import { getTripForecast } from "../data/trip-details-preview";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import type {
  TripDetailsSheetState,
  TripMutation,
} from "../types/trip-details-types";
import { getTripTitle, formatTripDates } from "../utils/trip-formatters";
import { DateRangeSheet } from "./date-range-sheet";
import { PlacePickerSheet } from "./place-picker-sheet";
import { TripDetailsSheet } from "./trip-details-sheet";
import { StopDetailsForm } from "./trip-details-forms";
import { TripEditForm } from "./trip-edit-form";
import { TripStartPointForm } from "./trip-start-point-form";
import { TripForecastDetails } from "./trip-forecast-details";
import { TripReorder } from "./trip-reorder";
import { TripOptimizationSheet } from "./trip-optimization-preview";
import { TripDirectionsButton } from "./trip-directions-button";
import { TripDeleteAlert } from "./trip-delete-alert";
import { tripTransportModes } from "../constants/trip-form";
import {
  mergeScheduledOrder,
  scheduledStops,
} from "../utils/trip-details-layout";

type Props = {
  trip: Trip;
  day?: TripDay;
  today: string;
  canEdit: boolean;
  sheet: TripDetailsSheetState | null;
  onSheetChange: (sheet: TripDetailsSheetState | null) => void;
  onCommit: (mutation: TripMutation) => boolean;
  onEditHistory: () => void;
  onJournal: () => void;
  onDelete: () => void;
};

export function TripDetailsPanels({
  trip,
  day,
  today,
  canEdit,
  sheet,
  onSheetChange: setSheet,
  onCommit: commit,
  onEditHistory,
  onJournal: openJournal,
  onDelete,
}: Props) {
  const [hostReady, setHostReady] = useState(false);
  const theme = useAppTheme();
  const { copy, locale } = useTripDetailsCopy();
  const closeSheet = () => setSheet(null);
  const pool = trip.unscheduledStops ?? [];
  const forecast = getTripForecast(trip, day?.date);
  const currentWeather =
    ongoingWeatherSnapshot.tripId === trip.id &&
    ongoingWeatherSnapshot.date === day?.date &&
    day?.date === today;
  const scheduledDay = day ? { ...day, stops: scheduledStops(day) } : undefined;
  const stopInSheet =
    sheet?.kind === "stop"
      ? (sheet.date === null
          ? pool
          : (trip.days.find((item) => item.date === sheet.date)?.stops ?? [])
        ).find((stop) => stop.id === sheet.stopId)
      : undefined;
  const sheetTitle = sheet
    ? {
        menu: copy.menu,
        info: copy.edit,
        day: copy.daySettings,
        transport: copy.transport,
        add: copy.add,
        weather: copy.weather,
        reorder: copy.reorder,
        optimize: copy.optimizeTitle,
        stop: copy.stopDetails,
        dates: copy.dates,
        "place-picker": copy.add,
      }[sheet.kind]
    : "";
  return (
    <>
      {sheet && sheet.kind !== "optimize" ? (
        <TripDetailsSheet
          contentKey={`${sheet.kind}:${sheet.kind === "stop" ? sheet.stopId : ""}`}
          variant={sheet.kind === "weather" ? "weather" : "default"}
          topSpacing={sheet.kind === "info" ? theme.spacing.xxl : undefined}
          onShow={() => setHostReady(true)}
          title={sheetTitle}
          onClose={closeSheet}
        >
          {sheet.kind === "menu" ? (
            <>
              <AppButton
                variant="outline"
                leadingIcon={
                  <AppIcon
                    name="edit"
                    size={theme.layout.iconSmall}
                    color={theme.colors.primaryText}
                  />
                }
                onPress={() => {
                  if (!canEdit) onEditHistory();
                  setSheet({ kind: "info" });
                }}
              >
                {copy.edit}
              </AppButton>
              <AppButton
                variant="outline"
                leadingIcon={
                  <AppIcon
                    name="memories"
                    size={theme.layout.iconSmall}
                    color={theme.colors.primaryText}
                  />
                }
                onPress={() => {
                  closeSheet();
                  openJournal();
                }}
              >
                {copy.journal}
              </AppButton>
              <DeleteTripButton onDelete={onDelete} />
            </>
          ) : null}
          {sheet.kind === "info" ? (
            canEdit ? (
              <TripEditForm trip={trip} today={today} onCommit={commit} />
            ) : (
              <>
                <AppText variant="heading">
                  {getTripTitle(trip, locale)}
                </AppText>
                <AppText>
                  {trip.destination} · {formatTripDates(trip, locale)}
                </AppText>
                {trip.accommodation ? (
                  <AppText>
                    {copy.accommodation}: {trip.accommodation}
                  </AppText>
                ) : null}
                {trip.budget ? (
                  <AppText>
                    {copy.budget}:{" "}
                    {new Intl.NumberFormat(locale).format(trip.budget.amount)}
                  </AppText>
                ) : null}
                {trip.notes ? <AppText>{trip.notes}</AppText> : null}
                <AppButton
                  variant="soft"
                  onPress={() => {
                    onEditHistory();
                  }}
                >
                  {copy.editHistory}
                </AppButton>
              </>
            )
          ) : null}
          {sheet.kind === "day" && day ? (
            canEdit ? (
              <TripStartPointForm trip={trip} day={day} onCommit={commit} />
            ) : (
              <>
                <AppText>
                  {day.startLocation || trip.accommodation || copy.chooseStart}
                </AppText>
                <AppText>
                  {day.startTime || copy.noTime} ·{" "}
                  {copy[day.transport ?? "car"]}
                </AppText>
              </>
            )
          ) : null}
          {sheet.kind === "transport" && day && canEdit ? (
            <>
              {tripTransportModes.map((transport) => (
                <AppButton
                  key={transport}
                  variant={
                    transport === (day.transport ?? "car") ? "soft" : "outline"
                  }
                  accessibilityState={{
                    selected: transport === (day.transport ?? "car"),
                  }}
                  leadingIcon={<AppIcon name={transport} />}
                  onPress={() =>
                    commit({
                      kind: "day",
                      date: day.date,
                      values: { transport },
                    })
                  }
                >
                  {copy[transport]}
                </AppButton>
              ))}
            </>
          ) : null}
          {sheet.kind === "add" ? (
            <>
              <AppText variant="caption" tone="muted">
                {copy.addHint}
              </AppText>
              {day ? (
                <AppButton
                  variant="gradient"
                  onPress={() =>
                    setSheet({ kind: "place-picker", date: day.date })
                  }
                >
                  {copy.addToDay}
                </AppButton>
              ) : null}
              <AppButton
                variant="outline"
                onPress={() => setSheet({ kind: "place-picker", date: null })}
              >
                {copy.saveForLater}
              </AppButton>
            </>
          ) : null}
          {sheet.kind === "stop" && stopInSheet ? (
            <>
              <TripDirectionsButton
                stop={stopInSheet}
                destination={trip.destination}
              />
              {canEdit ? (
                <StopDetailsForm
                  trip={trip}
                  stop={stopInSheet}
                  date={sheet.date}
                  onCommit={commit}
                  onRemove={() =>
                    commit({
                      kind: "remove",
                      date: sheet.date,
                      stopId: stopInSheet.id,
                    })
                  }
                />
              ) : (
                <>
                  <AppText variant="heading">
                    {stopInSheet.name[locale]}
                  </AppText>
                  <AppText>{stopInSheet.time || copy.noTime}</AppText>
                  {stopInSheet.note ? (
                    <AppText>{stopInSheet.note}</AppText>
                  ) : null}
                </>
              )}
            </>
          ) : null}
          {sheet.kind === "reorder" && day && scheduledDay ? (
            <TripReorder
              stops={scheduledDay.stops}
              onApply={(ids) =>
                commit({
                  kind: "reorder",
                  date: day.date,
                  ids: mergeScheduledOrder(day, ids),
                })
              }
            />
          ) : null}
          {sheet.kind === "weather" ? (
            currentWeather ? (
              <OngoingWeatherDetails
                tripId={trip.id}
                today={today}
                destination={trip.destination}
              />
            ) : (
              <TripForecastDetails
                forecast={forecast}
                destination={trip.destination}
              />
            )
          ) : null}
          {sheet.kind === "dates" ? (
            <AppText variant="caption" tone="muted">
              {copy.datesHint}
            </AppText>
          ) : null}
          {sheet.kind === "place-picker" ? (
            <AppText variant="caption" tone="muted">
              {copy.addHint}
            </AppText>
          ) : null}
        </TripDetailsSheet>
      ) : null}
      {sheet?.kind === "optimize" ? (
        <TripOptimizationSheet
          key={`${trip.id}:${day?.date ?? "none"}`}
          day={scheduledDay}
          onClose={closeSheet}
          onApply={(ids) => {
            if (day)
              commit({
                kind: "reorder",
                date: day.date,
                ids: mergeScheduledOrder(day, ids),
              });
          }}
        />
      ) : null}
      {hostReady && sheet?.kind === "dates" ? (
        <DateRangeSheet
          visible
          startDate={trip.startDate ?? ""}
          endDate={trip.endDate ?? ""}
          today={
            trip.startDate && trip.startDate < today ? trip.startDate : today
          }
          onApply={(startDate, endDate) =>
            commit({ kind: "dates", startDate, endDate })
          }
          onClose={closeSheet}
        />
      ) : hostReady && sheet?.kind === "place-picker" ? (
        <PlacePickerSheet
          visible
          destination={trip.destination}
          initialSelected={[]}
          excludedIds={(sheet.date === null
            ? pool
            : (trip.days.find((item) => item.date === sheet.date)?.stops ?? [])
          ).map((stop) => stop.id)}
          onApply={(stops) => {
            commit({ kind: "add", date: sheet.date, stops });
          }}
          onClose={closeSheet}
        />
      ) : null}
    </>
  );
}

function DeleteTripButton({ onDelete }: { onDelete: () => void }) {
  const theme = useAppTheme();
  const { copy } = useTripDetailsCopy();
  const [confirmVisible, setConfirmVisible] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.delete}
        onPress={() => setConfirmVisible(true)}
        style={({ pressed }) => ({
          minHeight: theme.layout.touchTarget,
          borderWidth: 1,
          borderColor: theme.colors.error,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.md,
          opacity: pressed ? theme.motion.pressOpacity : 1,
        })}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: theme.spacing.sm,
          }}
        >
          <AppIcon
            name="trash"
            size={theme.layout.iconSmall}
            color={theme.colors.error}
          />
          <AppText variant="label" tone="error">
            {copy.delete}
          </AppText>
        </View>
      </Pressable>
      {confirmVisible ? (
        <TripDeleteAlert
          onCancel={() => setConfirmVisible(false)}
          onConfirm={() => {
            setConfirmVisible(false);
            onDelete();
          }}
        />
      ) : null}
    </>
  );
}
