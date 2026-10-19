# WeGo · Travel Mobile UI

Ứng dụng React Native dùng Expo SDK 57, Expo Router, TypeScript strict và React Compiler. Giao diện sáng, hỗ trợ Tiếng Việt/Tiếng Anh; mặc định Tiếng Việt.

## Chạy dự án

```bash
npm install
npm run web
```

Trong chế độ development, ứng dụng mở Home trực tiếp để làm UI, không cần chạy backend. Chọn **Đổi trạng thái** ở cuối Home để xem bốn tình huống. Dữ liệu mẫu dùng ngày cố định **21/10/2026** và chỉ tồn tại trong phiên.

Chạy Android bằng development build khi đã chuẩn bị Android SDK và thiết bị/emulator:

```bash
npm run android
```

Build iOS bằng `npm run ios` trên macOS có Xcode. Các module Google Sign-In native cần development build; Expo Go không đủ cho toàn bộ chức năng của dự án.

## Cấu trúc chính

- `src/app`: routes và layout Expo Router.
- `src/features/home`: Home, dữ liệu preview, tương tác chuyến đi và album ảnh.
- `src/features/auth`: giao diện và tích hợp xác thực.
- `src/components`: UI và thành phần dùng chung.
- `src/theme`: màu, typography, spacing, layout và motion tokens.
- `tests`: kiểm tra hợp đồng, state và logic thuần bằng Node test runner.

## Kiểm tra

```bash
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npm test
```

ESLint đã được cấu hình qua `npm run lint`. Đợt rà soát Home ngày 19/10/2026 không chạy lint theo yêu cầu hiện tại của chủ dự án.

## Tài liệu và tiến độ

- [Bàn giao ngữ cảnh cho agent mới](docs/AGENT-HANDOFF.md) · [Lời nhắn để mở chat mới](docs/NEXT-CHAT-PROMPT.md)
- [Trạng thái dự án](docs/PROJECT-STATUS.md)
- [Cách xem và cấu trúc Home preview](docs/HOME-PREVIEW.md)
- [Kết quả rà soát Home](docs/HOME-REVIEW.md)
- [Tích hợp Auth](docs/auth-integration.md)
- [Thiết lập Google Sign-In](docs/google-auth.md)
- [Quy định phát triển](AGENTS.md)

Khi quay lại tích hợp auth, đổi `UI_PREVIEW_ENABLED` trong `src/constants/development.ts` thành `false`. Cờ hiện tại dùng `__DEV__`, vì vậy bản release vẫn yêu cầu xác thực. Các luồng Home vẫn đang dùng mock và cần được nối API riêng khi backend sẵn sàng.
