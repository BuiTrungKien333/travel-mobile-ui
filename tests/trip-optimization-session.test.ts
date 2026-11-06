import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidElement, type ReactElement } from "react";
import type { TripDay } from "../src/features/home/types/home-types.ts";
import type { ItineraryOptimizationProposal } from "../src/features/trip/api/itinerary-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Props = { children?: unknown; disabled?: boolean; onPress?: () => void; accessibilityRole?: string };
const day: TripDay = { date: "2026-11-06", stops: ["a", "b"].map((id, index) => ({ id,
  name: { vi: id, en: id }, kind: { vi: "Place", en: "Place" }, time: `${index + 9}:00`, durationMinutes: 30 })) };
function proposal(): ItineraryOptimizationProposal {
  return { status: "ALL_CLEAR", totalTripDistanceKm: 3, totalTripTransitMinutes: 7,
    dailySchedules: [{ dayDate: day.date, status: "ALL_CLEAR", totalDistanceKm: 3, totalTransitMinutes: 7,
      scheduleItems: [...day.stops].reverse().map((stop, index) => ({ placeId: stop.id, placeName: stop.id,
        plannedDate: day.date, displayDate: day.date, arrivalTime: `${day.date}T${index + 10}:00:00`, durationMinutes: 30,
        transitDistanceKmFromPrev: 1.5, transitMinutesFromPrev: 3 })) }],
  };
}
function elements(value: unknown): ReactElement<Props>[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!isValidElement<Props>(value)) return [];
  return [value, ...elements(value.props.children)];
}
function harness() {
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>("src/theme/tokens.ts");
  const load = tripModuleLoader({
    "react-native": { View: "View", ActivityIndicator: "Spinner", StyleSheet: { create: (styles: unknown) => styles } },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "en" }) },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/components/ui/app-text": { AppText: "AppText" }, "@/components/ui/app-button": { AppButton: "AppButton" },
    "./trip-details-sheet": { TripDetailsSheet: "TripDetailsSheet" },
  });
  const { TripOptimizationSheet } = load<typeof import("../src/features/trip/components/trip-optimization-preview.tsx")>("src/features/trip/components/trip-optimization-preview.tsx");
  let applied = 0; let closed = 0; let retried = 0;
  const props = { proposal: proposal(), daySettings: [day], loading: false, applying: false, error: undefined as string | undefined,
    onApply: () => { applied++; }, onClose: () => { closed++; }, onRetry: () => { retried++; } };
  function render() { return TripOptimizationSheet(props); }
  return { props, render, footer: () => render().props.footer as ReactElement<Props>,
    get applied() { return applied; }, get closed() { return closed; }, get retried() { return retried; } };
}

test("preview exposes before/after visits and only invokes apply after explicit confirmation", () => {
  const h = harness(); const before = JSON.stringify(day);
  const labels = elements(h.render()).map((element) => element.props.children).flat(Infinity).filter((value) => typeof value === "string").join(" ");
  assert.ok(labels.includes("Current")); assert.ok(labels.includes("Proposed"));
  assert.equal(h.footer().props.disabled, false);
  assert.equal(h.applied, 0); h.footer().props.onPress?.();
  assert.equal(h.applied, 1); assert.equal(JSON.stringify(day), before);
});

test("closing a proposal preserves the original itinerary and reopening begins with the server proposal", () => {
  const h = harness(); const before = JSON.stringify(day);
  h.render().props.onClose();
  assert.equal(h.closed, 1); assert.equal(h.applied, 0);
  assert.equal(JSON.stringify(day), before);
  const reopened = harness(); assert.equal(reopened.footer().props.disabled, false);
});

test("loading, applying and failed proposals disable apply and cannot retry during an apply", () => {
  const h = harness(); h.props.loading = true;
  assert.equal(h.footer().props.disabled, true);
  h.props.loading = false; h.props.applying = true; h.props.error = "Conflict";
  const sheet = h.render(); assert.equal(sheet.props.dismissible, false);
  assert.equal(h.footer().props.disabled, true);
  const retry = elements(sheet).find((element) => element.props.onPress === h.props.onRetry);
  assert.equal(retry?.props.disabled, true);
  h.props.applying = false; assert.equal(h.footer().props.disabled, true);
  h.props.onRetry(); assert.equal(h.retried, 1); assert.equal(h.applied, 0);
});

test("empty or foreign stops cannot enable Apply", () => {
  const h = harness(); h.props.proposal.dailySchedules = [];
  assert.equal(h.footer().props.disabled, true);
  assert.ok(elements(h.render()).some((element) => element.props.accessibilityRole === "alert"));
  h.props.proposal = proposal(); h.props.proposal.dailySchedules[0].scheduleItems[1].placeId = "unknown";
  assert.equal(h.footer().props.disabled, true);
});
