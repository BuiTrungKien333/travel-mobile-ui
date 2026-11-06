import type { Memory, Trip } from "@/features/home/types/home-types";
import type { ServerMemory } from "../api/memory-api";

export function mergeMemories(remote: readonly ServerMemory[], local: readonly Memory[], trips: readonly Trip[], userId?: string, serverAvailable = false): Memory[] {
  const photos: Memory[] = remote.filter((memory) => !!userId && memory.userId === userId).flatMap((memory) => {
    const trip = trips.find((item) => item.id === memory.tripId);
    const place = trip?.days.flatMap((day) => day.stops).find((stop) => stop.id === memory.placeId)?.name;
    const experienced = new Date(memory.experiencedAt);
    const date = `${experienced.getFullYear()}-${String(experienced.getMonth() + 1).padStart(2, "0")}-${String(experienced.getDate()).padStart(2, "0")}`;
    return [...memory.media].sort((a, b) => a.displayOrder - b.displayOrder).map((media) => {
      const backup = local.find((item) => !!item.local && item.local.userId === userId && item.local.serverId === memory.id
        && (item.local.mediaId === media.id || (!item.local.mediaId && memory.media.length === 1)));
      return {
        id: media.id, photo: backup?.photo ?? media.url, text: memory.note ?? "", tripId: memory.tripId ?? undefined,
        destination: trip?.destination ?? "", date,
        time: `${String(experienced.getHours()).padStart(2, "0")}:${String(experienced.getMinutes()).padStart(2, "0")}`,
        place, remote: { memoryId: memory.id, mediaId: media.id, version: memory.version },
        pendingDeletion: local.some((backup) => !!userId && backup.local?.userId === userId && backup.local.serverId === memory.id
          && backup.local.deletePending && (!backup.local.mediaId || backup.local.mediaId === media.id)),
      };
    });
  });
  const drafts = local.filter((memory) => memory.local && !!userId && memory.local.userId === userId &&
    !remote.some((item) => item.id === memory.local?.serverId && item.media.length > 0) &&
    (!serverAvailable || !memory.local.uploaded || !memory.local.serverId || memory.local.deletePending));
  return [...drafts.map((memory) => ({ ...memory, pendingDeletion: memory.local?.deletePending })), ...photos];
}
