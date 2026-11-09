import { AppText } from "@/components/ui/app-text";
import { AppButton } from "@/components/ui/app-button";
import type { Trip } from "@/features/home/types/home-types";
import { useTripDetailsCopy } from "../i18n/trip-details-copy";
import { useItineraryCopy } from "../i18n/itinerary-copy";
import { toDayStops } from "../api/trip-adapters";
import type { ItineraryResponse, UpdateDayScheduleRequest } from "../api/itinerary-types";
import type { useOptimizeDayRoute } from "../api/trip-day-route";
import type { ScheduleEditor, DayStops } from "../types/schedule-editor";
import type { TripDetailsMode } from "../utils/trip-details-layout";
import { BacklogScheduleSheet } from "./backlog-schedule-sheet";
import { ConnectedStopScheduleSheet } from "./connected-stop-schedule-sheet";
import { ConnectedDayScheduleSheet } from "./connected-day-schedule-sheet";
import { TripDetailsSheet } from "./trip-details-sheet";
import { TripReorder } from "./trip-reorder";
import { TripOptimizationSheet } from "./trip-optimization-preview";

type Props = {
  editor: ScheduleEditor | null;
  trip: Trip;
  mode: TripDetailsMode;
  today?: string;
  editableDays: { date: string; dayNumber: number; }[];
  ready: boolean;
  canEditDay: (date: string) => boolean;
  save: { isPending: boolean; };
  daySchedule: { isPending: boolean; };
  optimize: Pick<ReturnType<typeof useOptimizeDayRoute>, "data" | "isPending">;
  scheduleError?: string;
  isConflict: boolean;
  refreshSchedule: () => Promise<void>;
  closeEditor: () => void;
  persistDay: (date: string, stops: DayStops, visited?: readonly string[]) => Promise<void>;
  persistSchedule: (date: string, base: ItineraryResponse, version: number, draft: Pick<UpdateDayScheduleRequest, "settings" | "durations">) => Promise<void>;
  persistOrder: (edit: Extract<ScheduleEditor, { kind: "reorder" | "optimize"; }>, ids: string[], visited?: readonly string[]) => void;
};

