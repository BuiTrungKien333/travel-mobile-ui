/** Android's image loader expects base64 data URLs, including SVG gradients. */
export function svgDataUri(svg: string): string {
  const bytes = encodeURIComponent(svg).replace(
    /%([0-9A-F]{2})/g,
    (_, hex: string) => String.fromCharCode(parseInt(hex, 16)),
  );
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let encoded = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes.charCodeAt(index);
    const b = index + 1 < bytes.length ? bytes.charCodeAt(index + 1) : 0;
    const c = index + 2 < bytes.length ? bytes.charCodeAt(index + 2) : 0;
    encoded +=
      alphabet[a >> 2] +
      alphabet[((a & 3) << 4) | (b >> 4)] +
      (index + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : "=") +
      (index + 2 < bytes.length ? alphabet[c & 63] : "=");
  }
  return `data:image/svg+xml;base64,${encoded}`;
}
