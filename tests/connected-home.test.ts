import assert from "node:assert/strict";
import { homeFixture } from "./helpers/home-dashboard-fixture.ts";
import type { HomeDashboard } from "../src/features/home/api/home-api.ts";
import { test } from "node:test";
import * as tokens from "../src/theme/tokens.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Node = { type: unknown; props: Record<string, unknown> };
const element = (type: unknown, props: Record<string, unknown>): Node => ({
  type,
  props,
});
function nodes(value: unknown, type: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap((child) => nodes(child, type));
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [
    ...(node.type === type ? [node] : []),
    ...nodes(node.props.children, type),
  ];
}
function press(node: Node | undefined) {
  assert.ok(node);
  const handler = node.props.onPress;
  assert.equal(typeof handler, "function");
  return (handler as () => unknown)();
}
const primitives = {
  HomePage: "HomePage",
  EnterSection: "EnterSection",
  SectionHeading: "SectionHeading",
  PreviewNotice: "PreviewNotice",
  TextAction: "TextAction",
  homeStyles: {},
};
function harness() {
  let refreshes = 0;
  const routes: unknown[] = [];
  const query = {
    data: undefined as HomeDashboard | undefined,
    isSuccess: false,
    isRefetching: false,
    isError: false,
    error: undefined as unknown,
    refetch: async () => {
      refreshes++;
    },
  };
  const load = tripModuleLoader({
    "react/jsx-runtime": { jsx: element, jsxs: element },
    react: { useState: () => [false, () => {}] },
    "expo-router": {
      router: {
        push: (route: unknown) => routes.push(structuredClone(route)),
        navigate: (route: unknown) => routes.push(structuredClone(route)),
      },
    },
    "@/services/api/client": { apiClient: {} },
    "@/features/weather/api/weather-queries": {
      useTripWeather: () => ({
        data: undefined,
        isPending: false,
        isError: false,
        refetch: async () => {},
      }),
    },
    "../components/connected-trip-weather": {
      TripWeatherModal: "TripWeatherModal",
      WeatherQueryStatus: "WeatherQueryStatus",
    },
    "@/features/auth/hooks/use-auth": {
      useProfile: () => ({ data: { id: "owner-a" } }),
    },
    "@/features/memories/hooks/use-memories": {
      useMemoryActions: () => ({ remove: { mutateAsync: async () => {} } }),
    },
    "../providers/trip-preview-provider": {
      useTripPreview: (select: (state: unknown) => unknown) =>
        select({ memories: [] }),
    },
    "../api/home-queries": {
      useHomeDashboard: () => query,
      useHomeActions: () => ({
        visit: { isError: false, isPending: false, reset: () => {} },
        removePhoto: {},
      }),
    },
    "../screens/ongoing-home-screen": {
      OngoingHomeScreen: "OngoingHomeScreen",
    },
    "./ongoing-home-screen": { OngoingHomeScreen: "OngoingHomeScreen" },
    "../components/upcoming-trip-card": {
      UpcomingTripCard: "UpcomingTripCard",
    },
    "../components/journey-invitation-card": {
      JourneyInvitationCard: "JourneyInvitationCard",
    },
    "../components/trip-completion-card": {
      TripCompletionCard: "TripCompletionCard",
    },
    "../components/footprint-card": { FootprintCard: "FootprintCard" },
    "../components/journal-album": { JournalAlbum: "JournalAlbum" },
    "../components/travel-weather-dashboard": {
      TravelWeatherDashboard: "TravelWeatherDashboard",
    },
    "../components/ongoing-trip-panels": { JourneySheet: "JourneySheet" },
    "../components/ongoing-weather-details": {
      OngoingWeatherDetails: "OngoingWeatherDetails",
    },
    "@/features/trip/api/trip-queries": { useTripsQuery: () => query },
    "@/features/trip/screens/connected-trips-screen": {
      ConnectedTripsScreen: "ConnectedTripsScreen",
    },
    "@/features/trip/i18n/trip-integration-copy": {
      useTripIntegrationCopy: () => ({
        copy: { loading: "Loading", retry: "Retry" },
      }),
      tripApiErrorMessage: () => "Network error",
    },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/hooks/use-app-theme": { useAppTheme: () => tokens },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "react-native": { View: "View" },
    "../components/home-primitives": primitives,
    "../components/trip-hero": { TripHero: "TripHero" },
    "../components/example-itinerary-card": {
      ExampleItineraryCard: "ExampleItineraryCard",
    },
  });
  const { ConnectedHomeScreen } = load<
    typeof import("../src/features/home/screens/connected-home-screen.tsx")
  >("src/features/home/screens/connected-home-screen.tsx");
  const { NewUserHomeScreen } = load<
    typeof import("../src/features/home/screens/new-user-home-screen.tsx")
  >("src/features/home/screens/new-user-home-screen.tsx");
  return {
    query,
    routes,
    render: ConnectedHomeScreen,
    NewUserHomeScreen,
    refreshes: () => refreshes,
  };
}

