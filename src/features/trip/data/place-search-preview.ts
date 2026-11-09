import type { TripStop } from "@/features/home/types/home-types";
import { getPlacesForDestination } from "./place-bank";

// Address-only search fixtures. Coordinates are approximate, not geocoded results.
export function getAddressSearchPreview(): TripStop[] {
  return [
    {
      id: "address-preview-quang-trung",
      time: "",
      name: { vi: "100/25 Quang Trung", en: "100/25 Quang Trung" },
      address: {
        vi: "100/25 Quang Trung, Gò Vấp, TP. Hồ Chí Minh",
        en: "100/25 Quang Trung, Go Vap, Ho Chi Minh City",
      },
      kind: { vi: "Địa chỉ", en: "Address" },
      locationType: "address",
      location: { latitude: 10.834, longitude: 106.666 },
    },
  ];
}

// UI fixtures only. These approximate coordinates and addresses are not a geocoding service.
const locations: Record<string, [number, number, string]> = {
  lake: [11.9416, 108.4422, "Hồ Xuân Hương, Đà Lạt"],
  square: [11.9368, 108.4453, "Trần Quốc Toản, Đà Lạt"],
  "flower-garden": [11.953, 108.4496, "Trần Nhân Tông, Đà Lạt"],
  museum: [11.9397, 108.4613, "Hùng Vương, Đà Lạt"],
  datanla: [11.9038, 108.4494, "Đèo Prenn, Đà Lạt"],
  station: [11.9417, 108.4557, "Quang Trung, Đà Lạt"],
  "dn-beach": [16.0544, 108.2478, "Võ Nguyên Giáp, Đà Nẵng"],
  "dn-bridge": [16.0611, 108.2275, "Cầu Rồng, Đà Nẵng"],
  "dn-sontra": [16.123, 108.277, "Bán đảo Sơn Trà, Đà Nẵng"],
  "dn-marble": [16.0036, 108.2641, "Hòa Hải, Đà Nẵng"],
  "ha-oldtown": [15.877, 108.328, "Phố cổ Hội An"],
  "ha-market": [15.8753, 108.3262, "Nguyễn Hoàng, Hội An"],
  "ha-bridge": [15.8771, 108.3262, "Nguyễn Thị Minh Khai, Hội An"],
  "nt-honmun": [12.168, 109.299, "Đảo Hòn Mun, Nha Trang"],
  "nt-ponagar": [12.2653, 109.1959, "Hai Tháng Tư, Nha Trang"],
  "nt-vinwonders": [12.216, 109.242, "Đảo Hòn Tre, Nha Trang"],
};

/** Swap this fixture source for the connected Places search in the next integration. */
export function getPlaceSearchPreview(destination: string): TripStop[] {
  return getPlacesForDestination(destination).map((stop) => {
    const entry = locations[stop.id];
    return entry
      ? {
          ...stop,
          location: { latitude: entry[0], longitude: entry[1] },
          address: { vi: entry[2], en: entry[2] },
        }
      : stop;
  });
}
