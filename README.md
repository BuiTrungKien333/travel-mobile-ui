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
- [Review danh sách/tạo chuyến](docs/TRIPS-REVIEW.md) · [Đề xuất chi tiết chuyến đi](docs/TRIP-DETAIL-DESIGN.md)
- [Tích hợp Auth](docs/auth-integration.md)
- [Thiết lập Google Sign-In](docs/google-auth.md)
- [Quy định phát triển](AGENTS.md)

Development mặc định giữ UI preview không cần backend. Đặt `EXPO_PUBLIC_UI_PREVIEW=false` để dùng auth thật và tạo/list/chi tiết metadata chuyến đi; release luôn yêu cầu auth/API. Chọn `EXPO_PUBLIC_API_URL` theo thiết bị và khởi động lại Metro sau khi đổi env. Xem [hướng dẫn tích hợp Trip](docs/TRIP-API-INTEGRATION.md).

Nhánh `minhduc` đã được đối chiếu và gộp có chọn lọc, giữ UI hiện tại. Các service Places/Itinerary/Media chưa nối vào UI; Maps native tắt mặc định và cần development build mới khi bật. Backend chưa merge trong đợt này. Xem [báo cáo merge mobile](docs/MERGE-MINHDUC-2026-11-02.md).
