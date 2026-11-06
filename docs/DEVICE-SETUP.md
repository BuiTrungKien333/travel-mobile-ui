# Chạy WeGo trên điện thoại Android qua USB

Hướng dẫn dành cho người vừa clone project, dùng Windows/PowerShell và điện thoại Android thật. Dùng **development build** để kiểm tra Maps, camera, đăng nhập và các luồng gọi backend.

## 1. Chuẩn bị máy tính và điện thoại

Trên máy tính:

- Cài Git, Node.js và npm. Node 22 từ 22.13.0 hoặc Node 24 từ 24.3.0 phù hợp với engines của React Native đang cài trong project.
- Cài JDK 21, đặt `JAVA_HOME` tới thư mục JDK; thêm thư mục `bin` của JDK vào `PATH`.
- Cài Android Studio. Trong SDK Manager, cài Android SDK Platform, SDK Build-Tools, SDK Platform-Tools và Command-line Tools theo yêu cầu build của project. Không cần tạo emulator khi dùng điện thoại thật.
- Đặt `ANDROID_HOME` tới thư mục Android SDK; thêm `platform-tools` vào `PATH`. Vị trí mặc định thường là `%LOCALAPPDATA%\Android\Sdk`.
- Máy tính và điện thoại dùng chung Wi-Fi có thể truy cập lẫn nhau. Hướng dẫn này dùng LAN cho Metro/backend và USB để cài app.

Kiểm tra trong terminal mới:

```powershell
node --version
npm.cmd --version
java -version
adb version
```

Trên điện thoại:

1. Vào **Cài đặt → Giới thiệu điện thoại**, chạm **Số bản dựng** nhiều lần để mở tùy chọn nhà phát triển. Tên mục có thể khác theo hãng.
2. Bật **USB debugging / Gỡ lỗi USB** trong **Tùy chọn nhà phát triển**.
3. Cắm cáp USB có truyền dữ liệu, mở khóa điện thoại và chấp nhận hộp thoại **Allow USB debugging**. Nếu cần, chọn chế độ USB **Truyền tệp**.
4. Một số máy cần thêm driver USB của hãng hoặc bật quyền cài ứng dụng qua USB.

```powershell
adb devices -l
```

Thiết bị cần có trạng thái `device`. Nếu là `unauthorized`, chấp nhận hộp thoại trên điện thoại. Nếu danh sách trống, kiểm tra cáp, cổng USB và driver trước khi build.

## 2. Clone và cài thư viện

Thay URL dưới đây bằng repository mobile của nhóm:

```powershell
git clone <URL-repository-mobile> travel-mobile-ui
cd travel-mobile-ui
npm.cmd ci
Copy-Item .env.example .env
```

Chỉ sao chép file env khi chưa có `.env`. Nếu clone repository cha chứa nhiều project, chuyển vào thư mục có `package.json` của mobile trước khi chạy các lệnh npm.

Không cần cài Expo CLI toàn cục. Dùng `npx.cmd expo` từ project.

## 3. Chạy backend và cấu hình .env

App hiện gọi backend thật cho tài khoản, chuyến đi, địa điểm và kỷ niệm. Người chạy mobile cần một backend đã cấu hình database và đang hoạt động; có thể dùng backend của mình hoặc backend dùng chung của nhóm.

Kiểm tra trên máy chạy backend:

```text
http://localhost:8080/api/v1/health/database
```

Dùng `ipconfig` để tìm IPv4 của card Wi-Fi trên máy chạy backend. Ví dụ nếu IP là `192.168.1.10`, cấu hình mobile:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.10:8080
GOOGLE_ANDROID_PACKAGE_NAME=com.travel.mobile
GOOGLE_MAPS_ANDROID_API_KEY=<key-Maps-SDK-for-Android-của-nhóm>
```

Thay IP và key minh họa bằng giá trị thật. URL chỉ chứa origin, không thêm `/api/v1`, không dùng `0.0.0.0`. Các biến iOS có thể để trống khi chỉ chạy Android.

Mở URL health bằng trình duyệt trên điện thoại:

```text
http://192.168.1.10:8080/api/v1/health/database
```

Nếu điện thoại không truy cập được, kiểm tra backend, IP, mạng Wi-Fi và Windows Firewall cho port backend (mặc định 8080). USB không tự làm URL backend truy cập được từ điện thoại. Nếu backend ở máy khác, dùng IP/HTTPS của máy đó.

Khi development qua Expo LAN, resolver cũng hỗ trợ đổi `localhost` sang host của Metro; hướng dẫn này dùng IP LAN rõ ràng để tránh nhầm khi backend và Metro ở hai máy khác nhau. Bản release yêu cầu HTTPS.

Maps SDK key chỉ phục vụ bản đồ nền. Tìm địa điểm và tính tuyến đường dùng Geoapify ở backend; tải ảnh dùng cấu hình Cloudinary ở backend. Nếu các tính năng này chưa cấu hình, cần người phụ trách backend bổ sung. Không đưa secret backend vào mobile.

Google Sign-In cần OAuth riêng, xem [google-auth.md](google-auth.md). Có thể kiểm tra bằng tài khoản email/mật khẩu hợp lệ do nhóm cung cấp khi Google Sign-In chưa sẵn sàng.

## 4. Cấu hình Maps cho bản Android của người clone

`app.config.ts` đọc key và package từ `.env`, ghép plugin native với cấu hình trong `app.json`. Tạo/cập nhật Android project sau khi điền env:

```powershell
npx.cmd expo prebuild --platform android
```

Lấy SHA-1 của debug keystore vừa tạo, chạy từ thư mục gốc mobile:

```powershell
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Gửi **package name và SHA-1** cho người quản lý Google Cloud key để thêm vào:

