import { layout } from "@/theme/tokens";
import { cameraPhotoCrop } from "../utils/camera-photo-geometry";
import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";

export async function prepareCameraPhoto(
  photo: {
    uri: string;
    width: number;
    height: number;
    mimeType?: string;
    format?: "jpg" | "png";
  },
  zoom = 1,
) {
  // A missing optional editor in an older build must not prevent taking a photo.
  if (
    Platform.OS !== "web" &&
    !requireOptionalNativeModule("ExpoImageManipulator")
  )
    return {
      ...photo,
      mimeType:
        photo.mimeType ??
        (photo.format === "png"
          ? "image/png"
          : photo.format === "jpg"
            ? "image/jpeg"
            : undefined),
    };
  const { ImageManipulator, SaveFormat } =
    await import("expo-image-manipulator");
  const crop = cameraPhotoCrop(photo.width, photo.height, zoom);
  const context = ImageManipulator.manipulate(photo.uri);
  try {
    context.crop(crop);
    if (crop.width > layout.cameraMaxPhotoSize)
      context.resize({ width: layout.cameraMaxPhotoSize });
    const rendered = await context.renderAsync();
    try {
      const result = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: layout.cameraPhotoQuality,
      });
      return { ...result, mimeType: "image/jpeg" };
    } finally {
      rendered.release();
    }
  } finally {
    context.release();
  }
}
