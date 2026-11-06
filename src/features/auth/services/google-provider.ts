import { ApiError } from "@/services/api/api-error";
import Constants from "expo-constants";
import { Platform } from "react-native";
import type { GoogleChallenge } from "../types/auth-types";

export async function getGoogleIdToken(
  challenge: GoogleChallenge,
): Promise<string> {
  if (Constants.executionEnvironment === "storeClient")
    throw new ApiError("GOOGLE_BUILD_REQUIRED");
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (
    Platform.OS === "ios" &&
    !iosClientId?.match(/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/)
  )
    throw new ApiError("GOOGLE_CONFIG");
  let sdk: typeof import("react-native-nitro-google-signin");
  try {
    sdk = await import("react-native-nitro-google-signin");
  } catch {
    throw new ApiError("GOOGLE_BUILD_REQUIRED");
  }
  try {
    sdk.GoogleOneTapSignIn.configure({
      webClientId: challenge.webClientId,
      iosClientId,
      nonce: challenge.nonce,
      offlineAccess: false,
      autoSelectOnSignIn: true,
    });
    if (Platform.OS === "android")
      await sdk.GoogleOneTapSignIn.checkPlayServices();
    // iOS silent restore returns an old nonce: request a fresh interactive token instead.
    let result =
      Platform.OS === "ios"
        ? await sdk.GoogleOneTapSignIn.presentExplicitSignIn()
        : await sdk.GoogleOneTapSignIn.signIn();
    if (sdk.isNoSavedCredentialFoundResponse(result))
      result = await sdk.GoogleOneTapSignIn.createAccount();
    if (sdk.isCancelledResponse(result)) throw new ApiError("CANCELLED");
    if (!sdk.isSuccessResponse(result)) throw new ApiError("GOOGLE_FAILED");
    return result.data.idToken;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (sdk.isErrorWithCode(error)) {
      if (error.code === sdk.statusCodes.DEVELOPER_ERROR)
        throw new ApiError("GOOGLE_CONFIG");
      if (error.code === sdk.statusCodes.PLAY_SERVICES_NOT_AVAILABLE)
        throw new ApiError("GOOGLE_PLAY_SERVICES");
      if (error.code === sdk.statusCodes.IN_PROGRESS)
        throw new ApiError("CANCELLED");
      if (error.code === sdk.statusCodes.SIGN_IN_CANCELLED)
        throw new ApiError("CANCELLED");
    }
    throw new ApiError("GOOGLE_FAILED");
  }
}
