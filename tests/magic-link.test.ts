import { test } from "node:test";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { readMagicLinkToken } from "../src/features/auth/utils/magic-link.ts";
import { resetPasswordSchema } from "../src/features/auth/schemas/auth-schemas.ts";
import { emailRequestResultSchema, registrationResultSchema } from "../src/features/auth/types/auth-types.ts";

const token = "a".repeat(43);
test("links work with the URL implementation installed by Expo's native runtime", () => {
  const require = createRequire(import.meta.url);
  const expoRequire = createRequire(require.resolve("expo/package.json"));
  const native = expoRequire("whatwg-url-minimum");
  const originalURL = globalThis.URL, originalParams = globalThis.URLSearchParams;
  try {
    globalThis.URL = native.URL;
    globalThis.URLSearchParams = native.URLSearchParams;
    for (const base of ["travelplannermobileui://verify-email", "exp://192.168.1.8:8081/--/verify-email", "https://app.example.com/verify-email"]) {
      assert.equal(readMagicLinkToken(`${base}#token=${token}`, "verify-email"), token);
    }
  } finally {
    globalThis.URL = originalURL;
    globalThis.URLSearchParams = originalParams;
  }
});
test("verification accepts configured app, Expo Go and HTTPS fragment links", () => {
  for (const base of ["travelplannermobileui://verify-email", "exp://192.168.1.8:8081/--/verify-email", "https://app.example.com/verify-email"]) {
    assert.equal(readMagicLinkToken(`${base}#token=${token}`, "verify-email"), token);
  }
});
test("reset token cannot be read as verification and vice versa", () => {
  assert.equal(readMagicLinkToken(`https://app.example.com/reset-password#token=${token}`, "verify-email"), null);
  assert.equal(readMagicLinkToken(`travelplannermobileui://verify-email#token=${token}`, "reset-password"), null);
  assert.equal(readMagicLinkToken(`travelplannermobileui://reset-password#token=${token}`, "reset-password"), token);
});
test("malformed, ambiguous and query-param tokens are rejected", () => {
  for (const value of [null, "invalid", "https://app.example.com/verify-email", `https://app.example.com/verify-email?token=${token}`,
    `https://app.example.com/verify-email#token=${token}&token=${token}`, `https://app.example.com/verify-email#token=${token}&next=https://evil.example.com`,
    "https://app.example.com/verify-email#token=too-short", `https://app.example.com/verify-email#token=${"+".repeat(43)}`]) {
    assert.equal(readMagicLinkToken(value, "verify-email"), null);
  }
});
test("reset form requires confirmation and keeps backend password boundaries", () => {
  assert.equal(resetPasswordSchema.safeParse({ password: "NewPassword123@", confirmPassword: "NewPassword123@" }).success, true);
  for (const value of [{ password: "NewPassword123@", confirmPassword: "different" }, { password: "1234567", confirmPassword: "1234567" },
    { password: "ệ".repeat(25), confirmPassword: "ệ".repeat(25) }, { password: "a".repeat(51), confirmPassword: "a".repeat(51) }]) {
    assert.equal(resetPasswordSchema.safeParse(value).success, false);
  }
});
test("pending registration contract requires verification and a valid server cooldown", () => {
  assert.equal(registrationResultSchema.safeParse({ verificationRequired: true, resendAfterSeconds: 60 }).success, true);
  assert.equal(registrationResultSchema.safeParse({ verificationRequired: false, resendAfterSeconds: 60 }).success, false);
  assert.equal(registrationResultSchema.safeParse({ accessToken: "token", refreshToken: "token" }).success, false);
  for (const value of [0, -1, 1.5, Number.POSITIVE_INFINITY]) assert.equal(emailRequestResultSchema.safeParse({ resendAfterSeconds: value }).success, false);
});
