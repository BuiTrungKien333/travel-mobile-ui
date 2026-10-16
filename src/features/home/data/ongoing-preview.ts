import { homeImages, samplePhotoCredits } from "./home-mocks";
import type { Memory } from "../types/home-types";

// A separate snapshot for the ongoing preview, not the future trip forecast.
export const ongoingWeatherSnapshot = {
  tripId: "dalat-ongoing",
  date: "2026-10-21",
  observedAt: "10:45",
  condition: "cloud",
  temperature: 18,
  feelsLike: 17,
  rainStartsAt: "14:00",
  rainEndsAt: "16:00",
  rainChance: 70,
} as const;

export const captureSamples = [
  {
    id: "lake",
    photo: homeImages.xuanHuongLake,
    credit: samplePhotoCredits[0],
  },
  {
    id: "square",
    photo: homeImages.upcomingPhoto,
    credit: samplePhotoCredits[1],
  },
  {
    id: "museum",
    photo: homeImages.lamDongMuseum,
    credit: samplePhotoCredits[2],
  },
] as const;
export type CapturePhotoId = (typeof captureSamples)[number]["id"];

export const ongoingMemories: Memory[] = [
  {
    id: "ongoing-lake",
    tripId: "dalat-ongoing",
    destination: "Đà Lạt",
    date: "2026-10-21",
    time: "09:45",
    photo: homeImages.xuanHuongLake,
    place: { vi: "Hồ Xuân Hương", en: "Xuan Huong Lake" },
    text: "",
  },
  {
    id: "ongoing-square",
    tripId: "dalat-ongoing",
    destination: "Đà Lạt",
    date: "2026-10-20",
    time: "16:30",
    photo: homeImages.lamVienSquare,
    place: { vi: "Quảng trường Lâm Viên", en: "Lam Vien Square" },
    text: "",
  },
];

export function initialVisited(scenario: string): Record<string, string[]> {
  return scenario === "ongoing" ? { "dalat-ongoing:2026-10-21": ["lake"] } : {};
}
