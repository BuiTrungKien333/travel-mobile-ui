import { requireOptionalNativeModule } from "expo";
import type { File } from "expo-file-system";
import { Image, type ImageSource } from "expo-image";
import { Platform } from "react-native";
import type { PhotoRect } from "../utils/photo-viewer-geometry";
import { PhotoActionError } from "./photo-action-error";

function assertPhotoModule(
  name:
    | "FileSystem"
    | "ExpoMediaLibraryNext"
    | "ExpoSharing"
    | "ExpoImageManipulator",
) {
  if (!requireOptionalNativeModule(name))
    throw new PhotoActionError("nativeBuildRequired");
}

/** Export the entire photo, independently of the current crop or zoom. */
async function withLocalPhoto(
  uri: string,
  action: (file: File) => Promise<void>,
  retainForSharing = false,
  source?: ImageSource | string | number,
) {
  assertPhotoModule("FileSystem");
  const { Directory, File, Paths } = await import("expo-file-system");
  const directory = new Directory(Paths.cache, `wego-photo-${Date.now()}`);
  directory.create();
  const extension =
    uri.match(/\.(jpe?g|png|webp|gif|heic)(?:\?|$)/i)?.[1]?.toLowerCase() ??
    "jpg";
  let file = new File(directory, `WeGo-${Date.now()}.${extension}`);
  let stage = "prepare";
  try {
    if (/^https?:\/\//i.test(uri)) await File.downloadFileAsync(uri, file);
    else if (/^(file|content):/i.test(uri)) await new File(uri).copy(file);
    else {
      stage = "decode";
      // Bundled Android drawables/asset URIs are images, not filesystem paths.
      // Decode once, export lossless PNG, and release native pixel buffers promptly.
      assertPhotoModule("ExpoImageManipulator");
      const { ImageManipulator, SaveFormat } =
        await import("expo-image-manipulator");
      const decoded = await Image.loadAsync(source ?? uri);
      let context: ReturnType<typeof ImageManipulator.manipulate> | undefined;
      let rendered:
        | Awaited<ReturnType<NonNullable<typeof context>["renderAsync"]>>
        | undefined;
      try {
        stage = "render";
        context = ImageManipulator.manipulate(decoded);
        rendered = await context.renderAsync();
        stage = "encode";
        const result = await rendered.saveAsync({ format: SaveFormat.PNG });
        stage = "copy";
        const temporary = new File(result.uri);
        file = new File(directory, `WeGo-${Date.now()}.png`);
        try {
          await temporary.copy(file);
        } finally {
          if (temporary.exists) temporary.delete();
        }
      } finally {
        rendered?.release();
        context?.release();
        decoded.release();
      }
    }
    stage = "media-action";
    await action(file);
  } catch (failure) {
    // Keep export diagnostics useful without logging photo URLs, paths or auth data.
    const message =
      failure instanceof Error ? failure.message : String(failure);
    console.warn(
      "WeGo photo export failed",
      stage,
      message.replace(
        /(?:https?:|file:|content:|\/data\/)[^\s]+/g,
        "[redacted]",
      ),
    );
    throw failure;
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
  source?: ImageSource | string | number,
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
    source,
  );
}

export async function saveJournalPhoto(
  uri: string,
  source?: ImageSource | string | number,
) {
  // Native photo dependencies must not block Home when an older build lacks them.
  assertPhotoModule("ExpoMediaLibraryNext");
  const { Asset, requestPermissionsAsync } = await import("expo-media-library");
  // Modern Android can insert an app-owned photo without browsing the user's library.
  if (
    Platform.OS === "ios" ||
    (Platform.OS === "android" && Number(Platform.Version) < 30)
  ) {
    const permission = await requestPermissionsAsync(true, []);
    if (!permission.granted) throw new PhotoActionError("permission");
  }
  await withLocalPhoto(
    uri,
    async (file) => {
      await Asset.create(file.uri);
    },
    false,
    source,
  );
}
