import assert from "node:assert/strict";
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
  const query = {
    data: undefined as
      | undefined
      | { pages: { content: unknown[]; totalElements: number }[] },
    isSuccess: false,
    isError: false,
    error: undefined as unknown,
    refetch: async () => {
      refreshes++;
    },
  };
  const load = tripModuleLoader({
    "react/jsx-runtime": { jsx: element, jsxs: element },
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
    render: ConnectedHomeScreen,
    NewUserHomeScreen,
    refreshes: () => refreshes,
  };
}

test("authenticated Home route uses the connected Home while UI preview keeps its original screen", () => {
  for (const preview of [false, true]) {
    const load = tripModuleLoader({
      "react/jsx-runtime": { jsx: element },
      "@/constants/development": { UI_PREVIEW_ENABLED: preview },
      "@/features/home/screens/home-screen": { HomeScreen: "HomeScreen" },
      "@/features/home/screens/connected-home-screen": {
        ConnectedHomeScreen: "ConnectedHomeScreen",
      },
    });
    const route = load<{ default: () => Node }>(
      "src/app/(workspace)/tabs/index.tsx",
    );
    assert.equal(
      route.default().type,
      preview ? "HomeScreen" : "ConnectedHomeScreen",
    );
  }
});

test("confirmed empty account reuses first-trip and sample itinerary design without account-wide preview copy", () => {
  const h = harness();
  h.query.data = { pages: [{ content: [], totalElements: 0 }] };
  h.query.isSuccess = true;
  assert.equal(h.render().type, h.NewUserHomeScreen);
  const screen = h.NewUserHomeScreen({});
  assert.equal(screen.type, "HomePage");
  assert.equal(screen.props.showHeader, true);
  assert.equal(
    (nodes(screen, "TripHero")[0].props.selection as { kind: string }).kind,
    "new",
  );
  assert.equal(nodes(screen, "ExampleItineraryCard").length, 1);
  assert.equal(nodes(screen, "PreviewNotice").length, 0);
  assert.equal(
    nodes(h.NewUserHomeScreen({ preview: true }), "PreviewNotice").length,
    1,
  );
});

test("loading and failed/refetch states never masquerade as a new account; retry refetches", async () => {
  const h = harness();
  assert.notEqual(h.render().type, h.NewUserHomeScreen);
  assert.equal(nodes(h.render(), "AppText")[0].props.children, "Loading");
  h.query.isError = true;
  assert.equal(
    nodes(h.render(), "AppText")[0].props.accessibilityRole,
    "alert",
  );
  await press(nodes(h.render(), "AppButton")[0]);
  assert.equal(h.refreshes(), 1);
  h.query.data = { pages: [{ content: [], totalElements: 0 }] };
  assert.notEqual(h.render().type, h.NewUserHomeScreen);
});

test("Home reacts to server trip count after creation and deletion, not merely first-page content", () => {
  const h = harness();
  h.query.isSuccess = true;
  h.query.data = { pages: [{ content: [], totalElements: 1 }] };
  assert.equal(h.render().type, "ConnectedTripsScreen");
  h.query.data = { pages: [{ content: [], totalElements: 0 }] };
  assert.equal(h.render().type, h.NewUserHomeScreen);
  h.query.data = {
    pages: [{ content: [{ id: "server-trip" }], totalElements: 1 }],
  };
  assert.equal(h.render().type, "ConnectedTripsScreen");
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
