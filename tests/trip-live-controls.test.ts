import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidElement } from "react";
import type { Trip, TripStop } from "../src/features/home/types/home-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Props = {
  children?: unknown;
  accessibilityRole?: string;
  accessibilityLabel?: string;
  "aria-checked"?: boolean;
  name?: string;
  onPress?: () => void;
};
function elements(node: unknown): Props[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (typeof node === "function") return elements(node(() => {}));
  if (!isValidElement<Props>(node)) return [];
  return [node.props, ...elements(node.props.children)];
}
function text(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (typeof node === "function") return text(node(() => {}));
  if (Array.isArray(node)) return node.map(text).join(" ");
  return isValidElement<Props>(node) ? text(node.props.children) : "";
}
const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
  "src/theme/tokens.ts",
);
const load = tripModuleLoader({
  react: { useState: () => [0, () => {}] },
  "react-native": {
    Pressable: "Pressable",
    View: "View",
    ScrollView: "ScrollView",
    StyleSheet: {
      create: (value: unknown) => value,
      hairlineWidth: 1,
      absoluteFill: {},
    },
  },
  "expo-image": { Image: "Image" },
  "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
  "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
  "@/components/ui/app-text": { AppText: "AppText" },
  "@/components/ui/app-button": { AppButton: "AppButton" },
  "@/components/ui/app-icon": { AppIcon: "AppIcon" },
  "@/components/common/glass-backdrop": { GlassBackdrop: "GlassBackdrop" },
  "../data/trip-details-preview": {
    getPreviewLeg: () => null,
    getStopImage: () => 1,
    getDayTravel: () => null,
    getTripForecast: () => null,
  },
  "./trip-stop-interactions": {
    TripStopDragFrame: "TripStopDragFrame",
    TripStopInteractions: "TripStopInteractions",
  },
});
const { TripStopRow } = load<
  typeof import("../src/features/trip/components/trip-stop-row.tsx")
>("src/features/trip/components/trip-stop-row.tsx");
const { TripDayTools } = load<
  typeof import("../src/features/trip/components/trip-details-overview.tsx")
>("src/features/trip/components/trip-details-overview.tsx");
const { TripStartNode } = load<
  typeof import("../src/features/trip/components/trip-timeline-states.tsx")
>("src/features/trip/components/trip-timeline-states.tsx");
const { TripMapPreview } = load<
  typeof import("../src/features/trip/components/trip-map-preview.tsx")
>("src/features/trip/components/trip-map-preview.tsx");
const stop: TripStop = {
  id: "square",
  time: "11:00",
  name: { vi: "Lâm Viên", en: "Lam Vien" },
  kind: { vi: "Quảng trường", en: "Square" },
};
const trip: Trip = {
  id: "live",
  destination: "Đà Lạt",
  status: "planned",
  days: [{ date: "2026-10-21", stops: [stop] }],
};

test("Live summary opens the shared optimizer for a day with multiple stops", () => {
  const opened: string[] = [];
  const props = {
    trip,
    day: { ...trip.days[0], stops: [stop, { ...stop, id: "museum" }] },
    today: "2026-10-21",
    canEdit: false,
    editHistory: false,
    showWeather: false,
    showOptimize: true,
    onSheetChange: (sheet: { kind: string }) => opened.push(sheet.kind),
  };
  const optimize = elements(TripDayTools(props)).filter(
    (element) => element.accessibilityLabel === "Tối ưu lộ trình",
  );
  assert.equal(optimize.length, 1);
  optimize[0].onPress?.();
  assert.deepEqual(opened, ["optimize"]);
  assert.equal(
    elements(TripDayTools({ ...props, day: trip.days[0] })).some(
      (element) => element.accessibilityLabel === "Tối ưu lộ trình",
    ),
    false,
  );
  assert.equal(
    elements(TripDayTools({ ...props, showOptimize: false })).some(
      (element) => element.accessibilityLabel === "Tối ưu lộ trình",
    ),
    false,
  );
});

