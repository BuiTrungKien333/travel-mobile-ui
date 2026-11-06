# Chạy WeGo trên thiết bị để kiểm tra đồ án

## 1. Cấu hình native dùng chung

`app.json` chứa tên app, giao diện, scheme và quyền camera/media. **`app.config.js` là dynamic config duy nhất**, ghép thêm Maps tùy chọn, dev-client, scene support và Google Sign-In. Không khôi phục `app.config.ts` từ nhánh khác.

Các giá trị trong `.env`:

| Biến | Mục đích |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Origin backend, không kèm `/api/v1` |
| `GOOGLE_ANDROID_PACKAGE_NAME` | Package đã đăng ký; để trống thì giữ `com.travel.mobile` trong `app.json` |
| `GOOGLE_IOS_BUNDLE_ID` | Bundle identifier; để trống thì giữ giá trị trong `app.json` |
| `EXPO_PUBLIC_NATIVE_MAP_ENABLED` | Chỉ bật sau khi cấu hình Maps SDK và dựng lại development build |
| `GOOGLE_MAPS_ANDROID_API_KEY` | Key Maps SDK cho Android |
| `GOOGLE_MAPS_IOS_API_KEY` | Key Maps SDK cho iOS |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | iOS OAuth client ID; để trống khi chỉ làm Android |

Giá trị trống không được thay bằng ID/key giả. Cấu hình vẫn đọc được để phát triển các phần còn lại; tính năng Maps/Google trên nền tảng tương ứng cần key/OAuth thật. Android Google Sign-In sử dụng Web client ID do backend challenge cung cấp; cần đăng ký đúng package/chứng thư. Xem [google-auth.md](google-auth.md).

## 2. Backend và URL API

Khởi động PostgreSQL/backend theo cấu hình của repo `travel-system`. Kiểm tra health bằng `http://localhost:18080/api/v1/health/database` trên máy chạy backend.

- Web hoặc iOS simulator cùng máy: `http://localhost:18080`.
- Android emulator: resolver tự đổi `localhost` thành `10.0.2.2`.
- Điện thoại cùng Wi-Fi: resolver lấy IP LAN của máy chạy Metro khi `.env` dùng `localhost`. Port backend phải truy cập được từ điện thoại.
- Backend ở máy khác hoặc Metro dùng tunnel: đặt IP LAN/HTTPS của backend trực tiếp.
- Release hiện yêu cầu URL HTTPS; dùng development build khi thử HTTP local.

## 3. Dựng lại bản Android và mở Metro

Sau khi thay plugin, key native, package hoặc bundle ID cần dựng/cài lại app; reload JavaScript chưa cập nhật được cấu hình native.

```powershell
# Cần Android SDK, JDK và emulator/điện thoại được kết nối.
npx.cmd expo run:android

# Các lần chạy tiếp theo với development build đã cài.
npx.cmd expo start --dev-client
```

Google native Sign-In cần development build. iOS local cần macOS/Xcode; xem hướng dẫn EAS hiện có trong [google-auth.md](google-auth.md) nếu cần build từ Windows.

## 4. Kiểm tra nhanh sau khi cài

- [ ] App mở và tải màn đăng nhập, không báo thiếu native module.
- [ ] Đăng nhập email/password và tải được danh sách chuyến.
- [ ] Có key Maps hợp lệ thì bản đồ hiển thị; thử tìm một địa điểm và xem ghim.
- [ ] Mở camera, cấp/từ chối quyền, chọn ảnh và quay lại được.
- [ ] Nếu đã cấu hình OAuth: thử đăng nhập Google và quay về app đúng màn.

Các test Google và `tests/team-merge.test.ts` kiểm tra cấu hình và plugin hiện hành. Test cấu hình không thay cho việc chạy checklist trên thiết bị.
