import { useI18n } from "@/hooks/use-i18n";

const vi = {
  back: "Quay lại",
  capture: "Chụp khoảnh khắc",
  gallery: "Chọn ảnh trong máy",
  flip: "Đổi camera trước/sau",
  flashOn: "Bật flash",
  flashOff: "Tắt flash",
  zoom: "Phóng to kỹ thuật số",
  memories: "kỷ niệm",
  albumHint: "Xem album chuyến đi",
  details: "Chi tiết chuyến đi",
  home: "Trang chủ",
  journal: "Kỷ niệm",
  permission: "Ghi lại hành trình của bạn",
  permissionHint:
    "Cho phép dùng camera để chụp ảnh. Bạn vẫn có thể chọn ảnh từ thư viện.",
  allow: "Cho phép camera",
  settings: "Mở cài đặt",
  ready: "Đang mở camera…",
  error: "Chưa thể mở camera. Bạn thử lại hoặc chọn ảnh trong máy nhé.",
  photoError: "Chưa thể xử lý ảnh. Bạn thử lại nhé.",
  saveError:
    "Chưa thể lưu ảnh. Chuyến đi đã thay đổi hoặc phiên xem trước đã đầy.",
  retry: "Thử lại",
  save: "Lưu khoảnh khắc",
  retake: "Chụp lại",
  confirmHint: "Ảnh vừa chọn · Chạm dấu tích để lưu",
  saved: "Đã thêm vào kỷ niệm",
  build: "Cần cập nhật bản cài ứng dụng",
  buildHint: "Cài bản ứng dụng mới để chụp ảnh và chọn ảnh trong máy.",
  missing: "Chưa có chuyến đi phù hợp để ghi lại khoảnh khắc.",
};
const en: typeof vi = {
  back: "Back",
  capture: "Capture a moment",
  gallery: "Choose a photo",
  flip: "Switch cameras",
  flashOn: "Turn flash on",
  flashOff: "Turn flash off",
  zoom: "Digital zoom",
  memories: "memories",
  albumHint: "View this trip's album",
  details: "Trip details",
  home: "Home",
  journal: "Memories",
  permission: "Capture your journey",
  permissionHint:
    "Allow camera access to take photos. You can still choose an image from your library.",
  allow: "Allow camera",
  settings: "Open settings",
  ready: "Opening camera…",
  error:
    "Couldn't open the camera. Try again or choose an image from your library.",
  photoError: "Couldn't process this image. Please try again.",
  saveError:
    "Couldn't save. The trip has changed or this preview session is full.",
  retry: "Try again",
  save: "Save moment",
  retake: "Retake",
  confirmHint: "Photo preview · Tap the check to save",
  saved: "Added to memories",
  build: "An updated app build is needed",
  buildHint:
    "Install the updated app to take photos and choose images from your library.",
  missing: "No available trip to capture a moment for.",
};
export function useCameraCopy() {
  const { locale } = useI18n();
  return { locale, copy: locale === "vi" ? vi : en };
}
