import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

function fixture() {
  let states: unknown[] = [];
  let cursor = 0;
  let effect: (() => () => void) | undefined;
  let listener: ((state: string) => void) | undefined;
  let getFails = false;
  let environmentIssue: "insecure" | "unsupported" | "embedded" | null = null;
  let granted = false;
  let requests = 0;
  const refs: { current: unknown }[] = [];
  let refCursor = 0;
  let nextQuery: Promise<ReturnType<typeof permission>> | undefined;
  const permission = () => ({
    granted,
    status: granted ? "granted" : "denied",
    canAskAgain: !granted,
    expires: "never",
  });
  const load = tripModuleLoader({
    react: {
      useState: (initial: unknown) => {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [
          states[index],
          (value: unknown) => {
            states[index] = value;
          },
        ];
      },
      useRef: (initial: unknown) => {
        const index = refCursor++;
        refs[index] ??= { current: initial };
        return refs[index];
      },
      useCallback: (callback: unknown) => callback,
      useEffect: (callback: () => () => void) => {
        effect = callback;
      },
    },
    "expo-camera": {
      Camera: {
        getCameraPermissionsAsync: async () => {
          if (nextQuery) {
            const query = nextQuery;
            nextQuery = undefined;
            return query;
          }
          if (getFails) throw new Error("Permission query failed");
          return permission();
        },
        requestCameraPermissionsAsync: async () => {
          requests++;
          granted = true;
          return permission();
        },
      },
    },
    "react-native": {
      AppState: {
        addEventListener: (
          _event: string,
          callback: (state: string) => void,
        ) => {
          listener = callback;
          return { remove: () => {} };
        },
      },
    },
    "../utils/camera-environment": {
      getCameraEnvironmentIssue: () => environmentIssue,
    },
  });
  const { useCameraAccess } = load<
    typeof import("../src/features/camera/hooks/use-camera-access.ts")
  >("src/features/camera/hooks/use-camera-access.ts");
  function CameraAccessFixture() {
    cursor = 0;
    refCursor = 0;
    return useCameraAccess();
  }
  CameraAccessFixture();
  const dispose = effect?.();
  return {
    render: CameraAccessFixture,
    dispose,
    setGetError: (value: boolean) => {
      getFails = value;
    },
    setEnvironment: (value: typeof environmentIssue) => {
      environmentIssue = value;
    },
    setGranted: (value: boolean) => {
      granted = value;
    },
    activate: () => listener?.("active"),
    requests: () => requests,
    deferQuery: () => {
      let finish: () => void = () => {};
      const result = permission();
      nextQuery = new Promise((resolve) => {
        finish = () => resolve(result);
      });
      return finish;
    },
  };
}
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

test("permission query failure renders a retryable state and an explicit request can recover", async () => {
  const f = fixture();
  await flush();
  f.setGetError(true);
  f.activate();
  await flush();
  assert.equal(f.render().issue, "permissionError");
  const pending = f.render().request();
  assert.equal(f.requests(), 1);
  await pending;
  assert.equal(f.render().permission?.granted, true);
  assert.equal(f.render().issue, null);
});

test("blocked camera environments explain the problem without requesting access", async () => {
  for (const issue of ["insecure", "unsupported", "embedded"] as const) {
    const f = fixture();
    f.setEnvironment(issue);
    await f.render().request();
    assert.equal(f.requests(), 0);
    assert.equal(f.render().issue, issue);
    f.dispose?.();
  }
});

test("returning from settings refreshes permission and also detects revoked access", async () => {
  const f = fixture();
  await flush();
  await f.render().request();
  assert.equal(f.render().permission?.granted, true);
  f.setGranted(false);
  f.activate();
  await flush();
  assert.equal(f.render().permission?.granted, false);
  assert.equal(f.render().issue, "denied");
});

test("a stale permission query cannot revoke newly granted camera access", async () => {
  const f = fixture();
  await flush();
  const finishQuery = f.deferQuery();
  f.activate();
  await f.render().request();
  finishQuery();
  await flush();
  assert.equal(f.render().permission?.granted, true);
  assert.equal(f.render().issue, null);
  f.dispose?.();
});

test("returning to the app during a permission request does not start a second request", async () => {
  const f = fixture();
  await flush();
  const first = f.render().request();
  f.activate();
  await Promise.all([first, f.render().request()]);
  assert.equal(f.requests(), 1);
  assert.equal(f.render().permission?.granted, true);
  f.dispose?.();
});
