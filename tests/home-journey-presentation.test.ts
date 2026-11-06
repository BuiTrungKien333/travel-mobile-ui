import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidElement, type ReactElement } from "react";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { TripSummary } from "../src/features/trip/api/trip-types.ts";

const today = "2026-11-06";
function trip(overrides: Partial<TripSummary> = {}): TripSummary {
  return { id: "trip", title: "My journey", destination: { name: "Da Lat" }, startDate: "2026-11-10", endDate: "2026-11-12",
    timeZone: "Asia/Ho_Chi_Minh", status: "READY", mode: "PLANNING", readiness: { hasDates: true, hasPlaces: true, unscheduledCount: 0 },
    dayCount: 3, stopCount: 4, memoryCount: 0, coverImageUrl: null, version: 0,
    createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z", ...overrides };
}
const load = tripModuleLoader();
const { selectHomeJourney } = load<typeof import("../src/features/home/utils/home-journey.ts")>("src/features/home/utils/home-journey.ts");

test("Home gives ongoing journeys priority, then nearest departure, then editable drafts and memories", () => {
  const active = trip({ id: "active", status: "ACTIVE" });
  const nearest = trip({ id: "nearest", startDate: "2026-11-07" });
  const draft = trip({ id: "draft", status: "PLANNING" });
  const completed = trip({ id: "past", status: "COMPLETED" });
  const values = [trip(), completed, draft, nearest, active];
  assert.equal(selectHomeJourney(values, today).trip?.id, "active");
  assert.equal(selectHomeJourney(values.filter((item) => item.id !== "active"), today).trip?.id, "nearest");
  assert.equal(selectHomeJourney([completed, draft], today).state, "draft");
  assert.equal(selectHomeJourney([completed], today).state, "completed");
});

test("draft dates and cancelled trips never become ongoing journeys or completed footprint counts", () => {
  const datedDraft = trip({ status: "PLANNING", startDate: "2026-11-01", endDate: today });
  const cancelled = trip({ status: "CANCELLED", endDate: "2026-11-01" });
  assert.equal(selectHomeJourney([datedDraft, cancelled], today).state, "draft");
  assert.equal(selectHomeJourney([datedDraft, cancelled], today).completed.length, 0);
  assert.equal(selectHomeJourney([cancelled], today).state, "new");
  assert.equal(selectHomeJourney([], today).trip, undefined);
  assert.equal(selectHomeJourney([trip({ startDate: today, endDate: today })], today).state, "ongoing");
});

type Props = { children?: unknown; label?: string; onPress?: () => void; visible?: boolean; onCreated?: (id: string) => void; tripId?: string };
function nodes(node: unknown, type: string): ReactElement<Props>[] {
  if (Array.isArray(node)) return node.flatMap((item) => nodes(item, type));
  if (!isValidElement<Props>(node)) return [];
  return [...(node.type === type ? [node] : []), ...nodes(node.props.children, type)];
}

function homeFixture(trips: TripSummary[], failed = false) {
  let visible = false;
  const routes: unknown[] = [];
  const tokens = load<typeof import("../src/theme/tokens.ts")>("src/theme/tokens.ts");
  const homeLoad = tripModuleLoader({
    react: { useState: () => [visible, (value: boolean) => { visible = value; }] },
    "expo-router": { router: { push: (route: unknown) => routes.push(route), navigate: (route: unknown) => routes.push(route) } },
    "react-native": { View: "View", Pressable: "Pressable", ActivityIndicator: "Spinner" }, "expo-image": { Image: "Image" },
    "@/components/ui/app-text": { AppText: "AppText" }, "@/components/ui/app-icon": { AppIcon: "AppIcon" }, "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) }, "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/utils/calendar-date": { todayCalendarDate: () => today },
    "@/features/trip/api/trip-hooks": { useTripsQuery: () => ({ data: trips, isPending: false, isError: failed }) },
    "@/components/common/query-feedback": { QueryFeedback: "QueryFeedback" },
    "@/features/memories/hooks/use-memories": { useMemories: () => ({ memories: [], isPending: false, isError: false }) },
    "../components/home-header": { HomeHeader: "HomeHeader" }, "../components/home-live-journey": { HomeLiveJourney: "HomeLiveJourney" },
    "@/features/trip/components/create-trip-modal": { CreateTripModal: "CreateTripModal" },
    "@/features/trip/components/trip-status-badge": { TripStatusBadge: "TripStatusBadge" },
    "../components/home-primitives": { HomePage: "HomePage", SurfaceCard: "SurfaceCard", SectionHeading: "SectionHeading", TextAction: "TextAction" },
  });
  const { HomeScreen } = homeLoad<typeof import("../src/features/home/screens/home-screen.tsx")>("src/features/home/screens/home-screen.tsx");
  return { render: HomeScreen, routes };
}

test("first-trip CTA opens the real creation form directly and opens the created server trip", () => {
  const f = homeFixture([]);
  const create = nodes(f.render(), "AppButton").find((node) => node.props.children === "Tạo chuyến đi");
  assert.ok(create); create.props.onPress?.();
  const modal = nodes(f.render(), "CreateTripModal")[0];
  assert.equal(modal.props.visible, true);
  modal.props.onCreated?.("created-id");
  assert.equal(JSON.stringify(f.routes[0]), JSON.stringify({ pathname: "/trip/[tripId]", params: { tripId: "created-id" } }));
});

test("completed Home action opens that journey's album; only an ongoing journey mounts live actions", () => {
  const f = homeFixture([trip({ status: "COMPLETED", id: "past" })]);
  const album = nodes(f.render(), "AppButton").find((node) => node.props.children === "Xem kỷ niệm chuyến đi");
  assert.ok(album); album.props.onPress?.();
  assert.equal(JSON.stringify(f.routes[0]), JSON.stringify({ pathname: "/memories/[tripId]", params: { tripId: "past" } }));
  assert.equal(nodes(f.render(), "HomeLiveJourney").length, 0);
  const active = homeFixture([trip({ status: "ACTIVE", id: "active" })]);
  assert.equal(nodes(active.render(), "HomeLiveJourney")[0].props.tripId, "active");
});

test("background request errors retain the cached Home journey and its primary action", () => {
  const f = homeFixture([trip()], true);
  assert.ok(nodes(f.render(), "AppButton").some((node) => node.props.children === "Xem kế hoạch"));
  assert.equal(nodes(f.render(), "QueryFeedback").length, 1);
});

test("today plan opens the selected server trip on today's calendar date", () => {
  const f = homeFixture([trip({ status: "ACTIVE", id: "active" })]);
  const action = nodes(f.render(), "TextAction").find((node) => node.props.label === "Xem lịch hôm nay");
  assert.ok(action); action.props.onPress?.();
  assert.equal(JSON.stringify(f.routes[0]), JSON.stringify({ pathname: "/trip/[tripId]", params: { tripId: "active", day: today } }));
});
