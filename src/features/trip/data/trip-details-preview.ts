import { weatherPreviews } from "@/features/home/data/weather-preview";
import type { ImageSource } from "expo-image";
import type {
  Trip,
  TripDay,
  TripStop,
  TravelMode,
} from "@/features/home/types/home-types";
import { homeImages } from "@/features/home/data/home-mocks";
import { getSampleImage } from "../utils/trip-images";

const stopImages: Record<string, ImageSource | number> = {
  lake: homeImages.xuanHuongLake,
  square: homeImages.lamVienSquare,
  museum: homeImages.lamDongMuseum,
  station: homeImages.dalatStation,
  datanla: homeImages.datanlaWaterfall,
  "flower-garden": homeImages.dalatFlowerGarden,
};
export function getStopImage(id: string) {
  return stopImages[id] ?? getSampleImage(id);
}

// Explicit UI fixture pairs, never presented as live directions or measured travel times.
const legs: Record<string, { km: number } & Record<TravelMode, number>> = {
  "lake:square": { km: 1.5, car: 7, motorcycle: 6, walk: 20 },
  "square:lake": { km: 1.5, car: 7, motorcycle: 6, walk: 20 },
  "square:museum": { km: 3.2, car: 12, motorcycle: 10, walk: 43 },
  "lake:museum": { km: 3.8, car: 15, motorcycle: 12, walk: 50 },
  "square:flower-garden": { km: 3.1, car: 12, motorcycle: 10, walk: 42 },
  "flower-garden:museum": { km: 4.3, car: 16, motorcycle: 14, walk: 58 },
  "museum:station": { km: 1.2, car: 5, motorcycle: 4, walk: 16 },
  "station:datanla": { km: 8.5, car: 24, motorcycle: 20, walk: 115 },
};
export function getPreviewLeg(from: TripStop, to: TripStop, mode: TravelMode) {
  const leg = legs[`${from.id}:${to.id}`];
  return leg ? { km: leg.km, minutes: leg[mode] } : null;
}
export function getDayTravel(day: TripDay) {
  const segments = day.stops
    .slice(1)
    .map((stop, index) =>
      getPreviewLeg(day.stops[index], stop, day.transport ?? "car"),
    );
  return {
    complete:
      !day.startLocation &&
      !day.returnToStart &&
      segments.length > 0 &&
      segments.every(Boolean),
    km: segments.reduce((sum, leg) => sum + (leg?.km ?? 0), 0),
    minutes: segments.reduce((sum, leg) => sum + (leg?.minutes ?? 0), 0),
  };
}
const sampleOrder = [
  "lake",
  "square",
  "flower-garden",
  "museum",
  "station",
  "datanla",
];
export function suggestedDayOrder(day: TripDay): string[] | null {
  if (
    day.stops.length < 2 ||
    day.stops.some((stop) => !sampleOrder.includes(stop.id))
  )
    return null;
  const free = day.stops
    .filter((stop) => !stop.pinned)
    .sort((a, b) => sampleOrder.indexOf(a.id) - sampleOrder.indexOf(b.id));
  let cursor = 0;
  return day.stops.map((stop) => (stop.pinned ? stop.id : free[cursor++].id));
}

export function getTripForecast(trip: Trip, date?: string) {
  return trip.destination.toLowerCase().includes("đà lạt")
    ? weatherPreviews.dalat?.days.find((day) => day.date === date)
    : undefined;
}
