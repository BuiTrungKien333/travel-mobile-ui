import type { TripStop } from "@/features/home/types/home-types";

export type TimelineSlot = { id: string; pinned: boolean; height: number };

/** Pinned stops form boundaries. Geometry includes each row's travel leg. */
export function timelineDropTarget(
  slots: readonly TimelineSlot[],
  from: number,
  delta: number,
) {
  "worklet";
  if (!slots[from] || slots[from].pinned) return from;
  let low = from;
  let high = from;
  while (low > 0 && !slots[low - 1].pinned) low--;
  while (high < slots.length - 1 && !slots[high + 1].pinned) high++;
  let sourceTop = 0;
  for (let index = 0; index < from; index++) sourceTop += slots[index].height;
  const center = sourceTop + slots[from].height / 2 + delta;
  let top = 0;
  let target = low;
  let distance = Infinity;
  for (let index = 0; index <= high; index++) {
    if (index >= low) {
      const nextDistance = Math.abs(center - top - slots[index].height / 2);
      if (nextDistance < distance) {
        target = index;
        distance = nextDistance;
      }
    }
    top += slots[index].height;
  }
  return target;
}

export function moveTimelineStop(
  stops: readonly TripStop[],
  id: string,
  to: number,
): string[] | null {
  const from = stops.findIndex((stop) => stop.id === id);
  if (
    from < 0 ||
    to < 0 ||
    to >= stops.length ||
    from === to ||
    stops[from].pinned
  )
    return null;
  if (
    stops
      .slice(Math.min(from, to), Math.max(from, to) + 1)
      .some((stop) => stop.pinned)
  )
    return null;
  const ids = stops.map((stop) => stop.id);
  const [moved] = ids.splice(from, 1);
  ids.splice(to, 0, moved);
  return ids;
}
