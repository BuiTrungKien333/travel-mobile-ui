import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import {
  tripReadSchema,
  type TripReadDto,
} from "../src/features/trip/api/trip-contract.ts";
import { tripQueryKeys } from "../src/features/trip/api/trip-query-keys.ts";
import { hasVisitedAllTripPlaces } from "../src/features/trip/utils/trip-completion.ts";
import { ApiError } from "../src/services/api/api-error.ts";
import * as tokens from "../src/theme/tokens.ts";
import { lightColors } from "../src/theme/colors.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const spec = JSON.parse(
  readFileSync(
    new URL("../docs/api/trip-crud.openapi.json", import.meta.url),
    "utf8",
  ),
);
function live(): TripReadDto {
  const read = tripReadSchema.parse(
    spec.components.schemas.TripResponse.example.data,
  );
  read.trip.mode = "LIVE";
  read.trip.stopCount = 2;
  return read;
}

test("completion suggestion requires every place across the trip, including other days and backlog", () => {
  const read = live();
  assert.equal(hasVisitedAllTripPlaces(read, undefined), false);
  assert.equal(hasVisitedAllTripPlaces(read, []), false);
  assert.equal(hasVisitedAllTripPlaces(read, [{ visited: true }]), false);
  assert.equal(
    hasVisitedAllTripPlaces(read, [{ visited: true }, { visited: false }]),
    false,
  );
  assert.equal(
    hasVisitedAllTripPlaces(read, [{ visited: true }, { visited: true }]),
    true,
  );
  read.trip.stopCount = 0;
  assert.equal(hasVisitedAllTripPlaces(read, []), false);
  read.trip.stopCount = 2;
  read.trip.mode = "RECAP";
  assert.equal(
    hasVisitedAllTripPlaces(read, [{ visited: true }, { visited: true }]),
    false,
  );
});

test("completion POST sends version only and validates responses", async () => {
  const calls: unknown[] = [];
  let response: unknown = { success: true, data: live() };
  const { tripApi } = tripModuleLoader({
    "@/services/api/client": {
      apiClient: {
        post: async (...args: unknown[]) => {
          calls.push(args);
          return { data: response };
        },
      },
    },
    "@/services/api/api-error": { ApiError },
  })<typeof import("../src/features/trip/api/trip-api.ts")>(
    "src/features/trip/api/trip-api.ts",
  );
  const read = await tripApi.complete(live().trip.id, 3);
  assert.equal(read.trip.id, live().trip.id);
  assert.equal(
    JSON.stringify(calls[0]),
    JSON.stringify([`/api/v1/trips/${read.trip.id}/complete`, { version: 3 }]),
  );
  for (const version of [-1, 0.5, Number.NaN])
    await assert.rejects(tripApi.complete(read.trip.id, version), {
      code: "INVALID_TRIP",
    });
  assert.equal(calls.length, 1);
  response = { success: true, data: {} };
  await assert.rejects(tripApi.complete(read.trip.id, 3), {
    code: "INVALID_RESPONSE",
  });
});

test("completion updates detail and refreshes account Home/list/itinerary without crossing sessions", async () => {
  const client = new QueryClient();
  const read = live();
  read.trip.mode = "RECAP";
  let session = 1;
  const owner = "owner";
  const load = tripModuleLoader({
    "@tanstack/react-query": {
      useMutation: (options: unknown) => options,
      useQueryClient: () => client,
    },
    "@/features/auth/hooks/use-auth": {
      useProfile: () => ({ data: { id: owner } }),
    },
    "@/features/auth/services/auth-session": {
      authSession: { getVersion: () => session },
    },
    "@/services/api/api-error": { ApiError },
    "./trip-api": { tripApi: { complete: async () => read } },
  });
  const { useCompleteTripMutation } = load<{
    useCompleteTripMutation: (id: string) => {
      mutationFn: (
        version: number,
      ) => Promise<{ read: TripReadDto; sessionVersion: number }>;
      onSuccess: (value: {
        read: TripReadDto;
        sessionVersion: number;
      }) => Promise<void>;
    };
  }>("src/features/trip/api/trip-queries.ts");
  const keys = [
    tripQueryKeys.dashboard(owner),
    tripQueryKeys.list(owner),
    tripQueryKeys.itinerary(owner, read.trip.id),
  ];
  try {
    keys.forEach((key) => client.setQueryData(key, {}));
    client.setQueryData(tripQueryKeys.dashboard("other"), {});
    const mutation = useCompleteTripMutation(read.trip.id);
    const result = await mutation.mutationFn(0);
    await mutation.onSuccess(result);
    assert.equal(
      client.getQueryData<TripReadDto>(
        tripQueryKeys.detail(owner, read.trip.id),
      )?.trip.mode,
      "RECAP",
    );
    keys.forEach((key) =>
      assert.equal(client.getQueryState(key)?.isInvalidated, true),
    );
    assert.equal(
      client.getQueryState(tripQueryKeys.dashboard("other"))?.isInvalidated,
      false,
    );
    session++;
    client.clear();
    await assert.rejects(mutation.onSuccess(result), { code: "CANCELLED" });
    assert.equal(
      client.getQueryData(tripQueryKeys.detail(owner, read.trip.id)),
      undefined,
    );
  } finally {
    client.clear();
  }
});

