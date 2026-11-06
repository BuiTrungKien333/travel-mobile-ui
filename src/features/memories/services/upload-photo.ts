import { Platform } from "react-native";
import { ApiError } from "@/services/api/api-error";
import { memoryApi, type ServerMemory, type UploadLimits } from "../api/memory-api";
import type { LocalMemory } from "../schemas/local-memory-schema";
import { createRequestId } from "@/utils/create-request-id";
import { withMemoryOperation } from "./memory-operation";
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function photoFormData(memory: LocalMemory, limits: UploadLimits): Promise<FormData> {
  const { width, height } = memory.local;
  if (width && height && (width > limits.maxDimension || height > limits.maxDimension || width * height > limits.maxPixels))
    throw new ApiError("UPLOAD_008");
  const body = new FormData();
  if (Platform.OS === "web") {
    const response = await fetch(memory.photo);
    if (!response.ok) throw new ApiError("LOCAL_PHOTO");
    const blob = await response.blob();
    if (!blob.size) throw new ApiError("UPLOAD_001");
    if (blob.size > limits.maxFileBytes) throw new ApiError("UPLOAD_002");
    if (!IMAGE_MIME_TYPES.includes(blob.type)) throw new ApiError("UPLOAD_003");
    body.append("file", blob, `${memory.id}.${blob.type.split("/")[1]}`);
  } else {
    const { File } = await import("expo-file-system");
    const file = new File(memory.photo);
    if (!file.exists || !file.size) throw new ApiError("LOCAL_PHOTO");
    if (file.size > limits.maxFileBytes) throw new ApiError("UPLOAD_002");
    const mimeType = memory.local.mimeType ?? "image/jpeg";
    if (!IMAGE_MIME_TYPES.includes(mimeType)) throw new ApiError("UPLOAD_003");
    // RN has this additional FormData overload; the web TypeScript lib only declares Blob.
    const nativeBody = body as FormData & {
      append(name: string, value: { uri: string; name: string; type: string }): void;
    };
    nativeBody.append("file", { uri: file.uri, name: `${memory.id}.${mimeType.split("/")[1]}`, type: mimeType });
  }
  return body;
}

const uploads = new Map<string, Promise<ServerMemory>>();

export function uploadLocalMemory(
  memory: LocalMemory,
  userId: string,
  persist: (memory: LocalMemory) => Promise<void>,
  assertSession: () => void,
  onProgress?: (progress: number) => void,
  sessionVersion?: number,
) {
  const key = `${userId}:${sessionVersion ?? "direct"}:${memory.id}`;
  const existing = uploads.get(key);
  if (existing) return existing;
  const operation = withMemoryOperation(userId, memory.id, () => performUpload(memory, userId, persist, assertSession, onProgress))
    .finally(() => uploads.delete(key));
  uploads.set(key, operation);
  return operation;
}

async function performUpload(
  memory: LocalMemory,
  userId: string,
  persist: (memory: LocalMemory) => Promise<void>,
  assertSession: () => void,
  onProgress?: (progress: number) => void,
) {
  assertSession();
  if (memory.local.userId !== userId) throw new ApiError("CANCELLED");
  if (memory.local.deletePending) throw new ApiError("MEMORY_DELETE_PENDING", 409);
  if (!memory.tripId) throw new ApiError("TRIP_001");
  const experiencedAt = new Date(`${memory.date}T${memory.time}:00`);
  if (!Number.isFinite(experiencedAt.getTime()) || experiencedAt.getTime() > Date.now()) throw new ApiError("MEMORY_FUTURE_DATE");
  const limits = await memoryApi.limits();
  const body = await photoFormData(memory, limits);
  assertSession();
  let draft = { ...memory, local: { ...memory.local, userId, clientRequestId: memory.local.clientRequestId ?? createRequestId() } };
  await persist(draft);
  assertSession();
  if (!draft.local.serverId) {
    const created = await memoryApi.create({
      clientRequestId: draft.local.clientRequestId, tripId: draft.tripId,
      placeId: draft.local.placeId, note: draft.text, experiencedAt: experiencedAt.toISOString(),
    });
    assertSession();
    draft = { ...draft, local: { ...draft.local, serverId: created.id, serverVersion: created.version } };
    await persist(draft);
  }
  const serverId = draft.local.serverId;
  if (!serverId) throw new ApiError("INVALID_RESPONSE");
  assertSession();
  // A previous upload can succeed even when its response is lost. Read before retrying.
  const current = await memoryApi.detail(serverId);
  assertSession();
  if (draft.local.uploaded && current.media.length === 0) throw new ApiError("MEMORY_REMOTE_MISSING", 404);
  if (!draft.local.uploaded && current.media.length === 0) await memoryApi.upload(serverId, memory.tripId, body, onProgress, draft.local.clientRequestId);
  assertSession();
  const result = await memoryApi.detail(serverId);
  assertSession();
  if (!result.media.length) throw new ApiError("INVALID_RESPONSE");
  await persist({ ...draft, text: result.note ?? "", local: { ...draft.local, uploaded: true,
    mediaId: result.media[0].id, serverVersion: result.version } });
  assertSession();
  return result;
}
