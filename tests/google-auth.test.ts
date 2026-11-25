import { test } from "node:test";
import assert from "node:assert/strict";
import { SessionManager } from "../src/features/auth/services/session-manager.ts";
import { ApiError } from "../src/services/api/api-error.ts";
import {
  googleChallengeSchema,
  googleLoginSchema,
  type AuthData,
  type GoogleLoginOutcome,
} from "../src/features/auth/types/auth-types.ts";
import { readMagicLinkToken } from "../src/features/auth/utils/magic-link.ts";

const auth: AuthData = {
  accessToken: "access",
  refreshToken: "refresh",
  tokenType: "Bearer",
  expiresIn: 1800000,
  user: {
    id: "00000000-0000-4000-8000-000000000001",
    email: "an@gmail.com",
    fullName: "An",
    role: "USER",
  },
};
const pending: GoogleLoginOutcome = {
  status: "VERIFICATION_REQUIRED",
  email: "an@example.com",
  resendAfterSeconds: 60,
};
const credentials = (result: GoogleLoginOutcome) =>
  result.status === "AUTHENTICATED" ? result.auth : null;
function sessionFixture() {
  const saved: string[] = [],
    revoked: string[] = [];
  const session = new SessionManager({
    read: async () => null,
    write: async (value) => {
      saved.push(value);
    },
    remove: async () => {},
    requestRefresh: async () => auth,
    requestLogout: async (value) => {
      revoked.push(value);
    },
    onStatus: () => {},
    onUser: () => {},
    onClear: () => {},
  });
  return { session, saved, revoked };
}

test("email confirmation outcome never creates or stores an authenticated session", async () => {
  const { session, saved } = sessionFixture();
  assert.deepEqual(
    await session.authenticateOutcome(async () => pending, credentials),
    pending,
  );
  assert.equal(session.getAccessToken(), null);
  assert.deepEqual(saved, []);
});
test("successful Google outcome enters the same session used by password login", async () => {
  const { session, saved } = sessionFixture();
  await session.authenticateOutcome(
    async () => ({ status: "AUTHENTICATED", auth }),
    credentials,
  );
  assert.equal(session.getAccessToken(), "access");
  assert.deepEqual(saved, ["refresh"]);
});
test("Google response arriving after logout is rejected and its server session is revoked", async () => {
  const { session, saved, revoked } = sessionFixture();
  let resolve: (result: GoogleLoginOutcome) => void = () => {
    throw new Error("not initialized");
  };
  const response = new Promise<GoogleLoginOutcome>((done) => {
    resolve = done;
  });
  const login = session.authenticateOutcome(() => response, credentials);
  const rejected = assert.rejects(
    login,
    (error: unknown) => error instanceof ApiError && error.code === "CANCELLED",
  );
  await session.logout();
  resolve({ status: "AUTHENTICATED", auth });
  await rejected;
  assert.deepEqual(revoked, ["refresh"]);
  assert.deepEqual(saved, []);
  assert.equal(session.getAccessToken(), null);
});
test("Google contracts reject incomplete authenticated outcomes and malformed challenge boundaries", () => {
  assert.equal(googleLoginSchema.safeParse(pending).success, true);
  assert.equal(
    googleLoginSchema.safeParse({
      status: "AUTHENTICATED",
      email: "an@gmail.com",
    }).success,
    false,
  );
  const challenge = {
    challengeId: auth.user.id,
    nonce: "a".repeat(64),
    webClientId: "123-test.apps.googleusercontent.com",
    expiresIn: 300000,
  };
  assert.equal(googleChallengeSchema.safeParse(challenge).success, true);
  for (const changes of [
    { challengeId: "invalid" },
    { nonce: "short" },
    { webClientId: "client-secret" },
    { expiresIn: 0 },
    { expiresIn: 600001 },
  ])
    assert.equal(
      googleChallengeSchema.safeParse({ ...challenge, ...changes }).success,
      false,
    );
});
test("Google email link works on native/web and cannot be used as a reset or verification link", () => {
  const token = "a".repeat(43);
  for (const base of [
    "travelplannermobileui://google-link",
    "https://app.example.com/google-link",
  ]) {
    const link = `${base}#token=${token}`;
    assert.equal(readMagicLinkToken(link, "google-link"), token);
    assert.equal(readMagicLinkToken(link, "reset-password"), null);
    assert.equal(readMagicLinkToken(link, "verify-email"), null);
  }
});
