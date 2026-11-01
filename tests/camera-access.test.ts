import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

function fixture() {
  let states: unknown[] = [];
  let cursor = 0;
  let effect: (() => () => void) | undefined;
  let listener: ((state: string) => void) | undefined;
  let getFails = false;
  let environmentIssue: "insecure" | "unsupported" | null = null;
  let granted = false;
  let requests = 0;
  const mounted = { current: false };
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
      useRef: () => mounted,
      useCallback: (callback: unknown) => callback,
      useEffect: (callback: () => () => void) => {
        effect = callback;
      },
    },
    "expo-camera": {
      Camera: {
        getCameraPermissionsAsync: async () => {
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
  function render() {
    cursor = 0;
    return useCameraAccess();
  }
  render();
  const dispose = effect?.();
  return {
    render,
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

test("insecure and unsupported web environments explain the problem without requesting camera access", async () => {
  for (const issue of ["insecure", "unsupported"] as const) {
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