type Element = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Element;
  return [node, ...nodes(node.props.children)];
}
function harness(allVisited = true, confirmationOnly = false) {
  const states: unknown[] = [];
  let cursor = 0;
  let failure: unknown;
  let read = live();
  let closed = 0;
  const sent: number[] = [];
  const load = tripModuleLoader({
    react: {
      useState(initial: unknown) {
        const i = cursor++;
        if (!(i in states)) states[i] = initial;
        return [
          states[i],
          (value: unknown) => {
            states[i] = value;
          },
        ];
      },
      useRef(initial: unknown) {
        const i = cursor++;
        return (states[i] ??= { current: initial });
      },
    },
    "react/jsx-runtime": {
      jsx: (type: unknown, props: Element["props"]) => ({ type, props }),
      jsxs: (type: unknown, props: Element["props"]) => ({ type, props }),
    },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/features/home/components/journey-card": { JourneyCard: "JourneyCard" },
    "@/hooks/use-app-theme": {
      useAppTheme: () => ({ ...tokens, colors: lightColors }),
    },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/services/api/api-error": { ApiError },
    "../api/trip-queries": {
      useCompleteTripMutation: () => ({
        mutateAsync: async (version: number) => {
          sent.push(version);
          if (failure) throw failure;
        },
      }),
    },
    "./trip-delete-alert": { TripDeleteAlert: "TripDeleteAlert" },
  });
  const { TripCompletionAction } = load<
    typeof import("../src/features/trip/components/trip-completion-action.tsx")
  >("src/features/trip/components/trip-completion-action.tsx");
  function render() {
    cursor = 0;
    return TripCompletionAction({
      read,
      allVisited,
      confirmationOnly,
      onCompleted: () => {
        closed++;
      },
      onReload: async () => {
        read = { ...read, trip: { ...read.trip, version: 7 } };
        return read;
      },
    });
  }
  function press(type: string, event = "onPress") {
    const node = nodes(render()).find((node) => node.type === type);
    assert.ok(node, type);
    (node.props[event] as () => void)();
  }
  return {
    render,
    press,
    sent,
    fail: (value: unknown) => {
      failure = value;
    },
    closed: () => closed,
    setMode: (mode: TripReadDto["trip"]["mode"]) => {
      read.trip.mode = mode;
    },
  };
}
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

test("visiting all places only suggests completion; cancel never writes", () => {
  const h = harness();
  assert.equal(h.sent.length, 0);
  assert.equal(
    nodes(h.render()).some((node) => node.type === "JourneyCard"),
    true,
  );
  h.press("AppButton");
  assert.equal(h.sent.length, 0);
  h.press("TripDeleteAlert", "onCancel");
  assert.equal(
    nodes(h.render()).some((node) => node.type === "TripDeleteAlert"),
    false,
  );
  assert.equal(h.sent.length, 0);
});

test("menu confirmation opens one alert without nesting a sheet or rendering another trigger", () => {
  const h = harness(false, true);
  const rendered = nodes(h.render());
  assert.equal(
    rendered.filter((node) => node.type === "TripDeleteAlert").length,
    1,
  );
  assert.equal(
    rendered.some((node) => node.type === "AppButton"),
    false,
  );
  assert.equal(h.sent.length, 0);
});

test("explicit confirmation sends once and hides unavailable states", async () => {
  const h = harness(false);
  h.press("AppButton");
  h.press("TripDeleteAlert", "onConfirm");
  h.press("TripDeleteAlert", "onConfirm");
  await flush();
  assert.equal(h.sent.length, 1);
  assert.equal(h.closed(), 1);
  h.setMode("PLANNING");
  assert.equal(h.render(), null);
  h.setMode("RECAP");
  assert.equal(h.render(), null);
});

test("version conflict requires review and a new explicit confirmation", async () => {
  const h = harness();
  h.fail(new ApiError("TRIP_002"));
  h.press("AppButton");
  h.press("TripDeleteAlert", "onConfirm");
  await flush();
  const alert = nodes(h.render()).find(
    (node) => node.type === "TripDeleteAlert",
  );
  assert.ok(alert?.props.error);
  h.press("TripDeleteAlert", "onConfirm");
  await flush();
  assert.equal(h.sent.length, 1);
  h.fail(undefined);
  h.press("TripDeleteAlert", "onConfirm");
  await flush();
  assert.equal(h.sent[1], 7);
  assert.equal(h.closed(), 1);
});
