import { test } from "node:test";
import assert from "node:assert/strict";
import { changePasswordSchema } from "../src/features/auth/schemas/auth-schemas.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const values = { currentPassword: "old-pass", newPassword: "NewPassword123@", confirmPassword: "NewPassword123@" };

test("password change requires current proof, matching confirmation and BCrypt-compatible new password", () => {
  assert.equal(changePasswordSchema.safeParse(values).success, true);
  for (const changes of [
    { currentPassword: "" }, { newPassword: "1234567", confirmPassword: "1234567" },
    { confirmPassword: "different" }, { newPassword: "ệ".repeat(25), confirmPassword: "ệ".repeat(25) },
  ]) assert.equal(changePasswordSchema.safeParse({ ...values, ...changes }).success, false);
});

test("password change sends only currentPassword/newPassword to the authenticated endpoint", async () => {
  const calls: unknown[] = [];
  const load = tripModuleLoader({
    "@/services/api/client": { apiClient: { put: async (...args: unknown[]) => { calls.push(args); } } },
  });
  const { authApi } = load<{ authApi: { changePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void> } }>("src/features/auth/api/auth-api.ts");
  await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
  assert.deepEqual(calls, [["/api/v1/users/me/password", { currentPassword: values.currentPassword, newPassword: values.newPassword }]]);
});

test("successful change clears the session; rejected change or account switch cannot clear another session", async () => {
  for (const mode of ["success", "rejected", "switched"]) {
    let version = 1;
    let expired = false;
    const load = tripModuleLoader({
      "@tanstack/react-query": { useMutation: (options: unknown) => options },
      "../api/auth-api": { authApi: { changePassword: async () => {
        if (mode === "rejected") throw new Error("wrong password");
        if (mode === "switched") version++;
      } } },
      "../services/auth-session": { authSession: { getVersion: () => version, expire: async () => { expired = true; } } },
      "@/store/use-auth-store": {},
    });
    const { useChangePassword } = load<{ useChangePassword: () => { mutationFn: (input: typeof values) => Promise<void> } }>("src/features/auth/hooks/use-auth.ts");
    const change = useChangePassword();
    if (mode === "success") await change.mutationFn(values);
    else await assert.rejects(change.mutationFn(values));
    assert.equal(expired, mode === "success");
  }
});
