import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  tripReadSchema,
  updateTripSchema,
  type UpdateTripPayload,
} from "../src/features/trip/api/trip-contract.ts";
import { ApiError } from "../src/services/api/api-error.ts";
import * as tokens from "../src/theme/tokens.ts";
import type { TripMutation } from "../src/features/trip/types/trip-details-types.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import { QueryClient } from "@tanstack/react-query";
import { tripQueryKeys } from "../src/features/trip/api/trip-query-keys.ts";
import { memoryQueryKeys } from "../src/features/home/api/memory-query-keys.ts";

const spec = JSON.parse(
  readFileSync(
    new URL("../docs/api/trip-crud.openapi.json", import.meta.url),
    "utf8",
  ),
);
const original = () =>
  tripReadSchema.parse(spec.components.schemas.TripResponse.example.data);
type Element = { type: unknown; key?: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Element;
  return [node, ...nodes(node.props.children)];
}
function invoke(
  node: Element | undefined,
  handler: string,
  ...args: unknown[]
): unknown {
  assert.ok(node);
  assert.equal(typeof node.props[handler], "function");
  return (node.props[handler] as (...values: unknown[]) => unknown)(...args);
}
const noteEdit: TripMutation = {
  kind: "info",
  changedFields: ["notes"],
  values: { notes: "Updated note" },
};

test("PATCH boundaries preserve omission/null and reject invalid dates, versions or readonly fields", () => {
  assert.deepEqual(updateTripSchema.parse({ version: 0, notes: null }), {
    version: 0,
    notes: null,
  });
  for (const value of [
    { version: 0 },
    { version: -1, title: "Test" },
    { version: 0.5, title: "Test" },
    { version: 0, notes: null, status: "COMPLETED" },
    { version: 0, startDate: "2026-11-20" },
    { version: 0, startDate: "2026-11-21", endDate: "2026-11-20" },
    { version: 0, title: "" },
    { version: 0, preferences: ["nature", "nature"] },
    { version: 0, startDate: "2026-01-01", endDate: "2027-01-01" },
  ])
    assert.equal(updateTripSchema.safeParse(value).success, false);
});

test("Trip mutation transport uses PATCH, preview POST and version query on DELETE with runtime responses", async () => {
  const calls: { url: string; method: string; value: unknown }[] = [];
  let response: unknown = { success: true, data: original() };
  const request = async (method: string, url: string, value: unknown) => {
    calls.push({ method, url, value });
    return { data: response };
  };
  const load = tripModuleLoader({
    "@/services/api/client": {
      apiClient: {
        patch: (url: string, value: unknown) => request("PATCH", url, value),
        post: (url: string, value: unknown) => request("POST", url, value),
        delete: (url: string, value: unknown) => request("DELETE", url, value),
      },
    },
    "@/services/api/api-error": { ApiError },
  });
  const { tripApi } = load<
    typeof import("../src/features/trip/api/trip-api.ts")
  >("src/features/trip/api/trip-api.ts");
  const id = original().trip.id;
  await tripApi.update(id, { version: 0, notes: null });
  response = {
    success: true,
    data: {
      baseVersion: 0,
      startDate: "2026-11-20",
      endDate: "2026-11-21",
      dayCount: 2,
      removedDates: [],
      addedDates: [],
      movedToPoolCount: 0,
      requiresAcknowledgement: false,
    },
  };
  await tripApi.previewDates(id, {
    version: 0,
    startDate: "2026-11-20",
    endDate: "2026-11-21",
  });
  await tripApi.remove(id, 0);
  assert.deepEqual(
    calls.map((call) => call.method),
    ["PATCH", "POST", "DELETE"],
  );
  assert.equal(calls[1].url, `/api/v1/trips/${id}/date-change-preview`);
  assert.equal(
    JSON.stringify(calls[2].value),
    JSON.stringify({ params: { version: 0 } }),
  );
  response = { success: true, data: { trip: { id } } };
  await assert.rejects(tripApi.update(id, { version: 0, title: "Updated" }), {
    code: "INVALID_RESPONSE",
  });
  await assert.rejects(tripApi.remove(id, -1), { code: "INVALID_TRIP" });
});

