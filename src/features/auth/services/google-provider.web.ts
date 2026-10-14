import { ApiError } from "@/services/api/api-error";
import type { GoogleChallenge } from "../types/auth-types";

export async function getGoogleIdToken(
  _challenge: GoogleChallenge,
): Promise<string> {
  // Browser credentials are delivered by the Google Identity Services button callback.
  throw new ApiError("GOOGLE_FAILED");
}
