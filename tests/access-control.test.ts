import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canAdminister,
  canUseWorkspace,
} from "../src/features/auth/utils/authorization.ts";
import { accountSchema } from "../src/features/access/access-contract.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

test("guest and missing identity cannot enter the member workspace or administration", () => {
  for (const user of [null, undefined, { role: "GUEST" as const }]) {
    assert.equal(canUseWorkspace(user), false);
    assert.equal(canAdminister(user), false);
  }
  assert.equal(canUseWorkspace({ role: "USER" }), true);
  assert.equal(canAdminister({ role: "USER" }), false);
  assert.equal(canAdminister({ role: "ADMIN" }), true);
});
test("admin contract rejects unknown roles and invalid concurrency versions", () => {
  const value = {
    id: "a0000000-0000-0000-0000-000000000001",
    fullName: "Fixture",
    email: "fixture@example.com",
    role: "USER",
    locked: false,
    verified: true,
    version: 0,
    createdAt: "2026-11-17T00:00:00Z",
  };
  assert.equal(accountSchema.safeParse(value).success, true);
  for (const change of [
    { role: "SUPERUSER" },
    { locked: "false" },
    { version: -1 },
    { version: 1.5 },
  ])
    assert.equal(
      accountSchema.safeParse({ ...value, ...change }).success,
      false,
    );
});
test("public request classification is specific to method and path; AI tooling stays protected", () => {
  const { isPublicApiRequest } = tripModuleLoader()<
    typeof import("../src/services/api/public-endpoints.ts")
  >("src/services/api/public-endpoints.ts");
  assert.equal(isPublicApiRequest("/api/v1/destinations", "get"), true);
  assert.equal(isPublicApiRequest("/api/v1/destinations", "post"), false);
  assert.equal(isPublicApiRequest("/api/v1/public/places", "get"), true);
  assert.equal(
    isPublicApiRequest("/api/v1/public/planning/generate-draft", "post"),
    false,
  );
  assert.equal(isPublicApiRequest("/api/v1/admin/users", "get"), false);
});

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
function adminHarness(enabled = true) {
  let cursor = 0;
  const state: unknown[] = [];
  const writes: unknown[] = [];
  const account = {
    id: "other",
    fullName: "Fixture",
    email: "fixture@example.com",
    role: "USER",
    locked: false,
    verified: true,
    version: 3,
  };
  const tokens = tripModuleLoader()<Record<string, unknown>>(
    "src/theme/tokens.ts",
  );
  const query = {
    data: { content: [account], totalElements: 1 },
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: async () => {},
  };
  const load = tripModuleLoader({
    react: {
      useState: (initial: unknown) => {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [
          state[index],
          (value: unknown) => {
            state[index] = value;
          },
        ];
      },
    },
    "react-native": { FlatList: "FlatList", View: "View" },
    "expo-router": { Redirect: "Redirect", router: { back: () => {} } },
    "@/hooks/use-app-theme": { useAppTheme: () => ({ ...tokens, colors: {} }) },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/components/common/screen-safe-area": {
      ScreenSafeArea: "ScreenSafeArea",
    },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-input": { AppInput: "AppInput" },
    "./access-hooks": {
      useAdministration: () => ({
        enabled,
        user: { id: "self" },
        accounts: query,
        catalog: query,
        events: query,
        mutation: {
          reset: () => {},
          isPending: false,
          isError: false,
          isSuccess: false,
          mutateAsync: async (value: unknown) => {
            writes.push(value);
          },
        },
      }),
    },
  });
  const { AdminScreen } = load<{ AdminScreen: () => Node }>(
    "src/features/access/admin-screen.tsx",
  );
  return {
    account,
    writes,
    render: () => {
      cursor = 0;
      return AdminScreen();
    },
  };
}
test("administration cannot render for a non-admin", () => {
  assert.equal(adminHarness(false).render().type, "Redirect");
});
test("locking an account requires review and an explicit confirmation", async () => {
  const h = adminHarness();
  const list = nodes(h.render(), "FlatList")[0];
  const item = (list.props.renderItem as (value: { item: unknown }) => Node)({
    item: h.account,
  });
  const lock = nodes(item, "AppButton").find(
    (n) => n.props.children === "Khóa tài khoản",
  );
  assert.ok(lock);
  (lock.props.onPress as () => void)();
  assert.equal(h.writes.length, 0);
  const header = nodes(h.render(), "FlatList")[0].props.ListHeaderComponent;
  const confirm = nodes(header, "AppButton").find(
    (n) => n.props.children === "Xác nhận thay đổi",
  );
  assert.ok(confirm);
  (confirm.props.onPress as () => void)();
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(h.writes.length, 1);
  assert.equal((h.writes[0] as { locked: boolean }).locked, true);
  assert.equal(
    (h.writes[0] as { account: { version: number } }).account.version,
    3,
  );
});
