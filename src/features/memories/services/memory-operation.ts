import { ApiError } from "@/services/api/api-error";

// Shared by screens: deleting/editing a capture cannot race its upload checkpoints.
const operations = new Map<string, Promise<unknown>>();
export async function withMemoryOperation<T>(owner: string, id: string, task: () => Promise<T>): Promise<T> {
  const key = `${owner}:${id}`;
  if (operations.has(key)) throw new ApiError("MEMORY_BUSY", 409);
  const operation = task();
  operations.set(key, operation);
  try { return await operation; }
  finally { if (operations.get(key) === operation) operations.delete(key); }
}