test("Edit mapping sends only dirty fields, clears nullable values and preserves the selected province", () => {
  const load = tripModuleLoader({ "@/services/api/api-error": { ApiError } });
  const { tripEditPayload } = load<
    typeof import("../src/features/trip/api/trip-edit-payload.ts")
  >("src/features/trip/api/trip-edit-payload.ts");
  const base = original().trip;
  assert.equal(
    JSON.stringify(tripEditPayload(noteEdit, base, 3)),
    JSON.stringify({ version: 3, notes: "Updated note" }),
  );
  const cleared = tripEditPayload(
    { kind: "info", changedFields: ["budget", "notes"], values: {} },
    base,
    3,
  );
  assert.equal(cleared.notes, null);
  assert.equal(cleared.budget, null);
  assert.equal("title" in cleared, false);
  const unchanged = tripEditPayload(
    {
      kind: "info",
      changedFields: ["destination"],
      values: { destination: base.destination.name },
    },
    base,
    3,
  );
  assert.equal(unchanged.destination?.provinceId, base.destination.provinceId);
  const changed = tripEditPayload(
    {
      kind: "info",
      changedFields: ["destination"],
      values: { destination: "New place" },
    },
    base,
    3,
  );
  assert.equal(changed.destination?.provinceId, null);
});

function harness() {
  let read = original();
  let cursor = 0;
  const states: unknown[] = [];
  const updates: UpdateTripPayload[] = [];
  const deletions: number[] = [];
  const state = {
    closed: 0,
    deleted: 0,
    reloads: 0,
    requireAck: false,
    updateError: null as unknown,
    deleteError: null as unknown,
  };
  const update = {
    isPending: false,
    mutateAsync: async (payload: UpdateTripPayload) => {
      updates.push(payload);
      if (state.updateError) throw state.updateError;
      return read;
    },
  };
  const preview = {
    isPending: false,
    mutateAsync: async (payload: {
      version: number;
      startDate: string;
      endDate: string;
    }) => ({
      ...payload,
      baseVersion: payload.version,
      dayCount: 2,
      removedDates: [],
      addedDates: [],
      movedToPoolCount: state.requireAck ? 2 : 0,
      requiresAcknowledgement: state.requireAck,
    }),
  };
  const remove = {
    isPending: false,
    mutateAsync: async (version: number) => {
      deletions.push(version);
      if (state.deleteError) throw state.deleteError;
    },
  };
  const detailCopy = {
    edit: "Edit",
    menu: "Menu",
    journal: "Journal",
    delete: "Delete",
    deleteTitle: "Delete trip?",
    deleteYes: "Yes",
    deleteNo: "No",
  };
  const load = tripModuleLoader({
    react: {
      useState: (initial: unknown) => {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [
          states[index],
          (value: unknown) => {
            states[index] =
              typeof value === "function" ? value(states[index]) : value;
          },
        ];
      },
    },
    "react/jsx-runtime": {
      jsx: (type: unknown, props: Element["props"], key: unknown) => ({
        type,
        props,
        key,
      }),
      jsxs: (type: unknown, props: Element["props"], key: unknown) => ({
        type,
        props,
        key,
      }),
    },
    "react-native": { View: "View" },
    "expo-router": { router: { push: () => {} } },
    "@/hooks/use-app-theme": {
      useAppTheme: () => ({
        ...tokens,
        colors: new Proxy({}, { get: () => "color" }),
      }),
    },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/services/api/api-error": { ApiError },
    "../api/trip-queries": {
      useUpdateTripMutation: () => update,
      useTripDatePreviewMutation: () => preview,
      useDeleteTripMutation: () => remove,
    },
    "../i18n/trip-details-copy": {
      useTripDetailsCopy: () => ({ copy: detailCopy }),
    },
    "./trip-details-sheet": { TripDetailsSheet: "TripDetailsSheet" },
    "./trip-edit-form": { TripEditForm: "TripEditForm" },
    "./trip-delete-alert": { TripDeleteAlert: "TripDeleteAlert" },
  });
  const { ConnectedTripActions } = load<
    typeof import("../src/features/trip/components/connected-trip-actions.tsx")
  >("src/features/trip/components/connected-trip-actions.tsx");
  const { copy } = load<
    typeof import("../src/features/trip/i18n/trip-integration-copy.ts")
  >("src/features/trip/i18n/trip-integration-copy.ts").useTripIntegrationCopy();
  function render() {
    cursor = 0;
    return ConnectedTripActions({
      read,
      onClose: () => {
        state.closed++;
      },
      onDeleted: () => {
        state.deleted++;
      },
      onReload: async () => {
        state.reloads++;
        return read;
      },
    });
  }
  const find = (type: string) =>
    nodes(render()).find((node) => node.type === type);
  const press = (label: string) =>
    invoke(
      nodes(render()).find(
        (node) =>
          node.type === "AppButton" &&
          (node.props.children === label ||
            nodes(node.props.children).some(
              (child) => child.props.children === label,
            )),
      ),
      "onPress",
    );
  return {
    render,
    find,
    press,
    state,
    updates,
    deletions,
    update,
    preview,
    copy,
    setVersion: (version: number) => {
      read = { ...read, trip: { ...read.trip, version } };
    },
  };
}

