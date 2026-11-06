import type { LocalizedText, TripStop } from "@/features/home/types/home-types";

type PlaceReference = { aliases: readonly string[]; introduction: LocalizedText; source: string; url: string };

// Editorial summaries checked 2026-11-06 against the official tourism website.
// No opening hours, admission prices, images or live availability are inferred.
const references: readonly PlaceReference[] = [
  {
    aliases: ["ho xuan huong", "xuan huong lake"],
    introduction: {
      vi: "Hồ Xuân Hương nằm ở trung tâm Đà Lạt. Khu vực quanh hồ là một phần của hành trình khám phá các điểm nổi bật trong thành phố.",
      en: "Xuan Huong Lake sits at the heart of Da Lat, a starting point for exploring the city's landmarks.",
    },
    source: "Vietnam Tourism",
    url: "https://vietnam.travel/place-to-go/south-central-coast-central-highlands/dalat/",
  },
  {
    aliases: ["ga da lat", "da lat railway station", "dalat railway station"],
    introduction: {
      vi: "Ga Đà Lạt là một điểm kiến trúc đặc trưng của thành phố. Vietnam Tourism giới thiệu trải nghiệm đi tàu tới Trại Mát và tham quan chùa Linh Phước; lịch tàu và vé cần kiểm tra riêng.",
      en: "Da Lat's railway station is an architectural landmark. Vietnam Tourism highlights the train experience to Trai Mat and Linh Phuoc Pagoda; confirm schedules and tickets separately.",
    },
    source: "Vietnam Tourism",
    url: "https://vietnam.travel/place-to-go/south-central-coast-central-highlands/dalat/",
  },
];

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function getPlaceReference(place: TripStop): PlaceReference | undefined {
  const location = place.location;
  // Name alone is insufficient: avoid enriching similarly named places in another city or user addresses.
  if (place.locationType === "address" || !location || location.latitude < 11.90 || location.latitude > 12.01
    || location.longitude < 108.40 || location.longitude > 108.49) return;
  const names = [normalized(place.name.vi), normalized(place.name.en)];
  return references.find((reference) => reference.aliases.some((alias) => names.includes(alias)));
}
