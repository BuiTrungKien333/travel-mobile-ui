# Tích hợp auth

## Chạy ứng dụng

1. Backend: khởi động lại `TravelApplication` trong `E:/travel-system/backend` với profile `dev` để áp dụng Flyway V6/V7. Profile này đọc `.env` tại thư mục backend. Cần PostgreSQL và hai biến `JWT_SECRET_KEY`, `JWT_REFRESH_KEY` là khóa Base64 riêng, mỗi khóa ít nhất 32 byte; không dùng khóa ví dụ/test trong môi trường thật.
2. Cấu hình SMTP theo phần dưới. Email mặc định **tắt**: đăng ký/gửi lại/quên mật khẩu trả `503 AUTH_010` cho đến khi bật; đăng nhập tài khoản đã xác thực vẫn hoạt động.
3. Mobile: đặt `EXPO_PUBLIC_API_URL` theo `.env.example`, rồi khởi động Metro. Điện thoại dùng IP LAN của backend, cùng mạng và truy cập được port 8080; Android emulator dùng `http://10.0.2.2:8080`, web trên máy dùng `http://localhost:8080`. HTTP chỉ được phép trong development.
4. Đăng ký → xem email → mở link → bấm xác nhận → quay lại đăng nhập. Không tự đăng nhập sau xác thực. Thử quên mật khẩu → mở link → nhập/xác nhận mật khẩu mới → đăng nhập lại. Đặt lại mật khẩu vô hiệu mọi phiên cũ.

Ứng dụng chỉ dùng giao diện sáng, mặc định tiếng Việt, hỗ trợ tiếng Anh; input giữ cỡ chữ 14. Loading/error và nội dung email có VI/EN. Cấu hình Google Sign-In và Flyway V8 xem [google-auth.md](./google-auth.md).

## SMTP và đường dẫn email

