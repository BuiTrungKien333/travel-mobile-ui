# Trip API — tích hợp đầu tiên

Cập nhật: **03/11/2026**. Phạm vi: **tạo → danh sách → chi tiết metadata → sửa/đổi ngày/xóa → tải lại**, kèm danh mục điểm đến API. Xem [kết quả Phase 2](PHASE-2-TRIP-MUTATIONS.md) và [danh mục điểm đến/cách thử](DESTINATIONS-INTEGRATION.md).

## Đã triển khai

| API | Hành vi |
| --- | --- |
| POST /api/v1/trips | Ghi Trip PLANNING + itinerary mặc định + từng ngày trong một transaction; initialPlaceIds hợp lệ được đưa vào pool |
| GET /api/v1/trips | Owner scope, pagination, filter mode/q và sort whitelist |
| GET /api/v1/trips/{id} | Metadata + ngày thực trong DB; UUID/ownership/soft-delete được kiểm tra |
| PATCH /api/v1/trips/{id} | Sửa các field có mặt trong body, version check, no-op không tăng version, atomic đổi ngày |
| POST /api/v1/trips/{id}/date-change-preview | Chỉ đọc tác động đổi ngày, cần xác nhận nếu điểm sẽ về pool |
| DELETE /api/v1/trips/{id}?version=N | Soft-delete Trip + Memory; giữ file reference, gọi lại cùng owner trả 204 |
| GET /api/v1/destinations | Province nội bộ, authenticated, tìm có/không dấu hoặc code, phân trang tối đa 100 |

- Backend: Flyway V10, cột metadata/version/idempotency, bảng trip_days, service và read projections.
- Idempotency: cùng owner + key + normalized payload không tạo trùng; concurrent requests trả một 201 và một 200. Khác payload trả409.
- Frontend: DTO Zod, shared Axios, React Query theo owner, form tạo dùng request key giữ nguyên khi retry cùng payload.
- Không đưa query data vào preview store. Lúc tích hợp, store fixture được làm rỗng để các route chưa nối không dùng nhầm dữ liệu mẫu.
- Preview UI vẫn giữ nguyên. Chế độ thật dùng danh sách chuyến đi ở cả tab Home và Chuyến đi trong đợt này; dashboard Home thật nằm ở phase sau.
- Chi tiết thật tái sử dụng khung map co giãn/header/date selector; hiện metadata thật và trạng thái chưa kết nối, không hiện đường đi/thời tiết/điểm dừng giả.
- Nút `…` trong chi tiết mở Sửa / Nhật ký / Xóa. Form sửa dùng cùng UI preview, pending/error/retry, xác nhận date impact và giữ form khi 409. Nhật ký vẫn là module chưa nối.
- Chức năng thêm địa điểm vào lịch báo chưa kết nối, không gửi fixture ID. Destination picker tạo/sửa đã nối Province: dòng danh mục gửi ID thật; dòng tự nhập/submit gửi provinceId=null. Có loading/empty/error/retry/load more; preview vẫn dùng dữ liệu mẫu.

## Bật chế độ API

Từ 03/11/2026, auth/API là mặc định cả development khi không đặt `EXPO_PUBLIC_UI_PREVIEW`. Flag `false` bên dưới là tường minh; `true` chỉ dành cho preview UI. Không cần sửa hằng số TypeScript để chuyển chế độ.

Trong `.env.local` của mobile (giữ các giá trị khác bạn đang dùng):

```dotenv
EXPO_PUBLIC_UI_PREVIEW=false
EXPO_PUBLIC_API_URL=http://localhost:8080
```

- Web: localhost là máy đang chạy backend; origin web localhost:8081 đã có trong cấu hình CORS dev mặc định.
- Android Emulator: dùng `http://10.0.2.2:8080`.
- Điện thoại thật: dùng IP LAN của máy chạy backend, cùng mạng và mở cổng cần thiết. localhost trên điện thoại không phải máy tính.
- Production dùng HTTPS. Không đưa secret/JWT vào EXPO_PUBLIC_*.
- Restart Metro khi đổi env. Không sửa `.env.local` người dùng tự động trong lần triển khai này.

```powershell
cd E:\travel-mobile-ui
npx expo start --dev-client --clear
```

Web có thể dùng `npx expo start --web --clear`. Không cần build lại development client chỉ vì bật API Trip. Lần merge `minhduc` bổ sung `react-native-maps`, nhưng native map tắt mặc định; nếu bật `EXPO_PUBLIC_NATIVE_MAP_ENABLED=true`, phải cấu hình Maps SDK key và build development client mới. Web vẫn dùng sơ đồ, chưa có SDK web.

