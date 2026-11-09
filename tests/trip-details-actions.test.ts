import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidElement, type ReactNode } from "react";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { Trip } from "../src/features/home/types/home-types.ts";

type ButtonProps = {
  children?: ReactNode;
  onPress?: () => void;
  variant?: string;
};
function buttons(node: ReactNode): ButtonProps[] {
  if (Array.isArray(node)) return node.flatMap(buttons);
  if (!isValidElement<ButtonProps>(node)) return [];
  return [
    ...(node.type === "AppButton" ? [node.props] : []),
    ...buttons(node.props.children),
  ];
}
const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
  "src/theme/tokens.ts",
);
const load = tripModuleLoader({
  "react-native": {
    View: "View",
    StyleSheet: { create: (styles: unknown) => styles, hairlineWidth: 1 },
  },
  "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
  "@/hooks/use-screen-insets": { useScreenInsets: () => ({ bottom: 24 }) },
  "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
  "@/components/ui/app-button": { AppButton: "AppButton" },
  "@/components/ui/app-icon": { AppIcon: "AppIcon" },
  "./trip-recap-content": { ShareTripButton: "ShareTripButton" },
  "./trip-optimize-slider": { TripOptimizeSlider: "TripOptimizeSlider" },
});
const { TripDetailsActions } = load<
  typeof import("../src/features/trip/components/trip-details-actions.tsx")
>("src/features/trip/components/trip-details-actions.tsx");

test("actual action bar exposes mode-specific CTAs and invokes the correct actions", () => {
  const invoked: string[] = [];
  const props = {
    trip: {
      id: "trip",
      destination: "Đà Lạt",
      status: "planned",
      days: [],
    } satisfies Trip,
    canOptimize: true,
    onOptimize: () => invoked.push("optimize"),
    onVisited: () => invoked.push("visited"),
    onDirections: () => invoked.push("expandMap"),
    onJournal: () => invoked.push("journal"),
    onInfo: () => invoked.push("info"),
  };
  const planning = TripDetailsActions({ ...props, mode: "planning" });
  assert.deepEqual(buttons(planning), []);
  const slider = planning?.props.children;
  assert.ok(isValidElement<{ onOptimize: () => void }>(slider));
  assert.equal(slider.type, "TripOptimizeSlider");
  slider.props.onOptimize();
  assert.equal(
    TripDetailsActions({ ...props, mode: "planning", canOptimize: false }),
    null,
  );
  const live = buttons(
    TripDetailsActions({
      ...props,
      mode: "live",
      nextStop: {
        id: "square",
        time: "11:00",
        name: { vi: "Lâm Viên", en: "Lam Vien" },
        kind: { vi: "Quảng trường", en: "Square" },
      },
    }),
  );
  assert.equal(live.length, 2);
  assert.equal(live[0].children, "Chỉ đường");
  live[0].onPress?.();
  assert.equal(live[1].children, "Đã ghé");
  live[1].onPress?.();
  const completed = buttons(TripDetailsActions({ ...props, mode: "live" }));
  assert.deepEqual(
    completed.map((button) => button.children),
    ["Xem kỷ niệm"],
  );
  const recap = buttons(TripDetailsActions({ ...props, mode: "recap" }));
  assert.deepEqual(
    recap.map((button) => button.children),
    ["Xem kỷ niệm"],
  );
  recap[0].onPress?.();
  const cancelled = buttons(
    TripDetailsActions({ ...props, mode: "cancelled" }),
  );
  assert.deepEqual(
    cancelled.map((button) => button.children),
    ["Thông tin chuyến đi"],
  );
  assert.deepEqual(invoked, ["optimize", "expandMap", "visited", "journal"]);
});
