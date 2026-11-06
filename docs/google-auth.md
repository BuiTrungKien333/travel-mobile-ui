# Google Sign-In cho Tripzy

## Hành vi đã triển khai

- Cả màn hình đăng nhập và đăng ký có thể dùng Google. Android dùng Credential Manager: ưu tiên tài khoản đã cấp quyền, tự chọn khi phù hợp, mở chọn tài khoản mới nếu chưa có credential. iOS mở Google Sign-In để lấy token mới chứa nonce của lần đăng nhập.
- Gmail hoặc Google Workspace đã xác thực: email trùng tài khoản mật khẩu thì liên kết vào **user hiện có**, giữ ID, dữ liệu, quyền và mật khẩu đã xác thực, vào app ngay. Không yêu cầu nhập lại mật khẩu. Email mới tạo user với quyền `USER`, không có mật khẩu giả.
- Email ngoài Gmail/Workspace: lần liên kết đầu gửi link xác nhận quyền sở hữu hộp thư. Bấm xác nhận sẽ đăng nhập luôn, **không nhập mật khẩu**. Sau khi liên kết, các lần Google login tiếp theo vào thẳng app. Đây là trường hợp Google không đảm bảo quyền sở hữu hiện tại của email, dù `email_verified=true`. [Hướng dẫn xác minh Google ID token](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
- Nếu đăng ký mật khẩu còn chưa xác thực, khi chủ email xác nhận qua Google/link, backend vô hiệu mật khẩu đã đặt và các link xác thực cũ. Chủ tài khoản có thể đặt mật khẩu mới bằng luồng quên mật khẩu. Tài khoản vô hiệu không được mở lại qua Google.
- Định danh Google bằng `sub`; không đổi email của user chỉ vì email trong Google thay đổi. Một user chỉ liên kết một `sub`, một `sub` chỉ thuộc một user.
- UI giữ giao diện sáng, VI mặc định/EN, input 14, Roboto và theme hiện có. Có loading, khóa thao tác trùng, lỗi có thể thử lại; hủy hộp thoại Google không hiện thông báo lỗi. Web dùng nút chính thức Google Identity Services và phiên trong memory; native lưu refresh token ở SecureStore.

## 1. Tạo OAuth clients

Trong [Google Cloud Console](https://console.cloud.google.com/), chọn/tạo một project, cấu hình Google Auth Platform: tên app, email hỗ trợ, Audience và Data Access cho đăng nhập cơ bản. Nếu đang Testing, thêm tài khoản thử nghiệm. Dùng cùng project cho các client sau. [Thiết lập Google Identity Services](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

| Client | Cần điền | Dùng ở đâu |
| --- | --- | --- |
| **Web application** | Authorized JavaScript origins cho web, ví dụ `http://localhost` và `http://localhost:8081`, thêm HTTPS origin thật khi deploy | Backend `GOOGLE_WEB_CLIENT_ID`; app lấy ID công khai từ API challenge để làm audience trên Android/iOS/web |
| **Android** | Package name thật của app và SHA-1 của chứng chỉ ký bản đang chạy | Credential Manager kiểm tra package/chữ ký; không cần biến Android client ID trong app |
| **iOS** | Bundle identifier thật của app | Mobile `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`; config tự tạo reversed URL scheme |

Chọn package/bundle ID ổn định trước khi tạo clients. Giá trị phải khớp bản build, không dùng tên slug Expo để thay thế. Chưa có ID thật nên repository không điền ID mẫu hoạt động giả.

### Android: lấy SHA-1

Sau khi tạo keystore/bản native đầu tiên, dùng `android/gradlew.bat signingReport` trong thư mục mobile, hoặc `keytool -list -v` với keystore đúng. Debug local, EAS internal/release và Google Play App Signing có thể dùng các chứng chỉ khác nhau: tạo Android OAuth client cho **từng package + SHA-1** cần thử/phát hành. Khi lên Play, dùng SHA-1 của app signing certificate cho bản cài từ Play. Thiết bị/emulator cần Google Play Services. [Credential Manager và Google Sign-In](https://developer.android.com/identity/sign-in/credential-manager-siwg).

### iOS

Tạo iOS OAuth client đúng bundle identifier. `app.config.ts` suy ra `com.googleusercontent.apps.<phần ID trước .apps.googleusercontent.com>`, Nitro plugin thêm URL scheme và các CocoaPods cần thiết. `expo-build-properties` bật scene support cho SDK 57/iOS 27; plugin dự án thêm xử lý Google URL vào AppDelegate mà Expo scene delegate chuyển tiếp đến, giữ callback của Router/dev-client. Không cần viết đè SceneDelegate. [Thiết lập Google Sign-In cho iOS](https://developers.google.com/identity/sign-in/ios/start-integrating).

Không cần Firebase, `google-services.json`, client secret hay quyền truy cập Google Drive/Calendar cho luồng đăng nhập này.

## 2. Điền biến môi trường

Backend `E:/travel-system/backend/.env`, chạy profile `dev`:

```dotenv
GOOGLE_AUTH_ENABLED=true
GOOGLE_WEB_CLIENT_ID=<Web OAuth client ID thật>.apps.googleusercontent.com
GOOGLE_CHALLENGE_TTL=5m
GOOGLE_LINK_TTL=10m
GOOGLE_LINK_URL=travelplannermobileui://google-link
```

Thay placeholder bằng **toàn bộ ID Google cấp**, không nối hậu tố lần nữa. Google login mặc định tắt cho đến khi có ID; nếu bật với ID sai định dạng, backend từ chối khởi động. SMTP cần bật theo [auth-integration.md](./auth-integration.md) nếu hỗ trợ email ngoài Gmail/Workspace. Google login Gmail/Workspace không cần SMTP.

Mobile `E:/travel-mobile-ui/.env`:

```dotenv
EXPO_PUBLIC_API_URL=http://<IP LAN máy chạy backend>:8080
GOOGLE_ANDROID_PACKAGE_NAME=<package name bạn đã đăng ký>
GOOGLE_IOS_BUNDLE_ID=<bundle identifier bạn đã đăng ký>
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<iOS OAuth client ID thật>.apps.googleusercontent.com
```

Chỉ Android có thể để trống hai biến iOS. Chỉ iOS có thể để trống Android package. Android emulator dùng `http://10.0.2.2:8080`; iOS simulator/web cùng máy dùng `http://localhost:8080`. Backend phải cho phép CORS đúng web origin khi thử web. Rebuild app sau khi đổi package/bundle/client ID/plugin; restart Metro và backend sau khi đổi env. ID công khai được phép nằm trong app, credential gửi mail/JWT signing keys không được dùng `EXPO_PUBLIC_*`.

Production dùng HTTPS API và URL link từ domain tin cậy, ví dụ `https://<domain>/google-link`. Cấu hình App Links/Universal Links và trang fallback tương ứng để mở app hoặc xác nhận trên web; dev custom scheme chỉ được profile `dev` cho phép.

## 3. Tạo development build

Google native Sign-In cần development build; **Expo Go không có native module này**. Sau khi điền identifiers:

```powershell
# Android local, cần Android SDK/JDK theo Expo SDK 57
npx expo run:android
# Khi bản build đã cài, chạy Metro cho development client
npx expo start --dev-client
```

iOS local cần macOS/Xcode: `npx expo run:ios`. Windows có thể dùng EAS Build:

```powershell
npx eas-cli build --profile development --platform android
npx eas-cli build --profile development --platform ios
```

EAS có thể yêu cầu đăng nhập, liên kết Expo project và credentials; cấu hình các biến môi trường cùng giá trị trên máy/build service. Profile `development` đã có trong `eas.json`, Android trả APK. Profile iOS internal dành cho thiết bị đã provision, không phải simulator. Không có EAS project ID hay chứng chỉ được tạo thay người dùng.

Web vẫn chạy `npm run web`. Khi Google chưa bật/cấu hình, nút hiển thị thông báo và cho thử lại; không giả lập đăng nhập thành công.

## API và bảo vệ phiên

Các response thành công dùng envelope `ApiResponse` của dự án.

| API | Body | Kết quả |
| --- | --- | --- |
| `POST /api/v1/auth/google/challenge` | `{}` | `challengeId`, `nonce`, `webClientId`, `expiresIn` theo milliseconds; mặc định 5 phút |
| `POST /api/v1/auth/google` | `{ "challengeId": "UUID", "idToken": "Google JWT" }` | 200 `{status:"AUTHENTICATED",auth:AuthResponse}` hoặc 202 `{status:"VERIFICATION_REQUIRED",email,resendAfterSeconds}` |
| `POST /api/v1/auth/google/verify-link` | `{ "token": "token trong link email" }` | 200 `AuthResponse`; tạo phiên sau xác nhận bằng thao tác chủ động |

Backend dùng Nimbus JWT decoder, Google JWKS có cache và timeout 5 giây. Kiểm tra chữ ký RS256, `iss`, `aud` đúng Web ID, `exp`, nonce, `sub` và email đã xác thực. Không tin tên/email/quyền do client tự gửi. Nonce được sinh ở server và chỉ lưu hash; consume challenge nguyên tử trong transaction để chống replay. Web dùng popup SDK chính thức với nonce/button state, không nhận JWT từ query hay `postMessage` tự viết.

`AuthTokenIssuer` dùng chung Google/password login: access/refresh token của hệ thống, kiểm tra user version, rotation, logout và quyền hiện có. SessionManager chỉ cấp phiên cho `AUTHENTICATED`; kết quả chờ email không lưu credential. Response về sau logout/đăng nhập khác bị từ chối và thu hồi refresh token mới cấp.

Flyway **V8** thêm `users.google_subject` unique, cho phép `password_hash` null, bảng challenge và ticket link email có FK/index. Google-only user không đăng nhập được bằng mật khẩu cho đến khi tự đặt qua reset. Link email chỉ lưu SHA-256, chỉ dùng một lần, ràng buộc user/email/Google subject/version và mặc định 10 phút. Reset mật khẩu làm ticket đang chờ mất hiệu lực. Link ở fragment `#token=...`, không đưa access/refresh token vào URL; mở link/GET không tiêu thụ token. Email gửi sau commit theo cơ chế sẵn có.

| Mã lỗi | HTTP | Ý nghĩa |
| --- | --- | --- |
| `AUTH_011` | 401 | Google token, nonce hoặc challenge không hợp lệ/hết hạn/đã dùng |
| `AUTH_012` | 503 | Không xác minh được với dịch vụ Google |
| `AUTH_013` | 503 | Google login hoặc link email chưa cấu hình |
| `AUTH_014` | 409 | Email đã liên kết Google identity khác |
| `AUTH_009` | 400 | Link email không hợp lệ/hết hạn/đã dùng |
| `AUTH_010` | 503 | Email chưa bật |

## Kiểm tra đã chạy

- Backend: **116 tests pass**, PostgreSQL thật + Flyway; gồm JWT ký RSA thật, issuer/audience/expiry/nonce/chữ ký sai, liên kết tài khoản hiện có, đăng ký dở dang, Google-only user, refresh/profile, tài khoản vô hiệu, replay/expiry challenge, email xác nhận, reset vô hiệu link và hai lần Google signup đồng thời. Provider/mail được mock trong integration; không gửi email thật hay dùng Google account thật.
- Mobile: **31 tests pass**, TypeScript và lint pass; kiểm tra session chờ email, response muộn sau logout, contract và link. Plugin Google callback được thử trên Swift template **của Expo đang cài**, giữ linking và chạy lại không chèn trùng.
- Export web thành công, có route `/google-link`; export Android/iOS cũng thành công với bundle Hermes. Đây là kiểm tra JavaScript, không phải biên dịch/chạy native. Config introspection với ID **fixture chỉ dành cho kiểm tra** xác nhận reversed URL scheme và `EXExpoAppSceneDelegate`.
- `expo-doctor`: **20/21**; còn 6 bản vá mới hơn của Expo, `@expo/ui`, constants, glass-effect, linking, router. Không tự nâng phiên bản hoặc tắt kiểm tra.
- Chưa build/chạy Google native trên thiết bị và chưa xác minh Google account/email thật: chưa có OAuth IDs; môi trường Windows hiện chưa cấu hình Android SDK và không build iOS local.

Trước khi public: cấu hình rate limit auth tại hệ thống/gateway (hiện backend chưa có), xác nhận Google branding/origins/SHA-1 trên bản ký thật và test email delivery. Mail hiện gửi sau commit bằng executor giới hạn nhưng chưa có outbox retry bền vững; nhận 202 không đảm bảo email đến inbox. Các giới hạn auth có trước được ghi trong [auth-integration.md](./auth-integration.md).
