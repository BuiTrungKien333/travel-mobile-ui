import type { Trip } from "@/features/home/types/home-types";

export const sampleTrips: Trip[] = [
  {
    id: "sample-dalat",
    destination: "Đà Lạt",
    title: "Khám phá xứ sở ngàn hoa",
    startDate: "2026-10-24",
    endDate: "2026-10-27",
    status: "planned",
    days: [
      {
        date: "2026-10-24",
        stops: [
          {
            id: "lake",
            time: "09:30",
            name: { vi: "Hồ Xuân Hương", en: "Xuan Huong Lake" },
            kind: { vi: "Dạo bộ · Ngắm cảnh", en: "Walk · Sightseeing" },
          },
          {
            id: "square",
            time: "11:00",
            name: { vi: "Quảng trường Lâm Viên", en: "Lam Vien Square" },
            kind: { vi: "Khám phá · Chụp ảnh", en: "Explore · Photography" },
          },
        ],
      },
      {
        date: "2026-10-25",
        stops: [
          {
            id: "museum",
            time: "15:30",
            name: { vi: "Bảo tàng Lâm Đồng", en: "Lam Dong Museum" },
            kind: { vi: "Văn hóa · Trong nhà", en: "Culture · Indoors" },
          },
        ],
      },
      {
        date: "2026-10-26",
        stops: [],
      },
      {
        date: "2026-10-27",
        stops: [],
      },
    ],
  },
  {
    id: "sample-danang",
    destination: "Đà Nẵng",
    title: "Kỳ nghỉ biển Mỹ Khê & Bán đảo Sơn Trà",
    startDate: "2026-08-12",
    endDate: "2026-08-15",
    status: "completed",
    days: [
      {
        date: "2026-08-12",
        stops: [
          {
            id: "beach",
            time: "08:00",
            name: { vi: "Biển Mỹ Khê", en: "My Khe Beach" },
            kind: { vi: "Tắm biển · Thư giãn", en: "Swimming · Relax" },
          },
          {
            id: "bridge",
            time: "19:30",
            name: { vi: "Cầu Rồng Đà Nẵng", en: "Dragon Bridge" },
            kind: { vi: "Ngắm cảnh đêm", en: "Night Sightseeing" },
          },
        ],
      },
      {
        date: "2026-08-13",
        stops: [
          {
            id: "son-tra",
            time: "09:00",
            name: { vi: "Bán đảo Sơn Trà", en: "Son Tra Peninsula" },
            kind: { vi: "Khám phá thiên nhiên", en: "Nature Explore" },
          },
        ],
      },
      {
        date: "2026-08-14",
        stops: [],
      },
      {
        date: "2026-08-15",
        stops: [],
      },
    ],
  },
  {
    id: "sample-hoian",
    destination: "Hội An",
    title: "Dạo bước phố cổ đèn lồng",
    startDate: "2026-11-08",
    endDate: "2026-11-10",
    status: "draft",
    days: [
      {
        date: "2026-11-08",
        stops: [
          {
            id: "old-town",
            time: "16:00",
            name: { vi: "Phố cổ Hội An", en: "Hoi An Ancient Town" },
            kind: { vi: "Dạo phố · Chụp ảnh", en: "Walk · Photography" },
          },
        ],
      },
      {
        date: "2026-11-09",
        stops: [
          {
            id: "lantern-market",
            time: "18:30",
            name: { vi: "Chợ đêm đèn lồng", en: "Lantern Night Market" },
            kind: { vi: "Ẩm thực · Mua sắm", en: "Food · Shopping" },
          },
        ],
      },
      {
        date: "2026-11-10",
        stops: [],
      },
    ],
  },
  {
    id: "sample-nhatrang",
    destination: "Nha Trang",
    title: "Trải nghiệm lặn biển vịnh Nha Trang",
    startDate: "2026-12-01",
    endDate: "2026-12-04",
    status: "planned",
    days: [
      {
        date: "2026-12-01",
        stops: [
          {
            id: "hon-mun",
            time: "09:00",
            name: { vi: "Đảo Hòn Mun", en: "Hon Mun Island" },
            kind: { vi: "Lặn biển · Ngắm san hô", en: "Scuba Diving · Coral" },
          },
        ],
      },
      {
        date: "2026-12-02",
        stops: [
          {
            id: "ponagar",
            time: "14:30",
            name: { vi: "Tháp Bà Ponagar", en: "Ponagar Cham Towers" },
            kind: { vi: "Di tích lịch sử", en: "Historic Site" },
          },
        ],
      },
      {
        date: "2026-12-03",
        stops: [],
      },
      {
        date: "2026-12-04",
        stops: [],
      },
    ],
  },
];
