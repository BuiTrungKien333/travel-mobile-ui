import { useI18n } from "@/hooks/use-i18n";

const vi = {
  back: "Quay lại album",
  previous: "Ảnh trước",
  next: "Ảnh tiếp theo",
  favorite: "Thêm vào yêu thích",
  unfavorite: "Bỏ yêu thích",
  info: "Thông tin ảnh",
  closeInfo: "Đóng thông tin ảnh",
  share: "Chia sẻ ảnh",
  save: "Lưu ảnh",
  remove: "Xóa ảnh",
  cancel: "Hủy",
  deleteTitle: "Xóa ảnh khỏi nhật ký?",
  deleteHint:
    "Ảnh sẽ được xóa khỏi kỷ niệm. Bản đã lưu vào thư viện thiết bị vẫn được giữ.",
  deleteFailed: "Chưa xóa được ảnh. Kiểm tra kết nối và thử lại.",
  deletePending:
    "Máy chủ đã lưu yêu cầu xóa và sẽ thử lại khi dịch vụ ảnh sẵn sàng.",
  deleteIdentityMissing:
    "Ảnh cũ này thiếu thông tin lưu trữ để xóa. Vui lòng liên hệ hỗ trợ.",
  imageHint:
    "Chạm để ẩn hoặc hiện công cụ. Vuốt ngang để chuyển ảnh. Chạm hai lần hoặc dùng hai ngón tay để phóng to. Kéo xuống để đóng.",
  zoomIn: "Phóng to",
  zoomOut: "Thu nhỏ",
  controls: "Ẩn hoặc hiện công cụ",
  unavailable: "Chưa mở được ảnh. Bạn thử lại nhé.",
  actionError: "Chưa thực hiện được. Bạn thử lại nhé.",
  permission:
    "Chưa có quyền lưu ảnh. Bạn có thể cấp quyền trong Cài đặt của thiết bị.",
  sharingUnavailable:
    "Thiết bị hoặc trình duyệt này chưa hỗ trợ chia sẻ file ảnh.",
  nativeBuildRequired:
    "Phiên bản ứng dụng này chưa hỗ trợ thao tác ảnh này. Vui lòng cập nhật ứng dụng.",
  saved: "Đã lưu ảnh vào thư viện",
  downloaded: "Đã gửi ảnh đến trình tải xuống",
  retry: "Thử lại",
  dateUnknown: "Chưa có ngày chụp",
  timeUnknown: "Chưa có giờ chụp",
};

const en: typeof vi = {
  back: "Back to album",
  previous: "Previous photo",
  next: "Next photo",
  favorite: "Add to favorites",
  unfavorite: "Remove from favorites",
  info: "Photo information",
  closeInfo: "Close photo information",
  share: "Share photo",
  save: "Save photo",
  remove: "Delete photo",
  cancel: "Cancel",
  deleteTitle: "Delete this journal photo?",
  deleteHint:
    "This photo will be removed from your memories. Copies saved to your device gallery will be kept.",
  deleteFailed: "Couldn't delete the photo. Check your connection and retry.",
  deletePending:
    "The server saved your deletion request and will retry when image storage is available.",
  deleteIdentityMissing:
    "This older photo is missing storage information needed for deletion. Please contact support.",
  imageHint:
    "Tap to toggle controls. Swipe sideways to change photos. Double tap or pinch to zoom. Drag down to close.",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  controls: "Toggle photo controls",
  unavailable: "Couldn't open this photo. Please try again.",
  actionError: "Couldn't complete this action. Please try again.",
  permission:
    "Photo saving permission is missing. You can enable it in your device settings.",
  sharingUnavailable:
    "This device or browser doesn't support sharing photo files.",
  nativeBuildRequired:
    "This app version doesn't support this photo action. Please update the app.",
  saved: "Photo saved to your library",
  downloaded: "Photo sent to your downloads",
  retry: "Try again",
  dateUnknown: "Capture date unavailable",
  timeUnknown: "Capture time unavailable",
};

export function usePhotoViewerCopy() {
  const { locale } = useI18n();
  return { copy: locale === "vi" ? vi : en, locale };
}
