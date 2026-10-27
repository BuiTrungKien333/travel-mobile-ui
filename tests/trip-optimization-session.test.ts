import assert from "node:assert/strict";
import { test } from "node:test";
import type { TripDay } from "../src/features/home/types/home-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Sheet = {
  props: {
    onClose: () => void;
    scrollEnabled: boolean;
    footer: { props: { disabled: boolean; onPress: () => void } };
    children: { props: { order: string[] | null } };
  };
};

function harness(ids = ["square", "lake", "museum"]) {
  const day: TripDay = {
    date: "2026-10-24",
    stops: ids.map((id, index) => ({
      id,
      time: `${9 + index}:30`,
      name: { vi: id, en: id },
      kind: { vi: "", en: "" },
    })),
  };
  let initialized = false;
  let draft: string[] | null;
  let draggedId: string | null = null;
  let reorder: (ids: string[]) => void = () => {};
  const applied: string[][] = [];
  let closed = 0;
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const load = tripModuleLoader({
    react: {
      useState: (initial: () => string[] | null) => {
        if (!initialized) {
          draft = initial();
          initialized = true;
        }
        return [
          draft,
          (next: string[]) => {
            draft = next;
          },
        ];
      },
    },
    "react-native": {
      View: "View",
      StyleSheet: { create: (style: unknown) => style, hairlineWidth: 1 },
    },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/common/glass-backdrop": { GlassBackdrop: "GlassBackdrop" },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/components/ui/app-text": { AppText: "AppText" },
    "./trip-details-sheet": { TripDetailsSheet: "TripDetailsSheet" },
    "./trip-reorder": { TripReorderList: "TripReorderList" },
    "../hooks/use-trip-timeline-drag": {
      useTripTimelineDrag: (options: {
        onReorder: (ids: string[]) => void;
      }) => {
        reorder = options.onReorder;
        return { draggedId };
      },
    },
  });
  const { TripOptimizationSheet } = load<{
    TripOptimizationSheet: (props: {
      day: TripDay;
      onApply: (ids: string[]) => void;
      onClose: () => void;
    }) => Sheet;
  }>("src/features/trip/components/trip-optimization-preview.tsx");
  return {
    day,
    applied,
    render: () =>
      TripOptimizationSheet({
        day,
        onApply: (ids) => applied.push(Array.from(ids)),
        onClose: () => {
          closed++;
        },
      }),
    reorder: (ids: string[]) => reorder(ids),
    drag: (id: string | null) => {
      draggedId = id;
    },
    closed: () => closed,
  };
}

test("manual suggested-order edits stay local until Apply and preserve the current itinerary", () => {
  const h = harness();
  assert.deepEqual(Array.from(h.render().props.children.props.order ?? []), [
    "lake",
    "square",
    "museum",
  ]);
  h.reorder(["museum", "lake", "square"]);
  const sheet = h.render();
  assert.deepEqual(Array.from(sheet.props.children.props.order ?? []), [
    "museum",
    "lake",
    "square",
  ]);
  assert.equal(h.applied.length, 0);
  assert.deepEqual(
    h.day.stops.map((stop) => stop.id),
    ["square", "lake", "museum"],
  );
  sheet.props.footer.props.onPress();
  assert.deepEqual(h.applied, [["museum", "lake", "square"]]);
});

test("dragging locks scrolling and Apply, and dropping back to the current order disables Apply", () => {
  const h = harness();
  h.render();
  h.drag("lake");
  const dragging = h.render();
  assert.equal(dragging.props.scrollEnabled, false);
  assert.equal(dragging.props.footer.props.disabled, true);
  dragging.props.footer.props.onPress();
  assert.equal(h.applied.length, 0);
  h.drag(null);
  h.reorder(["square", "lake", "museum"]);
  const unchanged = h.render();
  assert.equal(unchanged.props.scrollEnabled, true);
  assert.equal(unchanged.props.footer.props.disabled, true);
  unchanged.props.footer.props.onPress();
  assert.equal(h.applied.length, 0);
});

test("closing discards manual preview edits; a new session starts with the suggestion", () => {
  const h = harness();
  h.render();
  h.reorder(["museum", "square", "lake"]);
  h.render().props.onClose();
  assert.equal(h.closed(), 1);
  assert.equal(h.applied.length, 0);
  const fresh = harness();
  assert.deepEqual(
    Array.from(fresh.render().props.children.props.order ?? []),
    ["lake", "square", "museum"],
  );
});

test("an unsupported preview cannot apply an empty suggestion", () => {
  const h = harness(["custom", "lake"]);
  const sheet = h.render();
  assert.equal(sheet.props.children.props.order, null);
  assert.equal(sheet.props.footer.props.disabled, true);
  sheet.props.footer.props.onPress();
  assert.equal(h.applied.length, 0);
});
