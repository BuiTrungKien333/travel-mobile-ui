import type { ImageSource } from "expo-image";
import { homeImages } from "@/features/home/data/home-mocks";
import type { Trip } from "@/features/home/types/home-types";

export function getTripCoverImage(trip: Trip): ImageSource | string | number {
  if (trip.coverImage) return trip.coverImage;
  const destination = trip.destination.toLowerCase();
  if (destination.includes("đà lạt") || destination.includes("da lat")) {
    if (trip.status === "completed") return homeImages.dalatFlowerGarden;
    if (trip.status === "draft") return homeImages.lamDongMuseum;
    return homeImages.upcomingPhoto;
  }
  return homeImages.forest;
}
