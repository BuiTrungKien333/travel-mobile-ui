import type { Memory, Trip, TripStop } from "@/features/home/types/home-types";
import type { ServerMemory } from "../api/memory-api";
import { todayCalendarDate, travelClockTime } from "@/utils/calendar-date";

export function mergeMemories(
  remote: readonly ServerMemory[],
  local: readonly Memory[],
  trips: readonly Trip[],
  userId?: string,
): Memory[] {
  const tripsById = new Map<string, Trip>();
  for (const trip of trips) {
    if (!tripsById.has(trip.id)) tripsById.set(trip.id, trip);
  }
  const placeNamesByTrip = new Map<string, Map<string, TripStop["name"]>>();
  const photos: Memory[] = remote.flatMap((memory) => {
    const trip =
      memory.tripId === null ? undefined : tripsById.get(memory.tripId);
    let names = trip && placeNamesByTrip.get(trip.id);
    if (trip && !names) {
      names = new Map();
      for (const day of trip.days) {
        for (const stop of day.stops) {
          const id = stop.placeId ?? stop.id;
          // Match the first occurrence, as the previous Array.find did.
          if (!names.has(id)) names.set(id, stop.name);
        }
      }
      placeNamesByTrip.set(trip.id, names);
    }
    const place =
      memory.placeId === null ? undefined : names?.get(memory.placeId);
    const experienced = new Date(memory.experiencedAt);
    const date = todayCalendarDate(experienced);
    const time = travelClockTime(experienced);

    return [...memory.media]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((media) => ({
        id: media.id,
        photo: media.url,
        text: memory.note ?? "",
        tripId: memory.tripId ?? undefined,
        destination: trip?.destination ?? "",
        date,
        time,
        place,
        remote: {
          memoryId: memory.id,
          mediaId: media.id,
          version: memory.version,
        },
      }));
  });

  const remoteWithPhotos = new Set(
    remote
      .filter((memory) => memory.media.length > 0)
      .map((memory) => memory.id),
  );

  const drafts = local.filter(
    (memory) =>
      memory.local &&
      memory.local.userId === userId &&
      // Uploaded backups must not resurrect a photo removed on the server.
      !memory.local.uploaded &&
      (memory.local.serverId === undefined ||
        !remoteWithPhotos.has(memory.local.serverId)),
  );

  return [...drafts, ...photos];
}
