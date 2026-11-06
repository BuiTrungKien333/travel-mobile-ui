# Kế hoạch nghiệm thu theo màn hình sau merge

> Mới nhất · 07/11/2026: người dùng ưu tiên nối Home trước QA-5. Đã hoàn tất triển khai lựa chọn server toàn tài khoản + tái sử dụng UI Home; đang chờ người dùng kiểm tra [batch Home](HOME-DASHBOARD-INTEGRATION.md#batch-kiểm-tra-ui). Backend 433/433, mobile 304/304 và TS/diff đạt. QA-4 catalog nội bộ đã được người dùng test xong; QA-5 itinerary và QA-6 Camera/Memory vẫn chưa nghiệm thu. Không dùng dữ liệu fixture để thay phần tích hợp còn thiếu.

> Phản hồi mới: người dùng đã test xong QA-4 gợi ý/tìm/thêm địa điểm nội bộ và yêu cầu bước tiếp theo. Ghi nhận hoàn tất vòng test UI trong phạm vi này; chưa mở rộng nghiệm thu sang Mapbox live, địa chỉ ngoài catalog hoặc độ chính xác tọa độ. Bước đề xuất tiếp theo: QA-5A lịch trình thủ công từng ngày (Chờ xếp lịch → chọn ngày → giờ/thời lượng/ghi chú → đổi thứ tự/gỡ khỏi ngày → lưu và mở lại). Giữ thiết kế timeline hiện có; tối ưu/AI và Mapbox SDK xử lý sau theo phạm vi đã thống nhất.

> Trạng thái mới nhất 06/11/2026: người dùng chuyển sang QA-4, đổi Maps sang Mapbox, chọn catalog nội bộ + cấu hình trước. Xem [QA4-PLACES-MAPBOX.md](QA4-PLACES-MAPBOX.md) cho API/body mẫu và batch test UI. Chưa nghiệm thu toàn bộ QA-4, chưa tích hợp SDK hoặc lưu provider preview. Các mốc “chưa sang QA-4” bên dưới giữ làm lịch sử.

Ngày khởi tạo: 06/11/2026. Đây là kế hoạch QA/nghiệm thu, không thay thế roadmap tích hợp hoặc là kết luận production-ready.

## Mốc đối chiếu

Nhãn chuẩn bị mới theo yêu cầu: còn >7 ngày là Đang lên kế hoạch; 1–7 ngày là Sắp khởi hành, cùng API mode PLANNING. UI badge/header dùng cùng helper với ngày backend; quy tắc LIVE/RECAP/CANCELLED giữ nguyên. Mobile294/294 + TS/diff đạt. Khi test UI, tạo hai chuyến còn7 và8 ngày để đối chiếu; API filter PLANNING vẫn bao gồm cả hai, không có enum UPCOMING mới.

**QA-4 mới nhất:** catalog INTERNAL/create/batch/chi tiết đã nối; backend 421/421, mobile 290/290 + latest affected 41/41, TS/diff đạt. Dev 18081 V15 giữ dữ liệu, health/CORS/401 đạt. Người dùng chọn cấu hình Mapbox trước, chưa thêm SDK; chờ checklist UI trong [QA4-PLACES-MAPBOX.md](QA4-PLACES-MAPBOX.md). Không coi provider mock là nghiệm thu live hoặc hoàn thành toàn bộ Places.

- Mobile: `E:/travel-mobile-ui`, `connect/backend/home`; mốc khảo sát ban đầu e2408ce, mốc QA-3 hiện tại `3a515be` sau commit được cập nhật trong phiên làm việc.
- Backend: `E:/travel-system/backend`, `fix/rag-ai-v2`; mốc sau merge `8fc64b7`, mốc QA-3 hiện tại `afbfa5c`.
- Cấu hình dev quan sát: frontend API `http://localhost:18081`; backend `.env` có `SERVER_PORT=18081`. Không mặc định dùng port 18080 từ lịch sử chat. Không thay env cá nhân trong lượt lập kế hoạch.
- Android là nền tảng nghiệm thu chính; web dùng kiểm tra nhanh và đối chiếu. Safe area, bàn phím, gesture, native modules và hiệu năng phải có bằng chứng Android riêng.
- Không xét RBAC nghiệp vụ actor ở giai đoạn này. Vẫn kiểm tra authentication và ownership/isolation dữ liệu giữa hai tài khoản.
- Giữ giao diện Ocean Teal/Glass hiện hành, Roboto, input 14, VI mặc định/EN. Không refactor toàn feature chỉ để chỉnh phong cách code.

## Vòng lặp cho mỗi luồng

1. **Đọc source hiện tại**: route/screen/component/form/store/query → Axios request/schema → controller/validation/authentication → service/transaction/repository → migration/constraint. So khớp method/path, request/response, UUID, version, ngày giờ và HTTP/error code.
2. **Chuẩn bị dữ liệu có kiểm soát**: user thử nghiệm A/B và các trạng thái cần thiết; ghi mốc DB trước test, không chỉnh/xóa dữ liệu sẵn có để ép kết quả đúng. API/query không lấy fixture khi ở chế độ thật.
3. **Sửa lỗi có tác động**: ưu tiên crash, sai dữ liệu, ownership, mất dữ liệu, API không gọi được; tiếp theo loading/error/retry, cache và hiệu năng có bằng chứng. Thay đổi ít nhất đủ sửa nguyên nhân. Ghi việc hoãn và lý do.
4. **Kiểm chứng tự động**: test phù hợp trên môi trường test cô lập, không dùng DB dev làm DB cho test tự động. Unit/contract + HTTP/service; PostgreSQL/Flyway thật cho transaction/constraint/query. Regression cho bug đã tìm; TS/build cho code liên quan. Không dùng số test cũ làm bằng chứng bản mới.
5. **Người dùng test UI**: gửi một batch khoảng 5–10 case có ID, dữ liệu đầu vào, thao tác, kết quả UI/HTTP/DB mong đợi. Nhận ảnh/video/log đã che credential, sửa rồi test lại case lỗi và luồng gần nó.
6. **Chốt và chuyển**: cập nhật Passed/Failed/Blocked/Not tested, commit/nguồn bằng chứng và rủi ro còn lại. Chỉ chuyển khi người dùng xác nhận luồng chính và không còn lỗi nghiêm trọng; không tự tuyên bố production-ready chỉ vì unit tests đạt.

## Các phase

| Phase | Màn hình/luồng | Nội dung phải kiểm tra | Bằng chứng dữ liệu/API |
| --- | --- | --- | --- |
| QA-0 | Môi trường sau merge | Một runtime đúng commit; FE/BE port/CORS; profile/env; Flyway/constraint; API còn thiếu; phân biệt fixture với dữ liệu thật | Startup/health, schema history, API contracts, bộ test baseline trên DB riêng |
| QA-1A | Login | Validation, ẩn/hiện mật khẩu, bàn phím, pending/chặn gửi lặp, thông báo lỗi, verified/disabled, điều hướng | POST auth/login → profile, user đúng, refresh-token hash mới khi thành công; không cấp token khi thất bại |
| QA-1B | Register và verify email | Email trùng, Unicode/BCrypt limits, chờ email, resend/cooldown, link sai/hết hạn/đã dùng; web và native mở link | User chưa verified, token hành động có hash/TTL/purpose; verify đúng một lần; không login trước verify |
| QA-1C | Quên/reset mật khẩu | Email tồn tại/không tồn tại, UX đồng nhất, nhập lại password, token hết hạn/đã dùng; lỗi gửi mail | Password hash đổi sau reset; mật khẩu cũ và refresh token cũ không còn dùng được; rollback khi lỗi |
| QA-1D | Google | Web popup/Android SDK, cancel, cấu hình thiếu, tài khoản mới/cũ có password, link/đổi account | ID token do backend xác minh; chính sách link đúng; profile/ownership/cache không lẫn tài khoản |
| QA-1E | Session/logout | Android cold/warm start, access hết hạn, refresh đồng thời, logout khi mất mạng, logout rồi Back, đổi account | Rotation một lần; old refresh token không replay; cache và SecureStore đúng; phân biệt chính sách web memory |
| QA-2 | Home bốn trạng thái | Mới/sắp đi/đang đi/đã đi; chọn chuyến theo ngày/timezone; zero/error/loading; CTA và cập nhật sau CRUD | Query thật chọn đúng dữ liệu/owner, không render fixture làm dữ liệu người dùng; liên thông list/detail/memory |
| QA-3 | List/tạo/sửa/xóa Trip | Pagination/filter/search; Province; date range; submit lặp; PATCH/version/date preview; confirm/undo nếu hỗ trợ | Trip/days/places đúng sau refresh; idempotency; stale version 409; không orphan/cascade ngoài nghiệp vụ |
| QA-4 | Search/thêm/chi tiết Place | Gõ địa chỉ cụ thể/địa điểm; debounce/cancel; zero/error; bản đồ/confirm tọa độ; custom name; đã có không gợi ý lại | Place.id vs provider ID vs TripPlace.id; đúng trip/day/owner; không lưu nhầm provider preview hoặc dữ liệu chưa xác nhận |
| QA-5 | Lịch trình từng ngày/Live/Recap | Điểm xuất phát/giờ/duration/return/transport; reorder/swipe delete; optimize preview/apply; đã ghé/chỉ đường; trạng thái theo ngày | ItineraryItem ID/Place ID nhất quán, version/concurrency, time zone, pin/duration/notes không rơi; API thiếu ghi Blocked |
| QA-6 | Camera/Kỷ niệm | Permission, chụp/flip/zoom/gallery, lưu local, gắn trip/day/place, upload lỗi/retry, album/detail/zoom/share/download/xóa | Metadata + media + file/object storage khớp; không duplicate upload; mất mạng không mất ảnh; ảnh riêng tư và account isolation |
| QA-7 | Cá nhân/cài đặt | Load/sửa tên/avatar, validation, lưu lỗi, VI/EN, logout và các link | PUT/GET profile nhất quán sau mở lại; không sửa email/role ngoài contract; query/session không giữ profile account cũ |
| QA-8 | Hồi quy và trước public | Luồng xuyên màn hình, mạng chậm/mất kết nối/5xx, app background/foreground, text scaling/thiết bị nhỏ, hiệu năng release | Regression/e2e; prod env/HTTPS/OAuth/email/storage, rate limit và quyền truy cập; không seed demo ở production; QA thiết bị |

Phase tích hợp 1–9 trong roadmap và QA-* là hai hệ đánh số khác nhau. Module import code chưa đồng nghĩa API đã tồn tại hoặc đã được nghiệm thu.

## Thang đánh giá

- **Chặn nghiệm thu**: không khởi động/không gọi API, crash, sai owner, mất/sai dữ liệu, cấp phiên sai, persistence không đúng.
- **Cần sửa trong phase**: pending/error/retry/cache sai, thao tác khó dùng, trùng request có hậu quả, bố cục làm mất nút chính hoặc che nội dung.
- **Có thể hoãn có ghi nhận**: tiểu tiết thẩm mỹ, đổi tên nội bộ hoặc tối ưu chưa có bằng chứng; không bỏ qua privacy/data integrity.
- Theo từng luồng ghi riêng: Source reviewed / Automated verified / UI user verified / HTTP+DB verified / Production conditions. Không gộp các trạng thái thành một chữ Done.

## Phát hiện preflight hiện tại: migration trùng version

Cùng thư mục `backend/src/main/resources/db/migration` hiện có:

| Version | Nhánh schema/auth/Trip hiện hành | File đi vào sau các merge |
| --- | --- | --- |
| V9 | V9__google_authentication.sql | V9__place_retrieval_profiles.sql |
| V10 | V10__trip_metadata_and_days.sql | V10__trip_details_and_place_category.sql |
| V11 | V11__retain_removed_trip_schedule.sql | V11__seed_local_demo.sql |

`application-dev.yaml` và `application-test.yaml` đều bật Flyway đọc thư mục trên. Đây là xung đột source cần xử lý ở QA-0; chưa chạy bản backend mới để tái hiện startup trong lượt này. Hai migration V10 có thể thay cùng schema, vì vậy chỉ đổi số version chưa chứng minh hợp lệ.

Trước khi sửa phải đối chiếu history thực tế, checksum và schema hiện có. Không chạy `flyway repair`, xóa history, sửa migration đã áp dụng hoặc reset DB để vượt qua lỗi. Dùng truy vấn chỉ đọc sau trên đúng DB dev để đối chiếu; không lấy row user/token:

```sql
SELECT installed_rank, version, description, script, checksum, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

Sau đó chốt migration canonical, giữ file đã áp dụng bất biến và thiết kế migration kế tiếp phù hợp cả DB mới lẫn DB có dữ liệu. Tách demo seed khỏi đường chạy production theo lịch sử đã áp dụng, không xóa/đổi seed đang có trong DB. Kiểm thử trên DB test riêng và kiểm tra lại baseline trước khi test Login.

### Đối chiếu database dev · 06/11/2026

Đã chạy truy vấn metadata trong transaction `BEGIN READ ONLY ... ROLLBACK` trên container `travel-postgres`, database `travel_db`; không đọc user/password/token và không thay đổi dữ liệu.

- History có V1–V11 và hai repeatable RAG, tất cả success.
- **13/13 script và checksum khớp commit `90afbb0`**, là parent thứ nhất của merge backend `8fc64b7`.
- Source HEAD chỉ khớp 8/13 do thiếu các tên file lịch sử V4–V8 sau merge; không chỉ có duplicate V9/V10/V11.
- V4 lịch sử: `add_place_context_fields`; V5: `add_weekly_opening_hours_to_places`; V6: `auth_refresh_tokens`; V7: `email_verification_and_password_reset`; V8: `google_authentication`. Giữ nguyên các file đúng checksum từ `90afbb0` khi thực hiện sửa.
- Schema dev có Trip CRUD/day metadata, removed_at và retrieval profiles; chưa có các cột transportation/budget/description/cover_image/category, arrival_at/duration_minutes mới của nhánh nhập.
- Migration Memory V4 mới nhập chứa cả quyền/index và dữ liệu mẫu; V11 seed_local_demo cũng nằm trong location mặc định. Khi sửa cần tách schema/quyền/index cần thiết khỏi seed demo; không tự đổ fixtures vào DB hiện có hoặc production.

**Bước thực hiện tiếp theo:** khôi phục file lịch sử đúng checksum, đưa thay đổi chưa áp dụng vào version mới không trùng, chuyển seed mẫu thành thao tác dev opt-in; kiểm tra schema sạch và đường nâng cấp trên DB test riêng trước khi cho backend dev chạy migration. Chưa sửa source migration hoặc áp dụng DDL vào dev ở lượt đối chiếu này.

### QA-0 đã thực hiện · 06/11/2026

- Đã khôi phục lịch sử canonical và đưa schema mới vào V12–V14; seed 50 user/chuyến/album và bộ Memory ví dụ chuyển sang chạy dev chủ động. RAG repeatables cũ giữ nguyên.
- Đã sửa duplicate enum chặn compile; owner predicate cho memory count/soft-delete; cập nhật tests Trip dùng đúng contract hiện tại và fixture ownership Memory. Không đổi kiến trúc/skin UI hoặc phục hồi CRUD legacy.
- Thiếu Cloudinary không còn chặn toàn backend: cấu hình media tùy chọn, upload chưa cấu hình trả 503/UPLOAD_006. Chưa setup media provider thật hoặc nghiệm thu Phase Media.
- Testcontainers dùng PostgreSQL riêng. Báo cáo cuối **403 tests xanh** qua full-suite + rerun các class ảnh hưởng, 0 failures/errors/skips. Không gán đây là nghiệm thu UI/production.
- Dev đã lên V14, 16 migrations validated; giữ nguyên 13 history rows và fingerprint 9 bảng nghiệp vụ trước/sau (4 user, 8 place, chưa có trip/media), không reset/repair.
- Backend mới đang chạy `http://localhost:18081`; health DB 200/CONNECTED, CORS web8082 cho login và protected profile đạt. Smoke anonymous profile 401/AUTH_001, dummy invalid login 401/AUTH_004; không dùng tài khoản thật để dò lỗi.
- Frontend Metro8082 đang chạy. Chưa test UI hoặc login hợp lệ; bước tiếp theo QA-1A, L01–L10. Chi tiết source/tests: `E:/travel-system/backend/docs/QA-0-MIGRATION-RECOVERY-2026-11-06.md`.

## QA-1A: bản đồ luồng Login đã đọc source

- `LoginScreen` → RHF/Zod `loginSchema` → `useLogin` → `SessionManager.authenticate` → Axios POST `/api/v1/auth/login`.
- Backend: `AuthController.login` → `AuthServiceImpl.login` → normalize email, lock user, BCrypt matches (dummy hash nếu không có user), kiểm tra deleted/verified → `AuthTokenIssuer` → lưu hash refresh token trong `auth_refresh_tokens`.
- Response là `ApiResponse<AuthResponse>`; mobile kiểm schema `accessToken`, `refreshToken`, `tokenType=Bearer`, `expiresIn` **milliseconds**, user. Không đưa token vào báo cáo/screenshot.
- Access token ở memory; Android lưu refresh token bằng SecureStore. Web chỉ giữ trong memory, nên reload toàn trang yêu cầu đăng nhập lại theo chính sách hiện tại. Đây là điểm sản phẩm cần ghi nhận, chưa đổi sang localStorage.
- Có source tests AuthController/AuthService/AuthIntegration, mobile auth-contract/session/transport/UI. Chưa chạy lại trên baseline backend sau merge; các số 337/281 trong báo cáo trước không phải kết quả QA mới.
- Source AuthController vẫn có TODO rate limit. Chưa kết luận có/không ở gateway bên ngoài repository; phải kiểm chứng và xử lý trước public. Không thêm Redis/limiter in-memory chỉ để đánh dấu hoàn thành.

### Batch thao tác Login sau khi QA-0 đạt

Dùng tài khoản thử nghiệm A đã verified và chưa có chuyến; tài khoản U chưa verified. Nếu chưa có A, thực hiện register/verify ở QA-1B để chuẩn bị, không dùng SQL đổi password/verified để giả lập luồng đã đạt.

| ID | Thao tác | Kết quả mong đợi |
| --- | --- | --- |
| L01 | Để trống cả hai ô, bấm Đăng nhập | Lỗi field rõ ràng; không gọi API và không chuyển màn hình |
| L02 | Email sai định dạng, password có dữ liệu | Báo lỗi email; không gọi API |
| L03 | Email A + sai password, rồi email không tồn tại + một password sai | Hai lần đều 401/AUTH_004, thông báo credentials chung; không vào app, không cấp refresh token mới |
| L04 | Email A đúng, có viết hoa/khoảng trắng ngoài email | Trim/normalize email đúng; password giữ nguyên; 200, đúng profile và Home người mới |
| L05 | Trong lần login hợp lệ, bấm nhanh 2–3 lần | Loading/disable hợp lý; không phát sinh login/session trùng do UI và không nhảy màn nhiều lần; nếu lặp request thì xem log đã che token |
| L06 | A + password đúng, dùng icon mắt và phím Done của Android | Hiện/ẩn đúng, gửi được bằng Done, không bị keyboard/status bar che nút/lỗi |
| L07 | U chưa verified + password đúng | 403/AUTH_008, vẫn ở auth và có hành động xác thực; không cấp phiên |
| L08 | Mất mạng trước khi bấm login, rồi bật lại và thử lần nữa | Không treo loading, lỗi có thể hiểu, thử lại thành công; không tự replay login nền |
| L09 | Login A thành công, mở Cá nhân và danh sách chuyến | GET profile đúng A; list rỗng thật, không hiện fixture; không tạo thêm users/trips khi chỉ login |
| L10 | Đổi VI/EN, thử một lỗi form và một lỗi credentials | Copy và thông báo lỗi đúng ngôn ngữ; không có key i18n thô hoặc lỗi layout |

Mất quyền truy cập/disabled sẽ test bằng user fixture có kiểm soát trong API/integration, không tự vô hiệu account người dùng đang dùng để thử UI. Restore/logout/refresh chuyên sâu chuyển QA-1E để batch Login không quá dài.

### Kiểm chứng dữ liệu cho Login

Trước/sau case, kiểm đúng UUID user thử nghiệm. Login thành công không tạo user/trip mới; chỉ phát hành phiên và ghi token hash với user_id/expires_at. Login thất bại không ghi phiên mới. GET profile và list Trip không được trả dữ liệu tài khoản B. Khi kiểm DB không SELECT token_hash/password_hash ra log; chỉ đọc ID/count, owner và thời điểm/TTL cần thiết.

## Mẫu phản hồi của người dùng

```text
Case: L04
Thiết bị: Pixel 7 / Android ... hoặc Web ...
Thao tác: ...
Kết quả thực tế: ...
Mong đợi: ...
Ảnh/video hoặc HTTP status + error code (không token/password): ...
```

## Nhật ký nghiệm thu

| Mốc | Phase | Source | Automated | UI | HTTP+DB | Việc tiếp theo |
| --- | --- | --- | --- | --- | --- | --- |
| 06/11/2026 | QA-0 | Đã sửa lịch sử/schema/config và các blocker sau merge | 403 tests xanh qua full-suite + reruns; DB sạch/upgrade đạt | Chưa nghiệm thu UI | Dev V14, health/CORS/401 đạt, dữ liệu cũ giữ nguyên | QA-1A Login L01–L10 |
| 06/11/2026 | QA-1A–E | Đã rà Auth/session/email/Google và sửa logout SecureStore lỗi; hoàn thiện typography Auth | Backend Auth/Security106/106; mobile Auth50/50 và các lượt UI refinement; TS đạt | Người dùng xác nhận hoạt động hoàn hảo, chốt nghiệm thu chức năng QA-1 | Dev 18081 smoke đạt; DB workflow qua Testcontainers. Không coi xác nhận chức năng là chứng minh rate-limit/load hoặc mọi điều kiện production | Chuyển QA-3 theo lựa chọn của người dùng, hoãn Home tổng hợp |
| 06/11/2026 | QA-2 | Phát hiện Home có chuyến hiện fallback danh sách; dashboard/GET home chưa tích hợp | Baseline connected-home/home-selection/trip-api15/15; backend lịch/Trip CRUD9/9 | Chưa nghiệm thu bốn dashboard API | Không suy Home từ trang đầu Trip hoặc dùng fixture | Người dùng chọn kiểm Trip CRUD trước, quay lại Home sau các phụ thuộc |
| 06/11/2026 | QA-3 | Rà list/create/read/PATCH/date preview/DELETE/destination; chặn double submit trước validation | Mobile41/41; backend29/29; TS/no-unused đạt | Chờ batch T01–T10 | Dev GET Trips/Destinations anonymous401 và PATCH CORS 8082 đạt; luồng hợp lệ/DB được test trên PostgreSQL riêng | Người dùng nghiệm thu list/tạo/sửa/xóa; chưa tự chuyển Places |

## QA-1 · Kết quả rà soát và kiểm chứng 06/11/2026

### Lỗi đã sửa

**P2 — Logout bỏ qua revoke server khi SecureStore không xóa được.** `SessionManager.logout()` trước đây dừng ngay nếu `expire()` lỗi lưu trữ. Refresh token trên server vì vậy vẫn dùng được dù người dùng vừa yêu cầu đăng xuất. Đã chuyển phần revoke vào `finally`; lỗi STORAGE vẫn được trả cho UI để yêu cầu phục hồi, không báo đăng xuất thành công giả. Khi revoke cũng lỗi mạng, lỗi STORAGE không bị che mất. Tăng assertion trong test cũ và thêm một regression; cả hai thất bại trước sửa và đạt sau sửa. Không thêm request ở luồng logout bình thường hoặc đổi policy backend.

### Bằng chứng

- **Backend: 106 tests đạt, 0 failures/errors/skips trong một lượt chạy** gồm 13 class Auth/Security; 33 tests integration Auth/Email/Google sử dụng PostgreSQL 17 Testcontainers và migrations thật. SMTP/Google boundary được mock; verifier Google có test RSA/issuer/audience/expiry/nonce riêng, không chứng minh OAuth thật đã chạy.
- Bao phủ đăng ký chưa cấp phiên, verify explicit POST/single-use/expiry/cooldown/concurrency/rollback; reset đúng purpose, đổi hash, thu hồi access + refresh mọi thiết bị, cạnh tranh với login/refresh; Google auto-link Gmail/Workspace, bảo vệ đăng ký chưa xác thực, email bên thứ ba cần xác nhận; refresh rotation/replay, protected profile và CORS.
- **Mobile: 49/49 tests** từ auth-contract/session/transport/UI, google-auth/config và magic-link. Bao phủ schema/UTF-8 bounds, cache khi đổi tài khoản, restore/offline/refresh đồng thời, response muộn sau logout, Axios thật trong harness, route/form recovery và parse magic link. Harness không thay thế UI/native runtime.
- `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` và `git diff --check` đạt; không chạy lint theo yêu cầu. Không thêm dependency hoặc đổi config native.
- Dev HTTP port18081: profile thiếu token →401/AUTH_001; login rỗng/email sai →400/COMMON_003; login tài khoản giả không tồn tại →401/AUTH_004; reset token sai format →400/COMMON_003; GET verify →405/COMMON_007. Google challenge →200, nonce đúng format, TTL300000ms. Không tạo user dev, không gửi email; chỉ tạo một challenge dev để kiểm cấu hình public.
- Log local không commit: backend `.git/qa-preflight/qa1-backend-tests.log`, `qa1-http-smoke.json`, `qa1-google-config-smoke.json`; mobile `.expo/qa1-auth-tests.log`, `.expo/qa1-types.log`. Không đưa token/credential thật vào tài liệu.

### Các việc còn mở, theo tác động

1. **P1 · Chặn public nếu chưa có rate limit ở hạ tầng.** Controller login/register/refresh/email/Google hiện chỉ có TODO, không có limiter trong source đã rà. Resend cooldown không bảo vệ brute-force password, spam nhiều địa chỉ hoặc endpoint challenge. Cần xác nhận gateway/deployment thực sự áp giới hạn và kiểm 429 trước phát hành. Chưa thêm Redis/limiter trong memory khi chưa chốt môi trường triển khai.
2. **P2 · Policy logout còn cửa sổ access token.** Backend logout chỉ revoke refresh token được gửi, access token còn sống đến TTL; reset password dùng sessionVersion và revoke tất cả. Đây là behavior có tài liệu, không phải logout API bị lỗi. Nếu sản phẩm cần logout vô hiệu access ngay theo thiết bị, cần chốt thiết kế phiên trước public. Không giả định profile phải 401 ngay sau logout trong Postman.
3. **P2 · Mail sau commit chưa có lưu bền/retry.** Queue giới hạn 100, 2 worker tránh chiếm request thread, lỗi không làm rollback tài khoản. Restart/SMTP lỗi/queue đầy có thể mất email; 202 chỉ xác nhận tiếp nhận yêu cầu. MVP có resend sau cooldown; production cần theo dõi lỗi và chốt mức bảo đảm gửi, chỉ thêm outbox khi yêu cầu thực tế cần.
4. **P2 · Điều khoản và Quyền riêng tư trên Register chưa mở được nội dung.** Hai đoạn chữ màu primary chưa có onPress/destination. Cần trang/URL chính thức trước phát hành; chưa tự tạo nội dung pháp lý hoặc URL giả.

Về hiệu năng: đã có single-flight refresh, retry giới hạn, projection AuthState theo user PK và index token hash/expiry; kiểm trạng thái DB ở protected request phục vụ thu hồi phiên. Không có bằng chứng để bỏ check DB, thêm cache/Redis hay giảm BCrypt. **Chưa benchmark tải cao/độ trễ P95**, không khẳng định hiệu năng production chỉ dựa trên tests.

### API để test trực tiếp bằng Postman

Base URL dev đang chạy: `http://localhost:18081`. Postman dùng Body → raw → JSON; header `Content-Type: application/json`, `Accept-Language: vi` (hoặc en). Các endpoint auth dưới đây dùng No Auth. Chỉ GET/PUT profile thêm `Authorization: Bearer <accessToken>`.

Ví dụ email `qa1@example.com` và password bên dưới chỉ là dữ liệu mẫu; **thay email bằng inbox thử nghiệm của bạn** trước register/forgot/resend. Không export credential thật hoặc gửi token lên chat.

| Method | Path (nối với base URL) | Body mẫu | Kỳ vọng |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | `{"fullName":"QA Một","email":"qa1@example.com","password":"QaOnly#2026"}` | 202, data.verificationRequired=true; chưa có access/refresh |
| POST | `/api/v1/auth/resend-verification` | `{"email":"qa1@example.com"}` | 202, data.resendAfterSeconds; cooldown không gửi thêm |
| POST | `/api/v1/auth/verify-email` | `{"token":"<verification_token>"}` | 204, không body; dùng lại token →400/AUTH_009 |
| POST | `/api/v1/auth/login` | `{"email":"qa1@example.com","password":"QaOnly#2026"}` | 200 khi verified; chưa verified →403/AUTH_008 |
| GET | `/api/v1/users/me` | Không body; Bearer access token | 200, data profile đúng tài khoản |
| PUT | `/api/v1/users/me` | `{"fullName":"QA Một cập nhật","avatarUrl":null}`; Bearer access token | 200; GET lại xác nhận tên (tùy chọn, chi tiết ở QA-7) |
| POST | `/api/v1/auth/refresh` | `{"refreshToken":"<refresh_token>"}` | 200, cặp token mới; token cũ replay →401/AUTH_005 |
| POST | `/api/v1/auth/logout` | `{"refreshToken":"<refresh_token_mới_nhất>"}` | 204; refresh token đó không dùng lại được |
| POST | `/api/v1/auth/forgot-password` | `{"email":"qa1@example.com"}` | 202, cùng payload cho email không tồn tại |
| POST | `/api/v1/auth/reset-password` | `{"token":"<reset_token>","password":"QaOnlyNew#2026"}` | 204; password cũ + mọi phiên cũ bị thu hồi; không auto-login |
| POST | `/api/v1/auth/google/challenge` | `{}` | 200, data.challengeId/nonce/webClientId/expiresIn |
| POST | `/api/v1/auth/google` | `{"challengeId":"<challengeId>","idToken":"<Google_ID_token_cùng_nonce>"}` | 200 AUTHENTICATED hoặc202 VERIFICATION_REQUIRED |
| POST | `/api/v1/auth/google/verify-link` | `{"token":"<google_link_token>"}` | 200, session sau xác nhận email bên thứ ba |

Login/refresh/Google verify-link trả token tại `data.accessToken`, `data.refreshToken`; `expiresIn` là **milliseconds**. Google login 200 trả cặp token bên trong `data.auth`, không cùng nesting với login password. Luôn thay cặp token sau mỗi refresh.

Action token là phần sau `#token=` trong email, không phải toàn URL, không phải access/refresh JWT. Verify, reset và Google-link dùng ba token khác purpose. Nếu đã bấm xác nhận trên UI thành công thì token đã dùng; không dùng lại để test thành công Postman. Link web dev đang trỏ frontend8082; cần nghiệm thu native deep link riêng, không đổi env web sang app scheme khi chưa chọn nền tảng test.

Google ID token phải do Google SDK/GIS cấp với **nonce của chính challenge**; Postman chỉ gọi challenge không thể tự tạo token hợp lệ. Không thay bằng access token của Google/application, không bỏ kiểm nonce để test. Google thật thử qua UI trước; nếu cần gọi Postman, tự lấy ID token trong môi trường debug của bạn, không chia sẻ lên chat. Challenge hết hạn/sử dụng rồi cần tạo challenge và token Google mới.

### Batch nghiệm thu thủ công tiếp theo

| ID | Thao tác | Kỳ vọng |
| --- | --- | --- |
| A01 | Register bằng inbox mới, thử login trước verify | 202 và màn chờ email; login403/AUTH_008; chưa vào app |
| A02 | Nhận email, mở link nhưng chưa xác nhận, rồi xác nhận; dùng lại link | Mở link không tự tiêu thụ; xác nhận một lần; replay báo link không hợp lệ |
| A03 | Login đúng/sai, email không tồn tại; thực hiện L01–L10 | Đúng profile; generic credentials khi sai; pending/keyboard/safe area/VI–EN đạt; account chưa có trip hiện Home mới |
| A04 | Đăng nhập hai thiết bị/phiên, forgot/reset, thử lại password và token cũ | 202 không lộ existence; reset204; password/access/refresh cũ thất bại; password mới login được |
| A05 | Android đóng/mở app, mất mạng khi mở, bật mạng/thử lại | SecureStore restore được; mạng lỗi cho retry, không tự xóa phiên do lỗi mạng; refresh không vòng lặp |
| A06 | Logout bình thường và mất mạng; Back; login account B | Cache không lẫn A/B; không vào workspace sau logout; offline có thông báo revoke server chưa thành công |
| A07 | Google mới/cũ cùng Gmail với tài khoản mật khẩu, cancel; email bên thứ ba nếu có | Gmail/Workspace auto-link không hỏi lại password; cancel không treo; email bên thứ ba phải xác nhận rồi mới cấp phiên |

**Trạng thái:** Source reviewed + automated verified; UI user verified, SMTP delivery, Google thật/Android runtime và kiểm tải cao **chưa được xác nhận**. Chưa kết luận toàn QA-1 hoàn thành hoặc production-ready. Người dùng gửi case ID, nền tảng, HTTP status/error code và ảnh đã che credential; xử lý lỗi trong QA-1 trước QA-2.

### UI Auth · Typography và khả năng đọc 06/11/2026

- Quy ước: `title`24/32 semibold, `subheading`18/26 semibold, `bodyLarge`16/24 regular; thông tin phụ/label/legal14/20, caption12/16, input14/20. Theo tinh chỉnh tiếp theo của người dùng: logo Auth144×48, chữ CTA Đăng nhập/Tạo tài khoản và link footer Đăng ký/Đăng nhập16/24. AppButton dùng `labelSize="large"` cho hai CTA này, default module khác vẫn14/20. Các kiểu chữ dùng font/size/lineHeight tokens có sẵn trong theme.
- Phạm vi: AuthScaffold, login/register/email request/verify/reset/Google confirmation, CheckEmail/GoogleFeedback, SessionGate và profile/editor. Default AppText `body`14 + legacy `heading`24 bold của module khác giữ nguyên. Google-rendered web button giữ font SDK; khung đồng bộ height52/radius10, không sửa nội dung iframe.
- Không giới hạn số dòng hoặc tắt font scaling trong Auth; form/screen vẫn cuộn, safe area/keyboard behavior giữ nguyên. Footer link tăng vùng chạm tối thiểu44, xuống dòng khi thiếu chỗ; subtitle/footer rỗng không chiếm gap thừa. Các thông báo hướng dẫn/success/error chính chuyển16 để dễ đọc; không đổi logic/API/credentials/session.
- Bộ Auth hiện50/50 tests đạt sau thay đổi. Chưa coi đây là bằng chứng layout font lớn trên thiết bị.
- Nghiệm thu bổ sung: mở login/register/reset và màn chờ email trên Pixel7, thiết bị rộng khoảng320–360 logical px, VI/EN, font hệ thống mặc định và phóng lớn khoảng1.5×. Kiểm title/địa chỉ email dài/footer không cắt chữ; cuộn tới được submit khi mở bàn phím; lỗi form/success đủ rõ; tên profile dài không đẩy nội dung ra khỏi card. Google thật cần so sánh khung nút trên web và Android riêng.

## Quyết định sau QA-1 · 06/11/2026

Người dùng đã xác nhận QA-1 hoạt động hoàn hảo. Chốt **nghiệm thu chức năng Auth**; các điều kiện public ghi ở trên vẫn tách riêng.

QA-2 source review cho thấy `ConnectedHomeScreen` chỉ dùng `NewUserHomeScreen` khi `totalElements=0`, có chuyến thì trả `ConnectedTripsScreen`. `HomeScreen`/`selectHome` đủ bốn trạng thái chỉ thuộc preview, không phải dashboard server-backed. `/home` và thống kê thuộc Phase8 tích hợp, phụ thuộc Places/Itinerary/Memory. Thống kê tỉnh/thành theo Memory gắn Place, không đếm mọi điểm đã thêm vào lịch làm “đã khám phá”. Không sửa bằng cách chọn từ 20 chuyến đầu hoặc chép API data vào preview store.

**Lựa chọn người dùng:** kiểm thử Trip CRUD đã tích hợp trước, rồi quay lại Home. Thứ tự hiện tại: QA-1 đã chốt → QA-3 Trip CRUD đang nghiệm thu → các module phụ thuộc → quay lại QA-2. Không đánh dấu QA-2 hoàn thành.

## QA-3 · Danh sách, tạo, sửa và xóa chuyến đi

### Kết quả source và sửa lỗi

- **P2 — Submit tạo chuyến có thể chạy đồng thời trước khi UI loading render.** Test component thực tế gọi hai onPress liên tiếp đã quan sát2 mutation calls. Backend clientRequestId đã chống trùng bản ghi nhưng frontend vẫn gửi dư request và có thể điều hướng lặp. Đã chặn ngay trước RHF async validation bằng ref, giải phóng trong finally, chặn đóng form khi đang submit. Giữ fingerprint/clientRequestId cho retry và logic API cũ. Regression xác nhận1 request/1 điều hướng; không thêm queue, dependency hoặc state server mới.
- **Đính chính về DELETE:** backend đã hỗ trợ idempotency: xóa lại cùng chuyến của chính chủ trả204 kể cả bản ghi đã soft-delete. Test `TripMutationIntegrationTest.deleteIsIdempotentAndSoftDeletesOnlyRelatedMemoriesWhileKeepingMedia` đã xác nhận. Nhận định ban đầu về404 khi retry DELETE dựa trên mock chưa phản ánh contract thật. Đã bỏ catch404 và hai tests mô phỏng vừa thêm (đã nằm trong commit hiện tại); giữ behavior cũ: xóa thành công theo204, lỗi thật được xử lý. Không bỏ/giảm test tích hợp idempotency, ownership hoặc rollback.
- Backend: create idempotent key+hash, transaction tạo Trip/Itinerary/days; GET owner-scoped/pagination; PATCH chỉ field dirty, phân biệt omitted/null, version409; preview ngày và acknowledge; hủy chỉ đọc nhưng vẫn xóa được; soft-delete owner và memory liên quan trong cùng transaction. Không sửa backend runtime/migration ở QA-3.
- **Phạm vi chưa triển khai:** UI list có pagination/refresh nhưng chưa có điều khiển search/filter/sort; backend các tham số q/mode/sort đã có và có thể test Postman. Bản đồ/lịch trình/Places/Weather trong connected detail còn theo phase tích hợp riêng; không coi placeholder là chức năng đã hoàn tất và không khôi phục fixture vào tài khoản thật.

### Kiểm chứng

- **Backend29 tests đạt, 0 failures/errors/skips trong một lượt:** TripCrudIntegrationTest8, TripMutationIntegrationTest13, TripCalendarTest1, DestinationCatalogIntegrationTest7. PostgreSQL17 Testcontainers + Flyway thật; kiểm ownership, create/replay/concurrency, validation/ref, version conflict, PATCH/null/no-op, ngày giao nhau, rollback và DELETE idempotent. Test rollback chủ động gây SQL5xx trong log là kết quả dự kiến, không phải suite thất bại.
- **Mobile41 tests đạt:** trip-api, trip-mutations, destinations, create-trip, trip-formatters, trip-details-actions, connected-home. Regression double submit thất bại trước sửa, đạt sau sửa. TypeScript/no-unused và diff check đạt. Không thêm test chỉ đo style hoặc chạy lint.
- HTTP backend dev18081: GET Trips và Destinations không token →401/AUTH_001; OPTIONS PATCH với Origin8082 →200 và đúng allow-origin. Không tạo user/trip dev, không sửa DB dev cho smoke. Dữ liệu hợp lệ/persistence/concurrency được kiểm trên DB test riêng; UI do người dùng nghiệm thu tiếp.
- Log local không commit: `.expo/qa3-create-before-fix.log`, `.expo/qa3-mobile-tests.log`, `.expo/qa3-types.log`; backend `.git/qa-preflight/qa3-trip-tests.log`, `qa3-http-smoke.json`. Không dùng mock404 cũ làm bằng chứng lỗi production.

### Batch UI Trip CRUD

Dùng tài khoản đã verified; chọn ngày không trước ngày hiện tại. Với mỗi case ghi lại Trip ID (không token), tên và số chuyến trước/sau. Cần nghiệm thu trên Android; web dùng thêm để kiểm phiên bản/cạnh tranh.

| Case | Thao tác | Kết quả mong đợi |
| --- | --- | --- |
| T01 | Tài khoản chưa có trip → tab Chuyến đi → Tạo chuyến đi, bấm tạo khi thiếu nơi đến/ngày | Empty state đúng; lỗi field và đưa tới chỗ cần nhập; không tạo Trip |
| T02 | Chọn nơi đến, hôm nay hoặc tương lai, đi1 ngày; bỏ ngân sách/sở thích | POST201; mở detail đúng ID, dayCount1; quay list/refresh vẫn đúng1 chuyến, không có địa điểm mẫu |
| T03 | Tạo chuyến3 ngày, tên tiếng Việt, ngân sách0 rồi thử chuyến có ngân sách/sở thích | Số ngày inclusive đúng;0 khác với không nhập; tên/ngân sách/preferences đúng sau mở lại |
| T04 | Bấm nhanh nút tạo2–3 lần trong cùng lần submit | Chỉ1 request đang chạy và1 lần điều hướng; không nhân đôi Trip. Nếu mạng lỗi, bật mạng và retry cùng form vẫn dùng create key của cùng payload |
| T05 | Sửa riêng ghi chú/tên, lưu rồi đóng/mở detail và refresh list | PATCH chỉ field đã đổi; version tăng; ngày/ngân sách/sở thích không bị xóa hoặc reset |
| T06 | Sửa ngày thành1 ngày hoặc kéo dài3 ngày; thử khoảng ngày ngược | Ngày hợp lệ lưu đúng days/dayCount/mode; ngày ngược bị chặn. Nếu đã có stops ngoài khoảng mới: phải preview và xác nhận trước khi áp dụng |
| T07 | Mở Xóa → Không, rồi Xóa → Có | Không: giữ nguyên; Có: DELETE204, list không còn trip, GET detail404. Không xóa trip/memory tài khoản khác |
| T08 | Mất mạng trước khi tạo/sửa/xóa, chờ lỗi rồi bật mạng/thử lại | Có lỗi và retry; không kẹt loading, không tự ghi đè hoặc tự replay mutation nền |
| T09 | Mở form sửa, dùng Postman/thiết bị thứ2 cập nhật cùng trip, rồi lưu form cũ | 409/TRIP_002; đề nghị tải bản mới, giữ dữ liệu server; chỉ sửa lại sau khi review version mới |
| T10 | Có hơn20 chuyến → Tải thêm/refresh; đổi account A/B | Tải đúng trang, lỗi tải có retry; cache/private trip không lẫn tài khoản; không nạp fixtures |

Các case về stops/Memory cần dữ liệu test đã tích hợp ở phase tương ứng; không dùng UI preview để coi DB case đã đạt. Chưa có dữ liệu cho case nào thì ghi Not tested thay vì Passed.

### API và body mẫu cho Postman

Base URL: `http://localhost:18081`; header `Authorization: Bearer <accessToken>`, `Content-Type: application/json`, `Accept-Language: vi`. Không tạo Collection theo yêu cầu người dùng.

| Method | Path | Body/kỳ vọng |
| --- | --- | --- |
| GET | `/api/v1/destinations?q=Đà%20Nẵng&page=0&size=20` | Không body;200, data.content chứa UUID tỉnh/thành |
| POST | `/api/v1/trips` | Body bên dưới;201 mới hoặc200 replay cùng key/payload |
| GET | `/api/v1/trips?page=0&size=20&sort=createdAt,desc` | Không body;200 data.content, totalElements/totalPages/context |
| GET | `/api/v1/trips?mode=PLANNING&q=Đà&page=0&size=20&sort=startDate,asc` | mode hỗ trợ PLANNING/LIVE/RECAP/CANCELLED; UI chưa có controls tương ứng |
| GET | `/api/v1/trips/<tripId>` | Không body;200 data.trip và data.context |
| PATCH | `/api/v1/trips/<tripId>` | Ví dụ `{"version":0,"title":"Đà Lạt đã chỉnh","notes":"Mang áo khoác"}`;200, dùng version mới nhất |
| POST | `/api/v1/trips/<tripId>/date-change-preview` | `{"version":0,"startDate":"2026-11-21","endDate":"2026-11-23"}`;200, chỉ xem tác động |
| DELETE | `/api/v1/trips/<tripId>?version=0` | Không body;204, xóa lại chính chủ vẫn204; version stale khi trip còn sống→409 |

Body tạo mẫu (đổi ngày nếu ngày hiện tại đã sau20/11/2026):

```json
{
  "clientRequestId": "11111111-1111-4111-8111-111111111111",
  "title": "Khám phá Đà Lạt",
  "destination": { "name": "Đà Lạt", "provinceId": null },
  "startDate": "2026-11-20",
  "endDate": "2026-11-22",
  "timeZone": "Asia/Ho_Chi_Minh",
  "budget": { "amount": 2000000, "currency": "VND" },
  "preferences": ["nature", "photography"],
  "initialPlaceIds": []
}
```

- Mỗi chuyến mới dùng clientRequestId UUID mới; **retry cùng lần tạo giữ nguyên key và payload**. Cùng key nhưng đổi payload →409/TRIP_004, không tự tạo chuyến khác.
- Lấy ID ở `data.trip.id`, version ở `data.trip.version`; response update có version mới để dùng lần sau. Không luôn dùng0 cho trip đã sửa.
- PATCH `{"version":<mới nhất>,"budget":null,"notes":null}` xóa rõ ràng hai field; bỏ field khỏi body giữ nguyên. `title`/dates không nhận null.
- Đổi ngày phải gửi cả startDate/endDate. Nếu preview.requiresAcknowledgement=true, PATCH gồm ngày và `acknowledgeDateImpact:true`; khi false/không gửi sẽ không tự làm mất lịch cũ. Không tự gửi flag trước khi người dùng review tác động.
- Kiểm accountB với tripA: GET/PATCH/DELETE đều404/TRIP_001, không lộ dữ liệu. Token thiếu →401. Không có mutation liên quan được chạy dưới accountB.

**Mốc QA-3 trước khi người dùng yêu cầu chuyển phase:** các kiểm tra tự động đạt, chưa có checklist T01–T10 được trả từng mục. Người dùng đã yêu cầu sang QA-4; không coi yêu cầu này là bằng chứng mọi ca UI đã được thực thi. Home bốn trạng thái vẫn chưa tích hợp.
