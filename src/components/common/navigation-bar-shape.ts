/** Pill outline with a circular cradle and tangent shoulders around the shutter. */
export function navigationBarShape({
  width,
  height,
  cameraSize,
  cameraRise,
  padding,
  gap,
  shoulder,
}: {
  width: number;
  height: number;
  cameraSize: number;
  cameraRise: number;
  padding: number;
  gap: number;
  shoulder: number;
}) {
  const edge = height / 2;
  const center = width / 2;
  const radius = cameraSize / 2 + gap;
  const centerY = padding - cameraRise + cameraSize / 2;
  const left = center - radius;
  const right = center + radius;
  return [
    `M ${edge} 0 H ${left - shoulder}`,
    `C ${left - shoulder / 2} 0 ${left} 0 ${left} ${centerY}`,
    `A ${radius} ${radius} 0 0 0 ${right} ${centerY}`,
    `C ${right} 0 ${right + shoulder / 2} 0 ${right + shoulder} 0`,
    `H ${width - edge} A ${edge} ${edge} 0 0 1 ${width} ${edge}`,
    `A ${edge} ${edge} 0 0 1 ${width - edge} ${height}`,
    `H ${edge} A ${edge} ${edge} 0 0 1 0 ${edge}`,
    `A ${edge} ${edge} 0 0 1 ${edge} 0 Z`,
  ].join(" ");
}
