import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

test("local gallery reads only the current account without calling remote trip or memory queries", () => {
  let owner: string | undefined = "A";
  const records = [
    { id: "a", local: { userId: "A" } },
    { id: "b", local: { userId: "B" } },
    { id: "legacy", local: {} },
    { id: "remote" },
  ];
  const load = tripModuleLoader({
    "@/constants/development": { UI_PREVIEW_ENABLED: false },
    "@tanstack/react-query": {
      useQuery: () => {
        throw new Error("No remote dependency");
      },
    },
    "@/features/auth/services/auth-session": { authSession: {} },
    "@/features/auth/hooks/use-auth": {
      useProfile: () => ({ data: owner ? { id: owner } : undefined }),
    },
    "@/features/home/providers/trip-preview-provider": {
      useTripPreview: (
        select: (state: { memories: typeof records }) => unknown,
      ) => select({ memories: records }),
    },
    "../api/memory-api": {},
    "../api/memory-trips-api": {},
    "../services/upload-photo": {},
  });
  const { useLocalMemories } = load<
    typeof import("../src/features/memories/hooks/use-memories.ts")
  >("src/features/memories/hooks/use-memories.ts");
  assert.equal(
    useLocalMemories()
      .map((item) => item.id)
      .join(),
    "a",
  );
  owner = "B";
  assert.equal(
    useLocalMemories()
      .map((item) => item.id)
      .join(),
    "b",
  );
  owner = undefined;
  assert.equal(useLocalMemories().length, 0);
});

test("memory choices read all Trip pages using the current paginated API", async () => {
  const spec = JSON.parse(
    readFileSync(
      new URL("../docs/api/trip-crud.openapi.json", import.meta.url),
      "utf8",
    ),
  );
  const trip = spec.components.schemas.TripResponse.example.data.trip;
  const calls: number[] = [];
  const places: string[] = [];
  const load = tripModuleLoader({
    "@/features/trip/api/trip-api": {
      tripApi: {
        list: async (page: number) => {
          calls.push(page);
          return {
            content: [
              { ...trip, id: `10000000-0000-4000-8000-00000000000${page + 1}` },
            ],
            page,
            totalPages: 2,
          };
        },
      },
    },
    "@/features/trip/api/trip-place-api": {
      tripPlacesApi: {
        listPlaces: async (id: string) => {
          places.push(id);
          return [];
        },
      },
    },
  });
  const { loadMemoryTrips } = load<
    typeof import("../src/features/memories/api/memory-trips-api.ts")
  >("src/features/memories/api/memory-trips-api.ts");
  const trips = await loadMemoryTrips();
  assert.deepEqual(calls, [0, 1]);
  assert.equal(trips.length, 2);
  assert.equal(places.length, 2);
  assert.ok(trips.every((item) => item.days.length > 0));
  places.length = 0;
  const summaries = await loadMemoryTrips(undefined, false);
  assert.equal(summaries.length, trips.length);
  assert.equal(places.length, 0);
  assert.ok(
    summaries.every((item) => item.days.every((day) => day.stops.length === 0)),
  );
});

test("memory cache keys inherit the current Trip and journal invalidation prefixes", () => {
  const load = tripModuleLoader({ "@/services/api/client": { apiClient: {} } });
  const { memoryQueryKeys } = load<
    typeof import("../src/features/memories/api/memory-api.ts")
  >("src/features/memories/api/memory-api.ts");
  const tripKeys = load<
    typeof import("../src/features/trip/api/trip-query-keys.ts")
  >("src/features/trip/api/trip-query-keys.ts").tripQueryKeys;
  const journalKeys = load<
    typeof import("../src/features/home/api/memory-query-keys.ts")
  >("src/features/home/api/memory-query-keys.ts").memoryQueryKeys;
  const owner = "fixture-owner";
  assert.equal(
    JSON.stringify(memoryQueryKeys.trips(owner).slice(0, -1)),
    JSON.stringify(tripKeys.list(owner)),
  );
  assert.equal(
    JSON.stringify(memoryQueryKeys.list(owner).slice(0, -1)),
    JSON.stringify(journalKeys.list(owner)),
  );
  assert.notEqual(
    JSON.stringify(memoryQueryKeys.list(owner)),
    JSON.stringify(journalKeys.list(owner)),
  );
});

test("late note/delete responses cannot write photo state after an account change", async () => {
  let version = 1;
  let writes = 0;
  const mutations: { mutationFn: (input: unknown) => Promise<unknown> }[] = [];
  const load = tripModuleLoader({
    "@/constants/development": { UI_PREVIEW_ENABLED: false },
    "@tanstack/react-query": {
      onlineManager: {},
      useMutation: (options: (typeof mutations)[number]) => {
        mutations.push(options);
        return {};
      },
      useQueryClient: () => ({
        setQueryData: () => writes++,
        invalidateQueries: () => {},
      }),
    },
    "@/features/auth/hooks/use-auth": {
      useProfile: () => ({ data: { id: "owner" } }),
    },
    "@/features/auth/services/auth-session": {
      authSession: { getVersion: () => version },
    },
    "@/features/home/providers/trip-preview-provider": {
      useTripPreview: (select: (state: unknown) => unknown) =>
        select({
          memories: [],
          persistLocalPhoto: async () => writes++,
          removeMemory: async () => writes++,
          updateMemoryNote: async () => writes++,
        }),
    },
    "../api/memory-api": {
      memoryQueryKeys: { list: () => ["memories", "owner"] },
      memoryApi: {
        updateNote: async () => {
          version++;
          return {};
        },
        removePhoto: async () => {
          version++;
        },
      },
    },
    "../api/memory-trips-api": {},
    "../services/upload-photo": {},
  });
  const { useMemoryActions } = load<
    typeof import("../src/features/memories/hooks/use-memories.ts")
  >("src/features/memories/hooks/use-memories.ts");
  useMemoryActions();
  const memory = {
    id: "photo",
    remote: { memoryId: "memory", mediaId: "media", version: 0 },
  };
  await assert.rejects(mutations[1].mutationFn({ memory, text: "new note" }), {
    code: "CANCELLED",
  });
  await assert.rejects(mutations[2].mutationFn(memory), { code: "CANCELLED" });
  assert.equal(writes, 0);
});