test("The connected editor saves through the API and closes only after success", async () => {
  const h = harness();
  h.press("Edit");
  await invoke(h.find("TripEditForm"), "onCommit", noteEdit);
  assert.equal(h.updates[0].notes, "Updated note");
  assert.equal(h.state.closed, 1);
});

test("Date impact requires explicit confirmation and cancel keeps the editor without a write", async () => {
  const h = harness();
  h.state.requireAck = true;
  h.press("Edit");
  const mutation: TripMutation = {
    ...noteEdit,
    dateRange: { startDate: "2026-11-21", endDate: "2026-11-22" },
  };
  await invoke(h.find("TripEditForm"), "onCommit", mutation);
  assert.equal(h.updates.length, 0);
  invoke(h.find("TripDeleteAlert"), "onCancel");
  assert.ok(h.find("TripEditForm"));
  assert.equal(h.updates.length, 0);
  await invoke(h.find("TripEditForm"), "onCommit", mutation);
  invoke(h.find("TripDeleteAlert"), "onConfirm");
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(h.updates[0].acknowledgeDateImpact, true);
  assert.equal(h.state.closed, 1);
});

test("Version conflicts retain the editor and never silently resubmit with a newer server version", async () => {
  const h = harness();
  h.press("Edit");
  const initialVersion = original().trip.version;
  h.state.updateError = new ApiError("TRIP_002", 409);
  await invoke(h.find("TripEditForm"), "onCommit", noteEdit);
  const key = h.find("TripEditForm")?.key;
  h.setVersion(initialVersion + 1);
  await invoke(h.find("TripEditForm"), "onCommit", noteEdit);
  assert.equal(h.updates[1].version, initialVersion);
  assert.equal(h.find("TripEditForm")?.key, key);
  assert.equal(h.state.closed, 0);
  await h.press(h.copy.discardReload);
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.notEqual(h.find("TripEditForm")?.key, key);
  h.state.updateError = null;
  await invoke(h.find("TripEditForm"), "onCommit", noteEdit);
  assert.equal(h.updates[2].version, initialVersion + 1);
});

test("Delete waits for confirmation, retains failures for retry and exits only on success", async () => {
  const h = harness();
  h.press("Delete");
  assert.equal(h.deletions.length, 0);
  h.state.deleteError = new ApiError("NETWORK");
  invoke(h.find("TripDeleteAlert"), "onConfirm");
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(h.state.deleted, 0);
  assert.ok(h.find("TripDeleteAlert")?.props.error);
  h.state.deleteError = null;
  invoke(h.find("TripDeleteAlert"), "onConfirm");
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(h.state.deleted, 1);
  assert.equal(h.deletions[0], h.deletions[1]);
});

test("A delete conflict requires loading and reviewing the latest version before a second delete", async () => {
  const h = harness();
  h.press("Delete");
  h.state.deleteError = new ApiError("TRIP_002", 409);
  invoke(h.find("TripDeleteAlert"), "onConfirm");
  await new Promise<void>((resolve) => setImmediate(resolve));
  h.setVersion(original().trip.version + 1);
  invoke(h.find("TripDeleteAlert"), "onConfirm");
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(h.deletions.length, 1);
  assert.equal(h.state.reloads, 1);
  h.state.deleteError = null;
  invoke(h.find("TripDeleteAlert"), "onConfirm");
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(h.deletions[1], original().trip.version + 1);
  assert.equal(h.state.deleted, 1);
});

test("Pending requests prevent closing the edit sheet", () => {
  const h = harness();
  h.press("Edit");
  h.update.isPending = true;
  assert.equal(h.find("TripDetailsSheet")?.props.dismissDisabled, true);
  invoke(h.find("TripDetailsSheet"), "onClose");
  assert.equal(h.state.closed, 0);
});

