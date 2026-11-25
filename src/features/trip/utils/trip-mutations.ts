import type { Trip, TripStop } from "@/features/home/types/home-types";
import { dayDistance } from "@/features/home/utils/select-home";
import { isCalendarDate } from "@/utils/calendar-date";
import { tripFormLimits } from "../constants/trip-form";
import type { TripMutation } from "../types/trip-details-types";

function uniquePlaces(stops: TripStop[]) {
  const places = new Map<string, TripStop>();
  for (const stop of stops) {
    const previous = places.get(stop.id);
    if (!previous) places.set(stop.id, stop);
    else {
      const notes = [
        ...new Set([previous.note, stop.note].filter(Boolean)),
      ].join("\n");
      places.set(stop.id, { ...previous, note: notes || undefined });
    }
  }

  return [...places.values()];
}

/** One immutable write path shared by the details UI and the session preview store. */
export function applyTripMutation(
  trip: Trip,
  mutation: TripMutation,
): Trip | null {
  if (mutation.kind === "info") {
    const updated = mutation.dateRange
      ? applyTripMutation(trip, { kind: "dates", ...mutation.dateRange })
      : trip;
    return updated ? { ...updated, ...mutation.values } : null;
  }
  if (mutation.kind === "restore") return { ...trip, ...mutation.snapshot };
  if (mutation.kind === "dates") {
    const { startDate, endDate } = mutation;
    const count = dayDistance(startDate, endDate) + 1;
    if (
      !isCalendarDate(startDate) ||
      !isCalendarDate(endDate) ||
      count < 1 ||
      count > tripFormLimits.days
    )
      return null;

    const days = Array.from({ length: count }, (_, index) => {
      const date = new Date(`${startDate}T12:00:00Z`);
      date.setUTCDate(date.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);

      return (
        trip.days.find((day) => day.date === key) ?? { date: key, stops: [] }
      );
    });
    const retained = new Set(days.map((day) => day.date));
    const displaced = trip.days
      .filter((day) => !retained.has(day.date))
      .flatMap((day) => day.stops);

    return {
      ...trip,
      startDate,
      endDate,
      days,
      unscheduledStops: uniquePlaces([
        ...(trip.unscheduledStops ?? []),
        ...displaced,
      ]),
    };
  }
  const day = trip.days.find((item) => item.date === mutation.date);
  const pool = trip.unscheduledStops ?? [];
  if (mutation.date !== null && !day) return null;
  if (mutation.kind === "day") {
    const durations = mutation.durations ?? [];
    if (
      !day ||
      new Set(durations.map((entry) => entry.stopId)).size !==
        durations.length ||
      durations.some(
        (entry) =>
          !day.stops.some((stop) => stop.id === entry.stopId) ||
          !Number.isInteger(entry.durationMinutes) ||
          entry.durationMinutes < 5 ||
          entry.durationMinutes > 480,
      )
    )
      return null;

    const byId = new Map(
      durations.map((entry) => [entry.stopId, entry.durationMinutes]),
    );

    return {
      ...trip,
      days: trip.days.map((item) =>
        item === day
          ? {
              ...item,
              ...mutation.values,
              stops: durations.length
                ? item.stops.map((stop) =>
                    byId.has(stop.id)
                      ? { ...stop, durationMinutes: byId.get(stop.id) }
                      : stop,
                  )
                : item.stops,
            }
          : item,
      ),
    };
  }

  if (mutation.kind === "add") {
    const existing = mutation.date === null ? pool : (day?.stops ?? []);
    const additions = uniquePlaces(mutation.stops)
      .filter((stop) => !existing.some((item) => item.id === stop.id))
      .map((stop) => ({
        ...stop,
        time: "",
        durationMinutes: stop.durationMinutes ?? 45,
        pinned: false,
      }));

    return mutation.date === null
      ? { ...trip, unscheduledStops: [...pool, ...additions] }
      : {
          ...trip,
          days: trip.days.map((item) =>
            item === day
              ? { ...item, stops: [...item.stops, ...additions] }
              : item,
          ),
          unscheduledStops: pool.filter(
            (stop) => !additions.some((item) => item.id === stop.id),
          ),
        };
  }

  if (mutation.kind === "reorder") {
    if (
      !day ||
      mutation.ids.length !== day.stops.length ||
      new Set(mutation.ids).size !== day.stops.length
    )
      return null;

    const reordered = mutation.ids.map((id) =>
      day.stops.find((stop) => stop.id === id),
    );

    if (
      reordered.some((stop) => !stop) ||
      day.stops.some(
        (stop, index) => stop.pinned && mutation.ids[index] !== stop.id,
      )
    )
      return null;
    const stops: TripStop[] = [];
    for (let index = 0; index < reordered.length; index++) {
      const stop = reordered[index];
      if (!stop) return null;
      stops.push({ ...stop, time: day.stops[index].time });
    }

    return {
      ...trip,
      days: trip.days.map((item) => (item === day ? { ...item, stops } : item)),
    };
  }
  const source = mutation.date === null ? pool : (day?.stops ?? []);
  const stop = source.find((item) => item.id === mutation.stopId);
  if (!stop) return null;
  if (mutation.kind === "stop") {
    if (
      mutation.targetDate !== null &&
      !trip.days.some((item) => item.date === mutation.targetDate)
    )
      return null;

    if (mutation.targetDate !== mutation.date) {
      const target =
        mutation.targetDate === null
          ? pool
          : (trip.days.find((item) => item.date === mutation.targetDate)
              ?.stops ?? []);
      if (target.some((item) => item.id === stop.id)) return null;
    }
    const updated = { ...stop, ...mutation.values };
    const transform = (items: TripStop[], date: string | null) => {
      const rest = items.filter(
        (item) => item.id !== stop.id || date !== mutation.date,
      );
      return date === mutation.targetDate ? [...rest, updated] : rest;
    };

    // Editing in place preserves order; moving to another day appends deliberately.
    if (mutation.date === mutation.targetDate)
      return mutation.date === null
        ? {
            ...trip,
            unscheduledStops: pool.map((item) =>
              item.id === stop.id ? updated : item,
            ),
          }
        : {
            ...trip,
            days: trip.days.map((item) =>
              item === day
                ? {
                    ...item,
                    stops: item.stops.map((entry) =>
                      entry.id === stop.id ? updated : entry,
                    ),
                  }
                : item,
            ),
          };

    return {
      ...trip,
      days: trip.days.map((item) => ({
        ...item,
        stops: transform(item.stops, item.date),
      })),
      unscheduledStops: transform(pool, null),
    };
  }

  return mutation.date === null
    ? { ...trip, unscheduledStops: pool.filter((item) => item.id !== stop.id) }
    : {
        ...trip,
        days: trip.days.map((item) =>
          item === day
            ? {
                ...item,
                stops: item.stops.filter((entry) => entry.id !== stop.id),
              }
            : item,
        ),
        unscheduledStops: uniquePlaces([...pool, stop]),
      };
}
