import { requireOptionalNativeModule } from "expo";
import type { File } from "expo-file-system";
import { Image } from "expo-image";
import { Platform } from "react-native";
import type { PhotoRect } from "../utils/photo-viewer-geometry";
import { PhotoActionError } from "./photo-action-error";

function assertPhotoModule(
  name: "FileSystem" | "ExpoMediaLibraryNext" | "ExpoSharing",
) {
  if (!requireOptionalNativeModule(name))
    throw new PhotoActionError("nativeBuildRequired");
}

/** Export the entire photo, independently of the current crop or zoom. */
async function withLocalPhoto(
  uri: string,
  action: (file: File) => Promise<void>,
  retainForSharing = false,
) {
  assertPhotoModule("FileSystem");
  const { Directory, File, Paths } = await import("expo-file-system");
  const directory = new Directory(Paths.cache, `wego-photo-${Date.now()}`);
  directory.create();
  const extension =
    uri.match(/\.(jpe?g|png|webp|gif|heic)(?:\?|$)/i)?.[1]?.toLowerCase() ??
    "jpg";
  let file = new File(directory, `wego-photo.${extension}`);
  try {
    if (/^https?:\/\//i.test(uri)) await File.downloadFileAsync(uri, file);
    else if (/^(file|asset|content):/i.test(uri))
      await new File(uri).copy(file);
    else {
      // Android release builds may expose bundled images as drawable resources, not files.
      // Expo Image can decode these and export their full pixels losslessly as PNG.
      const key = `wego-photo-export:${uri}`;
      let cached = await Image.getCachePathAsync(key);
      if (!cached) {
        await Image.writeToCacheAsync(await Image.loadAsync(uri), key);
        cached = await Image.getCachePathAsync(key);
      }
      if (!cached) throw new Error("Photo export unavailable");
      file = new File(directory, "wego-photo.png");
      await new File(cached).copy(file);
    }
    await action(file);
  } finally {
    // Android's chooser may return before the receiving app reads the URI.
    // Shared exports stay in the OS-managed cache; a saved-to-library export can be removed immediately.
    if (!retainForSharing && directory.exists) directory.delete();
  }
}

export async function shareJournalPhoto(
  uri: string,
  title: string,
  anchor: PhotoRect,
) {
  assertPhotoModule("ExpoSharing");
  const Sharing = await import("expo-sharing");
  if (!(await Sharing.isAvailableAsync()))
    throw new PhotoActionError("sharingUnavailable");
  await withLocalPhoto(
    uri,
    (file) =>
      Sharing.shareAsync(file.uri, {
        dialogTitle: title,
        mimeType: file.type || "image/jpeg",
        anchor,
      }),
    true,
  );
}

export async function saveJournalPhoto(uri: string) {
  // Native photo dependencies must not block Home when an older build lacks them.
  assertPhotoModule("ExpoMediaLibraryNext");
  const { Asset, requestPermissionsAsync } = await import("expo-media-library");
  // Modern Android can insert an app-owned photo without browsing the user's library.
  if (
    Platform.OS === "ios" ||
    (Platform.OS === "android" && Number(Platform.Version) < 29)
  ) {
    const permission = await requestPermissionsAsync(true, []);
    if (!permission.granted) throw new PhotoActionError("permission");
  }
  await withLocalPhoto(uri, async (file) => {
    await Asset.create(file.uri);
  });
}
