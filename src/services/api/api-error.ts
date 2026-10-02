import { isAxiosError, isCancel } from "axios";
import { z } from "zod";

const errorSchema = z.object({
  code: z.string(),
  errors: z.record(z.string(), z.string()).optional(),
});

export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly fields?: Record<string, string>;
  constructor(
    code: string,
    status?: number,
    fields?: Record<string, string>,
  ) {
    // Không đưa message kỹ thuật/raw response chứa dữ liệu nhạy cảm ra UI.
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isCancel(error)) return new ApiError("CANCELLED");
  if (isAxiosError<unknown>(error)) {
    if (!error.response) {
      return new ApiError(error.code === "ECONNABORTED" ? "TIMEOUT" : "NETWORK");
    }
    const parsed = errorSchema.safeParse(error.response.data);
    return new ApiError(
      parsed.success ? parsed.data.code : "SERVER",
      error.response.status,
      parsed.success ? parsed.data.errors : undefined,
    );
  }
  return new ApiError("UNKNOWN");
}
