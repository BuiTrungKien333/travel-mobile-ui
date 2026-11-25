import { test } from "node:test";
import assert from "node:assert/strict";
import { QueryClient } from "@tanstack/react-query";
import { SessionManager } from "../src/features/auth/services/session-manager.ts";
import { ApiError } from "../src/services/api/api-error.ts";
import type {
  AuthData,
  AuthStatus,
} from "../src/features/auth/types/auth-types.ts";

const user = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "user@example.com",
  fullName: "Nguyễn Văn An",
  role: "USER" as const,
};
function data(label = "new"): AuthData {
  return {
    accessToken: `${label}.access`,
    refreshToken: `${label}.refresh`,
    tokenType: "Bearer",
    expiresIn: 1800000,
    user,
  };
}
function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error("Not initialized");
  };
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function fixture(initial: string | null = null) {
  const state: {
    token: string | null;
    statuses: AuthStatus[];
    requests: number;
    revoked: string[];
    users: string[];
    cleared: number;
  } = {
    token: initial,
    statuses: [],
    requests: 0,
    revoked: [],
    users: [],
    cleared: 0,
  };
  const dependencies = {
    read: async () => state.token,
    write: async (token: string) => {
      state.token = token;
    },
    remove: async () => {
      state.token = null;
    },
    requestRefresh: async (_token: string) => {
      state.requests++;
      return data();
    },
    requestLogout: async (token: string) => {
      state.revoked.push(token);
    },
    onStatus: (status: AuthStatus) => {
      state.statuses.push(status);
    },
    onUser: (value: typeof user) => {
      state.users.push(value.id);
    },
    onClear: () => {
      state.cleared++;
    },
  };
  return { state, dependencies };
}

test("a warm Google-link account switch clears the previous account cache before publishing the new profile", async () => {
  const { dependencies } = fixture();
  const cache = new QueryClient();
  dependencies.onClear = () => cache.clear();
  dependencies.onUser = (current) => {
    cache.setQueryData(["auth", "profile"], current);
  };
  const session = new SessionManager(dependencies);
  await session.authenticate(async () => data("first"));
  cache.setQueryData(["private-trip", user.id], { title: "Private itinerary" });
  const other = {
    ...data("second"),
    user: {
      ...user,
      id: "00000000-0000-4000-8000-000000000002",
      email: "other@example.com",
    },
  };
  await session.authenticate(async () => other);
  assert.equal(cache.getQueryData(["private-trip", user.id]), undefined);
  assert.equal(
    cache.getQueryData<typeof user>(["auth", "profile"])?.id,
    other.user.id,
  );
  assert.equal(session.getAccessToken(), "second.access");
  cache.clear();
});

test("normal same-account refresh preserves cached application data", async () => {
  const { state, dependencies } = fixture();
  const session = new SessionManager(dependencies);
  await session.authenticate(async () => data("first"));
  await session.refresh();
  assert.equal(state.cleared, 0);
  assert.equal(session.getAccessToken(), "new.access");
});

