import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ApiError } from "../src/services/api/api-error.ts";
import type { TripReadDto } from "../src/features/trip/api/trip-contract.ts";
import type {
  ItineraryResponse,
  SaveItineraryDayRequest,
} from "../src/features/trip/api/itinerary-types.ts";
import type { TripPlaceResponse } from "../src/features/trip/api/trip-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Element = { type: unknown; props: Record<string, any> };
function elements(value: any): Element[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  return value && typeof value === "object" && value.props
    ? [value, ...elements(value.props.children)]
    : [];
}
function harness(mode: "LIVE" | "RECAP" = "LIVE") {
  const spec = JSON.parse(
    readFileSync(
      new URL("../docs/api/trip-crud.openapi.json", import.meta.url),
      "utf8",
    ),
  );
  const read: TripReadDto = structuredClone(
    spec.components.schemas.TripResponse.example.data,
  );
  read.trip.mode = mode;
  const date = read.trip.days[0].date;
  read.context.evaluatedDate = date;
  const ids = {
    place: "11111111-1111-4111-8111-111111111111",
    other: "22222222-2222-4222-8222-222222222222",
    membership: "33333333-3333-4333-8333-333333333333",
    item: "44444444-4444-4444-8444-444444444444",
  };
  const membership: TripPlaceResponse = {
    id: ids.membership,
    tripId: read.trip.id,
    placeId: ids.place,
    place: {
      id: ids.place,
      providerPlaceId: null,
      name: "Saved lake",
      address: "Stored address",
      latitude: 11.94,
      longitude: 108.44,
      provinceId: null,
      provinceName: null,
      category: null,
      createdAt: "2026-11-01T00:00:00Z",
    },
    priority: 0,
    estimatedDuration: null,
    notes: null,
    plannedOrder: 0,
    visited: false,
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
  };
  const schedule: ItineraryResponse = {
    id: "55555555-5555-4555-8555-555555555555",
    tripId: read.trip.id,
    name: "Main",
    status: "DRAFT",
    updatedAt: "2026-11-01T00:00:00Z",
    days: [
      {
        date,
        stops: [
          {
            id: ids.item,
            placeId: ids.place,
            name: membership.place.name,
            address: "Stored address",
            latitude: 11.94,
            longitude: 108.44,
            category: null,
            arrivalTime: date + "T09:00:00",
            durationMinutes: 45,
            sequence: 0,
            note: "Old note",
            distanceFromPreviousKm: null,
            travelMinutesFromPrevious: null,
          },
          {
            id: "66666666-6666-4666-8666-666666666666",
            placeId: ids.other,
            name: "Second",
            address: null,
            latitude: null,
            longitude: null,
            category: null,
            arrivalTime: date + "T11:00:00",
            durationMinutes: 60,
            sequence: 1,
            note: "Keep this",
            distanceFromPreviousKm: null,
            travelMinutesFromPrevious: null,
          },
        ],
      },
    ],
  };
  let cursor = 0;
  const state: unknown[] = [];
  const saves: { date: string; request: SaveItineraryDayRequest }[] = [];
  const visits: unknown[] = [];
  let backs = 0;
  let nextSaveError: unknown;
  const save = {
    isPending: false,
    error: undefined as unknown,
    reset() {
      this.error = undefined;
    },
    mutateAsync: async (value: {
      date: string;
      request: SaveItineraryDayRequest;
    }) => {
      saves.push(value);
      if (nextSaveError) {
        save.error = nextSaveError;
        throw nextSaveError;
      }
      return schedule;
    },
  };
  const refetch = async () => ({ isError: false });
  const tokens = tripModuleLoader()<typeof import("../src/theme/tokens.ts")>(
    "src/theme/tokens.ts",
  );
  const componentMocks: Record<string, unknown> = {};
  for (const [module, names] of Object.entries({
    "@/components/common/screen-safe-area": ["ScreenSafeArea"],
    "@/components/common/glass-backdrop": ["GlassBackdrop"],
    "@/components/ui/app-button": ["AppButton"],
    "@/components/ui/app-icon": ["AppIcon"],
    "@/components/ui/app-text": ["AppText"],
    "../components/place-details-content": ["PlaceDetailsContent"],
    "../components/place-details-editorial": [
      "PlaceAmenities",
      "PlaceClassification",
      "PlaceIntroduction",
    ],
    "../components/trip-day-map": ["TripDayMap"],
    "../components/trip-visit-card": ["TripVisitCard"],
    "../components/share-place-button": ["SharePlaceButton"],
    "../components/connected-stop-schedule-sheet": [
      "ConnectedStopScheduleSheet",
    ],
    "../components/trip-delete-alert": ["TripDeleteAlert"],
    "../components/trip-details-header": ["DetailIconButton"],
  }))
    componentMocks[module] = Object.fromEntries(
      names.map((name) => [name, name]),
    );
  const load = tripModuleLoader({
    ...componentMocks,
    "@/services/api/client": { apiClient: {} },
    "@/services/api/api-error": { ApiError },
    react: {
      useMemo: (fn: () => unknown) => fn(),
      useState: (initial: unknown) => {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [
          state[index],
          (value: unknown) => {
            state[index] =
              typeof value === "function" ? value(state[index]) : value;
          },
        ];
      },
      useRef: (value: unknown) => {
        const index = cursor++;
        if (!(index in state)) state[index] = { current: value };
        return state[index];
      },
    },
    "react-native": {
      View: "View",
      KeyboardAvoidingView: "KeyboardAvoidingView",
      Platform: { OS: "android" },
      StyleSheet: { create: (value: unknown) => value, hairlineWidth: 1 },
    },
    "react-native-gesture-handler": {
      GestureHandlerRootView: "GestureHandlerRootView",
    },
    "expo-router": {
      router: {
        canGoBack: () => true,
        back: () => {
          backs++;
        },
        replace: () => {},
      },
    },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-screen-insets": {
      useScreenInsets: () => ({ top: 24, bottom: 24 }),
    },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "../api/trip-queries": { useTripQuery: () => ({ data: read, refetch }) },
    "../api/trip-hooks": {
      useTripPlacesQuery: () => ({ data: [membership], refetch }),
      useUpdateTripPlaceMutation: () => ({
        mutateAsync: async (value: unknown) => {
          visits.push(value);
        },
      }),
    },
    "../api/itinerary-hooks": {
      useTripItineraryQuery: () => ({ data: schedule, refetch }),
      useSaveItineraryDayMutation: () => save,
    },
    "../api/place-discovery-queries": {
      usePlaceDetail: () => ({ data: undefined }),
    },
  });
  const { ConnectedTripStopDetailsScreen } = load<
    typeof import("../src/features/trip/screens/connected-trip-stop-details-screen.tsx")
  >("src/features/trip/screens/connected-trip-stop-details-screen.tsx");
  const render = () => {
    cursor = 0;
    return elements(
      ConnectedTripStopDetailsScreen({
        tripId: read.trip.id,
        stopId: ids.item,
        day: date,
      }),
    );
  };
  const find = (type: string) =>
    render().find((node) => node.type === type)?.props;
  return {
    find,
    render,
    read,
    date,
    ids,
    save,
    saves,
    visits,
    schedule,
    failNextSave: (error: unknown) => {
      nextSaveError = error;
    },
    backs: () => backs,
  };
}

