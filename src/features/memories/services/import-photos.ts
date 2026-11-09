import { MEMORY_UPLOAD_CONCURRENCY } from "../constants/memory-limits";
import type { LocalMemory } from "../schemas/local-memory-schema";

export type ImportSource = {
  uri: string;
  width: number;
  height: number;
  mimeType?: string;
};
export type PhotoImportItem = {
  id: string;
  source: ImportSource;
  memory?: LocalMemory;
  state: "waiting" | "saving" | "uploading" | "saved" | "uploaded" | "error";
  progress: number;
  error?: unknown;
};

/** Keep every available local copy before starting network work. Retry keeps memory/request IDs. */
export async function importPhotos(
  items: readonly PhotoImportItem[],
  options: {
    save: (source: ImportSource) => Promise<LocalMemory>;
    upload?: (
      memory: LocalMemory,
      onProgress: (value: number) => void,
    ) => Promise<unknown>;
    assertSession: () => void;
    onChange: (item: PhotoImportItem) => void;
  },
) {
  const pending: PhotoImportItem[] = [];
  const change = (item: PhotoImportItem) => {
    options.onChange(item);
    return item;
  };
  for (const item of items) {
    if (item.state === "uploaded" || item.state === "saved") continue;
    let current = item;
    try {
      options.assertSession();
      if (!current.memory) {
        change({ ...current, state: "saving", error: undefined });
        const memory = await options.save(current.source);
        current = { ...current, memory };
      }
      options.assertSession();
      current = change({
        ...current,
        state: options.upload ? "waiting" : "saved",
        progress: 0,
        error: undefined,
      });
      if (options.upload) pending.push(current);
    } catch (error) {
      change({ ...current, state: "error", error });
    }
  }
  const upload = options.upload;
  if (!upload) return;
  let cursor = 0;
  async function worker() {
    const uploadOne = options.upload;
    if (!uploadOne) return;
    while (cursor < pending.length) {
      let item = pending[cursor++];
      try {
        options.assertSession();
        const memory = item.memory;
        if (!memory) continue;
        item = change({ ...item, state: "uploading", progress: 0 });
        await uploadOne(memory, (value) => {
          const progress = Math.round(Math.max(0, Math.min(1, value)) * 100);
          if (progress !== item.progress) item = change({ ...item, progress });
        });
        options.assertSession();
        change({ ...item, state: "uploaded", progress: 100 });
      } catch (error) {
        change({ ...item, state: "error", error });
      }
    }
  }
  await Promise.all(
    Array.from(
      { length: Math.min(MEMORY_UPLOAD_CONCURRENCY, pending.length) },
      worker,
    ),
  );
}
