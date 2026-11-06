import type { TripDay, TripStop } from "@/features/home/types/home-types";
import type { ItineraryOptimizationProposal } from "../api/itinerary-types";

export function reviewOptimization(proposal: ItineraryOptimizationProposal, days: TripDay[]) {
  const expected = new Map<string, { stop: TripStop; index: number }>(days.flatMap((day) => day.stops.map((stop, index) =>
    [`${day.date}:${stop.id}`, { stop, index }] as const)));
  const seen = new Set<string>();
  const seenDays = new Set<string>();
  let changed = 0;
  let valid = proposal.dailySchedules.length > 0 && expected.size > 0;
  for (const day of proposal.dailySchedules) {
    if (seenDays.has(day.dayDate)) valid = false;
    seenDays.add(day.dayDate);
    for (const [index, stop] of day.scheduleItems.entries()) {
      const key = `${day.dayDate}:${stop.placeId}`;
      const before = expected.get(key);
      if (!before || seen.has(key) || stop.arrivalTime.slice(0, 10) !== day.dayDate) valid = false;
      seen.add(key);
      if (!before) continue;
      const time = stop.arrivalTime.slice(11, 16);
      if (before.stop.pinned && (before.index !== index || before.stop.time !== time)) valid = false;
      if (before.index !== index || before.stop.time !== time || (before.stop.durationMinutes ?? 45) !== stop.durationMinutes) changed++;
    }
  }
  return { valid: valid && seen.size === expected.size, changed, previous: expected };
}
