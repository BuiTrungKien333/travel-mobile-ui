import { z } from "zod";

import { ApiError } from "@/services/api/api-error";
import { apiClient } from "@/services/api/client";
import type {
  LoginFormValues,
  RegisterFormValues,
} from "../schemas/auth-schemas";
import {
  authDataSchema,
  authUserSchema,
  emailRequestResultSchema,
  googleChallengeSchema,
  googleLoginSchema,
  registrationResultSchema,
  type GoogleCredential,
} from "../types/auth-types";
import { authEndpoints } from "./auth-endpoints";

const authEnvelope = z.object({
  success: z.literal(true),
  data: authDataSchema,
});

const profileEnvelope = z.object({
  success: z.literal(true),
  data: authUserSchema,
});

const registrationEnvelope = z.object({
  success: z.literal(true),
  data: registrationResultSchema,
});

const emailEnvelope = z.object({
  success: z.literal(true),
  data: emailRequestResultSchema,
});

const googleChallengeEnvelope = z.object({
  success: z.literal(true),
  data: googleChallengeSchema,
});

const googleLoginEnvelope = z.object({
  success: z.literal(true),
  data: googleLoginSchema,
});

export const authApi = {
  async googleChallenge(signal?: AbortSignal) {
    const response = await apiClient.post<unknown>(
      authEndpoints.googleChallenge,
      {},
      { signal },
    );
    const parsed = googleChallengeEnvelope.safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },

  async googleLogin(credential: GoogleCredential) {
    const response = await apiClient.post<unknown>(
      authEndpoints.googleLogin,
      credential,
    );
    const parsed = googleLoginEnvelope.safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },

  async googleVerifyLink(token: string) {
    const response = await apiClient.post<unknown>(
      authEndpoints.googleVerifyLink,
      { token },
    );
    const parsed = authEnvelope.safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },

  async login(values: LoginFormValues) {
    const response = await apiClient.post<unknown>(authEndpoints.login, values);
    const parsed = authEnvelope.safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },

  async register(values: RegisterFormValues) {
    const response = await apiClient.post<unknown>(
      authEndpoints.register,
      values,
    );
    const parsed = registrationEnvelope.safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },

  async refresh(refreshToken: string) {
    const response = await apiClient.post<unknown>(authEndpoints.refresh, {
      refreshToken,
    });
    const parsed = authEnvelope.safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },

  async logout(refreshToken: string) {
    await apiClient.post(authEndpoints.logout, { refreshToken });
  },

  async profile(signal?: AbortSignal) {
    const response = await apiClient.get<unknown>(authEndpoints.profile, {
      signal,
    });
    const parsed = profileEnvelope.safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },

  async requestEmail(email: string, purpose: "verify" | "reset") {
    const endpoint =
      purpose === "verify"
        ? authEndpoints.resendVerification
        : authEndpoints.forgotPassword;
    const response = await apiClient.post<unknown>(endpoint, { email });
    const parsed = emailEnvelope.safeParse(response.data);
    if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
    return parsed.data.data;
  },

  async verifyEmail(token: string) {
    await apiClient.post(authEndpoints.verifyEmail, { token });
  },

  async resetPassword(values: { token: string; password: string }) {
    await apiClient.post(authEndpoints.resetPassword, values);
  },
};