Để quay về thiết kế UI không cần backend: đặt `EXPO_PUBLIC_UI_PREVIEW=true`, restart Expo. Release luôn yêu cầu auth/API, không bypass bằng flag này.

## Backend và dữ liệu

- Chuẩn bị PostgreSQL và env backend theo cấu hình local hiện có. Không dùng DB production để thử.
- Chạy backend từ `E:\travel-system\backend` với `./mvnw.cmd spring-boot:run` trong môi trường dev đã cấu hình.
- Flyway tự áp V10 khi startup; không chạy lại/sửa V1–V9. Review migration và backup nếu DB local có dữ liệu cần giữ.
- Phase 2 thêm **V11**, giữ appointment bị gỡ lịch bằng `removed_at`. Không sửa checksum V1–V10; startup backend sẽ áp migration mới. Lượt triển khai chỉ chạy migration trong PostgreSQL Testcontainers, không chạy DB cá nhân.
- V10 backfill ngày cho legacy range hợp lệ1–365 ngày. Date constraint NOT VALID bảo vệ write mới, không tự sửa dữ liệu cũ bất thường.
- Preferences legacy TEXT không phải JSON array cần kiểm kê/chuyển đổi riêng trước sử dụng; code không âm thầm xóa dữ liệu cũ. Chuyến tạo mới luôn ghi JSON array đúng kiểu.
- Main migrations không seed Province; DB mới có thể có catalog rỗng. Chưa import danh mục hành chính chính thức hoặc chuẩn hóa toàn bộ itinerary legacy; nhập tên riêng vẫn hoạt động.

## Cách thử

1. Bật API mode, mở app và đăng nhập tài khoản thật đã xác minh.
2. Ở danh sách, tạo chuyến với tên điểm đến, ngày từ hôm nay, budget/preferences nếu muốn. Chưa chọn địa điểm ở đợt này.
3. Sau thành công, app mở details bằng UUID server. Kiểm tra title, dates, days, budget và notes.
4. Quay lại danh sách, kéo refresh; không có chuyến trùng.
5. Reload app/web và mở lại chuyến: dữ liệu vẫn nằm trong PostgreSQL.
6. Web hiện giữ refresh token trong memory theo chính sách auth sẵn có. Reload toàn bộ trang có thể yêu cầu đăng nhập lại; sau login dữ liệu chuyến vẫn còn. Android dùng SecureStore để restore phiên.
7. Thử tài khoản khác: không thấy/đọc được chuyến của tài khoản trước.
8. Nếu request timeout, giữ form và bấm lại: key cũ cho cùng payload chống duplicate. Không đóng form khi đang gửi.

## Chưa triển khai

- Import/chuẩn hóa danh mục Province theo nguồn chính thức được duyệt, QA môi trường thực.
- Places search thật, lịch trình/day items, thêm/sắp xếp/check-in, Google Maps/Routes, tối ưu/AI.
- Home dashboard tổng hợp, Weather/Packing, Camera upload/Memory server, notification.
- Tab Kỷ niệm và nút Camera ở API mode mở trạng thái chưa kết nối; không giả báo đã lưu hoặc suy rằng không có chuyến Live từ store rỗng.
- Chưa QA tương tác trực quan trên điện thoại/trình duyệt người dùng; build/export không thay nghiệm thu thiết bị.

## Kiểm tra

- Backend: compile và toàn bộ test, PostgreSQL17 Testcontainers + Flyway thật; test API đi qua login/JWT/Security filter chain thật.
- Cases mới: ownership, replay/conflict/concurrent create, literal search/pagination, invalid references, rollback sau child write failure,365/366 ngày và nullable output.
- Frontend: TypeScript, toàn bộ unit/behavior tests; DTO/adapter/API transport và preview regression.
- Kết quả chạy cụ thể được ghi trong PROJECT-STATUS.md. Không chạy lint theo yêu cầu hiện tại.

Kết quả lần triển khai: **337 backend tests**, **171 frontend tests**, TypeScript/no-unused và export **web + Android/Hermes** đều đạt. Test DB dùng PostgreSQL Testcontainers; không chạy migration trực tiếp trên DB cá nhân. Chưa QA thực tế trên Android hoặc browser người dùng, chưa đo latency production.

Đặc tả đầy đủ: [TRIP-CRUD-CONTRACT.md](TRIP-CRUD-CONTRACT.md). OpenAPI có **7/7 operations được triển khai**. Mốc test 337/171 phía trên là lần triển khai đầu; kết quả mới: **357 backend/215 mobile**, TypeScript và web/Android export đạt; xem [danh mục điểm đến](DESTINATIONS-INTEGRATION.md). Chưa nghiệm thu HTTP e2e/thiết bị hoặc production.
