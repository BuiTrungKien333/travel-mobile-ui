# Review Phase 1 — Auth, session và hồ sơ

Ngày: **03/11/2026**. Phạm vi: backend hiện tại `fix/rag-ai-v2` và mobile `feat/ui/memory`. Không merge `integration/team-sync`, không sửa planning/AI, không triển khai Phase 2.

## Kết luận

Các luồng đã nối có contract khớp và đạt kiểm tra tự động: đăng ký chờ email, xác nhận POST, login, refresh một lần, logout, reset vô hiệu phiên, Google login/link, GET hồ sơ, route guards và cache. Đã tìm và sửa một lỗi cache khi đổi tài khoản bằng Google email link.

**Đạt mức code và test tích hợp nội bộ; chưa nghiệm thu trọn Phase 1 trên môi trường thực hoặc production.** Chưa thử SMTP/inbox thật, Google popup/Credential Manager thật, Android cold/warm links hoặc browser UI. Các ràng buộc cần xử lý/kiểm chứng bên dưới vẫn còn mở.

## Kết quả theo mức độ tác động

### P1 · Cần rate limit trước khi public

- `AuthController`, `EmailActionController`, `GoogleAuthController` có TODO rate limit. Không tìm thấy cơ chế throttle trong auth/security hiện tại; không kiểm chứng cấu hình gateway bên ngoài repository.
- Cooldown gửi lại theo user chỉ hạn chế một phần email spam; không bao phủ password guessing, nhiều email mới hoặc challenge liên tục. Cần giới hạn endpoint nhạy cảm theo IP/account ở tầng triển khai phù hợp, response 429 và kiểm thử UI.
- Không tự thêm Redis, queue hay limiter trong memory vào lượt review này: cần khớp mô hình triển khai và trusted proxy, tránh đưa một cơ chế giới hạn thiếu hiệu lực vào production.
- Cơ sở: [OWASP — Login Throttling](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#login-throttling). Đây là điều kiện trước public, không phải lỗi contract frontend/backend đã tái hiện.

### P2 · Cache còn lại khi chuyển tài khoản qua Google link — đã sửa

- `GoogleLinkScreen` mở được khi đã đăng nhập. Xác nhận link tài khoản B gọi `SessionManager.authenticate()` khi A vẫn đang là phiên hiện tại.
- Trước sửa: `accept()` cập nhật token/profile nhưng không gọi xóa query cache; chỉ logout/expire có xóa. Test dùng QueryClient thật tái hiện query private của A vẫn tồn tại sau khi chấp nhận B.
- Sửa: SessionManager theo dõi ID đang được chấp nhận; khi ID đổi, xóa cache trước khi phát profile mới. Expire xóa ID. Refresh cùng account không xóa cache, không làm app tải lại các query không cần thiết.
- Không khẳng định đã có màn hình lộ dữ liệu: nhiều query Trip đã có owner trong key. Lỗi xác nhận được là không bảo đảm chính sách xóa cache khi đổi tài khoản theo mọi đường đi.
- Regression: warm account switch xóa cache; refresh cùng user giữ cache. Không thêm API/DB call, dependency hay persistence mới.

### P2 · Link email dev cần khớp nền tảng đang thử

- Chỉ kiểm tra trạng thái cấu hình, không in secret. `.env` backend có email/Google enabled và các credential chính có giá trị; hai biến `AUTH_VERIFY_EMAIL_URL`, `AUTH_RESET_PASSWORD_URL` chưa được đặt.
- `application-dev.yaml` mặc định các link verify/reset/Google link thành scheme `travelplannermobileui://...`. Điều này phù hợp development build đã cài app; không tự đưa người dùng trở lại trang web localhost.
- Để nghiệm thu web, cấu hình ba URL theo origin/port web đang chạy, ví dụ `http://localhost:8081/verify-email`, `/reset-password`, `/google-link`; restart backend. Để nghiệm thu native, dùng scheme hiện có hoặc HTTPS App Links đã cấu hình. Không đổi env cá nhân trong review.
- CORS dev mặc định cho localhost:8081 đã có test preflight Authorization/Accept-Language đạt. Origin khác phải cấu hình riêng. Không xác nhận inbox delivery hoặc việc app thực sự mở link chỉ từ việc env tồn tại.

### Phần chưa nối và các đánh đổi đang có

- **Hồ sơ:** GET `/users/me` đã nối vào Cá nhân. Backend có PUT `/users/me` cho fullName/avatarUrl; mobile chưa có form/hook cập nhật. Không coi Profile CRUD đã hoàn tất. Chưa sửa field email/role/password qua endpoint này.
- **Web session:** refresh token chỉ ở memory; reload toàn trang cần đăng nhập lại. Android dùng SecureStore. Đây là chính sách hiện tại, không sửa sang localStorage trong review.
- **Logout server:** thu hồi refresh token; access JWT đã cấp còn hiệu lực đến hết TTL (mặc định 30 phút). Reset/deactivate có kiểm tra sessionVersion/trạng thái DB để loại token cũ. Chưa có thu hồi tức thời theo từng access session; không âm thầm chuyển sang logout toàn bộ thiết bị.
- **Email delivery:** gửi sau commit bằng executor có giới hạn, không có durable outbox. SMTP lỗi/restart có thể mất email; UI cho yêu cầu lại. HTTP 202 là tiếp nhận, không chứng minh gửi thành công. Chưa thêm outbox khi chưa có nhu cầu vận hành được xác nhận.
- **Google auto-link:** giữ tự động liên kết tài khoản mật khẩu khi Google là nguồn xác minh email phù hợp; email bên thứ ba cần proof bổ sung. Khớp hướng dẫn [Google backend authentication](https://developers.google.com/identity/sign-in/android/backend-auth). Không yêu cầu nhập lại mật khẩu trong nhánh auto-link đủ điều kiện.

## Ma trận kiểm chứng

| Luồng | Backend | Mobile | Giới hạn thực tế |
| --- | --- | --- | --- |
| Register / verify / resend | PostgreSQL + Flyway, mail event sau commit, POST single-use, TTL/purpose/cooldown/concurrency | RHF/Zod, chờ email, resend, đổi email, lỗi VI/EN | SMTP sender mock ở integration; chưa inbox/native link thật |
| Login / profile | BCrypt/JWT/security chain thật; lỗi credentials, inactive, chưa verified, response và CORS | API schema, shared Axios, profile loading/error/retry, guards | Chưa điều khiển browser/Android UI với tài khoản thật |
| Restore / refresh | Rotate/consume một lần, race reset/login/refresh, refresh/access token type | SecureStore adapter, SessionManager; real Axios interceptors + Auth API, nhiều 401 chỉ refresh một lần, giới hạn retry | HTTP adapter trong test mobile giả lập server; chưa HTTP e2e mobile → backend thật |
| Logout / account isolation | Refresh bị revoke | Xóa credential/cache, late responses không restore phiên; account switch đã sửa | Access token TTL như mô tả trên |
| Forgot / reset | Response không tiết lộ user, token hash/TTL/single-use, revoke mọi session, race tests | Link/form/password confirmation, error và session expire | Chưa nhận email/reset trên thiết bị thật |
| Google | JWT ký RSA thật kiểm issuer/audience/expiry/nonce; auto-link/link/races qua integration | DTO, session outcomes, native SDK guard, web GIS callback/config | Google verifier mock trong integration nghiệp vụ; chưa popup/GMS/OAuth project/SHA thực |
| Edit profile | Backend endpoint/service tests hiện có | Chưa tích hợp UI/API update | Không tự mở rộng thành tính năng mới trong review |

## Kiểm tra đã chạy

- Backend `./mvnw.cmd test`: **337 passed, 0 failures/errors/skipped**; **131 tests** thuộc Auth/User/Security. PostgreSQL 17 Testcontainers, Flyway và Spring Security thật. Không ghi vào DB cá nhân, không gửi email thật hoặc gọi Google live.
- Mobile `npm test`: **194 passed**. Bổ sung 2 case cache/session và 6 case shared Axios/Auth API; chỉ thay HTTP boundary bằng adapter, không thay logic interceptors/session đang kiểm tra.
- TypeScript `--noEmit --noUnusedLocals --noUnusedParameters`: đạt.
- Export web và Android/Hermes: đạt. Sau khi thu gọn diff định dạng test, chạy lại 21 tests session/transport: đạt.
- Không lint theo yêu cầu hiện tại. Không thêm dependency/native config; không chạy lại Expo Doctor. Không sửa code/config backend; không commit/push trong lượt review.

## Điều kiện chốt Phase 1

1. Dùng tài khoản thử nghiệm được phép: register → inbox → verify → login → profile → restart native → refresh → logout; reset rồi kiểm tra mật khẩu/token cũ không còn dùng được.
2. Google thật trên web và Android: account mới/cũ có mật khẩu, hủy popup, sai/mất cấu hình, đổi tài khoản, fallback email bên thứ ba.
3. Kiểm tra link khi app tắt/đang mở và browser cùng origin; xác nhận URL gửi mail khớp nền tảng.
4. Chốt PUT hồ sơ có thuộc scope bắt buộc trước Phase 2 hay để UI Profile CRUD sau; hiện GET và account settings đã nối.
5. Trước public: rate limit được triển khai và kiểm thử, HTTPS/link domain/OAuth restrictions được nghiệm thu; quyết định rõ logout access-token TTL và chính sách email delivery.

Trong lượt này chỉ review/sửa Phase 1. Không đánh dấu phase production-complete và chưa chuyển Phase 2.
