import type { ImageSource } from "expo-image";
import type { Trip } from "@/features/home/types/home-types";

// One optimized local sample set for covers, grids and the viewer on every platform.
const sampleCovers = [
  require("@/assets/images/examples/thumbnails/IMG20260110152554.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260110163722.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260222171145.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260222171156.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260222172702.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260222172729.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260222173257.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260409062951.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260409064219.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260409141212.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260409143445.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260409143459.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260409143711.webp"),
  require("@/assets/images/examples/thumbnails/IMG20260509091222.webp"),
] as const;

export function getTripCoverImage(trip: Trip): ImageSource | string | number {
  if (trip.coverImage) return trip.coverImage;
  return getSampleImage(trip.id);
}

// Keep the selection stable while scrolling, editing, and reloading.
export function getSampleImage(id: string): ImageSource | number {
  return sampleCovers[sampleIndex(id)];
}

export function getSampleThumbnail(id: string): ImageSource | number {
  return getSampleImage(id);
}

function sampleIndex(id: string) {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index++) {
    hash = Math.imul(hash ^ id.charCodeAt(index), 16777619);
  }

  return (hash >>> 0) % sampleCovers.length;
}
