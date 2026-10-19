import { useI18n } from "@/hooks/use-i18n";

const vi = {
  title: "Thời tiết chuyến đi",
  comfort: "ĐIỂM THUẬN LỢI",
  expected: "Nhiệt độ dự kiến",
  rainAlert: "Mưa nhẹ {from}–{to} · Khả năng {chance}%",
  hourly: "Khung giờ trải nghiệm",
  rainChance: "Khả năng mưa",
  rain: "Mưa rào",
  sun: "Nắng nhẹ",
  cloud: "Mát mẻ",
  day: "Ngày",
  packing: "Vali chuyến đi",
  packingTitle: "Đồ dùng cần thiết cho chuyến đi {destination}",
  packingHint: "Tích chọn khi bạn đã cho đồ vào vali.",
  done: "Xong",
  packingDone: "Đã đóng gói xong",
  packingOpen: "Mở checklist hành lý",
  packingComplete:
    "Tuyệt vời! Bạn đã chuẩn bị đủ hành lý gợi ý cho chuyến đi {destination}.",
  packingBadge: "Sẵn sàng cất cánh",
  close: "Đóng",
  packed: "đã chuẩn bị",
  packingEmpty: "Chưa có món đồ đặc biệt cần gợi ý.",
  empty: "Chưa có dự báo cho chuyến đi này",
  emptyHint:
    "Bạn có thể tiếp tục chuẩn bị kế hoạch trong khi chờ thông tin thời tiết.",
  coverage: "Chưa có dự báo cho tất cả các ngày của chuyến đi.",
  experiences: {
    mist: "Gợi ý săn mây",
    walk: "Dạo bộ",
    cafe: "Cà phê trong nhà",
    photo: "Giờ vàng chụp ảnh",
  },
  packingItems: {
    layer: "Áo ấm",
    umbrella: "Ô / áo mưa",
    sun: "Chống nắng",
    shoes: "Giày bám tốt",
  },
  packingReasons: {
    layer: "Có ngày dưới 20°C",
    umbrella: "Khả năng mưa trên 40%",
    sun: "Có ngày UV trên 5",
    shoes: "Đi bộ ngoài trời khi có mưa",
  },
};
const en: typeof vi = {
  title: "Trip weather",
  comfort: "TRAVEL COMFORT",
  expected: "Expected temperature",
  rainAlert: "Light rain {from}–{to} · {chance}% chance",
  hourly: "Your day, hour by hour",
  rainChance: "Chance of rain",
  rain: "Showers",
  sun: "Gentle sunshine",
  cloud: "Cool & cloudy",
  day: "Day",
  packing: "Trip packing",
  packingTitle: "Essentials for your trip to {destination}",
  packingHint: "Check off each item once it is in your suitcase.",
  done: "Done",
  packingDone: "All packed",
  packingOpen: "Open packing checklist",
  packingComplete:
    "Great! All suggested weather essentials for your trip to {destination} are packed.",
  packingBadge: "Ready for takeoff",
  close: "Close",
  packed: "packed",
  packingEmpty: "No special packing suggestions for these days.",
  empty: "No forecast for this trip yet",
  emptyHint:
    "Keep preparing your itinerary while waiting for weather information.",
  coverage: "A forecast is not available for every day of this trip yet.",
  experiences: {
    mist: "Cloud spotting",
    walk: "A scenic walk",
    cafe: "Indoor café",
    photo: "Golden hour photos",
  },
  packingItems: {
    layer: "Warm layer",
    umbrella: "Rain gear",
    sun: "Sun protection",
    shoes: "Grip shoes",
  },
  packingReasons: {
    layer: "Some days below 20°C",
    umbrella: "Rain chance above 40%",
    sun: "Some days with UV above 5",
    shoes: "Outdoor walking in wet weather",
  },
};

export function useWeatherCopy() {
  const { locale } = useI18n();
  return { copy: locale === "vi" ? vi : en, locale };
}

const dateFormats = {
  vi: new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }),
  en: new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }),
};

export function formatForecastDate(date: string, locale: "vi" | "en") {
  return dateFormats[locale].format(new Date(`${date}T12:00:00Z`));
}
