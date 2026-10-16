import type { HomeScenario, Trip, TripStop } from "../types/home-types";

// Fixed mock clock keeps all four previews reproducible, regardless of device date.
export const MOCK_TODAY = "2026-10-21";
export const mockProfile = {
  fullName: "Nguyễn Trung Kiên",
  email: "kien@example.com",
};
export const homeImages = {
  forest: require("@/assets/images/home/forest.jpg"),
  upcomingPhoto: require("@/assets/images/home/dalat-upcoming.jpg"),
  firstTripLandscape: require("@/assets/images/home/first-trip-landscape.svg"),
  xuanHuongLake: require("@/assets/images/home/xuan-huong-lake.jpg"),
  lamVienSquare: require("@/assets/images/home/lam-vien-square.jpg"),
  lamDongMuseum: require("@/assets/images/home/lam-dong-museum.jpg"),
  rainCloud: require("@/assets/icons/weather/rain-cloud.svg"),
  glassSun: require("@/assets/icons/weather/glass-sun.svg"),
};
export const exampleStops: TripStop[] = [
  {
    id: "lake",
    time: "09:30",
    name: { vi: "Hồ Xuân Hương", en: "Xuan Huong Lake" },
    kind: { vi: "Dạo bộ · Ngắm cảnh", en: "Walk · Sightseeing" },
    quickInfo: { admission: { vi: "Miễn phí", en: "Free" }, sample: true },
  },
  {
    id: "square",
    time: "11:00",
    name: { vi: "Quảng trường Lâm Viên", en: "Lam Vien Square" },
    kind: { vi: "Khám phá · Chụp ảnh", en: "Explore · Photography" },
    quickInfo: { admission: { vi: "Miễn phí", en: "Free" }, sample: true },
  },
  {
    id: "museum",
    time: "15:30",
    name: { vi: "Bảo tàng Lâm Đồng", en: "Lam Dong Museum" },
    kind: { vi: "Văn hóa · Trong nhà", en: "Culture · Indoors" },
    quickInfo: { closesAt: "17:00", sample: true },
  },
];
export const sampleItineraryStops = [
  { ...exampleStops[0], image: homeImages.xuanHuongLake },
  { ...exampleStops[1], image: homeImages.lamVienSquare },
  { ...exampleStops[2], image: homeImages.lamDongMuseum },
];

export const sampleItineraryDate = "2026-10-24";
export const sampleWeatherTemperature = 22;

export const samplePhotoCredits = [
  {
    author: "P. Hughes",
    source:
      "https://commons.wikimedia.org/wiki/File:Da_Lat_-_Xuan_Huong_Lake.jpg",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
  {
    author: "EA",
    source:
      "https://commons.wikimedia.org/wiki/File:L%C3%A2m_Vi%C3%AAn_%C4%90%C3%A0_L%E1%BA%A1t.JPG",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  {
    author: "Diane Selwyn",
    source: "https://commons.wikimedia.org/wiki/File:Lam_Dong_Museum_17.jpg",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  },
] as const;

export const genericStops: TripStop[] = [
  {
    id: "centre",
    time: "09:00",
    name: { vi: "Dạo quanh khu trung tâm", en: "Explore the city centre" },
    kind: { vi: "Khám phá · Địa điểm mẫu", en: "Explore · Sample place" },
  },
  {
    id: "cafe",
    time: "11:00",
    name: { vi: "Ghé một quán cà phê địa phương", en: "Visit a local café" },
    kind: { vi: "Nghỉ ngơi · Địa điểm mẫu", en: "Relax · Sample place" },
  },
  {
    id: "culture",
    time: "15:00",
    name: { vi: "Khám phá văn hóa địa phương", en: "Discover local culture" },
    kind: { vi: "Văn hóa · Địa điểm mẫu", en: "Culture · Sample place" },
  },
];
export function suggestedStops(destination: string): TripStop[] {
  return destination === "Đà Lạt" ? exampleStops : genericStops;
}
const history: Trip = {
  id: "past-danang",
  destination: "Đà Nẵng",
  status: "completed",
  startDate: "2026-08-12",
  endDate: "2026-08-14",
  days: [{ date: "2026-08-12", stops: genericStops }],
};
const dalat: Trip = {
  id: "dalat",
  destination: "Đà Lạt",
  status: "planned",
  startDate: "2026-10-24",
  endDate: "2026-10-27",
  days: [
    { date: "2026-10-24", stops: exampleStops.slice(0, 2) },
    { date: "2026-10-25", stops: exampleStops },
    { date: "2026-10-26", stops: [] },
    { date: "2026-10-27", stops: [] },
  ],
};
export const mockTrips: Record<HomeScenario, Trip[]> = {
  new: [],
  upcoming: [
    history,
    dalat,
    {
      id: "later-draft",
      destination: "Hội An",
      status: "draft",
      startDate: "2026-11-08",
      endDate: "2026-11-09",
      days: [
        { date: "2026-11-08", stops: [] },
        { date: "2026-11-09", stops: [] },
      ],
    },
  ],
  ongoing: [
    history,
    {
      ...dalat,
      id: "dalat-ongoing",
      startDate: "2026-10-20",
      endDate: "2026-10-23",
      days: dalat.days.map((day, index) => ({
        ...day,
        date: `2026-10-${20 + index}`,
      })),
    },
  ],
  returning: [history],
};
