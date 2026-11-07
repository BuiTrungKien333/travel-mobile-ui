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
import { TripDetailsSheet } from "./trip-details-sheet";
import { TripEditForm } from "./trip-edit-form";
import { TripDayScheduleForm } from "./trip-day-schedule-form";
import { TripForecastDetails } from "./trip-forecast-details";
import { TripReorder } from "./trip-reorder";
import { TripOptimizationSheet } from "./trip-optimization-preview";
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
  const forecast = getTripForecast(trip, day?.date);
  const currentWeather =
    ongoingWeatherSnapshot.tripId === trip.id &&
    ongoingWeatherSnapshot.date === day?.date &&
    day?.date === today;
  const scheduledDay = day ? { ...day, stops: scheduledStops(day) } : undefined;
  const sheetTitle = sheet
    ? {
        menu: copy.menu,
        info: copy.edit,
        day: day
          ? `${copy.daySettings} ${trip.days.findIndex((entry) => entry.date === day.date) + 1} (${new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(`${day.date}T12:00:00Z`))})`
          : copy.daySettings,
        transport: copy.transport,
        weather: copy.weather,
        reorder: copy.reorder,
        optimize: copy.optimizeTitle,
        dates: copy.dates,
      }[sheet.kind]
    : "";
  return (
    <>
      {sheet && sheet.kind !== "optimize" ? (
        <TripDetailsSheet
          contentKey={sheet.kind}
          variant={sheet.kind === "weather" ? "weather" : "default"}
          topSpacing={sheet.kind === "info" ? theme.spacing.xxl : undefined}
          heightRatio={
            sheet.kind === "day"
              ? theme.layout.tripDayEditorSheetHeightRatio
              : undefined
          }
          contentGap={
            sheet.kind === "info" || sheet.kind === "day"
              ? theme.spacing.sm
              : undefined
          }
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
                <AppText accessibilityRole="header" variant="sectionTitle">
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
              <TripDayScheduleForm trip={trip} day={day} onCommit={commit} />
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