test("connected day tools display the saved route summary and chosen transport", () => {
  const opened: string[] = [];
  const props = {
    trip,
    day: trip.days[0],
    today: "2026-10-21",
    canEdit: true,
    editHistory: false,
    showWeather: false,
    routeSummary: "12,4 km · 45 phút",
    transportLabel: "Đi bộ",
    transportIcon: "walk" as const,
    onSheetChange: (sheet: { kind: string }) => opened.push(sheet.kind),
  };
  const tools = TripDayTools(props);
  assert.match(text(tools), /12,4 km · 45 phút/);
  const transport = elements(tools).find((item) =>
    item.accessibilityLabel?.endsWith(": Đi bộ"),
  );
  assert.ok(transport);
  transport.onPress?.();
  assert.deepEqual(opened, ["transport"]);
  assert.doesNotMatch(
    text(TripDayTools({ ...props, routeSummary: null })),
    /12,4 km/,
  );
});

test("Live timeline check-in is a separate marker control without opening details or adding a large button", () => {
  let visits = 0;
  let opened = 0;
  const props = {
    stop,
    mode: "car" as const,
    number: 1,
    last: true,
    next: true,
    visited: false,
    onOpen: () => {
      opened++;
    },
    onVisited: () => {
      visits++;
    },
  };
  const row = TripStopRow(props);
  const checks = elements(row).filter(
    (element) => element.accessibilityRole === "checkbox",
  );
  assert.equal(checks.length, 1);
  assert.equal(checks[0]["aria-checked"], false);
  checks[0].onPress?.();
  assert.equal(visits, 1);
  assert.equal(opened, 0);
  assert.equal(text(row).includes("Điểm tiếp theo"), true);
  assert.equal(text(row).includes("Đánh dấu đã ghé"), false);
  const visited = TripStopRow({ ...props, visited: true, next: false });
  const check = elements(visited).find(
    (element) => element.accessibilityRole === "checkbox",
  );
  assert.equal(check?.["aria-checked"], true);
  assert.ok(check?.accessibilityLabel?.includes("Bỏ đánh dấu"));
  check?.onPress?.();
  assert.equal(visits, 2);
});

test("Live origin hides missing/blank locations, uses saved lodging, and never prompts for a missing time", () => {
  const props = {
    trip,
    day: trip.days[0],
    canEdit: true,
    live: true,
    onPress: () => {},
  };
  assert.equal(TripStartNode(props), null);
  assert.equal(
    TripStartNode({ ...props, day: { ...props.day, startLocation: "   " } }),
    null,
  );
  const lodging = TripStartNode({
    ...props,
    trip: { ...trip, accommodation: "  Khách sạn A  " },
  });
  assert.ok(lodging);
  assert.ok(text(lodging).includes("Khách sạn A"));
  assert.equal(text(lodging).includes("Chưa đặt giờ"), false);
  const planned = TripStartNode({ ...props, live: false });
  assert.ok(text(planned).includes("Chưa đặt giờ"));
  assert.ok(text(planned).includes("Thêm nơi xuất phát"));
});

test("the map can omit an unknown Live start while retaining stop numbering", () => {
  const props = {
    stops: [stop],
    startLabel: "Thêm nơi xuất phát",
    onSelect: () => {},
    onStart: () => {},
  };
  const live = TripMapPreview({ ...props, showStart: false });
  const buttons = elements(live).filter(
    (element) => element.accessibilityRole === "button",
  );
  assert.equal(buttons.length, 1);
  assert.equal(buttons[0].accessibilityLabel, "1. Lâm Viên");
  const planned = TripMapPreview(props);
  assert.ok(
    elements(planned).some((element) =>
      element.accessibilityLabel?.startsWith("S."),
    ),
  );
  assert.doesNotThrow(() =>
    TripMapPreview({ ...props, stops: [], showStart: false }),
  );
});
