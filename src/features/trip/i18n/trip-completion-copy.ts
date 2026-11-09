import { useI18n } from "@/hooks/use-i18n";

const vi = {
  action: "Kết thúc chuyến đi",
  title: "Kết thúc chuyến đi này?",
  hint: "Chuyến đi sẽ chuyển sang Đã hoàn thành. Ngày đi, địa điểm và kỷ niệm của bạn vẫn được giữ nguyên.",
  later: "Tiếp tục hành trình",
  allVisited: "Bạn đã khám phá hết các điểm trong lịch trình!",
  suggestion:
    "Bạn có thể tiếp tục trải nghiệm hoặc kết thúc chuyến đi khi sẵn sàng.",
};
const en: typeof vi = {
  action: "End trip",
  title: "End this trip?",
  hint: "Your trip will be marked as completed. Its dates, places and memories will be preserved.",
  later: "Keep exploring",
  allVisited: "You've explored every place in your itinerary!",
  suggestion: "Keep exploring, or end your trip whenever you're ready.",
};

export function useTripCompletionCopy() {
  const { locale } = useI18n();
  return locale === "vi" ? vi : en;
}
