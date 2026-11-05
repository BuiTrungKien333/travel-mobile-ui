import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidElement } from "react";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { Trip, TripDay, TripStop, TravelMode } from "../src/features/home/types/home-types.ts";

const origin = { latitude: 11.9, longitude: 108.4 };
const pointA = { latitude: 11.94, longitude: 108.44 };
const pointB = { latitude: 11.95, longitude: 108.45 };
const stop = (id: string, location?: TripStop["location"]): TripStop => ({
  id, time: "10:00", name: { vi: id, en: id }, kind: { vi: "", en: "" }, location,
});
const load = tripModuleLoader();
const { dayRoutePoints, routePoints } = load<typeof import("../src/features/trip/utils/day-route.ts")>("src/features/trip/utils/day-route.ts");
function plain(value: unknown) { return JSON.parse(JSON.stringify(value)); }
function elementTypes(node: unknown): unknown[] {
  if (Array.isArray(node)) return node.flatMap(elementTypes);
  if (!isValidElement<{ children?: unknown }>(node)) return [];
  return [node.type, ...elementTypes(node.props.children)];
}

test("a disabled native route cannot draw a cached polyline for a partial or unrelated route", () => {
  const load = tripModuleLoader({
    "react-native": { View: "View", Platform: { OS: "android" } },
    "react-native-maps": { __esModule: true, default: "MapView", Marker: "Marker", Polyline: "Polyline", PROVIDER_GOOGLE: "google" },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ layout: { tripMapPreviewHeight: 200, iconLarge: 20 },
      radius: { lg: 12, sm: 4 }, colors: {}, spacing: { sm: 8, xs: 4 } }) },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" }, "@/components/ui/app-text": { AppText: "AppText" },
    "../i18n/place-search-copy": { usePlaceSearchCopy: () => ({ copy: {}, locale: "vi" }) },
    "../api/maps-hooks": { usePlaceRouteQuery: () => ({ isError: false,
      data: { encodedPolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@", distanceMeters: 1000, durationSeconds: 300 } }) },
  });
  const { PlaceSearchMap } = load<typeof import("../src/features/trip/components/place-search-map.native.tsx")>("src/features/trip/components/place-search-map.native.tsx");
  const props = { places: [stop("A", pointA), stop("B", pointB)], region: { ...origin, span: 0.1 }, custom: false };
  assert.equal(elementTypes(PlaceSearchMap({ ...props, showRoute: false })).includes("Polyline"), false);
  assert.equal(elementTypes(PlaceSearchMap({ ...props, showRoute: true })).includes("Polyline"), true);
});

test("daily route includes the saved origin and the optional return leg in visit order", () => {
  const day: TripDay = { date: "2026-11-20", startLocation: "Hotel", startCoordinate: origin,
    stops: [stop("A", pointA), stop("B", pointB)] };
  assert.deepEqual(plain(dayRoutePoints(day)), [origin, pointA, pointB]);
  assert.deepEqual(plain(dayRoutePoints({ ...day, returnToStart: true })), [origin, pointA, pointB, origin]);
  assert.deepEqual(plain(dayRoutePoints({ date: day.date, stops: day.stops })), [pointA, pointB]);
});
test("unknown origins or visits cannot be silently omitted from a route", () => {
  assert.equal(dayRoutePoints({ date: "2026-11-20", startLocation: "Unresolved hotel", stops: [stop("A", pointA)] }), null);
  assert.equal(routePoints([stop("A", pointA), stop("unknown"), stop("B", pointB)], origin), null);
  assert.equal(routePoints([stop("A", pointA)], undefined, true), null);
});
test("choosing a visit as origin does not add zero-length duplicate legs", () => {
  assert.deepEqual(plain(routePoints([stop("A", pointA), stop("B", pointB)], pointA, true)), [pointA, pointB, pointA]);
  assert.deepEqual(plain(routePoints([stop("A", pointA)], pointA, true)), [pointA]);
  assert.deepEqual(plain(routePoints([], origin, true)), []);
});
test("route requests and cache keys follow the selected transport", async () => {
  type Options = { queryKey: unknown[]; enabled: boolean; queryFn: (context: { signal: AbortSignal }) => Promise<unknown> };
  const options: Options[] = [];
  const sent: Record<string, unknown>[] = [];
  const load = tripModuleLoader({
    "@tanstack/react-query": { useQuery: (value: Options) => { options.push(value); return {}; } },
    "@/services/api/client": { apiClient: { post: async (_url: string, body: Record<string, unknown>) => {
      sent.push(body); return { data: { success: true, data: { distanceMeters: 1000, durationSeconds: 300, encodedPolyline: "", provider: "fixture" } } };
    } } },
  });
  const { usePlaceRouteQuery } = load<typeof import("../src/features/trip/api/maps-hooks.ts")>("src/features/trip/api/maps-hooks.ts");
  function RouteProbe({ mode }: { mode: TravelMode }) {
    usePlaceRouteQuery([origin, pointA, pointB, origin], true, mode);
    return null;
  }
  for (const mode of ["car", "motorcycle", "walk"] as const) {
    RouteProbe({ mode });
    assert.equal(options.at(-1)?.enabled, true);
    await options.at(-1)?.queryFn({ signal: new AbortController().signal });
  }
  assert.deepEqual(sent.map((body) => body.travelMode), ["DRIVE", "TWO_WHEELER", "WALK"]);
  assert.equal(new Set(options.map((value) => JSON.stringify(value.queryKey))).size, 3);
  assert.deepEqual(plain(sent[2].intermediates), [pointA, pointB]);
  assert.deepEqual(plain(sent[2].destination), origin);
});
test("transport-only edits preserve coordinates while changing or clearing the label invalidates them", () => {
  const { toUpdateTripDayRequest } = load<typeof import("../src/features/trip/api/save-trip-day.ts")>("src/features/trip/api/save-trip-day.ts");
  const trip: Trip = { id: "40000000-0000-0000-0000-000000000001", destination: "Da Lat", status: "draft", serverVersion: 1,
    days: [{ date: "2026-11-20", stops: [], startLocation: "Hotel", startCoordinate: origin }] };
  const mode = toUpdateTripDayRequest(trip, { kind: "day", date: trip.days[0].date, values: { transport: "walk" } });
  assert.deepEqual(plain(mode.startCoordinate), origin);
  const renamed = toUpdateTripDayRequest(trip, { kind: "day", date: trip.days[0].date, values: { startLocation: "Other hotel" } });
  assert.equal(renamed.startCoordinate, null);
  const clear = toUpdateTripDayRequest(trip, { kind: "day", date: trip.days[0].date, values: { startLocation: "" } });
  assert.equal(clear.startCoordinate, null);
  assert.equal(clear.startLocation, null);
  assert.deepEqual(trip.days[0].startCoordinate, origin);
});
test("origin form requires an actual selected point, accepts zero coordinates and rejects invalid ones", () => {
  const load = tripModuleLoader({ "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) } });
  const { useTripDetailsCopy } = load<typeof import("../src/features/trip/i18n/trip-details-copy.ts")>("src/features/trip/i18n/trip-details-copy.ts");
  const { tripStartPointSchema } = load<typeof import("../src/features/trip/schemas/trip-details-schema.ts")>("src/features/trip/schemas/trip-details-schema.ts");
  const schema = tripStartPointSchema(useTripDetailsCopy().copy);
  const values = { startLocation: "Selected place", startTime: "07:45", returnToStart: true };
  assert.equal(schema.safeParse(values).success, false);
  assert.equal(schema.safeParse({ ...values, startCoordinate: { latitude: 0, longitude: 0 } }).success, true);
  assert.equal(schema.safeParse({ ...values, startCoordinate: { latitude: 91, longitude: 0 } }).success, false);
  assert.equal(schema.safeParse({ startLocation: "", startTime: "", returnToStart: false, startCoordinate: null }).success, true);
});
