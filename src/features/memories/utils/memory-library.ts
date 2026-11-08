import type { Memory, Trip } from "@/features/home/types/home-types";
import {
  getSampleImage,
  getSampleThumbnail,
} from "@/features/trip/utils/trip-images";
import { layout } from "@/theme/tokens";

export type MemoryAlbum = {
  trip: Trip;
  photos: Memory[];
  photoCount: number;
  sample: boolean;
};
const samplePrefix = "library-sample:";
export function isSampleMemory(memory: Memory) {
  return memory.id.startsWith(samplePrefix);
}

/** Samples are display-only and never enter persisted memory state or counts. */
export function sampleTripPhotos(trip: Trip): Memory[] {
  return Array.from({ length: layout.memorySamplePhotoCount }, (_, index) => ({
    id: `${samplePrefix}${trip.id}:${index}`,
    tripId: trip.id,
    destination: trip.destination,
    text: "",
    photo: getSampleImage(`${samplePrefix}${trip.id}:${index}`),
  }));
}

/** Group once instead of filtering the entire library for every trip. */
export function buildMemoryAlbums(
  trips: readonly Trip[],
  memories: readonly Memory[],
): MemoryAlbum[] {
  const grouped = new Map<string, Memory[]>();
  for (const memory of memories) {
    if (!memory.tripId || !memory.photo) continue;
    const bucket = grouped.get(memory.tripId) ?? [];
    bucket.push(memory);
    grouped.set(memory.tripId, bucket);
  }
  return [...trips]
    .sort(
      (a, b) =>
        (b.startDate ?? "").localeCompare(a.startDate ?? "") ||
        a.id.localeCompare(b.id),
    )
    .map((trip) => {
      const photos = (grouped.get(trip.id) ?? []).sort((a, b) =>
        `${b.date ?? ""} ${b.time ?? ""}`.localeCompare(
          `${a.date ?? ""} ${a.time ?? ""}`,
        ),
      );
      return {
        trip,
        photos: photos.length ? photos : sampleTripPhotos(trip),
        photoCount: photos.length,
        sample: !photos.length,
      };
    });
}

export function photoRows(photos: readonly Memory[]): Memory[][] {
  const rows: Memory[][] = [];
  for (let index = 0; index < photos.length; index += layout.memoryPhotoColumns)
    rows.push(photos.slice(index, index + layout.memoryPhotoColumns));
  return rows;
}

export function libraryThumbnail(memory: Memory, pixels: number) {
  return isSampleMemory(memory)
    ? getSampleThumbnail(memory.id)
    : memoryThumbnail(memory.photo, pixels);
}

/** Resize only unsigned Cloudinary uploads; retain the original for the viewer. */
export function memoryThumbnail(
  photo: Memory["photo"],
  pixels: number,
): Memory["photo"] {
  if (typeof photo !== "string" || !Number.isFinite(pixels) || pixels <= 0)
    return photo;
  const match = photo.match(
    /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/,
  );
  if (!match) return photo;
  const size = Math.ceil(pixels);
  return `${match[1]}f_auto,q_auto,c_limit,w_${size},h_${size}/${match[2]}`;
}
