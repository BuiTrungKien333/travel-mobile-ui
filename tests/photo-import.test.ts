import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { LocalMemory } from "../src/features/memories/schemas/local-memory-schema.ts";
import type {
  PhotoImportItem,
  ImportSource,
} from "../src/features/memories/services/import-photos.ts";

const { importPhotos } = tripModuleLoader()<
  typeof import("../src/features/memories/services/import-photos.ts")
>("src/features/memories/services/import-photos.ts");
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
function items(count: number): PhotoImportItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    source: { uri: `file:///photo-${index}.jpg`, width: 1200, height: 800 },
    state: "waiting",
    progress: 0,
  }));
}
function memory(source: ImportSource): LocalMemory {
  return {
    id: `local-${source.uri.split("/").at(-1)?.split(".")[0]}`,
    photo: source.uri,
    date: "2026-01-01",
    time: "10:00",
    destination: "",
    text: "",
    local: { capturedAt: "2026-01-01T03:00:00Z", deviceSaved: false },
  };
}

test("all local saves precede network work and at most two uploads run at once", async () => {
  const rows = items(5);
  const saved: string[] = [],
    uploaded: string[] = [];
  const releases: (() => void)[] = [];
  let active = 0,
    peak = 0;
  const operation = importPhotos(rows, {
    assertSession() {},
    save: async (source) => {
      saved.push(source.uri);
      return memory(source);
    },
    upload: async (photo) => {
      assert.equal(saved.length, 5);
      active++;
      peak = Math.max(peak, active);
      await new Promise<void>((resolve) => releases.push(resolve));
      uploaded.push(photo.id);
      active--;
    },
    onChange: (row) => {
      rows[Number(row.id)] = row;
    },
  });
  await flush();
  assert.equal(active, 2);
  for (let index = 0; index < 5; index++) {
    releases[index]();
    await flush();
  }
  await operation;
  assert.equal(peak, 2);
  assert.equal(uploaded.length, 5);
  assert.ok(
    rows.every((row) => row.state === "uploaded" && row.progress === 100),
  );
});

test("partial failure retains local IDs and retry skips successful files and local saves", async () => {
  const rows = items(3);
  let saves = 0,
    fail = true;
  const uploads: string[] = [];
  const options = {
    assertSession() {},
    save: async (source: ImportSource) => {
      saves++;
      return memory(source);
    },
    upload: async (photo: LocalMemory, progress: (value: number) => void) => {
      uploads.push(photo.id);
      progress(0.6);
      if (fail && photo.id.endsWith("1")) throw new Error("network failure");
    },
    onChange: (row: PhotoImportItem) => {
      rows[Number(row.id)] = row;
    },
  };
  await importPhotos(rows, options);
  assert.equal(rows[1].state, "error");
  const original = rows[1].memory;
  assert.ok(original);
  assert.equal(rows[2].state, "uploaded");
  fail = false;
  await importPhotos(rows, options);
  assert.equal(saves, 3);
  assert.equal(uploads.length, 4);
  assert.equal(rows[1].memory, original);
  assert.ok(rows.every((row) => row.state === "uploaded"));
});

test("photos without a trip are saved locally and never sent to cloud", async () => {
  const rows = items(3);
  await importPhotos(rows, {
    assertSession() {},
    save: async (source) => memory(source),
    onChange: (row) => {
      rows[Number(row.id)] = row;
    },
  });
  assert.ok(rows.every((row) => row.state === "saved" && row.memory));
});

test("a local storage failure does not block the remaining photos or claim that file is saved", async () => {
  const rows = items(3);
  const uploaded: string[] = [];
  await importPhotos(rows, {
    assertSession() {},
    save: async (source) => {
      if (source.uri.includes("-1")) throw new Error("Storage full");
      return memory(source);
    },
    upload: async (photo) => {
      uploaded.push(photo.id);
    },
    onChange: (row) => {
      rows[Number(row.id)] = row;
    },
  });
  assert.equal(rows[1].state, "error");
  assert.equal(rows[1].memory, undefined);
  assert.equal(uploaded.length, 2);
});

test("changing session after local persistence stops cloud work without dropping the saved copy", async () => {
  const rows = items(3);
  let changed = false,
    uploads = 0,
    saves = 0;
  await importPhotos(rows, {
    assertSession() {
      if (changed) throw new Error("Session changed");
    },
    save: async (source) => {
      saves++;
      changed = true;
      return memory(source);
    },
    upload: async () => {
      uploads++;
    },
    onChange: (row) => {
      rows[Number(row.id)] = row;
    },
  });
  assert.equal(uploads, 0);
  assert.equal(saves, 1);
  assert.ok(rows[0].memory);
  assert.ok(rows.every((row) => row.state === "error"));
});
