import type { ImageSource } from "expo-image";
import type { Trip } from "../../home/types/home-types.ts";

export const tripSampleImages = {
  dalatUpcoming: require("@/assets/images/home/dalat-upcoming.jpg"),
  xuanHuongLake: require("@/assets/images/home/xuan-huong-lake.jpg"),
  lamVienSquare: require("@/assets/images/home/lam-vien-square.jpg"),
  lamDongMuseum: require("@/assets/images/home/lam-dong-museum.jpg"),
  dalatStation: require("@/assets/images/home/dalat-station.jpg"),
  datanlaWaterfall: require("@/assets/images/home/datanla-waterfall.jpg"),
  dalatFlowerGarden: require("@/assets/images/home/dalat-flower-garden.jpg"),
  forest: require("@/assets/images/home/forest.jpg"),
};

export function getTripCoverImage(trip: Trip): ImageSource | string | number {
  if (trip.coverImage) return trip.coverImage;
  const dest = (trip.destination ?? "").toLowerCase();
  if (dest.includes("đà lạt") || dest.includes("da lat")) {
    if (trip.status === "completed") return tripSampleImages.dalatFlowerGarden;
    if (trip.status === "draft") return tripSampleImages.lamDongMuseum;
    return tripSampleImages.dalatUpcoming;
  }
  if (dest.includes("đà nẵng") || dest.includes("da nang")) {
    return tripSampleImages.xuanHuongLake;
  }
  if (dest.includes("hội an") || dest.includes("hoi an")) {
    return tripSampleImages.dalatStation;
  }
  if (dest.includes("nha trang")) {
    return tripSampleImages.datanlaWaterfall;
  }
  return tripSampleImages.forest;
}
