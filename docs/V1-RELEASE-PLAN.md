# WeGo V1 — APK báo cáo và web dự phòng

Chốt phạm vi ngày 08/11/2026. Ưu tiên ổn định luồng hiện có để báo cáo giảng viên. Đây là bản demo nội bộ, chưa phải đợt phát hành public/Play Store.

## Phạm vi đã thống nhất

- Bàn giao APK Android cài trực tiếp, chạy độc lập với Metro; web chạy trên laptop làm phương án dự phòng.
- Backend/PostgreSQL chạy trên laptop, điện thoại và laptop cùng Wi-Fi. Các provider Mapbox/Cloudinary/email vẫn cần Internet và cấu hình thật.
- Giữ auth, chuyến đi, địa điểm/lịch ngày, bản đồ/tuyến đường, thời tiết, Home, Camera, ảnh/album/Xem sau và hồ sơ hiện có.
- Vali: chọn lưu bền trên thiết bị theo tài khoản + trip ID, không xây API hoặc đồng bộ cloud. Không coi useState hiện tại là đã lưu bền. Chưa triển khai persistence cho vali trong đợt chuẩn bị build này.
- Thông báo và push nằm ngoài V1. Nút thông báo mẫu chỉ còn trong UI preview, ẩn ở luồng thật.
- Không mở rộng AI Copilot/planning mới, mạng xã hội, upload nền hoặc feature khác trong đợt chốt V1.

## Thứ tự hoàn thiện

1. **Baseline:** chạy test mobile/backend, TypeScript, Expo Doctor và export web. Ghi rõ check đã chạy và vấn đề thật; không dùng số test cũ để chứng nhận bản mới.
2. **Sửa lỗi chặn demo:** crash/màn trắng, mất ảnh/nháp, sai ownership/phiên, mất dữ liệu sau reload, API không kết nối, cỡ chữ/safe area/touch target làm thao tác không dùng được. Giữ nguyên ngôn ngữ thiết kế hiện tại.
3. **Nghiệm thu APK:** khởi động mới, mở lại app, back Android, quyền camera/thư viện/GPS, một đợt upload 10 ảnh, mất mạng/retry, zoom/vuốt ảnh, bộ nhớ khi mở album nhiều lần.
4. **Nghiệm thu toàn luồng:** tạo tài khoản/verify/login → tạo chuyến → thêm/sắp xếp điểm → dựng timeline → đã ghé → chụp/upload/xóa → kết thúc chuyến → recap. Logout A/login B không thấy cache hoặc ảnh local của A.
5. **Đóng gói:** giữ cố định cấu hình, commit/phiên bản, APK, web export, tài liệu chạy backend và một tài khoản/dữ liệu demo hợp lệ. Chỉ đánh dấu sẵn sàng khi APK thật đã test trên điện thoại.

## Mạng cho buổi báo cáo

IP Wi-Fi laptop được kiểm tra ở thời điểm chuẩn bị: `192.168.1.9`; backend cổng `18081`. IP có thể thay đổi khi đổi Wi-Fi hoặc lease DHCP, cần kiểm tra trước mỗi lần build/demo.

Trên điện thoại, mở `http://192.168.1.9:18081/actuator/health`. Phải nhận `UP` trước khi test app. Nếu không vào được: kiểm tra backend đang chạy, cùng mạng, mạng có chặn thiết bị truy cập nhau không và quyền inbound Java/cổng 18081 trên mạng Private. Không tắt toàn bộ firewall.

