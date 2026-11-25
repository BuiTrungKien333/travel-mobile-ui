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
  indoorAlternative: { vi: "Bảo tàng Lâm Đồng", en: "Lam Dong Museum" },
  rainStartsAt: "14:00",
  rainEndsAt: "16:00",
  rainChance: 70,
  hours: [
    { time: "11:00", temperature: 19, rainChance: 10, condition: "sun" },
    { time: "13:00", temperature: 18, rainChance: 30, condition: "cloud" },
    { time: "15:00", temperature: 17, rainChance: 70, condition: "rain" },
  ],
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
    id: "ongoing-album-square",
    tripId: "dalat-ongoing",
    destination: "Đà Lạt",
    date: "2026-10-21",
    photo: homeImages.lamVienSquare,
    place: { vi: "Quảng trường Lâm Viên", en: "Lam Vien Square" },
    text: "",
  },
  {
    id: "ongoing-album-waterfall",
    tripId: "dalat-ongoing",
    destination: "Đà Lạt",
    date: "2026-10-21",
    photo: homeImages.datanlaWaterfall,
    place: { vi: "Thác Datanla", en: "Datanla Waterfall" },
    text: "",
  },
  {
    id: "ongoing-album-station",
    tripId: "dalat-ongoing",
    destination: "Đà Lạt",
    date: "2026-10-21",
    photo: homeImages.dalatStation,
    place: { vi: "Ga Đà Lạt", en: "Da Lat Railway Station" },
    text: "",
  },
  {
    id: "ongoing-album-flowers",
    tripId: "dalat-ongoing",
    destination: "Đà Lạt",
    date: "2026-10-21",
    photo: homeImages.dalatFlowerGarden,
    place: { vi: "Vườn hoa Đà Lạt", en: "Da Lat Flower Garden" },
    text: "",
  },
  {
    id: "ongoing-album-museum",
    tripId: "dalat-ongoing",
    destination: "Đà Lạt",
    date: "2026-10-21",
    photo: homeImages.lamDongMuseum,
    place: { vi: "Bảo tàng Lâm Đồng", en: "Lam Dong Museum" },
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

export const journalPhotoCredits = [
  ...samplePhotoCredits,
  {
    author: "P. Hughes",
    source:
      "https://commons.wikimedia.org/wiki/File:Da_Lat_-_Train_Station.jpg",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
  {
    author: "Du Tran",
    source: "https://commons.wikimedia.org/wiki/File:Datanla_Waterfall.jpg",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    author: "hector garcia",
    source: "https://commons.wikimedia.org/wiki/File:Da_Lat_Flower_Park_1.jpg",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
] as const;

export function initialVisited(scenario: string): Record<string, string[]> {
  return scenario === "ongoing" ? { "dalat-ongoing:2026-10-21": ["lake"] } : {};
}
