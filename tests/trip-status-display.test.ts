import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidElement } from "react";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { Trip } from "../src/features/home/types/home-types.ts";
import { getTripDisplayStatus } from "../src/features/trip/utils/trip-formatters.ts";

function text(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join(" ");
  return isValidElement<{ children?: unknown }>(node)
    ? text(node.props.children)
    : "";
}

test("list badge and detail header agree on preparation labels in Vietnamese and English", () => {
  let locale: "vi" | "en" = "vi";
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const load = tripModuleLoader({
    "react-native": {
      View: "View",
      Pressable: "Pressable",
      StyleSheet: { create: (styles: unknown) => styles, hairlineWidth: 1 },
    },
    "@/hooks/use-app-theme": {
      useAppTheme: () => ({
        ...tokens,
        colors: new Proxy({}, { get: () => "color" }),
      }),
    },
    "@/hooks/use-i18n": { useI18n: () => ({ locale }) },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/components/common/glass-backdrop": { GlassBackdrop: "GlassBackdrop" },
  });
  const { TripStatusBadge } = load<
    typeof import("../src/features/trip/components/trip-status-badge.tsx")
  >("src/features/trip/components/trip-status-badge.tsx");
  const { TripDetailsHeader } = load<
    typeof import("../src/features/trip/components/trip-details-header.tsx")
  >("src/features/trip/components/trip-details-header.tsx");
  for (const language of ["vi", "en"] as const) {
    locale = language;
    for (const [startDate, vi, en] of [
      ["2026-11-13", "Sắp khởi hành", "Upcoming"],
      ["2026-11-14", "Đang lên kế hoạch", "Planning"],
    ]) {
      const trip: Trip = {
        id: "test",
        destination: "Đà Nẵng",
        status: "planned",
        serverMode: "PLANNING",
        startDate,
        endDate: startDate,
        days: [],
      };
      const today = "2026-11-06";
      const label = language === "vi" ? vi : en;
      assert.equal(
        text(
          TripStatusBadge({
            status: getTripDisplayStatus(trip, today),
            locale,
          }),
        ).trim(),
        label,
      );
      assert.ok(
        text(
          TripDetailsHeader({
            trip,
            mode: "planning",
            today,
            onBack: () => {},
          }),
        ).includes(label),
      );
    }
  }
});
