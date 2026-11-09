export type MagicLinkPurpose =
  | "verify-email"
  | "reset-password"
  | "google-link";

/** Only one-use action tokens in the fragment; access/refresh tokens never belong in a URL. */
export function readMagicLinkToken(
  value: string | null,
  purpose: MagicLinkPurpose,
): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const route =
      url.protocol === "travelplannermobileui:"
        ? `${url.host}${url.pathname}`
        : url.pathname;
    if (route.replace(/\/$/, "").split("/").at(-1) !== purpose) return null;
    const fragment = new URLSearchParams(url.hash.slice(1));
    const entries = [...fragment.entries()];
    if (entries.length !== 1 || entries[0][0] !== "token") return null;
    const token = entries[0][1];
    return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
  } catch {
    return null;
  }
}
