import type { ImageSource } from "expo-image";
import type { Trip } from "@/features/home/types/home-types";

// Static requires let Metro bundle local photos on both native and web.
const sampleCovers = [
  require("@/assets/images/examples/IMG20260110152554.webp"),
  require("@/assets/images/examples/IMG20260110163722.webp"),
  require("@/assets/images/examples/IMG20260222171145.webp"),
  require("@/assets/images/examples/IMG20260222171156.webp"),
  require("@/assets/images/examples/IMG20260222172702.webp"),
  require("@/assets/images/examples/IMG20260222172729.webp"),
  require("@/assets/images/examples/IMG20260222173257.webp"),
  require("@/assets/images/examples/IMG20260409062951.webp"),
  require("@/assets/images/examples/IMG20260409064219.webp"),
  require("@/assets/images/examples/IMG20260409141212.webp"),
  require("@/assets/images/examples/IMG20260409143445.webp"),
  require("@/assets/images/examples/IMG20260409143459.webp"),
  require("@/assets/images/examples/IMG20260409143711.webp"),
  require("@/assets/images/examples/IMG20260509091222.webp"),
] as const;

export function getTripCoverImage(trip: Trip): ImageSource | string | number {
  if (trip.coverImage) return trip.coverImage;
  return getSampleImage(trip.id);
}

// Keep the selection stable while scrolling, editing, and reloading.
export function getSampleImage(id: string): ImageSource | number {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index++) {
    hash = Math.imul(hash ^ id.charCodeAt(index), 16777619);
  }
  return sampleCovers[(hash >>> 0) % sampleCovers.length];
}
