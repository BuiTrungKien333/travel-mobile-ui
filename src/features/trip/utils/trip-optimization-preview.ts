import type { TripDay, TripStop } from "@/features/home/types/home-types";
import { getDayTravel } from "../data/trip-details-preview";

/** Compare only complete fixture routes; never turn missing legs into claimed savings. */
export function getOptimizationComparison(
  day: TripDay,
  ids: readonly string[],
) {
  if (ids.length !== day.stops.length || new Set(ids).size !== ids.length)
    return null;
  const byId = new Map(day.stops.map((stop) => [stop.id, stop]));
  const stops: TripStop[] = [];
  for (const id of ids) {
    const stop = byId.get(id);
    if (!stop) return null;
    stops.push(stop);
  }
  const before = getDayTravel(day);
  const after = getDayTravel({ ...day, stops });
  if (!before.complete || !after.complete) return null;

  return {
    before,
    after,
    savedKm: Math.round((before.km - after.km) * 10) / 10,
    savedMinutes: before.minutes - after.minutes,
  };
}