- Profile `preview-lan` bật cờ public `EXPO_PUBLIC_LAN_DEMO=true`, tắt UI fixture và tạo APK release nội bộ.
- HTTP API của bản demo chỉ được client chấp nhận với IPv4 private thuộc 10/8, 172.16/12 hoặc 192.168/16, trên Android/web. Không tự đổi localhost khi không có Metro.
- Plugin Android bật cleartext cho bản demo LAN; đây là ngoại lệ cho mạng demo tin cậy. Dùng dữ liệu/tài khoản thử. Profile production ép cờ LAN về false và tiếp tục yêu cầu HTTPS.
- URL API được đóng vào bundle: đổi IP/backend URL thì cần build/export lại. APK chạy không cần Metro nhưng vẫn cần backend laptop hoạt động.
- Web dự phòng mở trên laptop tại `http://localhost:8082`, phù hợp CORS/link email dev hiện có. Camera web chỉ hoạt động trong secure context như localhost/HTTPS; không dùng web HTTP qua IP LAN để hứa hỗ trợ chụp ảnh trên điện thoại.
- Khi mở link verify/reset từ điện thoại, khởi động backend bằng tham số WebUrl dưới đây để link và CORS dùng IP laptop, tránh localhost trỏ về điện thoại. Tài khoản demo không cần ảnh/ghi chú cá nhân.
- Google login native cần package và SHA-1 đúng bản APK/signing key. Kiểm tra riêng trước buổi báo cáo; đăng nhập email là luồng dự phòng. Không tạo OAuth ID hoặc secret giả để cho qua kiểm tra.
- Web hiện giữ refresh token trong bộ nhớ tab (`auth-session.ts`), reload cần đăng nhập lại. Android giữ phiên bằng SecureStore. Không đổi sang lưu bearer token trong localStorage để che khác biệt này; chuẩn bị tài khoản demo để đăng nhập lại trên web khi cần.
- Chốt mạng/IP laptop trước khi tạo APK. Nếu đổi Wi-Fi ở phòng báo cáo, kiểm tra IP và build lại theo IP mới, hoặc chủ động giữ cùng mạng demo/IP bằng cấu hình DHCP của mạng bạn quản lý.

## Chuẩn bị APK local trên Windows

Khởi động backend từ `E:\travel-system` (dừng tiến trình backend cũ trước):

```powershell
.\scripts\Start-Dev.ps1 -Port 18081 -WebUrl http://192.168.1.9:8082
```

Tham số này cấu hình link email/Google và bổ sung CORS cho web LAN sau khi đọc `.env`; không sửa file chứa secret. Web dự phòng phải chạy ở cổng tương ứng.

Yêu cầu: Java/Android SDK/NDK đúng dự án, native dependencies đã tải; kiểm tra provider token trong biến môi trường. Không đưa token/keystore vào Git.

Từ thư mục mobile, thay IP nếu đã đổi:

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://192.168.1.9:18081'
$env:EXPO_PUBLIC_LAN_DEMO = 'true'
$env:EXPO_PUBLIC_UI_PREVIEW = 'false'
$env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:NODE_OPTIONS = '--max-old-space-size=3072'
$env:NODE_ENV = 'production'
npx expo prebuild --platform android --no-install
Set-Location android
.\gradlew.bat :app:assembleRelease --max-workers=1 --no-daemon '-PreactNativeArchitectures=arm64-v8a,x86_64' '-Dorg.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=512m'
```

APK dự kiến: `android/app/build/outputs/apk/release/app-release.apk`. Build hai ABI arm64 cho điện thoại hiện đại và x86_64 cho emulator; không hứa hỗ trợ thiết bị Android 32-bit. Native folders không tracked; kiểm tra/cất thay đổi native thủ công trước khi chạy prebuild. Không dùng `--clean` mặc định. Local release hiện dùng debug signing, chỉ phù hợp demo nội bộ. Android prebuild đã đạt; kết quả APK ghi dưới phần trạng thái. Metro giới hạn tối đa 2 worker khi bật demo LAN và giữ cấu hình mặc định Expo ở các chế độ khác.

Có thể dùng EAS khi đã cấu hình tài khoản/project/biến môi trường build: `eas build -p android --profile preview-lan`. Cần đặt API URL LAN trong môi trường EAS; `.env` ignored không phải là nguồn bảo đảm cho build cloud. Tham chiếu: [Expo APK](https://docs.expo.dev/build-reference/apk/), [Build profiles](https://docs.expo.dev/build/eas-json/).

## Web dự phòng

Cùng ba biến EXPO_PUBLIC ở trên, từ thư mục mobile:

```powershell
npx expo export --platform web --max-workers 2
npx expo serve --port 8082
```

Mở `http://localhost:8082`. Port phải trống; dừng server web dev cũ nếu đang chiếm port. Giữ giới hạn worker khi laptop đang chạy emulator/backend để tránh tranh RAM. Các link verify/reset/Google dev cần trỏ đúng web này; nếu đổi port phải cập nhật CORS và link ở backend.

