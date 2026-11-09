import type { TripStop } from "../../home/types/home-types";

// Available suggested places by destination
const samplePlaceBank: Record<string, TripStop[]> = {
  "Đà Lạt": [
    {
      id: "lake",
      time: "09:30",
      name: { vi: "Hồ Xuân Hương", en: "Xuan Huong Lake" },
      kind: { vi: "Đà Lạt · Tham quan", en: "Da Lat · Sightseeing" },
    },
    {
      id: "square",
      time: "11:00",
      name: { vi: "Quảng trường Lâm Viên", en: "Lam Vien Square" },
      kind: { vi: "Đà Lạt · Tham quan", en: "Da Lat · Sightseeing" },
    },
    {
      id: "flower-garden",
      time: "14:00",
      name: { vi: "Vườn hoa Đà Lạt", en: "Dalat Flower Garden" },
      kind: { vi: "Đà Lạt · Tham quan", en: "Da Lat · Sightseeing" },
    },
    {
      id: "museum",
      time: "15:30",
      name: { vi: "Bảo tàng Lâm Đồng", en: "Lam Dong Museum" },
      kind: { vi: "Đà Lạt · Tham quan", en: "Da Lat · Sightseeing" },
    },
    {
      id: "datanla",
      time: "16:30",
      name: { vi: "Thác Datanla", en: "Datanla Waterfall" },
      kind: { vi: "Đà Lạt · Khám phá", en: "Da Lat · Adventure" },
    },
    {
      id: "station",
      time: "17:30",
      name: { vi: "Ga Đà Lạt", en: "Dalat Old Railway Station" },
      kind: { vi: "Đà Lạt · Di tích", en: "Da Lat · Historic" },
    },
  ],
  "Đà Nẵng": [
    {
      id: "dn-beach",
      time: "08:00",
      name: { vi: "Biển Mỹ Khê", en: "My Khe Beach" },
      kind: { vi: "Đà Nẵng · Tham quan", en: "Da Nang · Sightseeing" },
    },
    {
      id: "dn-bridge",
      time: "19:30",
      name: { vi: "Cầu Rồng Đà Nẵng", en: "Dragon Bridge" },
      kind: { vi: "Đà Nẵng · Tham quan", en: "Da Nang · Sightseeing" },
    },
    {
      id: "dn-sontra",
      time: "14:00",
      name: { vi: "Bán đảo Sơn Trà", en: "Son Tra Peninsula" },
      kind: { vi: "Đà Nẵng · Thiên nhiên", en: "Da Nang · Nature" },
    },
    {
      id: "dn-marble",
      time: "16:00",
      name: { vi: "Ngũ Hành Sơn", en: "Marble Mountains" },
      kind: { vi: "Đà Nẵng · Di tích", en: "Da Nang · Historic" },
    },
  ],
  "Hội An": [
    {
      id: "ha-oldtown",
      time: "16:00",
      name: { vi: "Phố cổ Hội An", en: "Hoi An Ancient Town" },
      kind: { vi: "Hội An · Tham quan", en: "Hoi An · Sightseeing" },
    },
    {
      id: "ha-market",
      time: "18:30",
      name: { vi: "Chợ đêm đèn lồng", en: "Lantern Night Market" },
      kind: { vi: "Hội An · Ẩm thực", en: "Hoi An · Food" },
    },
    {
      id: "ha-bridge",
      time: "10:00",
      name: { vi: "Chùa Cầu Hội An", en: "Japanese Covered Bridge" },
      kind: { vi: "Hội An · Văn hóa", en: "Hoi An · Culture" },
    },
  ],
  "Nha Trang": [
    {
      id: "nt-honmun",
      time: "09:00",
      name: { vi: "Đảo Hòn Mun", en: "Hon Mun Island" },
      kind: { vi: "Nha Trang · Lặn biển", en: "Nha Trang · Diving" },
    },
    {
      id: "nt-ponagar",
      time: "14:30",
      name: { vi: "Tháp Bà Ponagar", en: "Ponagar Cham Towers" },
      kind: { vi: "Nha Trang · Văn hóa", en: "Nha Trang · Culture" },
    },
    {
      id: "nt-vinwonders",
      time: "10:00",
      name: { vi: "VinWonders Nha Trang", en: "VinWonders Nha Trang" },
      kind: { vi: "Nha Trang · Vui chơi", en: "Nha Trang · Theme Park" },
    },
  ],
};

export function getPlacesForDestination(dest: string): TripStop[] {
  const match = Object.keys(samplePlaceBank).find((key) =>
    dest.toLowerCase().includes(key.toLowerCase()),
  );
  return match ? samplePlaceBank[match] : [];
}
