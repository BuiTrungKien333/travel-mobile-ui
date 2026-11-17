import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Node = { type: string; props: { children?: unknown } };
function text(value: unknown): string {
  if (Array.isArray(value)) return value.map(text).join(" ");
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (!value || typeof value !== "object") return "";
  return text((value as Node).props?.children);
}
function render(metadata?: Record<string, string>) {
  const tokens = tripModuleLoader()<Record<string, unknown>>("src/theme/tokens.ts");
  const load = tripModuleLoader({
    react: { useState: (initial: unknown) => [initial, () => {}] },
    "react-native": { View: "View" },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "./trip-day-map": { TripDayMap: "TripDayMap" },
  });
  const { TripPlanningPreview } = load<{ TripPlanningPreview: (props: unknown) => Node }>("src/features/trip/components/trip-planning-preview.tsx");
  return text(TripPlanningPreview({ draft: { canApply: true, proposal: {
    metadata, days: [], issues: [], executionReport: { overallMode: "AI_ASSISTED" },
    weather: { status: "UNKNOWN", days: [] }, unassignedPlaces: [],
  } } }));
}
test("road preview describes Mapbox driving estimates without showing a straight-line label", () => {
  const output = render({ routeSource: "MAPBOX_DRIVING", routeStatus: "AVAILABLE" });
  assert.match(output, /Mapbox/);
  assert.match(output, /chưa tính giao thông trực tiếp/);
  assert.doesNotMatch(output, /35 km\/h/);
});
test("provider fallback and legacy stored drafts retain the explicit estimate label", () => {
  assert.match(render({ routeSource: "ESTIMATED_HAVERSINE_35_KMH" }), /35 km\/h/);
  assert.match(render(), /35 km\/h/);
});
test("unreachable road preview asks for adjustment rather than claiming valid Mapbox times", () => {
  const output = render({ routeSource: "MAPBOX_DRIVING", routeStatus: "UNREACHABLE" });
  assert.match(output, /Chưa tìm được tuyến đường bộ/);
  assert.doesNotMatch(output, /Thứ tự ghé được tối ưu/);
});
