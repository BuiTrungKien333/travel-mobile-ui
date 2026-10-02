import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth-api";
import { authSession } from "../services/auth-session";
import { getGoogleIdToken } from "../services/google-provider";
import type { GoogleCredential } from "../types/auth-types";

export function useGoogleLogin() {
  return useMutation({ mutationFn: (credential: GoogleCredential | undefined) => authSession.authenticateOutcome(async () => {
    if (credential) return authApi.googleLogin(credential);
    const challenge = await authApi.googleChallenge();
    const idToken = await getGoogleIdToken(challenge);
    return authApi.googleLogin({ challengeId: challenge.challengeId, idToken });
  }, (result) => result.status === "AUTHENTICATED" ? result.auth : null) });
}

export function useGoogleEmailConfirmation() {
  return useMutation({ mutationFn: (token: string) => authSession.authenticate(() => authApi.googleVerifyLink(token)) });
}
