import { z } from "zod";

export const authUserSchema = z.object({
  // Java/PostgreSQL UUID và ID seed không bắt buộc mang version/variant RFC của UUID ngẫu nhiên.
  id: z.guid(),
  email: z.email(),
  fullName: z.string().min(1),
  role: z.enum(["USER", "ADMIN", "GUEST"]),
  avatarUrl: z.string().nullable().optional(),
});

export const authDataSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).max(4096),
  tokenType: z.literal("Bearer"),
  // Contract backend sử dụng milliseconds.
  expiresIn: z.number().positive().safe(),
  user: authUserSchema,
});

export type AuthData = z.infer<typeof authDataSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthStatus = "restoring" | "authenticated" | "anonymous" | "restore-error";

export const emailRequestResultSchema = z.object({ resendAfterSeconds: z.number().int().positive().safe() });
export const registrationResultSchema = emailRequestResultSchema.extend({ verificationRequired: z.literal(true) });

export const googleChallengeSchema = z.object({
  challengeId: z.guid(), nonce: z.string().regex(/^[a-f0-9]{64}$/),
  webClientId: z.string().regex(/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/),
  expiresIn: z.number().int().positive().max(600000),
});
export const googleLoginSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("AUTHENTICATED"), auth: authDataSchema }),
  z.object({ status: z.literal("VERIFICATION_REQUIRED"), email: z.email(), resendAfterSeconds: z.number().int().positive().safe() }),
]);
export type GoogleChallenge = z.infer<typeof googleChallengeSchema>;
export type GoogleLoginOutcome = z.infer<typeof googleLoginSchema>;
export type GoogleCredential = { challengeId: string; idToken: string };
