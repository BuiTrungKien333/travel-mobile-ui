import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Node = { type: string; props: { children?: unknown } };
function text(value: unknown): string {
  if (Array.isArray(value)) return value.map(text).join(" ");
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (!value || typeof value !== "object") return "";
  return text((value as Node).props?.children);
}
function render({
  metadata,
  overallMode = "AI_ASSISTED",
  canApply = true,
  issues = [],
}: {
  metadata?: Record<string, string>;
  overallMode?: "AI_ASSISTED" | "AI_WITH_FALLBACK" | "FALLBACK";
  canApply?: boolean;
  issues?: { code: string; blocking: boolean; message: string }[];
}) {
  const tokens = tripModuleLoader()<Record<string, unknown>>(
    "src/theme/tokens.ts",
  );
  const load = tripModuleLoader({
    react: { useState: (initial: unknown) => [initial, () => {}] },
    "expo-router": { router: { push: () => {} } },
    "react-native": {
      View: "View",
      Pressable: "Pressable",
      useWindowDimensions: () => ({ width: 390, height: 844 }),
    },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "./trip-day-map": { TripDayMap: "TripDayMap" },
    "./trip-stop-row": { TripStopRow: "TripStopRow" },
  });
  const { TripPlanningPreview } = load<{
    TripPlanningPreview: (props: unknown) => Node;
  }>("src/features/trip/components/trip-planning-preview.tsx");
  return text(
    TripPlanningPreview({
      draft: {
        tripId: "trip",
        canApply,
        input: {
          origin: { name: "Hotel", latitude: 16.06, longitude: 108.22 },
        },
        proposal: {
          metadata,
          days: [],
          issues,
          executionReport: { overallMode },
          weather: { status: "UNKNOWN", days: [] },
          unassignedPlaces: [],
        },
      },
    }),
  );
}
test("road preview shows AI provenance badge and unapplied status without blocking alerts", () => {
  const output = render({
    metadata: { routeSource: "MAPBOX_DRIVING", routeStatus: "AVAILABLE" },
  });
  assert.match(output, /Bản nháp chưa lưu vào lịch trình/);
  assert.match(output, /Có đề xuất từ AI/);
  assert.match(output, /Chưa áp dụng/);
  assert.doesNotMatch(output, /Cần điều chỉnh yêu cầu trước khi áp dụng/);
});
test("fallback drafts clearly display the basic itinerary label", () => {
  assert.match(
    render({
      metadata: { routeSource: "ESTIMATED_HAVERSINE_35_KMH" },
      overallMode: "FALLBACK",
    }),
    /Lịch trình cơ bản/,
  );
  assert.match(
    render({ overallMode: "AI_WITH_FALLBACK" }),
    /AI kết hợp phương án cơ bản/,
  );
});
test("unreachable road preview surfaces blocking issue and asks for adjustment", () => {
  const output = render({
    metadata: { routeSource: "MAPBOX_DRIVING", routeStatus: "UNREACHABLE" },
    canApply: false,
    issues: [
      {
        code: "ROUTE_UNAVAILABLE",
        blocking: true,
        message: "Chưa tìm được tuyến đường bộ nối đủ các điểm.",
      },
    ],
  });
  assert.match(output, /Cần điều chỉnh yêu cầu trước khi áp dụng/);
  assert.match(output, /Chưa tìm được tuyến đường bộ/);
});
