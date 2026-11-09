import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clampPhoto,
  fitPhoto,
  panLimits,
  photoPageDestination,
  rubberBand,
  zoomOffset,
} from "../src/features/home/utils/photo-viewer-geometry.ts";

test("fits the entire original photo without cropping in portrait and landscape viewports", () => {
  assert.deepEqual(
    fitPhoto({ width: 1200, height: 800 }, { width: 390, height: 844 }),
    { x: 0, y: 292, width: 390, height: 260 },
  );
  assert.deepEqual(
    fitPhoto({ width: 800, height: 1200 }, { width: 900, height: 600 }),
    { x: 250, y: 0, width: 400, height: 600 },
  );
});

test("horizontal swipes page in both directions and respect album boundaries", () => {
  const destination = (index: number, dx: number, velocity = 0) =>
    photoPageDestination(index, 6, dx, velocity, 390, 0.2, 650, 32);
  assert.equal(destination(2, -100), 3);
  assert.equal(destination(2, 100), 1);
  assert.equal(destination(0, 100), 0);
  assert.equal(destination(5, -100), 5);
  assert.equal(destination(2, -40, -800), 3);
  assert.equal(destination(2, 40, 800), 1);
  assert.equal(destination(2, -20, -1200), 2);
  assert.equal(destination(2, -60, -400), 2);
  assert.equal(destination(2, -120, 800), 1);
  assert.equal(photoPageDestination(0, 1, -200, -900, 390, 0.2, 650, 32), 0);
});

test("pan limits prevent exposing space beyond photo edges, including an axis smaller than the screen", () => {
  const photo = { width: 390, height: 260 };
  const screen = { width: 390, height: 844 };
  assert.deepEqual(panLimits(photo, screen, 1), { x: 0, y: 0 });
  assert.deepEqual(panLimits(photo, screen, 2.5), { x: 292.5, y: 0 });
  assert.deepEqual(panLimits(photo, screen, 5), { x: 780, y: 228 });
});

test("double tap zoom keeps the photo point under the finger at the same screen position", () => {
  const focal = 290;
  const center = 195;
  const offset = -20;
  const oldScale = 1.5;
  const nextScale = 3;
  const photoPoint = (focal - center - offset) / oldScale;
  const nextOffset = zoomOffset(focal, center, offset, oldScale, nextScale);
  assert.ok(
    Math.abs(center + nextOffset + photoPoint * nextScale - focal) < 1e-9,
  );
  assert.equal(zoomOffset(center, center, 0, 1, 2.5), 0);
});

test("rubber banding is continuous, symmetric, and progressively resists overscroll", () => {
  assert.equal(rubberBand(20, -100, 100, 390, 0.28), 20);
  assert.equal(rubberBand(100, -100, 100, 390, 0.28), 100);
  const near = rubberBand(110, -100, 100, 390, 0.28);
  const far = rubberBand(500, -100, 100, 390, 0.28);
  assert.ok(near > 100 && near < 110);
  assert.ok(far > near && far < 500);
  assert.equal(rubberBand(-500, -100, 100, 390, 0.28), -far);
  assert.ok((far - 100) / 400 < (near - 100) / 10);
});

test("release clamps both zoom and offsets back into legal bounds", () => {
  assert.equal(clampPhoto(0.7, 1, 5), 1);
  assert.equal(clampPhoto(5.6, 1, 5), 5);
  assert.equal(clampPhoto(500, -200, 200), 200);
  assert.equal(clampPhoto(-500, -200, 200), -200);
});