test("a timeline entry opens the stored place and edits only its own visit with the captured revisions", async () => {
  const h = harness();
  assert.equal(h.find("PlaceDetailsContent").place.name.vi, "Saved lake");
  assert.equal(h.find("ConnectedStopScheduleSheet"), undefined);
  h.find("TripVisitCard").onEdit();
  await h
    .find("ConnectedStopScheduleSheet")
    .onSave({
      date: h.date,
      time: "10:15",
      duration: "75",
      note: "  New note  ",
    });
  assert.equal(h.saves.length, 1);
  const { request } = h.saves[0];
  assert.equal(request.expectedTripVersion, h.read.trip.version);
  assert.equal(request.expectedUpdatedAt, h.schedule.updatedAt);
  assert.equal(request.stops[0].arrivalTime, h.date + "T10:15:00");
  assert.equal(request.stops[0].durationMinutes, 75);
  assert.equal(request.stops[0].note, "New note");
  assert.equal(request.stops[1].arrivalTime, h.date + "T11:00:00");
  assert.equal(request.stops[1].note, "Keep this");
});

test("visit actions address the Place UUID and removing requires confirmation before saving", async () => {
  const h = harness();
  h.render()
    .filter((node) => node.type === "AppButton")
    .at(-1)!
    .props.onPress();
  await new Promise(setImmediate);
  assert.equal(
    JSON.stringify(h.visits),
    JSON.stringify([{ placeId: h.ids.place, request: { visited: true } }]),
  );
  h.find("TripVisitCard").onRemove();
  assert.equal(h.saves.length, 0);
  h.find("TripDeleteAlert").onConfirm();
  await new Promise(setImmediate);
  assert.equal(h.saves[0].request.stops.length, 1);
  assert.equal(h.saves[0].request.stops[0].placeId, h.ids.other);
  assert.equal(h.saves[0].request.stops[0].sequence, 0);
  assert.equal(h.backs(), 1);
});

test("a stale revision keeps the editor open and requires reloading before another save", async () => {
  const h = harness();
  h.find("TripVisitCard").onEdit();
  h.failNextSave(new ApiError("TRIP_008"));
  await h
    .find("ConnectedStopScheduleSheet")
    .onSave({ date: h.date, time: "10:00", duration: "45", note: "" });
  const editor = h.find("ConnectedStopScheduleSheet");
  assert.match(editor.problem, /đã thay đổi/);
  assert.equal(typeof editor.onReload, "function");
  assert.equal(h.saves.length, 1);
  await editor.onSave({
    date: h.date,
    time: "10:00",
    duration: "45",
    note: "",
  });
  assert.equal(h.saves.length, 1);
  editor.onReload();
  await new Promise(setImmediate);
  assert.equal(
    h.render().some((node) => node.type === "ConnectedStopScheduleSheet"),
    false,
  );
});

test("completed trip visits remain read-only", () => {
  const h = harness("RECAP");
  const card = h.find("TripVisitCard");
  assert.equal(card.onEdit, undefined);
  assert.equal(card.onRemove, undefined);
  assert.equal(
    h
      .render()
      .filter((node) => node.type === "AppButton")
      .at(-1)!.props.disabled,
    true,
  );
});
