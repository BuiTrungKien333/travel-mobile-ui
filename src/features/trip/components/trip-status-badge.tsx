import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import type { TripDisplayStatus } from "../utils/trip-formatters";

export function TripStatusBadge({ status, locale = "vi" }: { status: TripDisplayStatus; locale?: "vi" | "en" }) {
  const labels = {
    ongoing: { vi: "Đang đi", en: "Ongoing" },
    upcoming: { vi: "Sắp khởi hành", en: "Upcoming" },
    draft: { vi: "Đang lên kế hoạch", en: "Planning" },
    completed: { vi: "Đã đi", en: "Completed" },
    cancelled: { vi: "Đã hủy", en: "Cancelled" },
  };
  const tones: Record<TripDisplayStatus, StatusTone> = {
    ongoing: "success", upcoming: "info", draft: "warning", completed: "neutral", cancelled: "error",
  };
  return <StatusBadge label={labels[status][locale]} tone={tones[status]} />;
}
