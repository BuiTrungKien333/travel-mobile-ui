import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidElement, type ReactElement } from "react";
import type { Memory } from "../src/features/home/types/home-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

test("Home shows uploaded and local photos and opens each with a valid memory route", () => {
  const routes: unknown[] = [];
  const memories: Memory[] = [
    { id: "uploaded-photo", tripId: "server-trip", photo: "https://example.com/photo.jpg", text: "Uploaded", destination: "Đà Lạt", date: "2026-01-01" },
    { id: "local-photo", photo: "file:///photo.jpg", text: "Local", destination: "", date: "2026-01-02" },
  ];
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>("src/theme/tokens.ts");
  const load = tripModuleLoader({
    react: { useState: (initial: unknown) => [initial, () => {}] },
    "../components/home-header": { HomeHeader: "HomeHeader" },
    "@/features/trip/components/create-trip-modal": { CreateTripModal: "CreateTripModal" },
    "@/features/trip/components/trip-status-badge": { TripStatusBadge: "TripStatusBadge" },
    "../components/home-live-journey": { HomeLiveJourney: "HomeLiveJourney" },
    "expo-router": { router: { push: (route: unknown) => routes.push(route) } },
    "expo-image": { Image: "Image" },
    "react-native": { ActivityIndicator: "Spinner", Pressable: "Pressable", View: "View" },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/features/trip/api/trip-hooks": { useTripsQuery: () => ({ data: [], isPending: false, isError: false }) },
    "@/features/memories/hooks/use-memories": {
      useMemories: () => ({ memories, isPending: false, isError: false }),
    },
    "../components/home-primitives": { HomePage: "HomePage", SectionHeading: "SectionHeading", SurfaceCard: "SurfaceCard" },
  });
  const { HomeScreen } = load<typeof import("../src/features/home/screens/home-screen.tsx")>("src/features/home/screens/home-screen.tsx");
  type Props = { children?: unknown; accessibilityLabel?: string; onPress?: () => void };
  function buttons(node: unknown): ReactElement<Props>[] {
    if (Array.isArray(node)) return node.flatMap(buttons);
    if (!isValidElement<Props>(node)) return [];
    return [...(node.type === "Pressable" ? [node] : []), ...buttons(node.props.children)];
  }
  const photos = buttons(HomeScreen()).filter((node) => node.props.accessibilityLabel === "Local" || node.props.accessibilityLabel === "Uploaded");
  assert.deepEqual(photos.map((node) => node.props.accessibilityLabel), ["Local", "Uploaded"]);
  photos.forEach((photo) => photo.props.onPress?.());
  assert.equal(routes[0], "/memories/saved-later");
  assert.equal(JSON.stringify(routes[1]), JSON.stringify({
    pathname: "/memories/photo/[memoryId]", params: { memoryId: "uploaded-photo", tripId: "server-trip" },
  }));
});
