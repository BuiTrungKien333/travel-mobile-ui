import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { loadHomePreview } from "./helpers/load-home-preview.ts";
const load = tripModuleLoader();
const { getPlaceSearchPreview, getAddressSearchPreview } = load<
  typeof import("../src/features/trip/data/place-search-preview.ts")
>("src/features/trip/data/place-search-preview.ts");
const {
  normalizePlaceQuery,
  searchPlaces,
  getPlaceMapRegion,
  projectPlace,
  unprojectPlace,
} = load<typeof import("../src/features/trip/utils/place-search.ts")>(
  "src/features/trip/utils/place-search.ts",
);

test("street address results are searchable without a tourist place name and retain their own map region", () => {
  const addresses = getAddressSearchPreview();
  const match = searchPlaces(addresses, "100/25 quang trung go vap")[0];
  assert.ok(match?.location);
  assert.equal(match.locationType, "address");
  assert.ok(match.address?.vi.includes("Gò Vấp"));
  assert.equal(searchPlaces(addresses, "an unknown address").length, 0);
  const region = getPlaceMapRegion([match]);
  assert.ok(region);
  assert.equal(projectPlace(match.location, region).x, 0.5);
  assert.equal(projectPlace(match.location, region).y, 0.5);
});

test("search accepts Vietnamese without accents, English names, address words and whitespace", () => {
  const places = getPlaceSearchPreview("Đà Lạt, Lâm Đồng");
  assert.equal(normalizePlaceQuery("  ĐÀ LẠT  "), "da lat");
  for (const query of [
    "ho xuan huong",
    "Hồ Xuân Hương",
    "xuan huong lake",
    "  HO   HUONG  ",
  ])
    assert.equal(searchPlaces(places, query)[0]?.id, "lake");
  assert.equal(searchPlaces(places, "tran quoc toan")[0]?.id, "square");
  assert.equal(searchPlaces(places, "nơi không có").length, 0);
  assert.equal(searchPlaces(places, " ").length, places.length);
});

test("exact names rank first without mutating the catalogue", () => {
  const places = getPlaceSearchPreview("Đà Lạt");
  const exact = places[0];
  const longer = {
    ...exact,
    id: "long",
    name: { vi: `${exact.name.vi} 2`, en: "A longer place name" },
  };
  const source = [longer, exact];
  assert.equal(searchPlaces(source, exact.name.vi)[0].id, exact.id);
  assert.equal(source[0].id, "long");
});

test("every supported fixture can focus a real coordinate, unknown destinations have no fake location", () => {
  for (const destination of ["Đà Lạt", "Đà Nẵng", "Hội An", "Nha Trang"]) {
    const places = getPlaceSearchPreview(destination);
    const region = getPlaceMapRegion(places);
    assert.ok(region);
    for (const place of places) {
      assert.ok(place.location);
      const point = projectPlace(place.location, region);
      assert.ok(point.x > 0 && point.x < 1 && point.y > 0 && point.y < 1);
      const restored = unprojectPlace(point.x, point.y, region);
      assert.ok(Math.abs(restored.latitude - place.location.latitude) < 1e-8);
      assert.ok(Math.abs(restored.longitude - place.location.longitude) < 1e-8);
    }
  }
  assert.equal(getPlaceSearchPreview("Unknown").length, 0);
  assert.equal(getPlaceMapRegion([]), null);
});

test("confirming chosen places preserves coordinates and addresses in the shared itinerary", () => {
  const { createPreviewStore } = loadHomePreview();
  const store = createPreviewStore();
  store.getState().changeScenario("new");
  assert.equal(
    store.getState().createDraft({
      destination: "Đà Lạt",
      startDate: "2026-10-24",
      endDate: "2026-10-25",
    }),
    true,
  );
  const trip = store.getState().trips[0];
  const square = getPlaceSearchPreview("Đà Lạt").find(
    (place) => place.id === "square",
  );
  assert.ok(square?.location);
  assert.equal(
    store.getState().mutateTrip(trip.id, {
      kind: "add",
      date: trip.days[1].date,
      stops: [square, square],
    }),
    true,
  );
  const updated = store.getState().trips[0];
  assert.equal(updated.days[0].stops.length, 0);
  assert.equal(updated.days[1].stops.length, 1);
  assert.equal(
    updated.days[1].stops[0].location?.latitude,
    square.location.latitude,
  );
  assert.equal(updated.days[1].stops[0].address?.vi, square.address?.vi);
  assert.equal(updated.days[1].stops[0].time, "");
  assert.equal(
    store.getState().mutateTrip(trip.id, {
      kind: "add",
      date: "2027-01-01",
      stops: [square],
    }),
    false,
  );
});
