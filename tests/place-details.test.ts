import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidElement, type ReactElement } from "react";
import type { TripStop } from "../src/features/home/types/home-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Props = {
  children?: unknown;
  mapContent?: unknown;
  focused?: TripStop;
  fitContainer?: boolean;
  showLocationControl?: boolean;
  header?: unknown;
  onPress?: () => void;
};
function elements(node: unknown): ReactElement<Props>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Props>(node)) return [];
  return [node, ...elements(node.props.children)];
}
function text(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join(" ");
  return isValidElement<Props>(node) ? text(node.props.children) : "";
}
const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
  "src/theme/tokens.ts",
);
const load = tripModuleLoader({
  react: { useState: () => [640, () => {}] },
  "react-native": {
    View: "View",
    ScrollView: "ScrollView",
    StyleSheet: { create: (value: unknown) => value, hairlineWidth: 1 },
  },
  "react-native-reanimated": {
    useSharedValue: (value: number) => ({ get: () => value, set: () => {} }),
  },
  "expo-image": { Image: "Image" },
  "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
  "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
  "@/components/ui/app-text": { AppText: "AppText" },
  "@/components/ui/app-icon": { AppIcon: "AppIcon" },
  "./trip-planning-map": { TripPlanningMap: "TripPlanningMap" },
  "./place-search-map": { PlaceSearchMap: "PlaceSearchMap" },
  "./trip-details-header": { DetailIconButton: "DetailIconButton" },
});
const { PlaceDetailsContent } = load<
  typeof import("../src/features/trip/components/place-details-content.tsx")
>("src/features/trip/components/place-details-content.tsx");
const { getPlaceSearchPreview, getAddressSearchPreview } = load<
  typeof import("../src/features/trip/data/place-search-preview.ts")
>("src/features/trip/data/place-search-preview.ts");
const { getPlaceMapRegion } = load<
  typeof import("../src/features/trip/utils/place-search.ts")
>("src/features/trip/utils/place-search.ts");
const { getPlaceDetailsPreview } = load<
  typeof import("../src/features/trip/data/place-details-preview.ts")
>("src/features/trip/data/place-details-preview.ts");

test("place details uses the shared resizable map with the selected pin and returns to results", () => {
  const places = getPlaceSearchPreview("Đà Lạt");
  const place = places[0];
  let backs = 0;
  const tree = PlaceDetailsContent({
    place,
    places,
    region: getPlaceMapRegion(places),
    onBack: () => {
      backs++;
    },
  });
  const map = elements(tree).find((node) => node.type === "TripPlanningMap");
  assert.ok(map);
  assert.equal(map.props.showLocationControl, false);
  assert.ok(isValidElement<Props>(map.props.mapContent));
  assert.equal(map.props.mapContent.props.focused?.id, place.id);
  assert.equal(map.props.mapContent.props.fitContainer, true);
  const back = elements(map.props.header).find(
    (node) => node.type === "DetailIconButton",
  );
  back?.props.onPress?.();
  assert.equal(backs, 1);
  assert.ok(text(tree).includes(place.name.vi));
  assert.ok(text(tree).includes(place.address?.vi ?? "missing address"));
  assert.ok(text(tree).includes("Giờ mở cửa"));
  assert.ok(text(tree).includes("Giá vé tham khảo"));
  assert.ok(text(tree).includes("Chưa đồng bộ bản đồ"));
  assert.equal(
    elements(tree).filter((node) => node.type === "Image").length,
    1,
  );
});

test("server content overrides preview facts and never invents a 45-minute visit", () => {
  const fixture = getPlaceSearchPreview("Đà Lạt")[0];
  const place = { ...fixture, durationMinutes: undefined };
  const tree = PlaceDetailsContent({
    place,
    places: [place],
    region: getPlaceMapRegion([place]),
    onBack: () => {},
    suppliedDetails: { photo: null },
  });
  assert.ok(text(tree).includes("Chưa có thông tin"));
  assert.ok(!text(tree).includes("Thông tin mẫu"));
  assert.ok(!text(tree).includes("45 phút"));
  assert.equal(
    elements(tree).filter((node) => node.type === "Image").length,
    0,
  );
});

test("unknown places don't borrow another place's photo, admission or opening hours", () => {
  const place: TripStop = {
    id: "custom-test",
    name: { vi: "Nhà mình", en: "Home" },
    kind: { vi: "Địa điểm riêng", en: "Private place" },
    time: "",
  };
  const preview = getPlaceDetailsPreview(place);
  assert.equal(preview.photo, null);
  assert.equal(preview.hours, undefined);
  assert.equal(preview.admission, undefined);
  const tree = PlaceDetailsContent({
    place,
    places: [],
    region: null,
    onBack: () => {},
  });
  assert.equal(
    elements(tree).some((node) => node.type === "TripPlanningMap"),
    false,
  );
  assert.equal(
    elements(tree).some((node) => node.type === "Image"),
    false,
  );
  assert.ok(text(tree).includes("Chưa có ảnh"));
  assert.ok(text(tree).includes("Chưa có thông tin"));
});

test("address details show selected location and the naming field without made-up visitor information", () => {
  const place = getAddressSearchPreview()[0];
  const tree = PlaceDetailsContent({
    place,
    places: [place],
    region: getPlaceMapRegion([place]),
    nameInput: "Tên địa điểm: Nhà mình",
    onBack: () => {},
  });
  assert.ok(text(tree).includes("Vị trí đã chọn"));
  assert.ok(text(tree).includes(place.address?.vi ?? "missing address"));
  assert.ok(text(tree).includes("Tên địa điểm: Nhà mình"));
  assert.ok(text(tree).includes("Chưa có thông tin"));
  assert.equal(text(tree).includes("45 phút"), false);
  assert.equal(text(tree).includes("Giờ mở cửa"), false);
  assert.equal(text(tree).includes("Chưa có ảnh"), false);
});

test("saved place admission takes priority over sample admission", () => {
  const place = getPlaceSearchPreview("Đà Lạt")[0];
  const updated = {
    ...place,
    quickInfo: { admission: { vi: "Theo hoạt động", en: "By activity" } },
  };
  assert.equal(getPlaceDetailsPreview(updated).admission?.vi, "Theo hoạt động");
});

test("sharing a place sends its name, address and coordinate link, without private itinerary notes", () => {
  const shared: { title: string; message: string }[] = [];
  const shareLoad = tripModuleLoader({
    react: { useState: (value: unknown) => [value, () => {}] },
    "react-native": {
      View: "View",
      Share: {
        share: async (value: { title: string; message: string }) => {
          shared.push(value);
        },
      },
    },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "./trip-details-header": { DetailIconButton: "DetailIconButton" },
  });
  const { SharePlaceButton } = shareLoad<
    typeof import("../src/features/trip/components/share-place-button.tsx")
  >("src/features/trip/components/share-place-button.tsx");
  const place = {
    ...getAddressSearchPreview()[0],
    name: { vi: "Nhà mình", en: "Home" },
    note: "Ghi chú riêng không chia sẻ",
  };
  const tree = SharePlaceButton({ place });
  elements(tree)
    .find((element) => element.type === "DetailIconButton")
    ?.props.onPress?.();
  assert.equal(shared.length, 1);
  assert.equal(shared[0].title, "Nhà mình");
  assert.ok(shared[0].message.includes(place.address?.vi ?? "missing address"));
  assert.ok(
    shared[0].message.includes(
      encodeURIComponent(
        `${place.location?.latitude},${place.location?.longitude}`,
      ),
    ),
  );
  assert.equal(shared[0].message.includes(place.note), false);
});
