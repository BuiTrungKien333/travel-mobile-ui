import { type TranslationKey } from "@/i18n/translations";
import { normalizeApiError } from "@/services/api/api-error";

const errorKeys: Record<string, TranslationKey> = {
  AUTH_011: "auth.error.googleInvalid",
  AUTH_012: "auth.error.googleUnavailable",
  AUTH_013: "auth.error.googleConfig",
  AUTH_014: "auth.error.googleConflict",
  GOOGLE_CONFIG: "auth.error.googleConfig",
  GOOGLE_BUILD_REQUIRED: "auth.error.googleBuild",
  GOOGLE_PLAY_SERVICES: "auth.error.googleServices",
  GOOGLE_FAILED: "auth.error.googleFailed",
  AUTH_008: "auth.error.emailUnverified",
  AUTH_009: "auth.error.invalidLink",
  AUTH_010: "auth.error.emailUnavailable",
  COMMON_003: "auth.error.fieldInvalid",
  AUTH_001: "auth.error.sessionExpired",
  AUTH_003: "auth.error.emailExists",
  AUTH_004: "auth.error.credentials",
  AUTH_005: "auth.error.sessionExpired",
  AUTH_007: "auth.error.accountDisabled",
  NETWORK: "auth.error.network",
  TIMEOUT: "auth.error.timeout",
  API_CONFIG: "auth.error.config",
  STORAGE: "auth.error.storage",
  INVALID_RESPONSE: "auth.error.response",
  CANCELLED: "auth.error.cancelled",
};

export function authErrorMessage(
  error: unknown,
  t: (key: TranslationKey) => string,
): string {
  const failure = normalizeApiError(error);
  if (failure.status === 429) return t("auth.error.rateLimit");
  const message = t(errorKeys[failure.code] ?? "auth.error.generic");
  if (
    failure.code === "STORAGE" &&
    "diagnostic" in failure &&
    typeof failure.diagnostic === "string" &&
    /^SECURE_(READ|WRITE|DELETE)_[A-Z_]{1,64}$/.test(failure.diagnostic)
  )
    return `${message} (${failure.diagnostic})`;
  return message;
}
