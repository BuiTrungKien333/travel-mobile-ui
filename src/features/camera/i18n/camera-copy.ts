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
  selectTrip: "Chọn chuyến đi và địa điểm để lưu khoảnh khắc này.",
  insecure:
    "Trình duyệt chỉ cho phép camera qua HTTPS hoặc localhost. Hãy mở địa chỉ HTTPS hoặc dùng ứng dụng trên điện thoại.",
  unsupported:
    "Môi trường này không hỗ trợ camera. Hãy dùng trình duyệt hệ thống hoặc chọn ảnh trong máy.",
  permissionError:
    "Chưa đọc được quyền camera. Hãy thử cấp quyền lại hoặc kiểm tra quyền Camera của ứng dụng trong Cài đặt.",
  denied:
    "Quyền camera chưa được cấp. Nếu đã chặn, hãy bật Camera trong cài đặt ứng dụng hoặc quyền trang web của trình duyệt.",
  startError:
    "Camera chưa khởi động được. Hãy đóng ứng dụng khác đang dùng camera, kiểm tra thiết bị camera rồi thử lại.",
  quick: "Chụp nhanh",
  quickHint: "Lưu vào thiết bị và Xem sau · Chọn chuyến đi sau",
  later: "Xem sau",
  savedPrivate:
    "Đã giữ ảnh trong ứng dụng. Chạm dấu tích để thử lưu vào thư viện thiết bị lại.",
  savedDevice: "Đã lưu vào thư viện thiết bị và album chuyến đi",
  savedInbox: "Đã lưu vào thư viện thiết bị và Xem sau",
  savedDownload: "Đã lưu trong ứng dụng và gửi ảnh đến trình tải xuống",
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
  selectTrip: "Choose a trip and place to save this moment.",
  insecure:
    "Camera access requires HTTPS or localhost. Open an HTTPS address or use the mobile app.",
  unsupported:
    "This environment does not support camera access. Use your system browser or choose a photo.",
  permissionError:
    "Couldn't read camera access. Try again or check the app's Camera permission in Settings.",
  denied:
    "Camera permission was not granted. If blocked, enable Camera in app settings or your browser's site permissions.",
  startError:
    "The camera couldn't start. Close other apps using it, check your camera device, and try again.",
  quick: "Quick capture",
  quickHint: "Save on device and in Saved for later · Organize later",
  later: "Saved for later",
  savedPrivate:
    "Kept in the app. Tap the check to retry saving to your device's photo library.",
  savedDevice: "Saved to your photo library and trip album",
  savedInbox: "Saved to your photo library and Saved for later",
  savedDownload: "Saved in the app and sent to your downloads",
};
export function useCameraCopy() {
  const { locale } = useI18n();
  return { locale, copy: locale === "vi" ? vi : en };
}
