import { ApiError } from "@/services/api/api-error";

type CameraErrorCopy = {
  importLimit: string;
  tooLarge: string;
  invalidType: string;
  imageTooLarge: string;
  futureDate: string;
  uploadError: string;
  networkError: string;
  uploadTimeout: string;
  storageUnavailable: string;
  sessionExpired: string;
  localPhotoMissing: string;
};

/** Only expose our normalized code/status; never a URL, file path or raw provider error. */
export function cameraApiErrorMessage(error: ApiError, copy: CameraErrorCopy) {
  const known: Record<string, string> = {
    UPLOAD_005: copy.importLimit,
    UPLOAD_002: copy.tooLarge,
    UPLOAD_003: copy.invalidType,
    UPLOAD_008: copy.imageTooLarge,
    MEMORY_FUTURE_DATE: copy.futureDate,
    NETWORK: copy.networkError,
    TIMEOUT: copy.uploadTimeout,
    LOCAL_PHOTO: copy.localPhotoMissing,
    AUTH_001: copy.sessionExpired,
    AUTH_007: copy.sessionExpired,
    UPLOAD_006: copy.storageUnavailable,
  };
  const message = known[error.code] ?? copy.uploadError;
  const code = /^[A-Z][A-Z0-9_]{0,60}$/.test(error.code)
    ? error.code
    : "UNKNOWN";

  return `${message} (${code}${error.status ? ` · HTTP ${error.status}` : ""})`;
}
