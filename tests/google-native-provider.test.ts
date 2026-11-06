import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

const challenge = { challengeId: "00000000-0000-4000-8000-000000000001", nonce: "a".repeat(64),
  webClientId: "123-example.apps.googleusercontent.com", expiresIn: 300000 };

test("native Google configuration errors stay distinguishable from cancellation and general failures", async () => {
  for (const [nativeCode, expected] of [
    ["DEVELOPER_ERROR", "GOOGLE_CONFIG"], ["SIGN_IN_CANCELLED", "CANCELLED"],
    ["PLAY_SERVICES_NOT_AVAILABLE", "GOOGLE_PLAY_SERVICES"], ["ONE_TAP_START_FAILED", "GOOGLE_FAILED"],
  ]) {
    const load = tripModuleLoader({
      "expo-constants": { executionEnvironment: "bare" },
      "react-native": { Platform: { OS: "android" } },
      "react-native-nitro-google-signin": {
        GoogleOneTapSignIn: { configure() {}, checkPlayServices: async () => {},
          signIn: async () => { throw { code: nativeCode }; } },
        isErrorWithCode: () => true,
        statusCodes: { DEVELOPER_ERROR: "DEVELOPER_ERROR", SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
          PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE", IN_PROGRESS: "IN_PROGRESS" },
      },
    }, { process: { env: {} } });
    const { getGoogleIdToken } = load<typeof import("../src/features/auth/services/google-provider.ts")>("src/features/auth/services/google-provider.ts");
    await assert.rejects(getGoogleIdToken(challenge), { code: expected });
  }
});

test("Expo Go reports that a native build is required before importing Google SDK", async () => {
  const load = tripModuleLoader({ "expo-constants": { executionEnvironment: "storeClient" },
    "react-native": { Platform: { OS: "android" } } });
  const { getGoogleIdToken } = load<typeof import("../src/features/auth/services/google-provider.ts")>("src/features/auth/services/google-provider.ts");
  await assert.rejects(getGoogleIdToken(challenge), { code: "GOOGLE_BUILD_REQUIRED" });
});
