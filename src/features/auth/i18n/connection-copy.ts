import { useI18n } from "@/hooks/use-i18n";

const vi = {
  title: "Kết nối máy chủ",
  subtitle:
    "Nhập URL API của laptop hoặc Cloudflare. Sau khi đổi máy chủ, bạn sẽ đăng nhập lại.",
  address: "Địa chỉ API",
  back: "Quay lại",
  submit: "Kiểm tra & kết nối",
  probe: "Đang kiểm tra máy chủ…",
  session: "Đã kết nối. Đang đóng phiên cũ…",
  preference: "Đang lưu địa chỉ máy chủ…",
  INVALID_URL:
    "Địa chỉ chưa hợp lệ. Nhập URL gốc HTTPS hoặc IP Wi-Fi nội bộ kèm cổng.",
  NETWORK:
    "Chưa nhận được phản hồi trong ứng dụng. Kiểm tra URL và quyền truy cập mạng của WeGo.",
  TIMEOUT: "Máy chủ chưa phản hồi đầy đủ sau 15 giây. Hãy thử lại.",
  RESPONSE: "Máy chủ đã phản hồi nhưng nội dung không phải JSON health hợp lệ.",
  HEALTH:
    "Máy chủ đã phản hồi nhưng chưa báo trạng thái UP. Kiểm tra đúng URL API.",
  SESSION:
    "Đã kết nối máy chủ nhưng chưa xóa được phiên đăng nhập cũ trên thiết bị. Ảnh vẫn được giữ.",
  PREFERENCE:
    "Đã kết nối máy chủ nhưng chưa lưu được URL trên thiết bị. Ảnh vẫn được giữ.",
  NAVIGATION:
    "Đã lưu kết nối nhưng chưa mở được màn đăng nhập. Hãy mở lại ứng dụng.",
};
const en: typeof vi = {
  title: "Server connection",
  subtitle:
    "Enter the laptop API or Cloudflare URL. Changing servers signs you out.",
  address: "API address",
  back: "Back",
  submit: "Check & connect",
  probe: "Checking server…",
  session: "Server reached. Clearing the old session…",
  preference: "Saving server address…",
  INVALID_URL: "Enter an HTTPS origin or local Wi-Fi IP with its port.",
  NETWORK:
    "The app could not receive a response. Check the URL and WeGo's network permissions.",
  TIMEOUT: "The server did not finish responding within 15 seconds. Retry.",
  RESPONSE: "The server responded, but its health response is not valid JSON.",
  HEALTH: "The server responded but did not report UP. Check the API URL.",
  SESSION:
    "Server reached, but the old sign-in session could not be removed on this device. Photos are kept.",
  PREFERENCE:
    "Server reached, but the URL could not be saved on this device. Photos are kept.",
  NAVIGATION:
    "Connection saved, but sign-in could not be opened. Reopen the app.",
};
export function useConnectionCopy() {
  const { locale } = useI18n();
  return locale === "vi" ? vi : en;
}