**Credentials → key Maps → Application restrictions → Android apps**.

- Package mặc định: `com.travel.mobile`; nếu thay package trong env, đăng ký đúng package đó.
- Dùng SHA-1 lấy trên máy người clone; không mặc định dùng SHA-1 từ máy người khác.
- Project Google Cloud cần bật **Maps SDK for Android**, liên kết Billing và cho phép API này trong API restrictions của key.
- Google Sign-In cũng cần Android OAuth client khớp package và SHA-1 của bản build.

Không cần gửi mật khẩu, private keystore hoặc API key lên chat/repository để đăng ký SHA-1. Xem [thiết lập Maps SDK của Google](https://developers.google.com/maps/documentation/android-sdk/get-api-key).

## 5. Build và cài lên điện thoại qua USB

Xác nhận `adb devices -l` thấy điện thoại, rồi chạy từ thư mục gốc mobile:

```powershell
npx.cmd expo run:android --device
```

Chọn điện thoại thật trong danh sách. Lệnh build Android, cài app và khởi động Metro. Mở **WeGo/app vừa cài**, thay vì mở bằng Expo Go. Cho phép camera/thư viện khi sử dụng tính năng tương ứng.

Lần đầu có thể mất nhiều thời gian và dung lượng để tải Gradle, Android SDK/NDK và biên dịch native. Nếu hủy bằng Ctrl+C, chạy lại đúng lệnh; Gradle thường dùng lại những bước đã hoàn thành. Không chạy `clean` hoặc xóa cache để tiếp tục build.

Những lần sau, nếu chỉ sửa JavaScript/TypeScript/UI và app đã được cài:

```powershell
npx.cmd expo start --dev-client --lan
```

Giữ Metro chạy, mở app và quét QR trong development client hoặc nhấn `a` trong terminal để mở trên Android được kết nối. Cho phép Node/Metro qua Windows Firewall trên mạng riêng; Metro mặc định dùng port 8081.

Sau khi đổi `.env`, dừng và mở lại Metro. Nếu đổi key Maps, package, plugin hoặc cấu hình native, chạy lại:

```powershell
npx.cmd expo prebuild --platform android
npx.cmd expo run:android --device
```

Không cần `--clean` cho quy trình thông thường. iOS local cần macOS/Xcode; hướng dẫn này dành cho Android.

## 6. Xử lý lỗi thường gặp

| Hiện tượng | Cách kiểm tra |
| --- | --- |
| Không nhận lệnh `adb` | Thêm Android SDK `platform-tools` vào PATH, mở lại terminal. |
| ADB báo `unauthorized` | Mở khóa điện thoại và chấp nhận USB debugging; thử rút/cắm cáp. |
| Expo cố mở emulator/port 5554 | Dùng `--device` và chọn điện thoại có trạng thái `device`. |
| App không kết nối Metro | Kiểm tra cùng Wi-Fi, QR của development client, VPN và Firewall port 8081. |
| App mở nhưng API lỗi | Mở URL health bằng trình duyệt điện thoại; kiểm tra IP, backend và Firewall port 8080. |
| Maps trống, chỉ có logo Google | Kiểm tra key của bản development build, package/SHA-1, API restrictions và Billing; đổi key native thì phải build/cài lại. |
| Lỗi chữ ký khi cài đè | Bản cũ có thể dùng keystore khác. Gỡ bản cũ nếu chấp nhận mất dữ liệu cục bộ của app, rồi cài lại. |

Expo Go Android SDK 57 có [báo cáo bản đồ đen dù còn logo Google](https://github.com/expo/expo/issues/49323). Key trong project không thay được key nhúng trong Expo Go. Dùng development build trong hướng dẫn này để kiểm tra Maps và các module Google native.

## 7. Checklist sau khi cài

- [ ] Đăng nhập tài khoản hợp lệ và tải danh sách chuyến đi.
- [ ] Mở chi tiết chuyến đi và lịch trình; dữ liệu vẫn còn sau khi mở lại app.
- [ ] Bản đồ có nền, tìm địa điểm có kết quả và hiển thị ghim.
- [ ] Tạo/chỉnh sửa chuyến đi và kiểm tra dữ liệu đã lưu.
- [ ] Chụp/chọn ảnh, lưu kỷ niệm và đổi avatar.
- [ ] Nếu đã cấu hình OAuth: đăng nhập Google quay lại app thành công.

Các bước build/cài lại dựa trên [Expo CLI](https://docs.expo.dev/more/expo-cli/#compiling-android). Kiểm thử cấu hình và unit test không thay thế checklist chạy trên thiết bị thật.
