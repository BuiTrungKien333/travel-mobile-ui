import type { LocalizedText, TripStop } from "@/features/home/types/home-types";
import { getStopImage } from "./trip-details-preview";

// Explicit UI fixtures, never interpreted as current opening hours or live ticket prices.
const previews: Record<string, { hours: string; admission: LocalizedText }> = {
  lake: { hours: "24h", admission: { vi: "Miễn phí", en: "Free" } },
  square: { hours: "24h", admission: { vi: "Miễn phí", en: "Free" } },
  museum: {
    hours: "07:30 – 17:00",
    admission: { vi: "50.000 ₫", en: "VND 50,000" },
  },
  "flower-garden": {
    hours: "07:00 – 18:00",
    admission: { vi: "100.000 ₫", en: "VND 100,000" },
  },
  station: {
    hours: "07:00 – 17:00",
    admission: { vi: "50.000 ₫", en: "VND 50,000" },
  },
  datanla: {
    hours: "07:00 – 17:00",
    admission: { vi: "Tùy hoạt động", en: "Varies by activity" },
  },
};
export function getPlaceDetailsPreview(place: TripStop) {
  const preview = previews[place.id];
  return {
    photo: preview ? getStopImage(place.id) : null,
    hours: preview?.hours,
    admission: place.quickInfo?.admission ?? preview?.admission,
  };
}
