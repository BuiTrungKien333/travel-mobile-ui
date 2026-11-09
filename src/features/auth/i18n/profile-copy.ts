import { useI18n } from "@/hooks/use-i18n";

const vi = {
  settings: "Cài đặt", close: "Đóng", travel: "Hồ sơ du lịch", options: "Tùy chọn ứng dụng",
  security: "Bảo mật & tài khoản", address: "Địa chỉ nhà riêng", addressHint: "Chọn điểm xuất phát quen thuộc",
  addressPlaceholder: "Nhập địa chỉ nhà riêng", saveAddress: "Lưu địa chỉ", cancel: "Hủy",
  interests: "Sở thích trải nghiệm", interestsHint: "Những điều bạn thích khi khám phá",
  vehicle: "Phương tiện mặc định", language: "Ngôn ngữ", reminder: "Nhắc lịch trình",
  reminderHint: "Tùy chọn tạm; V1 chưa gửi thông báo", localHint: "Các tùy chọn này chưa đồng bộ với tài khoản.",
  privacy: "Quyền riêng tư & điều khoản", understood: "Đã hiểu", app: "Ứng dụng", version: "Phiên bản",
  appearance: "Giao diện", light: "Sáng", add: "Thêm sở thích",
  privacyTitle: "Thông tin của bạn",
  privacyBody: "Ứng dụng sử dụng thông tin tài khoản để đăng nhập, lưu chuyến đi và kỷ niệm. Ảnh được đồng bộ khi bạn đưa vào chuyến đi; ảnh Xem sau chưa đồng bộ được giữ trên thiết bị.",
  termsTitle: "Sử dụng ứng dụng",
  termsBody: "Bạn quản lý nội dung và hình ảnh mình tải lên. Thời tiết và thời gian di chuyển là thông tin tham khảo để chuẩn bị hành trình.",
  interestLabels: { photography: "Check-in", cafe: "Cà phê", nature: "Thiên nhiên", food: "Ẩm thực", culture: "Văn hóa", beach: "Biển đảo", adventure: "Phiêu lưu", shopping: "Mua sắm" },
  vehicleLabels: { motorcycle: "Xe máy", car: "Ô tô", walk: "Đi bộ" },
};
const en: typeof vi = {
  settings: "Settings", close: "Close", travel: "Travel preferences", options: "App preferences",
  security: "Security & account", address: "Home address", addressHint: "Choose a familiar starting point",
  addressPlaceholder: "Enter your home address", saveAddress: "Save address", cancel: "Cancel",
  interests: "Travel interests", interestsHint: "What you enjoy exploring",
  vehicle: "Default transport", language: "Language", reminder: "Itinerary reminders",
  reminderHint: "Temporary preference; V1 does not send notifications", localHint: "These preferences are not synced to your account yet.",
  privacy: "Privacy & terms", understood: "Got it", app: "Application", version: "Version",
  appearance: "Appearance", light: "Light", add: "Add interests",
  privacyTitle: "Your information",
  privacyBody: "The app uses account information to sign you in and store trips and memories. Photos are synced when assigned to a trip; unsynced Saved for later photos stay on your device.",
  termsTitle: "Using the app",
  termsBody: "You manage the content and photos you upload. Weather and travel times are estimates to help you prepare your journey.",
  interestLabels: { photography: "Check-in", cafe: "Cafés", nature: "Nature", food: "Food", culture: "Culture", beach: "Beaches", adventure: "Adventure", shopping: "Shopping" },
  vehicleLabels: { motorcycle: "Motorbike", car: "Car", walk: "Walking" },
};
export function useProfileCopy() {
  const { locale } = useI18n();
  return { copy: locale === "vi" ? vi : en, locale };
}
