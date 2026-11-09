/** Match the square viewfinder and digital zoom without assuming hardware maximum zoom. */
export function cameraPhotoCrop(width: number, height: number, zoom = 1) {
  if (
    ![width, height, zoom].every(Number.isFinite) ||
    width < 1 ||
    height < 1 ||
    zoom < 1 ||
    zoom > 3
  )
    throw new Error("Invalid photo dimensions");
  const size = Math.max(1, Math.floor(Math.min(width, height) / zoom));
  return {
    originX: Math.floor((width - size) / 2),
    originY: Math.floor((height - size) / 2),
    width: size,
    height: size,
  };
}
