import { test } from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../src/features/auth/schemas/auth-schemas.ts";
import { authDataSchema } from "../src/features/auth/types/auth-types.ts";

const input = { fullName: "Nguyễn Văn An", email: "an@example.com", password: "Password123@" };
test("registration trims name/email without modifying password", () => {
  const result = registerSchema.parse({ ...input, fullName: " An ", email: " an@example.com ", password: " pass word " });
  assert.equal(result.fullName, "An");
  assert.equal(result.email, "an@example.com");
  assert.equal(result.password, " pass word ");
});
test("registration enforces shared minimum and maximum lengths", () => {
  for (const changes of [{ password: "1234567" }, { password: "a".repeat(51) }, { fullName: "a".repeat(101) }, { email: "a".repeat(250) + "@example.com" }]) {
    assert.equal(registerSchema.safeParse({ ...input, ...changes }).success, false);
  }
  assert.equal(registerSchema.safeParse({ ...input, password: "12345678" }).success, true);
});
test("UTF-8 byte limit handles Vietnamese and emoji at BCrypt boundary", () => {
  assert.equal(registerSchema.safeParse({ ...input, password: "ệ".repeat(24) }).success, true);
  assert.equal(registerSchema.safeParse({ ...input, password: "ệ".repeat(25) }).success, false);
  assert.equal(registerSchema.safeParse({ ...input, password: "🙂".repeat(18) }).success, true);
  assert.equal(registerSchema.safeParse({ ...input, password: "🙂".repeat(19) }).success, false);
});
test("login accepts existing short passwords but bounds untrusted input", () => {
  assert.equal(loginSchema.safeParse({ email: input.email, password: "123456" }).success, true);
  assert.equal(loginSchema.safeParse({ email: input.email, password: "" }).success, false);
  assert.equal(loginSchema.safeParse({ email: input.email, password: "ệ".repeat(25) }).success, false);
});
test("auth contract rejects malformed identity, token scheme and expiry", () => {
  const data = { accessToken: "access", refreshToken: "refresh", tokenType: "Bearer", expiresIn: 1800000,
    user: { id: "00000000-0000-4000-8000-000000000001", email: input.email, fullName: input.fullName, role: "USER" } };
  assert.equal(authDataSchema.safeParse(data).success, true);
  assert.equal(authDataSchema.safeParse({ ...data, user: { ...data.user, id: "a0000000-0000-0000-0000-000000000001" } }).success, true);
  for (const changes of [{ tokenType: "Basic" }, { expiresIn: 0 }, { user: { ...data.user, id: "not-a-uuid" } }, { user: { ...data.user, role: "SUPERUSER" } }]) {
    assert.equal(authDataSchema.safeParse({ ...data, ...changes }).success, false);
  }
});
