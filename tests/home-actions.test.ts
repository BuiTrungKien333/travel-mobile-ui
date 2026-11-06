import assert from "node:assert/strict";
import { test } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../src/services/api/api-error.ts";
import { tripQueryKeys } from "../src/features/trip/api/trip-query-keys.ts";
import { memoryQueryKeys } from "../src/features/home/api/memory-query-keys.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

function harness() {
  const client = new QueryClient();
  const calls: unknown[] = [];
  let changedSession = false;
  let session = 1;
  const load = tripModuleLoader({
    "@tanstack/react-query": {
      useMutation: (options: unknown) => options,
      useQueryClient: () => client,
    },
    react: { useEffect: () => {} },
    "@/features/auth/hooks/use-auth": {
      useProfile: () => ({ data: { id: "owner" } }),
    },
    "@/features/auth/services/auth-session": {
      authSession: { getVersion: () => session },
    },
    "@/services/api/api-error": { ApiError },
    "@/features/trip/api/trip-place-api": {
      tripPlacesApi: {
        updatePlace: async (...args: unknown[]) => {
          calls.push(args);
          if (changedSession) session++;
        },
      },
    },
    "@/features/memories/api/memory-api": {
      memoryApi: { removePhoto: async (id: string) => calls.push(id) },
    },
    "./home-api": {},
  });
  type Visit = { tripId: string; placeId: string };
  const { useHomeActions } = load<{
    useHomeActions: () => {
      visit: {
        mutationFn: (v: Visit) => Promise<void>;
        onSuccess: (result: undefined, v: Visit) => Promise<unknown>;
      };
      removePhoto: {
        mutationFn: (id: string) => Promise<void>;
        onSuccess: () => Promise<unknown>;
      };
    };
  }>("src/features/home/api/home-queries.ts");
  return {
    client,
    calls,
    actions: useHomeActions(),
    changeSession: () => {
      changedSession = true;
    },
  };
}

test("Home visit persists the Place UUID and refreshes only the affected account and trip", async () => {
  const h = harness();
  try {
    const home = tripQueryKeys.dashboard("owner");
    const places = tripQueryKeys.places("owner", "trip");
    const foreign = tripQueryKeys.dashboard("other");
    const unrelated = tripQueryKeys.places("owner", "another-trip");
    const memories = memoryQueryKeys.list("owner");
    for (const key of [home, places, foreign, unrelated, memories])
      h.client.setQueryData(key, {});
    const input = { tripId: "trip", placeId: "place" };
    await h.actions.visit.mutationFn(input);
    await h.actions.visit.onSuccess(undefined, input);
    assert.deepEqual(JSON.parse(JSON.stringify(h.calls)), [
      ["trip", "place", { visited: true }],
    ]);
    for (const key of [home, places])
      assert.equal(h.client.getQueryState(key)?.isInvalidated, true);
    for (const key of [foreign, unrelated, memories])
      assert.equal(h.client.getQueryState(key)?.isInvalidated, false);
  } finally {
    h.client.clear();
  }
});

test("Home photo delete uses Media UUID and refreshes owner albums and dashboard", async () => {
  const h = harness();
  try {
    const keys = [
      tripQueryKeys.dashboard("owner"),
      memoryQueryKeys.list("owner"),
      memoryQueryKeys.list("owner", "trip"),
    ];
    const foreign = memoryQueryKeys.list("other");
    for (const key of [...keys, foreign]) h.client.setQueryData(key, {});
    await h.actions.removePhoto.mutationFn("media-id");
    await h.actions.removePhoto.onSuccess();
    assert.deepEqual(h.calls, ["media-id"]);
    for (const key of keys)
      assert.equal(h.client.getQueryState(key)?.isInvalidated, true);
    assert.equal(h.client.getQueryState(foreign)?.isInvalidated, false);
  } finally {
    h.client.clear();
  }
});

test("Home rejects mutation results when the session changes during the request", async () => {
  const h = harness();
  try {
    h.changeSession();
    await assert.rejects(
      h.actions.visit.mutationFn({ tripId: "trip", placeId: "place" }),
      { code: "CANCELLED" },
    );
  } finally {
    h.client.clear();
  }
});
