import { useI18n } from "@/hooks/use-i18n";

const vi = {
  trips: "Chuyến đi của bạn",
  tripsCount: "{count} chuyến đi",
  tripsCountSingle: "1 chuyến đi",
  tripsEmptyCount: "Chưa có chuyến đi",
  createTrip: "Tạo chuyến đi",
  noTripsTitle: "Chưa có chuyến đi nào",
  noTripsHint: "Bắt đầu lên kế hoạch cho chuyến phiêu lưu tiếp theo của bạn.",
  createFirstTrip: "Lên kế hoạch ngay",
  filterAll: "Tất cả",
  filterUpcoming: "Sắp tới",
  filterDraft: "Bản nháp",
  filterCompleted: "Đã đi",
  statusOngoing: "Đang diễn ra",
  statusUpcoming: "Sắp khởi hành",
  statusDraft: "Bản nháp",
  statusCompleted: "Đã hoàn thành",
  statusCancelled: "Đã hủy",
  undated: "Chưa chọn ngày",
};

const en = {
  trips: "Your Trips",
  tripsCount: "{count} trips",
  tripsCountSingle: "1 trip",
  tripsEmptyCount: "No trips yet",
  createTrip: "Create trip",
  noTripsTitle: "No trips found",
  noTripsHint: "Start planning your next adventure to exciting places.",
  createFirstTrip: "Plan a trip now",
  filterAll: "All",
  filterUpcoming: "Upcoming",
  filterDraft: "Drafts",
  filterCompleted: "Past",
  statusOngoing: "Ongoing",
  statusUpcoming: "Upcoming",
  statusDraft: "Draft",
  statusCompleted: "Completed",
  statusCancelled: "Cancelled",
  undated: "Dates not set",
};

export function useTripCopy() {
  const { locale } = useI18n();
  return { copy: locale === "vi" ? vi : en, locale };
}
