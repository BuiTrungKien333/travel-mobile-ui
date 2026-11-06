import { StatusBadge } from "@/components/ui/status-badge";
import type { Memory } from "@/features/home/types/home-types";
import { useMemoriesCopy } from "../i18n/memories-copy";

export function memorySyncState(memory: Memory, syncing = false, failed = false) {
  if (memory.pendingDeletion || memory.local?.deletePending) return "deleting";
  if (syncing) return "syncing";
  if (memory.remote || memory.local?.uploaded) return "synced";
  if (failed) return "failed";
  if (memory.local?.clientRequestId) return "pending";
  return "private";
}

export function MemorySyncBadge({ memory, syncing, failed }: { memory: Memory; syncing?: boolean; failed?: boolean }) {
  const { copy } = useMemoriesCopy();
  const state = memorySyncState(memory, syncing, failed);
  const label = { deleting: copy.pendingDelete, syncing: copy.syncingPhoto, failed: copy.syncFailed,
    synced: copy.syncedPhoto, pending: copy.pendingSync, private: copy.privatePhoto }[state];
  const tone = state === "synced" ? "success" : state === "failed" ? "error"
    : state === "deleting" || state === "pending" ? "warning" : state === "syncing" ? "info" : "neutral";
  return <StatusBadge label={label} tone={tone} />;
}
