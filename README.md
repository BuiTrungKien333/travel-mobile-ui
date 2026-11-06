# WeGo · Travel Mobile UI

Ứng dụng React Native dùng Expo SDK 57, Expo Router, TypeScript strict và React Compiler. Giao diện sáng, hỗ trợ Tiếng Việt/Tiếng Anh; mặc định Tiếng Việt.

## Chạy dự án

**Chạy trên điện thoại Android có USB:** làm theo [hướng dẫn clone, cấu hình và cài app thật](docs/DEVICE-SETUP.md). Cần Node.js, JDK, Android SDK, backend đang chạy và điện thoại bật USB debugging.

Các lệnh chính trên Windows/PowerShell, sau khi clone và vào thư mục `travel-mobile-ui`:

```powershell
npm.cmd ci
Copy-Item .env.example .env
# Điền URL backend và key Maps trong .env trước khi build.
adb devices -l
npx.cmd expo run:android --device
```

Chọn điện thoại thật trong danh sách. Những lần sau, nếu chỉ sửa JavaScript/TypeScript/UI:

```powershell
npx.cmd expo start --dev-client --lan
```

Máy tính và điện thoại dùng chung mạng Wi-Fi có thể truy cập lẫn nhau. USB phục vụ cài app/debug; URL backend trong `.env` phải truy cập được từ điện thoại. Home, chuyến đi và kỷ niệm dùng backend thật, không dùng dữ liệu preview làm nguồn chính.

Web: sau khi cấu hình `.env` và chạy backend, dùng `npm.cmd run web`.

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

ESLint chạy bằng `npm run lint`. Kết quả kiểm tra và các giới hạn hiện tại được ghi trong [trạng thái dự án](docs/PROJECT-STATUS.md).

## Tài liệu và tiến độ

- [Bàn giao ngữ cảnh cho agent mới](docs/AGENT-HANDOFF.md) · [Lời nhắn để mở chat mới](docs/NEXT-CHAT-PROMPT.md)
- [Trạng thái dự án](docs/PROJECT-STATUS.md)
- [Chạy trên điện thoại thật qua USB](docs/DEVICE-SETUP.md)
- [Cách xem và cấu trúc Home preview](docs/HOME-PREVIEW.md)
- [Kết quả rà soát Home](docs/HOME-REVIEW.md)
- [Review danh sách/tạo chuyến](docs/TRIPS-REVIEW.md) · [Đề xuất chi tiết chuyến đi](docs/TRIP-DETAIL-DESIGN.md)
- [Tích hợp Auth](docs/auth-integration.md)
- [Thiết lập Google Sign-In](docs/google-auth.md)
- [Quy định phát triển](AGENTS.md)

Sao chép `.env.example` thành `.env` và chọn `EXPO_PUBLIC_API_URL` phù hợp với thiết bị; khởi động lại Metro sau khi đổi env. Khi đổi key Maps, package hoặc plugin native, cần prebuild và build/cài lại app theo hướng dẫn thiết bị.
