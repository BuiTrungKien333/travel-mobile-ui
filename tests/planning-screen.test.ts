import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

type Node = {
  type: string;
  props: Record<string, unknown> & { children?: unknown };
};
function nodes(value: unknown, type: string): Node[] {
  if (Array.isArray(value)) return value.flatMap((child) => nodes(child, type));
  if (!value || typeof value !== "object") return [];
  const node = value as Node;
  return [
    ...(node.type === type ? [node] : []),
    ...nodes(node.props?.children, type),
  ];
}
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));
class TestApiError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}
function harness() {
  let cursor = 0;
  const state: unknown[] = [];
  const writes: { kind: string; value: unknown }[] = [];
  let returned = 0;
  let fail = false;
  const latest: {
    data?: { id: string; canApply: boolean; proposal: { status: string } };
    error?: TestApiError;
    isPending: boolean;
    refetch: () => Promise<void>;
  } = {
    isPending: false,
    refetch: async () => {},
  };
  const tokens = tripModuleLoader()<Record<string, unknown>>(
    "src/theme/tokens.ts",
  );
  const load = tripModuleLoader({
    react: {
      useState: (initial: unknown) => {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [
          state[index],
          (next: unknown) => {
            state[index] = next;
          },
        ];
      },
      useRef: (initial: unknown) => {
        const index = cursor++;
        if (!(index in state)) state[index] = { current: initial };
        return state[index];
      },
    },
    "expo-router": {
      router: {
        canGoBack: () => true,
        back: () => {
          returned++;
        },
      },
    },
    "react-native": {
      View: "View",
      Pressable: "Pressable",
      ScrollView: "ScrollView",
      KeyboardAvoidingView: "KeyboardAvoidingView",
      Platform: { OS: "android" },
    },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/common/screen-safe-area": {
      ScreenSafeArea: "ScreenSafeArea",
    },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/services/api/api-error": { ApiError: TestApiError },
    "../components/trip-planning-form": {
      TripPlanningForm: "TripPlanningForm",
    },
    "../components/trip-planning-preview": {
      TripPlanningPreview: "TripPlanningPreview",
    },
    "../components/trip-planning-feedback": {
      TripPlanningErrorCard: "TripPlanningErrorCard",
      TripPlanningLoadingCard: "TripPlanningLoadingCard",
    },
    "../api/trip-queries": {
      useTripQuery: () => ({
        data: {
          trip: {
            id: "trip",
            destination: { name: "Đà Nẵng", provinceId: "prov-48" },
            dayCount: 2,
            status: "PLANNING",
            mode: "PLANNING",
            version: 4,
          },
        },
        refetch: async () => {},
      }),
    },
    "../api/itinerary-hooks": {
      useTripItineraryQuery: () => ({
        data: { days: [] },
        refetch: async () => {},
      }),
    },
    "../api/planning-hooks": {
      usePlanningDraft: () => ({
        latest,
        create: {
          isPending: false,
          mutateAsync: async (request: unknown) => {
            writes.push({ kind: "create", value: request });
            if (fail) throw new Error("connection lost");
            latest.data = {
              id: "stored-draft",
              canApply: true,
              proposal: { status: "READY_WITH_WARNINGS" },
            };
          },
        },
        apply: {
          isPending: false,
          mutateAsync: async (id: string) => {
            writes.push({ kind: "apply", value: id });
          },
        },
      }),
    },
  });
  const { TripPlanningScreen } = load<{
    TripPlanningScreen: (props: { tripId: string }) => Node;
  }>("src/features/trip/screens/trip-planning-screen.tsx");
  function render() {
    cursor = 0;
    return TripPlanningScreen({ tripId: "trip" });
  }
  return {
    render,
    latest,
    writes,
    fail: () => {
      fail = true;
    },
    returned: () => returned,
  };
}

test("empty trip opens a form; preview does not apply until the user confirms", async () => {
  const h = harness();
  const input = { text: "history" };
  const form = nodes(h.render(), "TripPlanningForm")[0];
  await (form.props.onSubmit as (value: unknown) => Promise<void>)(input);
  assert.equal(h.writes.length, 1);
  assert.equal(h.writes[0].kind, "create");
  assert.equal(
    (h.writes[0].value as { expectedTripVersion: number }).expectedTripVersion,
    4,
  );
  const preview = h.render();
  assert.equal(nodes(preview, "TripPlanningPreview").length, 1);
  const apply = nodes(preview, "AppButton").find(
    (node) => node.props.children === "Áp dụng lịch trình",
  )!;
  (apply.props.onPress as () => void)();
  await tick();
  assert.equal(h.writes[1].kind, "apply");
  assert.equal(h.writes[1].value, "stored-draft");
  assert.equal(h.returned(), 1);
});

test("reopening loads a stored preview and blocked drafts disable apply", () => {
  const h = harness();
  h.latest.data = {
    id: "stored",
    canApply: false,
    proposal: { status: "CONFLICTS_DETECTED" },
  };
  const tree = h.render();
  assert.equal(nodes(tree, "TripPlanningPreview").length, 1);
  assert.equal(nodes(tree, "TripPlanningForm").length, 0);
  assert.equal(
    nodes(tree, "AppButton").find(
      (node) => node.props.children === "Áp dụng lịch trình",
    )?.props.disabled,
    true,
  );
});

test("retry after a lost response preserves the idempotency request", async () => {
  const h = harness();
  h.fail();
  const form = nodes(h.render(), "TripPlanningForm")[0];
  await (form.props.onSubmit as (value: unknown) => Promise<void>)({
    text: "history",
  });
  const retry = nodes(h.render(), "AppButton").find(
    (node) => node.props.children === "Thử lại yêu cầu này",
  )!;
  (retry.props.onPress as () => void)();
  await tick();
  assert.equal(h.writes.length, 2);
  assert.equal(h.writes[0].value, h.writes[1].value);
});
test("reopening while the server is generating shows progress instead of a second generation form", () => {
  const h = harness();
  h.latest.error = new TestApiError("DRAFT_003");
  const tree = h.render();
  assert.equal(nodes(tree, "TripPlanningForm").length, 0);
  assert.ok(
    nodes(tree, "TripPlanningLoadingCard").some((node) =>
      String(node.props.title).includes("Đang hoàn tất yêu cầu trước"),
    ),
  );
});
test("an unavailable intent parser allows editing back to the structured form", () => {
  const h = harness();
  h.latest.data = {
    id: "stored",
    canApply: false,
    proposal: { status: "NEEDS_STRUCTURED_INPUT" },
  };
  const tree = h.render();
  const edit = nodes(tree, "AppButton").find(
    (node) => node.props.children === "Chỉnh yêu cầu / tạo lại",
  )!;
  (edit.props.onPress as () => void)();
  assert.equal(nodes(h.render(), "TripPlanningForm").length, 1);
});
