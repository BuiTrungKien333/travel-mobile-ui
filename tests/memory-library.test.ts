import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { Trip, Memory } from "../src/features/home/types/home-types.ts";

const {
  buildMemoryAlbums,
  isSampleMemory,
  photoRows,
  memoryThumbnail,
  libraryThumbnail,
} = tripModuleLoader()<
  typeof import("../src/features/memories/utils/memory-library.ts")
>("src/features/memories/utils/memory-library.ts");
const trip = (id: string, startDate: string): Trip => ({
  id,
  startDate,
  destination: id,
  status: "completed",
  days: [],
});

test("library groups actual photos once, sorts trips/photos and never counts local samples", () => {
  const trips = [trip("old", "2026-10-01"), trip("new", "2026-11-01")];
  const memories: Memory[] = [
    {
      id: "one",
      tripId: "old",
      destination: "old",
      text: "",
      photo: "https://example.com/a.jpg",
      date: "2026-10-01",
    },
    {
      id: "two",
      tripId: "old",
      destination: "old",
      text: "",
      photo: "https://example.com/b.jpg",
      date: "2026-10-02",
    },
    { id: "local", destination: "", text: "", photo: "file:///local.jpg" },
  ];
  const albums = buildMemoryAlbums(trips, memories);
  assert.equal(albums[0].trip.id, "new");
  assert.equal(albums[0].photoCount, 0);
  assert.equal(albums[0].sample, true);
  assert.equal(albums[0].photos.length, 6);
  assert.ok(albums[0].photos.every(isSampleMemory));
  assert.ok(
    String(libraryThumbnail(albums[0].photos[0], 300)).includes("/thumbnails/"),
  );
  assert.ok(albums[0].photos.every((photo) => !photo.local && !photo.remote));
  assert.equal(albums[1].photoCount, 2);
  assert.equal(albums[1].photos[0].id, "two");
  assert.equal(memories.length, 3);
  assert.equal(trips[0].id, "old");
  assert.equal(
    JSON.stringify(albums[0].photos),
    JSON.stringify(buildMemoryAlbums(trips, memories)[0].photos),
  );
});

test("grid rows preserve every photo and leave incomplete final rows unpadded", () => {
  const photos = buildMemoryAlbums(
    [trip("sample", "2026-11-01")],
    [],
  )[0].photos.slice(0, 5);
  const rows = photoRows(photos);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].length, 3);
  assert.equal(rows[1].length, 2);
  assert.equal(rows.flat().length, 5);
  assert.equal(photoRows([]).length, 0);
});

test("thumbnail requests resize unsigned Cloudinary images but preserve signed/custom/local sources", () => {
  const original =
    "https://res.cloudinary.com/demo/image/upload/v123/trip/photo.jpg";
  assert.equal(
    memoryThumbnail(original, 299.5),
    "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_300,h_300/v123/trip/photo.jpg",
  );
  for (const source of [
    "file:///photo.jpg",
    "blob:https://example.com/photo",
    "https://example.com/photo.jpg",
    "https://res.cloudinary.com/demo/image/upload/s--signed--/v1/photo.jpg",
    17,
    undefined,
  ])
    assert.equal(memoryThumbnail(source, 300), source);
  assert.equal(memoryThumbnail(original, Number.NaN), original);
});