function queryHarness() {
  const client = new QueryClient();
  const read = original();
  let sessionVersion = 1;
  const owner = "owner-a",
    id = read.trip.id;
  const next = {
    ...read,
    trip: {
      ...read.trip,
      version: read.trip.version + 1,
      notes: "Server note",
    },
  };
  const load = tripModuleLoader({
    "@tanstack/react-query": {
      useMutation: (options: unknown) => options,
      useQueryClient: () => client,
    },
    "@/features/auth/hooks/use-auth": {
      useProfile: () => ({ data: { id: owner } }),
    },
    "@/features/auth/services/auth-session": {
      authSession: { getVersion: () => sessionVersion },
    },
    "@/services/api/api-error": { ApiError },
    "./trip-api": {
      tripApi: { update: async () => next, remove: async () => {} },
    },
  });
  type Outcome = { read: typeof read; sessionVersion: number };
  const hooks = load<{
    useUpdateTripMutation: (id: string) => {
      mutationFn: (payload: UpdateTripPayload) => Promise<Outcome>;
      onSuccess: (value: Outcome) => Promise<void>;
    };
    useDeleteTripMutation: (id: string) => {
      mutationFn: (version: number) => Promise<number>;
      onSuccess: (value: number) => Promise<void>;
    };
  }>("src/features/trip/api/trip-queries.ts");
  client.setQueryData(tripQueryKeys.detail(owner, id), read);
  client.setQueryData(tripQueryKeys.list(owner), [read.trip]);
  client.setQueryData(tripQueryKeys.list("owner-b"), []);
  return {
    client,
    hooks,
    read,
    next,
    owner,
    id,
    switchSession: () => {
      sessionVersion++;
    },
  };
}

test("Update publishes the returned version and invalidates only affected account queries", async () => {
  const h = queryHarness();
  try {
    h.client.setQueryData(tripQueryKeys.itinerary(h.owner, h.id), {});
    const mutation = h.hooks.useUpdateTripMutation(h.id);
    await mutation.onSuccess(
      await mutation.mutationFn({
        version: h.read.trip.version,
        notes: "Server note",
      }),
    );
    assert.equal(
      h.client.getQueryData<typeof h.read>(tripQueryKeys.detail(h.owner, h.id))
        ?.trip.version,
      h.next.trip.version,
    );
    assert.equal(
      h.client.getQueryState(tripQueryKeys.list(h.owner))?.isInvalidated,
      true,
    );
    assert.equal(
      h.client.getQueryState(tripQueryKeys.itinerary(h.owner, h.id))
        ?.isInvalidated,
      true,
    );
    assert.equal(
      h.client.getQueryState(tripQueryKeys.list("owner-b"))?.isInvalidated,
      false,
    );
  } finally {
    h.client.clear();
  }
});

test("Successful delete removes stale trip detail and invalidates related memory lists", async () => {
  const h = queryHarness();
  try {
    h.client.setQueryData(memoryQueryKeys.list(h.owner), {});
    h.client.setQueryData(memoryQueryKeys.list(h.owner, h.id), {});
    const mutation = h.hooks.useDeleteTripMutation(h.id);
    await mutation.onSuccess(await mutation.mutationFn(h.read.trip.version));
    assert.equal(
      h.client.getQueryData(tripQueryKeys.detail(h.owner, h.id)),
      undefined,
    );
    assert.equal(
      h.client.getQueryState(memoryQueryKeys.list(h.owner))?.isInvalidated,
      true,
    );
    assert.equal(
      h.client.getQueryState(memoryQueryKeys.list(h.owner, h.id))
        ?.isInvalidated,
      true,
    );
    assert.equal(
      h.client.getQueryState(tripQueryKeys.list("owner-b"))?.isInvalidated,
      false,
    );
  } finally {
    h.client.clear();
  }
});

test("A logout between mutation completion and cache publication cannot recreate the previous account cache", async () => {
  const h = queryHarness();
  try {
    const mutation = h.hooks.useUpdateTripMutation(h.id);
    const outcome = await mutation.mutationFn({
      version: h.read.trip.version,
      notes: "Server note",
    });
    h.switchSession();
    h.client.clear();
    await assert.rejects(mutation.onSuccess(outcome), { code: "CANCELLED" });
    assert.equal(
      h.client.getQueryData(tripQueryKeys.detail(h.owner, h.id)),
      undefined,
    );
  } finally {
    h.client.clear();
  }
});