test("all server states reuse the Home dashboards, never the trip list", () => {
  const h = harness();
  for (const state of ["PLANNING", "UPCOMING"] as const) {
    h.query.data = homeFixture(state);
    const screen = h.render();
    assert.equal(nodes(screen, "UpcomingTripCard").length, 1);
    assert.equal(nodes(screen, "OngoingHomeScreen").length, 0);
    assert.equal(nodes(screen, "TravelWeatherDashboard")[0].props.live, true);
    assert.equal(
      nodes(screen, "UpcomingTripCard")[0].props.evaluatedDate,
      "2026-11-07",
    );
  }
  h.query.data = homeFixture("LIVE");
  assert.equal(nodes(h.render(), "OngoingHomeScreen").length, 1);
  h.query.data = homeFixture("RETURNING");
  assert.equal(nodes(h.render(), "JourneyInvitationCard").length, 1);
  assert.equal(nodes(h.render(), "UpcomingTripCard").length, 0);
  assert.equal(nodes(h.render(), "FootprintCard")[0].props.visitedPlaces, 0);
});

test("live Home camera keeps the just-visited membership and opens the selected trip album", () => {
  const h = harness();
  h.query.data = homeFixture("LIVE");
  const live = nodes(h.render(), "OngoingHomeScreen")[0];
  const runtime = live.props.runtime as {
    onCamera: (stop?: { id: string; tripPlaceId: string }) => void;
    onJournal: () => void;
  };
  runtime.onCamera({ id: "membership", tripPlaceId: "membership" });
  runtime.onJournal();
  const camera = h.routes[0] as {
    params: { tripId: string; day: string; stopId: string };
  };
  assert.equal(camera.params.stopId, "membership");
  assert.equal(camera.params.day, "2026-11-07");
  const album = h.routes[1] as { pathname: string; params: { tripId: string } };
  assert.equal(album.pathname, "/memories/[tripId]");
  assert.equal(album.params.tripId, camera.params.tripId);
});

test("confirmed NEW reuses onboarding without an account-wide preview notice", () => {
  const h = harness();
  h.query.data = homeFixture("NEW");
  assert.equal(h.render().type, h.NewUserHomeScreen);
  const screen = h.NewUserHomeScreen({});
  assert.equal(screen.type, "HomePage");
  assert.equal(nodes(screen, "ExampleItineraryCard").length, 1);
  assert.equal(nodes(screen, "PreviewNotice").length, 0);
  assert.equal(
    nodes(h.NewUserHomeScreen({ preview: true }), "PreviewNotice").length,
    1,
  );
});

test("loading/error never masquerade as NEW, and retry refetches", async () => {
  const h = harness();
  assert.notEqual(h.render().type, h.NewUserHomeScreen);
  h.query.isError = true;
  assert.equal(
    nodes(h.render(), "AppText")[0].props.accessibilityRole,
    "alert",
  );
  await press(nodes(h.render(), "AppButton")[0]);
  assert.equal(h.refreshes(), 1);
});

test("Home updates the selected card after server create/delete snapshots", () => {
  const h = harness();
  h.query.data = homeFixture("NEW");
  assert.equal(h.render().type, h.NewUserHomeScreen);
  h.query.data = homeFixture("UPCOMING");
  assert.equal(nodes(h.render(), "UpcomingTripCard").length, 1);
  h.query.data = homeFixture("NEW");
  assert.equal(h.render().type, h.NewUserHomeScreen);
});

test("reused onboarding actions open the real create form panel and the read-only sample sandbox", () => {
  const opened: { kind: string }[] = [];
  const theme = { ...tokens, colors: new Proxy({}, { get: () => "color" }) };
  const load = tripModuleLoader({
    "react/jsx-runtime": { jsx: element, jsxs: element },
    "react-native": {
      View: "View",
      StyleSheet: { create: (value: unknown) => value, hairlineWidth: 1 },
    },
    "react-native-reanimated": {
      __esModule: true,
      default: { View: "Animated.View" },
      useAnimatedStyle: (get: () => unknown) => get(),
    },
    "expo-image": { Image: "Image" },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/components/common/glass-backdrop": { GlassBackdrop: "GlassBackdrop" },
    "@/hooks/use-app-theme": { useAppTheme: () => theme },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "../providers/trip-preview-provider": {
      useTripPreview: (select: (value: unknown) => unknown) =>
        select({ openPanel: (panel: { kind: string }) => opened.push(panel) }),
    },
    "../hooks/use-home-ambient-motion": {
      useHomeAmbientMotion: () => ({ value: 0 }),
    },
    "../data/home-mocks": {
      homeImages: {},
      sampleItineraryDate: "2026-10-24",
      sampleItineraryStops: [],
    },
    "./home-primitives": primitives,
    "./sample-weather": { SampleWeather: "SampleWeather" },
    "./itinerary-stop-list": { ItineraryStopList: "ItineraryStopList" },
  });
  const { JourneyInvitationCard } = load<
    typeof import("../src/features/home/components/journey-invitation-card.tsx")
  >("src/features/home/components/journey-invitation-card.tsx");
  const { ExampleItineraryCard } = load<
    typeof import("../src/features/home/components/example-itinerary-card.tsx")
  >("src/features/home/components/example-itinerary-card.tsx");
  press(nodes(JourneyInvitationCard({ variant: "new" }), "AppButton")[0]);
  press(nodes(ExampleItineraryCard(), "TextAction")[0]);
  assert.equal(opened[0].kind, "create");
  assert.equal(opened[1].kind, "sample");
});