## Trạng thái kiểm tra

- Cập nhật sau rà soát checklist: người dùng xác nhận chạy được trên điện thoại thật. Mobile hiện đạt **399/399**, TypeScript strict/no-unused và export web `.expo/v1-readiness-web` đạt. Bổ sung ErrorBoundary root/Auth/Workspace; **APK có hash ghi dưới đây và bản web đang serve `.expo/v1-web-final` chưa chứa thay đổi mới này**. Cần build lại APK/serve export mới để nghiệm thu ErrorBoundary. Các số và artifact cũ dưới đây được giữ làm lịch sử, chưa có benchmark/E2E/provider thật mới.
- Mobile: 395/395 ca trong bộ đầy đủ đạt; 8 ca cấu hình/API URL liên quan đạt sau thay đổi demo/Metro. TypeScript strict/no-unused đạt. Backend đầy đủ 518/518 đạt; các kiểm tra migration được cập nhật V19, không sửa migration đã phát hành.
- Web cuối export thành công ở `.expo/v1-web-final`, server tĩnh đang chạy tại `http://localhost:8082`; Login/Register/verify/reset/Google callback HTTP 200. Backend LAN UP; CORS web LAN trả 200. Chưa nghiệm thu trực quan web vì CUA lỗi khởi tạo (`failed to write kernel assets`).
- Sau khi nhìn bản native, sửa lỗi link Đăng ký bị cắt ở Android, áp dụng chung footer auth; 18 ca auth/cấu hình liên quan và TypeScript đạt sau sửa. Bộ đầy đủ 395 ca ở trên là baseline trước sửa footer, không cộng các nhóm chồng lặp thành tổng test mới.
- APK cuối build thành công, kiểm tra chữ ký và ZIP alignment đạt. Đã cài vào Pixel 7 emulator, mở Login bằng bundle có sẵn (không chạy Metro), chuyển Register và Back về Login, xác nhận link Đăng ký hiển thị đủ. Không thấy fatal/ReactNativeJS/thiếu native module trong log của lượt smoke này. Không thực hiện đăng nhập tài khoản thật hoặc gửi email trong smoke test.
- Ảnh kiểm tra: [Login](../.expo/v1-start.png), [Register](../.expo/v1-register.png). Lượt đầu emulator có ANR của Quickstep khi chạy cùng build, app restore gặp lỗi mạng và phục hồi bằng Retry; lượt mở sạch bản cuối tới Login. Chưa dùng kết quả dưới tải đó làm benchmark cold start/độ mượt.
- Expo Doctor: 20/21 check đạt, check còn lại báo 13 package lệch patch version khuyến nghị trong SDK 57. Chưa tự nâng dependency hoặc bỏ qua check; cần chốt patch và kiểm tra lại khi chuẩn bị APK.
- Chưa nghiệm thu APK trên thiết bị thật, provider Cloudinary/email/Google thật và mạng từ điện thoại; chưa kết luận V1 sẵn sàng phát hành.
- Danh mục địa điểm/map data chưa cam kết tọa độ chính xác từng điểm theo phạm vi người dùng đã chốt. URL ảnh hiện công khai cho người có link; không dùng album dữ liệu riêng tư trong demo.

## File bàn giao đã tạo

- [WeGo V1 APK](../.expo/v1-release/WeGo-v1-demo-lan.apk), version 1.0.0, package `com.travel.mobile`, 152.839.058 byte (~146 MiB), arm64-v8a/x86_64, min API 24, target API 36.
- SHA-256: `115EA8E8C06D6D2F366CCF6636CD11D861B8223F2DC9015DBF49A1B5E7AB5576`.
- Đây là bản ký debug local cho demo nội bộ, API cố định `http://192.168.1.9:18081`; không phải gói phát hành Play Store. Giữ laptop/backend hoạt động và kiểm tra IP trước buổi báo cáo.
- Bước nghiệm thu tiếp theo trên điện thoại thật: login/restore → trip/lịch ngày/live → upload nhiều ảnh/mất mạng/retry/xóa → recap → đổi tài khoản. Phần vali lưu bền tại máy vẫn chưa triển khai; thông báo hoãn ngoài V1.
