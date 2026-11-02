import { useI18n } from "@/hooks/use-i18n";
import { ApiError } from "@/services/api/api-error";

const vi = {
  loading: "Đang tải chuyến đi…",
  retry: "Thử lại",
  versionConflict:
    "Chuyến đi đã được thay đổi ở nơi khác. Chỉnh sửa của bạn vẫn được giữ; hãy tải bản mới để xem lại trước khi lưu.",
  discardReload: "Bỏ chỉnh sửa, tải bản mới",
  reviewLatest: "Tải bản mới",
  readOnly: "Chuyến đi đã hủy chỉ có thể xem hoặc xóa.",
  deletePermanent:
    "Xóa chuyến đi “{title}” cùng các kỷ niệm liên quan? Thao tác này không thể hoàn tác trong ứng dụng.",
  dateImpactTitle: "Thay đổi ngày chuyến đi?",
  dateImpactHint:
    "{count} địa điểm sẽ chuyển về Chưa xếp lịch. Các ngày còn trùng được giữ nguyên; ghi chú và kỷ niệm vẫn được lưu.",
  confirmDates: "Xác nhận đổi ngày",
  dateImpactRequired:
    "Lịch trình có điểm bị ảnh hưởng. Bấm Lưu để xem lại tác động trước khi xác nhận.",
  more: "Xem thêm",
  unavailable: "Chưa kết nối chức năng này",
  pending:
    "Lịch trình, địa điểm, bản đồ và kỷ niệm sẽ được kết nối ở các bước tiếp theo. Thông tin chuyến đi đã được lưu trên máy chủ.",
  placesPending:
    "Tìm và thêm địa điểm sẽ được kết nối ở bước tiếp theo. Bạn có thể tạo chuyến đi trước.",
  modulePending:
    "Camera và kỷ niệm chưa được kết nối máy chủ trong đợt này. Bạn có thể tạo và xem chuyến đi trong mục Chuyến đi.",
  trips: "Chuyến đi",
  noNotes: "Chưa có ghi chú",
  budget: "Ngân sách",
  accommodation: "Nơi lưu trú",
  notes: "Ghi chú",
  generic: "Chưa thể tải hoặc lưu chuyến đi. Vui lòng thử lại.",
  network:
    "Chưa kết nối được máy chủ. Kiểm tra mạng rồi thử lại; thao tác gửi lại không tạo trùng chuyến đi.",
  config:
    "Chưa cấu hình địa chỉ API. Kiểm tra EXPO_PUBLIC_API_URL rồi khởi động lại Expo.",
  invalid: "Thông tin chuyến đi chưa hợp lệ. Kiểm tra các trường đã nhập.",
  conflict:
    "Yêu cầu tạo chuyến đã thay đổi. Đóng và mở lại form để tạo yêu cầu mới.",
  missing: "Không tìm thấy chuyến đi hoặc bạn không có quyền truy cập.",
  response: "Dữ liệu máy chủ chưa đúng cấu trúc. Vui lòng thử lại sau.",
  session: "Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.",
};
const en: typeof vi = {
  loading: "Loading trips…",
  retry: "Retry",
  versionConflict:
    "This trip changed elsewhere. Your edits are kept; load the latest version to review before saving.",
  discardReload: "Discard edits and load latest",
  reviewLatest: "Load latest",
  readOnly: "Cancelled trips can only be viewed or deleted.",
  deletePermanent:
    "Delete “{title}” and its related memories? This cannot be undone in the app.",
  dateImpactTitle: "Change trip dates?",
  dateImpactHint:
    "{count} places will move to Unscheduled. Overlapping days are kept; notes and memories remain saved.",
  confirmDates: "Confirm dates",
  dateImpactRequired:
    "Some scheduled places are affected. Select Save to review the impact before confirming.",
  more: "Load more",
  unavailable: "This feature is not connected yet",
  pending:
    "Itinerary, places, maps and memories will be connected in the next stages. Your trip information is saved on the server.",
  placesPending:
    "Place search will be connected in the next stage. You can create your trip first.",
  modulePending:
    "Camera and memories aren't connected to the server in this stage. You can create and view trips in the Trips tab.",
  trips: "Trips",
  noNotes: "No notes yet",
  budget: "Budget",
  accommodation: "Accommodation",
  notes: "Notes",
  generic: "Couldn't load or save the trip. Please try again.",
  network:
    "Couldn't reach the server. Check your connection and retry; resending won't duplicate the trip.",
  config:
    "The API address is not configured. Check EXPO_PUBLIC_API_URL and restart Expo.",
  invalid: "Some trip information is invalid. Please check your entries.",
  conflict:
    "The create request has changed. Close and reopen the form to start a new request.",
  missing: "The trip wasn't found or you don't have access.",
  response:
    "The server returned an unexpected response. Please try again later.",
  session: "Your session is no longer valid. Please sign in again.",
};
export function useTripIntegrationCopy() {
  const { locale } = useI18n();
  return { copy: locale === "vi" ? vi : en, locale };
}
export function tripApiErrorMessage(error: unknown, copy: typeof vi): string {
  if (!(error instanceof ApiError)) return copy.generic;
  if (error.code === "TRIP_002") return copy.versionConflict;
  if (error.code === "TRIP_003") return copy.dateImpactRequired;
  if (error.code === "TRIP_006") return copy.readOnly;
  if (error.code === "INVALID_TRIP" || error.code === "COMMON_006")
    return copy.invalid;
  if (error.code === "NETWORK" || error.code === "TIMEOUT") return copy.network;
  if (error.code === "API_CONFIG") return copy.config;
  if (error.code === "COMMON_003" || error.code === "TRIP_005")
    return copy.invalid;
  if (error.code === "TRIP_004") return copy.conflict;
  if (error.code === "TRIP_001") return copy.missing;
  if (error.code === "INVALID_RESPONSE") return copy.response;
  if (error.status === 401 || error.status === 403) return copy.session;
  return copy.generic;
}
