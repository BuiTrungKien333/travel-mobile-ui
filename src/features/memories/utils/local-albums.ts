import type { Memory, Trip } from "@/features/home/types/home-types";

/** Read-only album shells from photo metadata, never treated as an editable server trip. */
export function localAlbumTrips(memories: readonly Memory[], known: readonly Trip[], owner?: string): Trip[] {
  if (!owner) return [];
  const trips = new Map<string, Trip>();
  for (const memory of memories) {
    if (memory.local?.userId !== owner || !memory.tripId || known.some((trip) => trip.id === memory.tripId)) continue;
    let trip = trips.get(memory.tripId);
    if (!trip) {
      trip = { id: memory.tripId, destination: memory.destination, title: memory.destination, status: "draft", days: [], localOnly: true };
      trips.set(trip.id, trip);
    }
    if (memory.date && !trip.days.some((day) => day.date === memory.date)) trip.days.push({ date: memory.date, stops: [] });
  }
  return [...trips.values()].map((trip) => ({ ...trip, days: [...trip.days].sort((a, b) => a.date.localeCompare(b.date)) }));
}