Xem `E:/travel-system/backend/.env.example`. Đề xuất Resend SMTP khi có domain gửi đã xác thực; Gmail App Password dùng được để thử nghiệm. Không đưa credential vào source control hoặc biến `EXPO_PUBLIC_*`. Tài liệu: [Resend SMTP](https://resend.com/docs/send-with-smtp), [Gmail App Password](https://support.google.com/accounts/answer/185833?hl=en), [Spring Boot Mail](https://docs.spring.io/spring-boot/reference/io/email.html).

```dotenv
AUTH_EMAIL_ENABLED=true
AUTH_EMAIL_FROM=no-reply@your-verified-domain.com
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USERNAME=resend
MAIL_PASSWORD=<Resend API key>
MAIL_SMTP_AUTH=true
MAIL_STARTTLS=true
MAIL_SSL_ENABLED=false
AUTH_VERIFY_EMAIL_URL=travelplannermobileui://verify-email
AUTH_RESET_PASSWORD_URL=travelplannermobileui://reset-password
AUTH_VERIFICATION_TTL=24h
AUTH_RESET_TTL=30m
AUTH_RESEND_COOLDOWN=60s
```

- Development build đã cài trên điện thoại: dùng scheme `travelplannermobileui` có sẵn trong `app.json`.
- Expo Go: dùng URL của Metro hiện tại, ví dụ `exp://192.168.1.8:8081/--/verify-email` và `exp://192.168.1.8:8081/--/reset-password`. Port/IP phải khớp Metro; link chỉ dùng được khi Metro còn chạy.
- Web development: `http://localhost:8081/verify-email` và `/reset-password`; từ điện thoại thay localhost bằng IP LAN. Web production cần host static hỗ trợ các route đã export.
- Production: cấu hình URL HTTPS thật. Để HTTPS mở trực tiếp app, cần domain cùng Universal Links/App Links; chưa cấu hình vì chưa có domain. Custom scheme/HTTP/Expo Go chỉ được cho phép ở profile `dev`.
- Gmail: `smtp.gmail.com`, port 587, username là Gmail, password là App Password (cần bật xác minh hai bước); `AUTH_EMAIL_FROM` dùng địa chỉ gửi phù hợp.
- Mailpit local: localhost:1025, `MAIL_SMTP_AUTH=false`, `MAIL_STARTTLS=false`, `MAIL_SSL_ENABLED=false`; chỉ dùng development. Inbox local không gửi đến hộp thư thật.

Backend xác thực cấu hình link, thời hạn và sender khi khởi động; dùng TLS với kiểm tra hostname và timeout SMTP 5 giây. Sau khi cập nhật env cần khởi động lại backend. Gửi email diễn ra **sau commit**, qua executor có giới hạn; lỗi SMTP không log token/địa chỉ/nguyên văn lỗi nhà cung cấp. HTTP 202 là đã tiếp nhận yêu cầu, không đảm bảo email đã được chuyển đến inbox.

## API và dữ liệu

Các body là JSON; response có dữ liệu dùng envelope `ApiResponse` hiện có. `Accept-Language: vi` mặc định, hoặc `en`.

| API | Body | Thành công / hành vi |
| --- | --- | --- |
| `POST /api/v1/auth/register` | `{ "fullName": "An", "email": "name@example.com", "password": "..." }` | **202**, `data: { verificationRequired: true, resendAfterSeconds: 60 }`; không trả token đăng nhập. Email trùng 409. |
| `POST /api/v1/auth/resend-verification` | `{ "email": "name@example.com" }` | 202, `data: { resendAfterSeconds: 60 }`; cùng response cho email không tồn tại/đã xác thực/vô hiệu. |
| `POST /api/v1/auth/verify-email` | `{ "token": "<token trong link>" }` | 204, xác thực email; token chỉ dùng một lần. |
| `POST /api/v1/auth/forgot-password` | `{ "email": "name@example.com" }` | 202, `data: { resendAfterSeconds: 60 }`; không tiết lộ tài khoản tồn tại hay trả token. |
| `POST /api/v1/auth/reset-password` | `{ "token": "<token trong link>", "password": "..." }` | 204, đổi mật khẩu, xác nhận sở hữu email, thu hồi tất cả phiên; không tự đăng nhập. |
| `POST /api/v1/auth/login` | `{ "email": "...", "password": "..." }` | 200 và cặp token; credential sai 401, tài khoản vô hiệu hoặc chưa xác thực 403. |
| `POST /api/v1/auth/refresh` | `{ "refreshToken": "..." }` | Đổi refresh token một lần; token cũ không dùng lại được. |
| `POST /api/v1/auth/logout` | `{ "refreshToken": "..." }` | 204 kể cả token đã thu hồi; thu hồi phiên được cung cấp. |
| `GET /api/v1/users/me` | — | Yêu cầu access token; trả hồ sơ người đang đăng nhập. |

Cooldown mặc định 60 giây, có thể cấu hình; bảng dùng giá trị mặc định. Request trong cooldown vẫn trả 202 và không gửi email mới. Sau cooldown, gửi lại sẽ thay thế link cũ cùng mục đích. Chỉ POST xác nhận/đặt lại mật khẩu tiêu thụ token; mở link hoặc email scanner không tự xác thực tài khoản.

| Mã lỗi mới | HTTP | Ý nghĩa |
| --- | --- | --- |
| `AUTH_008` | 403 | Email chưa xác thực; mobile cung cấp luồng gửi lại. |
| `AUTH_009` | 400 | Link hết hạn, không hợp lệ, sai mục đích hoặc đã dùng; mobile cung cấp xin link mới. |
| `AUTH_010` | 503 | Chức năng gửi email chưa được bật. |

Action token ngẫu nhiên 32 byte, Base64 URL-safe 43 ký tự, DB chỉ lưu SHA-256. Token nằm trong **fragment** `#token=...` của URL, không nằm trong query, không lưu SecureStore/query cache và không chủ động truyền qua router params; web xóa fragment sau khi đọc. Expo Router có thể biểu diễn fragment trong navigation state: không log hoặc persist state chứa link auth. Link xác thực mặc định 24 giờ, đặt lại 30 phút. Mật khẩu mới 8–50 ký tự và tối đa 72 byte UTF-8 theo giới hạn BCrypt; đăng nhập chấp nhận mật khẩu ngắn của tài khoản cũ.

## Migration và phiên đăng nhập

- **V6** tạo `auth_refresh_tokens`, chỉ lưu hash refresh token; vô hiệu các tài khoản demo V3 còn mật khẩu mặc định. Không sửa checksum migration cũ.
- **V7** thêm `email_verified_at`, `session_version`, bảng `auth_action_tokens` có FK/index/ràng buộc mục đích. **User có trước migration được giữ quyền đăng nhập bằng cách đánh dấu đã xác thực**; đây là chính sách chuyển đổi để giữ tương thích, không phải chứng cứ họ đã mở email. User đăng ký mới bắt buộc xác thực.
- Đặt lại mật khẩu tăng `session_version`, xóa toàn bộ refresh/action token của user. Access/refresh JWT chứa version; protected request đối chiếu trạng thái user/version với DB để từ chối token cũ từ request tiếp theo. Một request đã được xác thực trước khi reset commit có thể hoàn thành. Login/refresh/reset cùng khóa dòng user để không phát hành phiên sống sót qua reset đồng thời.
- Reset bằng link cũng xác thực email của đăng ký dở dang, giúp chủ hộp thư khôi phục tài khoản; mọi link xác thực cũ bị thu hồi.
- Token đăng nhập có `expiresIn` theo **mili giây**, access TTL 30 phút, refresh TTL 7 ngày. Token của phiên trước MVP cần đăng nhập lại nếu thiếu loại/ID; token MVP thiếu version được coi là version 0 cho đến lần reset đầu.
- Mobile giữ access token trong memory; refresh token ở SecureStore trên Android/iOS. Web chỉ dùng memory và cần đăng nhập lại sau reload. Axios gộp refresh đồng thời; lỗi mạng restore giữ credential để thử lại. Reset thành công xóa phiên/cache mobile; lỗi xóa SecureStore được hiển thị để khôi phục.
- Route magic link mở được cả khi đang đăng nhập hoặc đang restore; cold/warm link được xử lý, link mới tạo form/trạng thái mới. Safe area, keyboard, loading, validation và thông báo accessibility dùng component/theme hiện có.

## Kiểm chứng

- `npm run lint`: pass, không warning.
- TypeScript `tsc --noEmit`: pass.
- `npm test`: **24 test pass** (contract, phiên/race/lưu trữ/mạng, magic link cả URL implementation của Expo native, validation reset).
- Backend: **102 test pass**, gồm **23 integration test trên PostgreSQL 17 thật** trong database riêng, Flyway + MockMvc + BCrypt + JWT; SMTP sender mock nên không gửi email ra ngoài. Có test link một lần/hết hạn/sai mục đích, rollback không gửi email, cooldown, verify/reset/resend đồng thời, reset với login/refresh đồng thời, thu hồi phiên mọi thiết bị, response không tiết lộ tài khoản.
- Lệnh backend: `mvnw.cmd -Dtest=AuthServiceTest,EmailActionServiceTest,SmtpAuthEmailSenderTest,AuthControllerTest,JwtUtilsTest,JwtAuthenticationFilterTest,UserControllerTest,UserServiceTest,AuthIntegrationTest,EmailAuthIntegrationTest test`. Integration mặc định PostgreSQL Testcontainers; khi Docker không hoạt động, có thể dùng `-Dtest.database.external=true` và `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` trỏ vào **database test riêng**; Flyway/test ghi dữ liệu.
- `expo export --platform web --max-workers 1`: pass, gồm `/verify-email`, `/forgot-password`, `/reset-password`; dùng `NODE_OPTIONS=--max-old-space-size=512` trên máy thiếu bộ nhớ.
- Expo SDK 57: không thêm dependency hoặc đổi native config mobile trong phần email. Lần expo-doctor trước đạt 20/21, còn 6 patch dependency có sẵn; chưa cập nhật chúng.
- Chưa kiểm chứng gửi SMTP thật (chưa có credential/domain), hoặc thao tác giao diện/deep link trên thiết bị Android/iOS. Static export và test parser không thay thế thử nghiệm trên thiết bị.

## Những phần cần bổ sung trước khi public

1. Rate limit theo IP/tài khoản tại gateway/server cho auth và email. Cooldown chỉ giới hạn gửi lại theo tài khoản, chưa đủ chống spam phân tán. TODO tại controller.
2. Outbox bền vững với payload được bảo vệ và worker retry: executor hiện tại không đảm bảo gửi email khi server restart/SMTP lỗi/queue đầy. MVP cho phép xin link mới sau cooldown; lỗi sender được ghi log an toàn. TODO tại listener.
3. Logout thường chỉ thu hồi refresh token của phiên đó; access token còn hiệu lực tối đa 30 phút. Reset mật khẩu đã thu hồi toàn bộ qua version. Google Sign-In dùng cùng cơ chế phiên; xem [google-auth.md](./google-auth.md).
4. Refresh rotation có thể yêu cầu đăng nhập lại nếu server rotate nhưng mạng đứt trước khi nhận response; không tự retry mutation auth.
5. Dọn token hết hạn định kỳ khi dữ liệu tăng. Không thêm Redis/Kafka cho MVP.
# Đồng bộ API hiện tại

Contract Trip/Memory, cập nhật hồ sơ và cách kiểm tra response backend thật được ghi trong [api-contract-integration.md](api-contract-integration.md).
