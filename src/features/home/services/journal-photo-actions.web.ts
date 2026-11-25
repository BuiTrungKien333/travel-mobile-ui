import type { PhotoRect } from "../utils/photo-viewer-geometry";
import { PhotoActionError } from "./photo-action-error";

async function photoFile(uri: string) {
  const response = await fetch(uri);
  if (!response.ok) throw new Error("Photo download failed");
  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) throw new Error("Invalid photo file");
  const extension =
    blob.type === "image/jpeg" ? "jpg" : blob.type.split("/")[1];

  return new File([blob], `wego-photo.${extension}`, { type: blob.type });
}

export async function shareJournalPhoto(
  uri: string,
  title: string,
  _anchor: PhotoRect,
) {
  const file = await photoFile(uri);
  if (!navigator.canShare?.({ files: [file] }))
    throw new PhotoActionError("sharingUnavailable");
  try {
    await navigator.share({ files: [file], title });
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "AbortError"))
      throw error;
  }
}

export async function saveJournalPhoto(uri: string) {
  const file = await photoFile(uri);
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser time to consume the URL before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
