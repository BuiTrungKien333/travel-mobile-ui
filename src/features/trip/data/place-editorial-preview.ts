import type { LocalizedText, TripStop } from "@/features/home/types/home-types";
import { homeImages } from "@/features/home/data/home-mocks";
import { getPlaceDetailsPreview } from "./place-details-preview";

const text = (vi: string, en: string): LocalizedText => ({ vi, en });
// Editorial UI examples only, not verified amenities or live opening states.
const entries: Record<
  string,
  {
    category: LocalizedText;
    state: "open" | "closed";
    amenities: LocalizedText[];
    tips: LocalizedText[];
    introduction: LocalizedText;
  }
> = {
  square: {
    category: text("Quảng trường", "Square"),
    state: "open",
    amenities: [
      text("Chụp ảnh", "Photography"),
      text("Đi dạo", "Walking"),
      text("Ăn uống quanh đây", "Food nearby"),
    ],
    tips: [
      text("Mang nước uống", "Bring water"),
      text("Chuẩn bị áo khoác", "Bring a jacket"),
    ],
    introduction: text(
      "Một điểm dừng thoáng đãng bên Hồ Xuân Hương, phù hợp để đi dạo và ghi lại những bức ảnh của chuyến đi. Bạn có thể dành thời gian khám phá khu vực xung quanh trước khi đến điểm tiếp theo.",
      "An open-air stop by Xuan Huong Lake for a walk and travel photos. Leave some time to explore the surrounding area before your next stop.",
    ),
  },
  lake: {
    category: text("Hồ", "Lake"),
    state: "open",
    amenities: [
      text("Chụp ảnh", "Photography"),
      text("Đi dạo", "Walking"),
      text("Ngắm cảnh", "Sightseeing"),
    ],
    tips: [
      text("Giữ vệ sinh", "Leave no litter"),
      text("Chú ý đường ven hồ", "Watch the lakeside road"),
    ],
    introduction: text(
      "Không gian ven hồ dành cho một khoảng nghỉ giữa hành trình. Đi bộ chậm, ngắm cảnh và lưu lại những khoảnh khắc của bạn trước khi tiếp tục khám phá Đà Lạt.",
      "A lakeside pause between stops. Take a slow walk, enjoy the views and capture a few memories before exploring more of Da Lat.",
    ),
  },
  museum: {
    category: text("Bảo tàng", "Museum"),
    state: "closed",
    amenities: [
      text("Tham quan trong nhà", "Indoor visit"),
      text("Tìm hiểu văn hóa", "Culture"),
    ],
    tips: [
      text("Kiểm tra giờ mở cửa", "Check opening hours"),
      text("Giữ yên lặng", "Keep quiet"),
    ],
    introduction: text(
      "Gợi ý một điểm tham quan trong nhà cho hành trình tìm hiểu văn hóa địa phương. Hãy kiểm tra lại lịch mở cửa và quy định chụp ảnh trước khi ghé.",
      "An indoor stop for discovering local culture. Check opening times and photography rules before visiting.",
    ),
  },
  station: {
    category: text("Nhà ga", "Railway station"),
    state: "open",
    amenities: [
      text("Chụp ảnh", "Photography"),
      text("Tham quan", "Sightseeing"),
    ],
    tips: [text("Kiểm tra lịch hoạt động", "Check operating times")],
    introduction: text(
      "Gợi ý một điểm dừng cho những ai thích kiến trúc và ảnh du lịch. Dành thời gian ngắm không gian nhà ga và kiểm tra thông tin hoạt động trước khi đến.",
      "A suggested stop for architecture and travel photography. Explore the station and check operating information before visiting.",
    ),
  },
  "flower-garden": {
    category: text("Vườn hoa", "Flower garden"),
    state: "open",
    amenities: [text("Chụp ảnh", "Photography"), text("Đi dạo", "Walking")],
    tips: [
      text("Không hái hoa", "Do not pick flowers"),
      text("Mang mũ che nắng", "Bring a sun hat"),
    ],
    introduction: text(
      "Một khoảng dừng nhiều màu sắc cho hành trình khám phá Đà Lạt. Đi dạo thong thả, tìm góc ảnh bạn yêu thích và dành thời gian tận hưởng không gian ngoài trời.",
      "A colourful pause on your Da Lat journey. Take a relaxed stroll, find a favourite photo spot and enjoy the outdoors.",
    ),
  },
  datanla: {
    category: text("Thác nước", "Waterfall"),
    state: "open",
    amenities: [
      text("Ngắm cảnh", "Sightseeing"),
      text("Chụp ảnh", "Photography"),
    ],
    tips: [
      text("Giày chống trơn", "Wear non-slip shoes"),
      text("Chú ý khi trời mưa", "Take care in the rain"),
    ],
    introduction: text(
      "Điểm dừng thiên nhiên để đổi nhịp cho chuyến đi. Chuẩn bị giày phù hợp, kiểm tra thời tiết và lựa chọn hoạt động vừa sức trước khi ghé.",
      "A nature stop to change the pace of your trip. Wear suitable shoes, check the weather and choose activities that suit you.",
    ),
  },
};

export function getPlaceEditorialPreview(place: TripStop) {
  const entry =
    place.locationType === "address" ? undefined : entries[place.id];
  const { photo } = getPlaceDetailsPreview(place);
  return {
    entry,
    // These are explicitly labelled as the place AND its surrounding area.
    photos:
      entry && photo
        ? Array.from(
            new Set([
              photo,
              ...(place.id === "lake"
                ? [homeImages.lamVienSquare]
                : [homeImages.xuanHuongLake]),
              homeImages.dalatStation,
            ]),
          )
        : [],
  };
}
