import assert from "node:assert/strict";
import { test } from "node:test";
import type { ReactElement } from "react";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

test("Home reports a failed itinerary separately from memories, even when another request is pending", () => {
  let retries = 0;
  const query = { data: undefined, isPending: true, isError: false, isFetching: false, refetch: () => { retries++; } };
  const load = tripModuleLoader({
    react: { useEffect() {}, useState() {} },
    "expo-router": { router: {} },
    "react-native": { View: "View" },
    "@/components/common/query-feedback": { QueryFeedback: "Feedback" },
    "@/components/ui/app-text": { AppText: "Text" },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ spacing: { sm: 8 } }) },
    "@/features/trip/api/trip-hooks": { useTripQuery: () => query, useTripPlacesQuery: () => query },
    "@/features/trip/api/itinerary-hooks": { useTripItineraryQuery: () => ({ ...query, isPending: false, isError: true }) },
    "@/features/trip/hooks/use-trip-visit": {},
    "../i18n/home-copy": { useHomeCopy: () => ({ copy: { todayItineraryLoadError: "Itinerary failed" } }) },
    "../i18n/ongoing-copy": {},
    "./ongoing-trip-components": {},
  });
  const { HomeLiveJourney } = load<{ HomeLiveJourney(props: { tripId: string; today: string }): ReactElement<{
    children: ReactElement<{ loading: boolean; error: string; onRetry(): void }>;
  }> }>("src/features/home/components/home-live-journey.tsx");
  const feedback = HomeLiveJourney({ tripId: "trip", today: "2026-11-06" }).props.children.props;
  assert.equal(feedback.error, "Itinerary failed");
  assert.equal(feedback.loading, false);
  feedback.onRetry(); assert.equal(retries, 3);
});