export function ConnectedTripSchedulePanels({ editor, trip, mode, today, editableDays, ready, canEditDay, save, daySchedule, optimize, scheduleError, isConflict, refreshSchedule, closeEditor, persistDay, persistSchedule, persistOrder }: Props) {
  const { copy: detailCopy } = useTripDetailsCopy();
  const { copy: itineraryCopy } = useItineraryCopy();
  return <>
    {editor?.kind === "assign" ? (
      <BacklogScheduleSheet
        count={editor.stops.length}
        days={editableDays.map((entry) => ({
          ...entry,
          stopCount: toDayStops(editor.base, entry.date).length,
        }))}
        pending={save.isPending}
        problem={scheduleError}
        onReload={isConflict ? () => void refreshSchedule() : undefined}
        onClose={closeEditor}
        onSave={async (targetDate) => {
          if (!canEditDay(targetDate)) return;
          const stops = toDayStops(editor.base, targetDate);
          const existing = new Set(stops.map((stop) => stop.placeId));
          for (const stop of editor.stops) {
            if (!stop.placeId || existing.has(stop.placeId)) continue;
            stops.push({
              placeId: stop.placeId,
              sequence: stops.length,
              arrivalTime: null,
              durationMinutes: stop.durationMinutes ?? 45,
              note: stop.note || null,
            });
            existing.add(stop.placeId);
          }
          await persistDay(targetDate, stops);
        }}
      />
    ) : null}
    {editor?.kind === "stop" ? (
      <ConnectedStopScheduleSheet
        stop={editor.stop}
        date={editor.date}
        days={editableDays}
        editable={
          ready &&
          (editor.date ? canEditDay(editor.date) : editableDays.length > 0)
        }
        pending={save.isPending}
        problem={scheduleError}
        onReload={isConflict ? () => void refreshSchedule() : undefined}
        onClose={closeEditor}
        onSave={async (draft) => {
          const placeId = editor.stop.placeId;
          if (!placeId) return;
          const stops = toDayStops(editor.base, draft.date);
          const index = stops.findIndex((stop) => stop.placeId === placeId);
          const previous = stops[index];
          const arrivalTime =
            previous?.arrivalTime &&
              previous.arrivalTime.slice(11, 16) === draft.time
              ? previous.arrivalTime
              : draft.time
                ? `${draft.date}T${draft.time}:00`
                : null;
          const stop = {
            placeId,
            sequence: index < 0 ? stops.length : index,
            arrivalTime,
            durationMinutes: Number(draft.duration),
            note: draft.note || null,
          };
          if (index < 0) stops.push(stop);
          else stops[index] = stop;
          await persistDay(draft.date, stops);
        }}
        onRemove={
          editor.date && ready && canEditDay(editor.date)
            ? () => {
              const targetDate = editor.date;
              if (targetDate)
                void persistDay(
                  targetDate,
                  toDayStops(editor.base, targetDate).filter(
                    (stop) => stop.placeId !== editor.stop.placeId,
                  ),
                );
            }
            : undefined
        }
      />
    ) : null}
    {editor?.kind === "day" ? (
      <ConnectedDayScheduleSheet
        trip={trip}
        day={editor.day}
        routeMode={editor.routeMode}
        pending={daySchedule.isPending}
        preserveVisited={mode === "live" && editor.day.date === today}
        problem={scheduleError}
        onReload={isConflict ? () => void refreshSchedule() : undefined}
        onClose={closeEditor}
        onSave={async (
          draft: Pick<UpdateDayScheduleRequest, "settings" | "durations">,
        ) => {
          await persistSchedule(
            editor.date,
            editor.base,
            editor.tripVersion,
            draft,
          );
        }}
      />
    ) : null}
    {editor?.kind === "reorder" ? (
      <TripDetailsSheet
        title={detailCopy.reorder}
        onClose={closeEditor}
        dismissDisabled={save.isPending}
      >
        {scheduleError ? (
          <AppText accessibilityRole="alert" tone="error">
            {scheduleError}
          </AppText>
        ) : null}
        {isConflict ? (
          <AppButton
            size="small"
            variant="outline"
            onPress={() => void refreshSchedule()}
          >
            {itineraryCopy.reload}
          </AppButton>
        ) : null}
        <TripReorder
          stops={editor.stops}
          pending={save.isPending || isConflict}
          onApply={(ids) => persistOrder(editor, ids)}
        />
      </TripDetailsSheet>
    ) : null}
    {editor?.kind === "optimize"
      ? (() => {
        const proposal = optimize.data;
        const ids =
          proposal?.order.flatMap(
            (placeId) =>
              editor.stops.find((stop) => stop.placeId === placeId)?.id ??
              [],
          ) ?? [];
        if (
          proposal &&
          ids.length === editor.stops.length &&
          proposal.originalOrder.length === editor.stops.length &&
          proposal.originalOrder.every(
            (id, index) => id === editor.stops[index].placeId,
          ) &&
          ((proposal.originalDistanceMeters != null &&
            proposal.originalDurationSeconds != null) ||
            editor.route)
        ) {
          const before = {
            km:
              (proposal.originalDistanceMeters ??
                editor.route?.distanceMeters ??
                0) / 1000,
            minutes: Math.ceil(
              (proposal.originalDurationSeconds ??
                editor.route?.durationSeconds ??
                0) / 60,
            ),
          };
          const after = {
            km: proposal.distanceMeters / 1000,
            minutes: Math.ceil(proposal.durationSeconds / 60),
          };
          return (
            <TripOptimizationSheet
              day={{
                date: editor.date,
                stops: editor.stops.map((stop) => ({
                  ...stop,
                  visited: proposal.visitedOrder.includes(
                    stop.placeId ?? "",
                  ),
                })),
              }}
              onClose={closeEditor}
              busy={save.isPending}
              problem={scheduleError}
              onReload={
                isConflict ? () => void refreshSchedule() : undefined
              }
              proposal={{
                order: ids,
                lockedPrefixIds: ids.slice(0, proposal.visitedOrder.length),
                comparison: {
                  before,
                  after,
                  savedKm: Math.round((before.km - after.km) * 10) / 10,
                  savedMinutes: before.minutes - after.minutes,
                },
              }}
              onApply={(order) =>
                persistOrder(editor, order, proposal.visitedOrder)
              }
            />
          );
        }
        return (
          <TripDetailsSheet
            title={detailCopy.optimizeTitle}
            onClose={closeEditor}
            dismissDisabled={optimize.isPending}
          >
            <AppText accessibilityLiveRegion="polite">
              {optimize.isPending
                ? itineraryCopy.optimizeLoading
                : itineraryCopy.optimizeUnavailable}
            </AppText>
          </TripDetailsSheet>
        );
      })()
      : null}

  </>;
}
