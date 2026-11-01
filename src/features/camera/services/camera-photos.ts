import { layout } from "@/theme/tokens";
import { cameraPhotoCrop } from "../utils/camera-photo-geometry";

export async function prepareCameraPhoto(
  photo: { uri: string; width: number; height: number },
  zoom = 1,
) {
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
      return await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: layout.cameraPhotoQuality,
      });
    } finally {
      rendered.release();
    }
  } finally {
    context.release();
  }
}
