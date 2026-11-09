// Auth/API thật mặc định cả development; preview UI cần bật tường minh.
// Bản release luôn dùng luồng xác thực thật.
export const UI_PREVIEW_ENABLED =
  __DEV__ && process.env.EXPO_PUBLIC_UI_PREVIEW === "true";
