import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { SaveItineraryDayRequest } from "../src/features/trip/api/itinerary-types.ts";
import type { TripStop } from "../src/features/home/types/home-types.ts";

const ids = [1, 2, 3, 4].map(
  (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
);
const [a, b, c, d] = ids;
const date = "2026-11-08";

test("grouped reorder preserves visited times and place metadata instead of assigning old slot times", () => {
  const { reorderDayStops } = tripModuleLoader()<
    typeof import("../src/features/trip/utils/itinerary-day-order.ts")
  >("src/features/trip/utils/itinerary-day-order.ts");
  const stops: SaveItineraryDayRequest["stops"] = ids.map(
    (placeId, sequence) => ({
      placeId,
      sequence,
      arrivalTime: `${date}T${String(8 + sequence).padStart(2, "0")}:00:00`,
      durationMinutes: sequence === 2 ? 60 : 45,
      note: placeId,
    }),
  );
  const ordered = reorderDayStops(stops, [a, c, d, b], [a, c]);
  assert.ok(ordered);
  assert.equal(ordered[1].arrivalTime, stops[2].arrivalTime);
  assert.equal(ordered[1].durationMinutes, 60);
  assert.equal(ordered[1].note, c);
  assert.deepEqual(
    Array.from(ordered, (stop) => stop.sequence),
    [0, 1, 2, 3],
  );
  assert.equal(reorderDayStops(stops, [c, a, d, b], [a, c]), null);
});

test("optimization API accepts a visited prefix and rejects a changed or malformed partition", async () => {
  let payload: unknown = {
    order: [a, c, d, b],
    originalOrder: ids,
    visitedOrder: [a, c],
    distanceMeters: 2000,
    durationSeconds: 1200,
    originalDistanceMeters: 18000,
    originalDurationSeconds: 7200,
  };
  const calls: string[] = [];
  const load = tripModuleLoader({
    "@tanstack/react-query": { useMutation: (config: unknown) => config },
    "@/hooks/use-app-theme": {},
    "@/features/auth/hooks/use-auth": {
      useProfile: () => ({ data: { id: "owner" } }),
    },
    "@/services/api/client": {
      apiClient: {
        post: async (path: string) => {
          calls.push(path);
          return { data: { success: true, data: payload } };
        },
      },
    },
  });
  const { useOptimizeDayRoute } = load<{
    useOptimizeDayRoute: (id: string) => {
      mutationFn: (input: {
        date: string;
        mode: "DRIVE";
      }) => Promise<{ visitedOrder: string[]; order: string[] }>;
    };
  }>("src/features/trip/api/trip-day-route.ts");
  const query = useOptimizeDayRoute("trip");
  const result = await query.mutationFn({ date, mode: "DRIVE" });
  assert.deepEqual(Array.from(result.visitedOrder), [a, c]);
  assert.deepEqual(Array.from(result.order), [a, c, d, b]);
  assert.equal(
    calls[0],
    `/api/v1/trips/trip/itinerary/days/${date}/route/optimize`,
  );
  payload = {
    order: [c, a, d, b],
    originalOrder: ids,
    visitedOrder: [a, c],
    distanceMeters: 2,
    durationSeconds: 2,
    originalDistanceMeters: 4,
    originalDurationSeconds: 4,
  };
  await assert.rejects(
    query.mutationFn({ date, mode: "DRIVE" }),
    (error: unknown) =>
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "INVALID_RESPONSE",
  );
});

test("optimization sheet locks visited rows and cannot apply a dragged order crossing that prefix", () => {
  let state: string[] | undefined;
  let drag:
    | { stops: TripStop[]; onReorder: (ids: string[]) => void }
    | undefined;
  const applied: string[][] = [];
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const load = tripModuleLoader({
    react: {
      useState: (initial: () => string[]) => {
        state ??= initial();
        return [
          state,
          (next: string[]) => {
            state = next;
          },
        ];
      },
    },
    "react/jsx-runtime": {
      jsx: (type: unknown, props: unknown) => ({ type, props }),
      jsxs: (type: unknown, props: unknown) => ({ type, props }),
    },
    "react-native": {
      View: "View",
      StyleSheet: { create: (value: unknown) => value, hairlineWidth: 1 },
    },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/ui/app-button": { AppButton: "Button" },
    "@/components/ui/app-text": { AppText: "Text" },
    "@/components/ui/app-icon": { AppIcon: "Icon" },
    "@/components/common/glass-backdrop": { GlassBackdrop: "Glass" },
    "./trip-details-sheet": { TripDetailsSheet: "Sheet" },
    "./trip-reorder": { TripReorderList: "ReorderList" },
    "../data/trip-details-preview": {
      suggestedDayOrder: () => null,
      getDayTravel: () => null,
    },
    "../hooks/use-trip-timeline-drag": {
      useTripTimelineDrag: (input: {
        stops: TripStop[];
        onReorder: (ids: string[]) => void;
      }) => {
        drag = input;
        return { draggedId: null };
      },
    },
  });
  const { TripOptimizationSheet } = load<{
    TripOptimizationSheet: (props: {
      day: { date: string; stops: TripStop[] };
      proposal: {
        order: string[];
        lockedPrefixIds: string[];
        comparison: unknown;
      };
      onApply: (ids: string[]) => void;
      onClose: () => void;
    }) => {
      props: { footer: { props: { disabled: boolean; onPress: () => void } } };
    };
  }>("src/features/trip/components/trip-optimization-preview.tsx");
  const props = {
    day: {
      date,
      stops: ids.map((id, index) => ({
        id,
        name: { vi: id, en: id },
        kind: { vi: "", en: "" },
        time: "08:00",
        visited: index === 0 || index === 2,
      })),
    },
    proposal: { order: [a, c, d, b], lockedPrefixIds: [a, c], comparison: {} },
    onApply: (order: string[]) => applied.push(Array.from(order)),
    onClose() {},
  };
  let sheet = TripOptimizationSheet(props);
  assert.ok(drag);
  assert.deepEqual(
    Array.from(
      drag.stops.filter((stop) => stop.pinned),
      (stop) => stop.id,
    ),
    [a, c],
  );
  assert.equal(sheet.props.footer.props.disabled, false);
  sheet.props.footer.props.onPress();
  assert.deepEqual(applied, [[a, c, d, b]]);
  drag.onReorder([c, a, d, b]);
  sheet = TripOptimizationSheet(props);
  assert.equal(sheet.props.footer.props.disabled, true);
  sheet.props.footer.props.onPress();
  assert.equal(applied.length, 1);
});
