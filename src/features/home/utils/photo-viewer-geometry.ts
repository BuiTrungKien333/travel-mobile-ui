export type PhotoSize = { width: number; height: number };
export type PhotoRect = PhotoSize & { x: number; y: number };

export type PhotoSelection = {
  id: string;
  uri: string;
  size: PhotoSize;
  origin: PhotoRect;
};

// Worklets capture dependencies during module initialization, so helpers must
// appear before the worklets that capture them (even for function declarations).
export function clampPhoto(value: number, min: number, max: number) {
  "worklet";
  return Math.min(max, Math.max(min, value));
}

/** At rest, adjacent pages require an intentional swipe; the album never wraps. */
export function photoPageDestination(
  index: number,
  count: number,
  displacement: number,
  velocity: number,
  width: number,
  ratio: number,
  flingVelocity: number,
  minimumFling: number,
) {
  "worklet";
  const passesDistance = Math.abs(displacement) > width * ratio;
  const passesVelocity =
    Math.abs(displacement) > minimumFling && Math.abs(velocity) > flingVelocity;
  if (!passesDistance && !passesVelocity) return index;
  const direction = passesVelocity ? velocity : displacement;

  return clampPhoto(
    index + (direction < 0 ? 1 : -1),
    0,
    Math.max(0, count - 1),
  );
}

export function fitPhoto(image: PhotoSize, viewport: PhotoSize): PhotoRect {
  "worklet";
  const ratio = Math.min(
    viewport.width / image.width,
    viewport.height / image.height,
  );
  const width = image.width * ratio;
  const height = image.height * ratio;

  return {
    x: (viewport.width - width) / 2,
    y: (viewport.height - height) / 2,
    width,
    height,
  };
}

export function panLimits(
  image: PhotoSize,
  viewport: PhotoSize,
  scale: number,
) {
  "worklet";

  return {
    x: Math.max(0, (image.width * scale - viewport.width) / 2),
    y: Math.max(0, (image.height * scale - viewport.height) / 2),
  };
}

/** Resistance increases beyond an edge; releasing always settles inside the bounds. */
export function rubberBand(
  value: number,
  min: number,
  max: number,
  extent: number,
  factor: number,
) {
  "worklet";
  const edge = clampPhoto(value, min, max);
  const excess = value - edge;

  return (
    edge + (excess * factor) / (1 + Math.abs(excess) / Math.max(1, extent))
  );
}

export function zoomOffset(
  focal: number,
  center: number,
  offset: number,
  oldScale: number,
  newScale: number,
) {
  "worklet";
  return focal - center - ((focal - center - offset) / oldScale) * newScale;
}
