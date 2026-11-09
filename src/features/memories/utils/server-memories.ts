import type { Memory, Trip } from "@/features/home/types/home-types";
import type { ServerMemory } from "../api/memory-api";
import { todayCalendarDate, travelClockTime } from "@/utils/calendar-date";

export function mergeMemories(
  remote: readonly ServerMemory[],
  local: readonly Memory[],
  trips: readonly Trip[],
  userId?: string,
): Memory[] {
  const photos: Memory[] = remote.flatMap((memory) => {
    const trip = trips.find((item) => item.id === memory.tripId);
    const place = trip?.days
      .flatMap((day) => day.stops)
      .find((stop) => (stop.placeId ?? stop.id) === memory.placeId)?.name;
    const experienced = new Date(memory.experiencedAt);
    const date = todayCalendarDate(experienced);
    return [...memory.media]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((media) => ({
        id: media.id,
        photo: media.url,
        text: memory.note ?? "",
        tripId: memory.tripId ?? undefined,
        destination: trip?.destination ?? "",
        date,
        time: travelClockTime(experienced),
        place,
        remote: {
          memoryId: memory.id,
          mediaId: media.id,
          version: memory.version,
        },
      }));
  });
  const drafts = local.filter(
    (memory) =>
      memory.local &&
      memory.local.userId === userId &&
      !remote.some(
        (item) => item.id === memory.local?.serverId && item.media.length > 0,
      ),
  );
  return [...drafts, ...photos];
}
