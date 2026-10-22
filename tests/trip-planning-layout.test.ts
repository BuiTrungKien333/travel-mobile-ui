import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidElement, type ReactNode } from "react";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { Trip } from "../src/features/home/types/home-types.ts";

const load = tripModuleLoader();
const { getPlanningMapBounds } = load<
  typeof import("../src/features/trip/utils/planning-map-layout.ts")
>("src/features/trip/utils/planning-map-layout.ts");
const { appendTripDayRange } = load<
  typeof import("../src/features/trip/utils/append-trip-day.ts")
>("src/features/trip/utils/append-trip-day.ts");
const { applyTripMutation } = load<
  typeof import("../src/features/trip/utils/trip-mutations.ts")
>("src/features/trip/utils/trip-mutations.ts");

test("planning split uses 35/80 percent snap points and keeps the date selector inside the viewport", () => {
  const normal = getPlanningMapBounds({
    screenHeight: 720,
    viewportHeight: 640,
    headerHeight: 68,
    selectorHeight: 54,
  });
  assert.ok(Math.abs(normal.collapsed - 252) < 0.001);
  assert.equal(normal.expanded, 576);
  for (const viewportHeight of [0, 180, 320, 640]) {
    const bounds = getPlanningMapBounds({
      screenHeight: 720,
      viewportHeight,
      headerHeight: 100,
      selectorHeight: 80,
    });
    assert.ok(bounds.collapsed >= 0 && bounds.collapsed <= bounds.expanded);
    assert.ok(bounds.expanded <= Math.max(0, viewportHeight - 80));
  }
});

test("adding the next day crosses month/year boundaries and preserves saved itinerary data", () => {
  const trip: Trip = {
    id: "test",
    destination: "Đà Lạt",
    status: "planned",
    startDate: "2026-12-31",
    endDate: "2026-12-31",
    days: [{ date: "2026-12-31", startTime: "08:00", stops: [] }],
    notes: "Keep this",
  };
  const range = appendTripDayRange(trip);
  assert.ok(range);
  assert.equal(range.endDate, "2027-01-01");
  const updated = applyTripMutation(trip, { kind: "dates", ...range });
  assert.ok(updated);
  assert.equal(updated.days.length, 2);
  assert.equal(updated.days[0].startTime, "08:00");
  assert.equal(updated.days[1].date, "2027-01-01");
  assert.equal(updated.notes, "Keep this");
  assert.equal(trip.days.length, 1);
});

test("append respects the trip-day limit and doesn't invent dates for missing/invalid ranges", () => {
  const trip: Trip = {
    id: "test",
    destination: "Đà Lạt",
    status: "draft",
    days: [],
  };
  assert.equal(appendTripDayRange(trip), null);
  assert.equal(
    appendTripDayRange({
      ...trip,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    }),
    null,
  );
  assert.equal(
    appendTripDayRange({
      ...trip,
      startDate: "2026-02-30",
      endDate: "2026-03-01",
    }),
    null,
  );
});

type Row =
  | { kind: "day"; key: string; date: string; index: number }
  | { kind: "backlog" | "add"; key: string };
type ListProps = {
  data: Row[];
  renderItem: (input: { item: Row }) => ReactNode;
};
type Props = { children?: ReactNode; onPress?: () => void };
function texts(node: ReactNode): string[] {
  if (typeof node === "string" || typeof node === "number")
    return [String(node)];
  if (Array.isArray(node)) return node.flatMap(texts);
  return isValidElement<Props>(node) ? texts(node.props.children) : [];
}
test("actual date items show day and abbreviated weekday/date; plus appends rather than selecting backlog", () => {
  const tokens = load<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const ui = tripModuleLoader({
    "react-native": {
      FlatList: "FlatList",
      Pressable: "Pressable",
      View: "View",
      useWindowDimensions: () => ({ fontScale: 1 }),
    },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
  });
  const { TripPlanningDaySelector } = ui<
    typeof import("../src/features/trip/components/trip-planning-day-selector.tsx")
  >("src/features/trip/components/trip-planning-day-selector.tsx");
  let selected: string | null = null;
  let added = 0;
  const node = TripPlanningDaySelector({
    trip: {
      id: "test",
      destination: "Đà Lạt",
      status: "planned",
      days: [{ date: "2026-10-24", stops: [] }],
    },
    selectedDate: "2026-10-24",
    backlog: false,
    backlogCount: 0,
    addDayDisabled: false,
    onSelect: (date) => {
      selected = date;
    },
    onAddDay: () => {
      added++;
    },
  });
  assert.ok(isValidElement<ListProps>(node));
  const day = node.props.renderItem({ item: node.props.data[0] });
  assert.deepEqual(Array.from(texts(day)), ["Ngày 1", "T7, 24/10"]);
  assert.ok(isValidElement<Props>(day));
  day.props.onPress?.();
  assert.equal(selected, "2026-10-24");
  const last = node.props.data.at(-1);
  assert.ok(last);
  const add = node.props.renderItem({ item: last });
  assert.ok(isValidElement<Props>(add));
  add.props.onPress?.();
  assert.equal(added, 1);
  assert.equal(selected, "2026-10-24");
});
