import { saveServerConnection } from "@/services/api/server-connection";
import { resolveApiUrl } from "@/services/api/client";
import { authSession } from "./auth-session";

export type ConnectionStage = "probe" | "session" | "preference";
export type ConnectionFailure =
  | "INVALID_URL"
  | "NETWORK"
  | "TIMEOUT"
  | "RESPONSE"
  | "HEALTH"
  | "SESSION"
  | "PREFERENCE"
  | "NAVIGATION";
export class ServerConnectionError extends Error {
  constructor(
    readonly code: ConnectionFailure,
    readonly httpStatus?: number,
  ) {
    super(`CONNECT_${code}`);
    this.name = "ServerConnectionError";
  }
}

export async function connectServer(
  value: string,
  onStage?: (stage: ConnectionStage) => void,
) {
  const origin = resolveApiUrl(value);
  if (!origin) throw new ServerConnectionError("INVALID_URL");
  onStage?.("probe");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    let response: Response;
    try {
      // Probe anonymously: credentials must never be sent to a candidate server.
      response = await fetch(`${origin}/actuator/health`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
    } catch {
      throw new ServerConnectionError(
        controller.signal.aborted ? "TIMEOUT" : "NETWORK",
      );
    }
    if (!response.ok)
      throw new ServerConnectionError("HEALTH", response.status);
    let health: unknown;
    try {
      health = await response.json();
    } catch {
      throw new ServerConnectionError(
        controller.signal.aborted ? "TIMEOUT" : "RESPONSE",
        response.status,
      );
    }
    if (
      !health ||
      typeof health !== "object" ||
      !("status" in health) ||
      health.status !== "UP"
    )
      throw new ServerConnectionError("HEALTH", response.status);
  } finally {
    // The network deadline must not remain active during native storage work.
    clearTimeout(timeout);
  }
  onStage?.("session");
  try {
    await authSession.expire();
  } catch {
    throw new ServerConnectionError("SESSION");
  }
  onStage?.("preference");
  try {
    await saveServerConnection(origin);
  } catch {
    throw new ServerConnectionError("PREFERENCE");
  }
  return origin;
}
