import { useI18n } from "@/hooks/use-i18n";

const vi = {
  title: "Thời tiết chuyến đi",
  open: "Xem dự báo",
  loading: "Đang cập nhật thời tiết…",
  retry: "Thử lại",
  error: "Chưa thể tải thời tiết. Bạn có thể thử lại sau.",
  network: "Không có kết nối mạng. Hãy kiểm tra kết nối và thử lại.",
  NO_DATES: "Chọn ngày cho chuyến đi để xem dự báo.",
  NO_LOCATION:
    "Chưa có vị trí để dự báo. Hãy thêm một địa điểm có tọa độ vào chuyến đi.",
  OUTSIDE_FORECAST_WINDOW:
    "Ngày này nằm ngoài phạm vi dự báo 15 ngày, tính cả hôm nay.",
  PAST_DATE:
    "Ngày này đã qua. Dự báo hiện tại không cung cấp dữ liệu thời tiết quá khứ.",
  MOCK_PROVIDER:
    "Máy chủ đang dùng chế độ thời tiết mẫu. Chưa có dự báo thực tế.",
  updated: "Cập nhật",
  area: "Khu vực",
  expected: "Dự báo lúc",
  feels: "Cảm giác như",
  range: "Trong ngày",
  partial: "Một số ngày của chuyến đi chưa nằm trong phạm vi dự báo.",
  hourlyEmpty: "Chưa có dự báo cho các giờ tiếp theo trong ngày.",
  currentMissing: "Chưa có dữ liệu hiện tại; đang hiển thị dự báo theo giờ.",
  rain: "Khả năng mưa {chance}% lúc {time}. Ưu tiên điểm trong nhà nếu trời chuyển mưa.",
  rainNow: "Khu vực đang có mưa. Cân nhắc trú mưa trước khi di chuyển.",
  severe:
    "Có khả năng thời tiết xấu. Cân nhắc hoãn hoạt động ngoài trời và kiểm tra cảnh báo địa phương.",
  clear:
    "Tranh thủ khám phá khi thời tiết thuận lợi; vẫn kiểm tra lại trước khi di chuyển.",
  hot: "Trời khá nóng. Nghỉ giữa các chặng và bổ sung nước thường xuyên.",
  cool: "Nhiệt độ xuống thấp trong ngày. Chuẩn bị thêm một lớp áo khi ra ngoài.",
  umbrella: "Nên mang dù / áo mưa",
  layer: "Nên mang áo khoác mỏng",
  water: "Mang nước uống",
  flexible: "Giữ lịch trình linh hoạt",
  conditions: {
    CLEAR_SKY: "Trời quang",
    PARTLY_CLOUDY: "Có mây",
    CLOUDY: "Nhiều mây",
    FOGGY: "Sương mù",
    LIGHT_RAIN: "Mưa nhẹ",
    RAINY: "Mưa rào",
    HEAVY_RAIN: "Mưa to",
    THUNDERSTORM: "Mưa dông",
    UNKNOWN: "Chưa xác định",
  },
};

const en: typeof vi = {
  title: "Trip weather",
  open: "View forecast",
  loading: "Updating weather…",
  retry: "Try again",
  error: "Weather is unavailable right now. Please try again later.",
  network: "You are offline. Check your connection and try again.",
  NO_DATES: "Choose trip dates to see the forecast.",
  NO_LOCATION:
    "No forecast location yet. Add a place with coordinates to your trip.",
  OUTSIDE_FORECAST_WINDOW:
    "This date is outside the 15-day forecast window, including today.",
  PAST_DATE:
    "This date has passed. This forecast does not provide historical weather.",
  MOCK_PROVIDER:
    "The server is using sample weather. A live forecast is not available.",
  updated: "Updated",
  area: "Area",
  expected: "Forecast at",
  feels: "Feels like",
  range: "Daily range",
  partial: "Some trip dates are outside the available forecast window.",
  hourlyEmpty: "No forecast for the remaining hours today.",
  currentMissing:
    "Current conditions are unavailable; showing the hourly forecast.",
  rain: "{chance}% chance of rain at {time}. Consider indoor stops if it starts raining.",
  rainNow: "It is raining in this area. Consider shelter before moving on.",
  severe:
    "Severe weather is possible. Consider postponing outdoor activities and check local alerts.",
  clear:
    "Make the most of favorable weather, and check again before heading out.",
  hot: "It is quite hot. Take breaks between stops and stay hydrated.",
  cool: "Temperatures drop during the day. Bring an extra layer.",
  umbrella: "Bring an umbrella / raincoat",
  layer: "Bring a light jacket",
  water: "Bring drinking water",
  flexible: "Keep your plans flexible",
  conditions: {
    CLEAR_SKY: "Clear sky",
    PARTLY_CLOUDY: "Partly cloudy",
    CLOUDY: "Cloudy",
    FOGGY: "Foggy",
    LIGHT_RAIN: "Light rain",
    RAINY: "Showers",
    HEAVY_RAIN: "Heavy rain",
    THUNDERSTORM: "Thunderstorm",
    UNKNOWN: "Unknown",
  },
};

export function useLiveWeatherCopy() {
  const { locale } = useI18n();
  return { copy: locale === "vi" ? vi : en, locale };
}
