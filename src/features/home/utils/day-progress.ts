import type { TripStop } from "../types/home-types.ts";

/** Only explicit check-ins count as visited; scheduled times never complete stops. */
export function getDayProgress(
  stops: readonly TripStop[],
  visitedIds: readonly string[],
) {
  const visited = new Set(visitedIds);
  const ordered = [...stops].sort((a, b) => a.plannedOrder != null && b.plannedOrder != null
    ? a.plannedOrder - b.plannedOrder : a.time.localeCompare(b.time));
  const visitedStops = ordered.filter((stop) => visited.has(stop.id));
  const remainingStops = ordered.filter((stop) => !visited.has(stop.id));
  return { ordered, visitedStops, remainingStops, nextStop: remainingStops[0] };
}