test("fresh install becomes anonymous without calling refresh", async () => {
  const { state, dependencies } = fixture();
  await new SessionManager(dependencies).restore();
  assert.deepEqual(state.statuses, ["restoring", "anonymous"]);
  assert.equal(state.requests, 0);
});
test("native restore rotates stored refresh token and supplies current user", async () => {
  const { state, dependencies } = fixture("old.refresh");
  const session = new SessionManager(dependencies);
  await session.restore();
  assert.equal(session.getAccessToken(), "new.access");
  assert.equal(state.token, "new.refresh");
  assert.deepEqual(state.users, [user.id]);
  assert.equal(state.statuses.at(-1), "authenticated");
});
test("secure storage read failure identifies storage recovery error", async () => {
  const { state, dependencies } = fixture();
  dependencies.read = async () => {
    throw new Error("storage locked");
  };
  const session = new SessionManager(dependencies);
  await session.restore();
  assert.equal(session.getRestoreError()?.code, "STORAGE");
  assert.equal(state.statuses.at(-1), "restore-error");
});
test("concurrent restore calls share one operation", async () => {
  const { state, dependencies } = fixture("old.refresh");
  const session = new SessionManager(dependencies);
  await Promise.all([session.restore(), session.restore()]);
  assert.equal(state.requests, 1);
});
test("expired refresh token clears storage, query data and session", async () => {
  const { state, dependencies } = fixture("expired.refresh");
  dependencies.requestRefresh = async () => {
    throw new ApiError("AUTH_005", 401);
  };
  const session = new SessionManager(dependencies);
  await session.restore();
  assert.equal(state.token, null);
  assert.equal(session.getAccessToken(), null);
  assert.equal(state.statuses.at(-1), "anonymous");
  assert.equal(state.cleared, 1);
});
test("network failure retains stored credential and retry restores session", async () => {
  const { state, dependencies } = fixture("old.refresh");
  dependencies.requestRefresh = async () => {
    throw new ApiError("NETWORK");
  };
  const session = new SessionManager(dependencies);
  await session.restore();
  assert.equal(state.token, "old.refresh");
  assert.equal(state.statuses.at(-1), "restore-error");
  dependencies.requestRefresh = async () => data();
  await session.restore();
  assert.equal(state.statuses.at(-1), "authenticated");
});
test("simultaneous 401 handlers cause only one refresh request", async () => {
  const { state, dependencies } = fixture();
  const pending = deferred<AuthData>();
  dependencies.requestRefresh = async () => {
    state.requests++;
    return pending.promise;
  };
  const session = new SessionManager(dependencies);
  await session.authenticate(async () => data("initial"));
  const first = session.refresh();
  const second = session.refresh();
  assert.equal(first, second);
  pending.resolve(data("rotated"));
  await Promise.all([first, second]);
  assert.equal(state.requests, 1);
  assert.equal(state.token, "rotated.refresh");
});
test("late refresh response cannot sign user back in after logout", async () => {
  const { state, dependencies } = fixture();
  const pending = deferred<AuthData>();
  dependencies.requestRefresh = async () => pending.promise;
  const session = new SessionManager(dependencies);
  await session.authenticate(async () => data("initial"));
  const refreshing = session.refresh();
  const rejected = assert.rejects(
    refreshing,
    (error: unknown) => error instanceof ApiError && error.code === "CANCELLED",
  );
  await session.logout();
  pending.resolve(data("late"));
  await rejected;
  assert.deepEqual(state.revoked, ["initial.refresh", "late.refresh"]);
  assert.equal(session.getAccessToken(), null);
  assert.equal(state.token, null);
  assert.equal(state.statuses.at(-1), "anonymous");
});
test("logout queued behind a credential write leaves storage empty", async () => {
  const { state, dependencies } = fixture();
  const writeStarted = deferred<void>();
  const writing = deferred<void>();
  dependencies.write = async (token) => {
    writeStarted.resolve();
    await writing.promise;
    state.token = token;
  };
  const session = new SessionManager(dependencies);
  const authenticating = session.authenticate(async () => data());
  const rejected = assert.rejects(
    authenticating,
    (error: unknown) => error instanceof ApiError && error.code === "CANCELLED",
  );
  await writeStarted.promise;
  const logout = session.logout();
  writing.resolve();
  await Promise.all([logout, rejected]);
  assert.equal(state.token, null);
  assert.equal(session.getAccessToken(), null);
});
test("storage write failure never grants authenticated UI and revokes issued token", async () => {
  const { state, dependencies } = fixture();
  dependencies.write = async () => {
    throw new Error("storage locked");
  };
  const session = new SessionManager(dependencies);
  await assert.rejects(
    session.authenticate(async () => data()),
    (error: unknown) => error instanceof ApiError && error.code === "STORAGE",
  );
  assert.equal(session.getAccessToken(), null);
  assert.ok(!state.statuses.includes("authenticated"));
  assert.deepEqual(state.revoked, ["new.refresh"]);
});
test("failed storage deletion exposes recovery error instead of claiming logout succeeded", async () => {
  const { state, dependencies } = fixture();
  const session = new SessionManager(dependencies);
  await session.authenticate(async () => data());
  dependencies.remove = async () => {
    throw new Error("storage unavailable");
  };
  await assert.rejects(
    session.logout(),
    (error: unknown) => error instanceof ApiError && error.code === "STORAGE",
  );
  assert.equal(session.getAccessToken(), null);
  assert.equal(state.statuses.at(-1), "restore-error");
  assert.deepEqual(state.revoked, ["new.refresh"]);
});

test("storage deletion failure remains visible when server revocation also fails", async () => {
  const { state, dependencies } = fixture();
  const session = new SessionManager(dependencies);
  await session.authenticate(async () => data());
  dependencies.remove = async () => {
    throw new Error("storage unavailable");
  };
  dependencies.requestLogout = async (token) => {
    state.revoked.push(token);
    throw new ApiError("NETWORK");
  };
  await assert.rejects(
    session.logout(),
    (error: unknown) => error instanceof ApiError && error.code === "STORAGE",
  );
  assert.deepEqual(state.revoked, ["new.refresh"]);
  assert.equal(session.getAccessToken(), null);
  assert.equal(session.getRestoreError()?.code, "STORAGE");
  assert.equal(state.statuses.at(-1), "restore-error");
});
test("offline logout clears local credentials and reports unsuccessful server revocation", async () => {
  const { state, dependencies } = fixture();
  dependencies.requestLogout = async () => {
    throw new ApiError("NETWORK");
  };
  const session = new SessionManager(dependencies);
  await session.authenticate(async () => data());
  assert.equal(await session.logout(), false);
  assert.equal(state.token, null);
  assert.equal(state.statuses.at(-1), "anonymous");
});
test("older login response cannot replace newer authenticated session", async () => {
  const { state, dependencies } = fixture();
  const oldResponse = deferred<AuthData>();
  const session = new SessionManager(dependencies);
  const oldLogin = session.authenticate(() => oldResponse.promise);
  const rejected = assert.rejects(
    oldLogin,
    (error: unknown) => error instanceof ApiError && error.code === "CANCELLED",
  );
  await session.authenticate(async () => data("current"));
  oldResponse.resolve(data("old"));
  await rejected;
  assert.equal(session.getAccessToken(), "current.access");
  assert.equal(state.token, "current.refresh");
});
