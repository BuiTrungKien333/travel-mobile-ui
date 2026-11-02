// Development mặc định preview; đặt EXPO_PUBLIC_UI_PREVIEW=false để tích hợp API.
// Bản release luôn dùng luồng xác thực thật.
export const UI_PREVIEW_ENABLED =
  __DEV__ && process.env.EXPO_PUBLIC_UI_PREVIEW !== "false";
