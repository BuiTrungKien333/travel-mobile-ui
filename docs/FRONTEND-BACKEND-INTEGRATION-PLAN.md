# Kế hoạch hợp nhất frontend và backend WeGo

### Phạm vi V1 báo cáo · 08/11/2026 — ưu tiên hiện tại

- APK Android độc lập + web dự phòng; backend laptop cùng Wi-Fi. Ưu tiên sửa lỗi và nghiệm thu ổn định trước khi mở thêm tính năng.
- Vali chọn lưu bền tại thiết bị theo tài khoản/chuyến, không xây API Packing. Thông báo/push hoãn ngoài V1. Các hợp đồng planned trước đây không phải yêu cầu phải làm cho bản này.
- Kế hoạch/gate build và mạng demo: [V1-RELEASE-PLAN.md](V1-RELEASE-PLAN.md). Profile `preview-lan` có ngoại lệ HTTP cho API IPv4 private; production giữ HTTPS. Chưa coi V1 sẵn sàng chỉ từ unit test/bundle export.

### QA-6 · Chọn và upload nhiều ảnh · 08/11/2026

- Đã nối picker tối đa 10 ảnh → lưu local → upload 2 ảnh đồng thời → kết quả/retry từng ảnh. Chưa có chuyến vẫn local-only, dùng lại API đơn và core viewer. Giữ ID bền sau mất phản hồi; refresh một lượt cuối đợt.
- API `/media/uploads` yêu cầu trip/memory và trả HTTP 200 với kết quả theo index, không giấu thành công một phần. Checklist/hợp đồng: [MULTI-PHOTO-UPLOAD-QA.md](MULTI-PHOTO-UPLOAD-QA.md). Còn nghiệm thu Android/iOS/web và cloud thật; chưa triển khai upload chạy nền.

### QA-6 · Xóa ảnh Cloudinary và đồng bộ UI · 08/11/2026

- Đã bổ sung xác nhận xóa asset trước DB, receipt bền để retry, dọn file của memory/chuyến đã ẩn và chặn upload cũ làm ảnh sống lại. Viewer chờ kết quả, có loading/lỗi/thử lại; ảnh local không upload để xóa.
- Checklist/API: [MEDIA-DELETION-QA.md](MEDIA-DELETION-QA.md). Còn nghiệm thu provider thật, cache CDN và thiết bị; private delivery và đối soát orphan sau process crash chưa nằm trong thay đổi này.

### QA-6 · Refactor thư viện Ảnh / Album · 08/11/2026

- Đã dùng chung dữ liệu thật cho lưới 3 cột và album một cột, giữ core xem ảnh và Xem sau. Ảnh mẫu chỉ là lớp hiển thị cho chuyến trống; không ảnh hưởng số đếm/DB.
- Tối ưu thumbnail/cache/ảo hóa và đọc summary chuyến không kèm membership. API metadata vẫn đọc các trang hiện có; API phân trang theo nhóm + số đếm tổng hợp chưa triển khai. Hướng dẫn: [MEMORY-LIBRARY-UI.md](MEMORY-LIBRARY-UI.md).

### Kết thúc chuyến đi chủ động · 08/11/2026

- Đã thêm API xác nhận kết thúc LIVE, giữ lịch sử và ngày dự kiến, chống ghi đè bằng version; frontend có hành động menu và lời nhắc khi ghé hết điểm toàn chuyến. Không tự hoàn thành theo số check-in.
- Chi tiết, Home và danh sách đồng bộ sau khi lưu. Checklist và API: [TRIP-COMPLETION-QA.md](TRIP-COMPLETION-QA.md); chờ nghiệm thu trên thiết bị.


### QA · Home và chi tiết chuyến đã hoàn thành · 08/11/2026

- Đối chiếu commit `fe9473b`, giữ card mời chuyến mới/dấu ấn/kỷ niệm trên Home, bổ sung lối mở đúng chuyến hoàn thành với tổng số thật. Chi tiết RECAP dùng map/dải ngày đồng nhất, tổng kết + album/ghi chú từng ngày và timeline chỉ đọc.
- Tái sử dụng API dashboard/trip/itinerary/memory/media hiện có; không thêm API/DB schema. Xóa ảnh và làm mới màn hình cập nhật lại tổng số; không chèn ảnh mock vào nhật ký thật. 49 ca backend, 30 ca mobile liên quan đạt.
- Hướng dẫn API/checklist: [COMPLETED-TRIP-QA.md](COMPLETED-TRIP-QA.md). Chờ người dùng nghiệm thu web/Android; không đổi nghiệp vụ phân quyền hoặc luồng lập kế hoạch.



### QA-5 · Tối ưu phần chưa ghé · 08/11/2026

- Đã nối đề xuất/lưu nhóm đã ghé lên đầu theo thứ tự cũ, giữ giờ/thời lượng/ID; lấy điểm cuối nhóm làm mốc và chỉ tối ưu phần chưa ghé. Ví dụ ABCD đã ghé A/C → ACBD hoặc ACDB. Preview không ghi DB.
- Dùng Mapbox Matrix + Held–Karp sẵn có để không ép giữ điểm cuối; luồng chưa ghé điểm nào giữ API tối ưu cũ. Modal so sánh phần còn lại, khóa kéo nhóm đã ghé và cập nhật timeline sau Áp dụng.
- Lưu lịch kiểm tra revision và snapshot visited, từ chối ghi đè khi check-in thay đổi. Provider I/O ngoài transaction; không đổi schema/dependency. Hướng dẫn và giới hạn chi phí: [REMAINING-ROUTE-OPTIMIZATION-QA.md](REMAINING-ROUTE-OPTIMIZATION-QA.md). Chờ nghiệm thu Android/web.



### QA-5 · Timeline dự kiến tự động · 07/11/2026

- Sửa sau nghiệm thu: dùng giờ điểm đầu làm mốc khi chưa có settings; tự hoàn thiện lịch cũ còn thiếu giờ khi route sẵn sàng, không yêu cầu người dùng nhập lại giờ xuất phát.

- Đã dùng chung backend tính giờ theo giờ xuất phát + Directions + thời lượng ghé (mặc định 45 phút; giữ giá trị người dùng nhập). Thêm/gỡ/đổi thứ tự/đổi thời lượng tự tính lại khi ngày đã có settings; ghi chú đơn thuần không gọi provider.
- Live hôm nay bảo toàn điểm đã ghé. Route I/O ngoài transaction, batch thêm và lịch tính commit nguyên tử, kiểm tra revision trước ghi; giữ ngày khác và dữ liệu cũ. Route không sẵn sàng không bịa giờ đến.
- Mobile giữ UI hiện có, thêm nhãn lịch dự kiến/trạng thái chưa đủ dữ liệu, lựa chọn nhanh 45/60 phút và khóa thời lượng đã ghé. Chọn giờ không bắt buộc chọn nơi xuất phát.
- API, quy tắc và checklist nghiệm thu: [ESTIMATED-TIMELINE-QA.md](ESTIMATED-TIMELINE-QA.md). Đã kiểm tra tự động; nghiệm thu UI web/Android còn chờ người dùng.


> QA-5C · 07/11/2026: rà lại LIVE trên Home/chi tiết, nối tick timeline và focus/mở rộng map, sửa camera sau check-in và cover backend; dùng ảnh local fallback ổn định. Khôi phục Chưa xếp lịch (N) để xử lý điểm giữ lại sau đổi ngày. 65 ca backend/66 mobile liên quan, TypeScript/export web+Android đạt. [LIVE-TRIP-QA.md](LIVE-TRIP-QA.md) là checklist mới nhất; chờ nghiệm thu thiết bị, chưa triển khai turn-by-turn hoặc visited per-visit.

> QA-6A · Xem sau · 07/11/2026: tái sử dụng core xem ảnh Home, đọc local độc lập với API album/chuyến, gán chuyến lưu trước rồi đồng bộ. Ảnh lỗi ở Chờ đồng bộ có retry/progress/mở album và khôi phục sau reload; chỉ đánh dấu uploaded sau khi server xác nhận media. 54 ca mobile, TypeScript/export web+Android đạt. Chờ nghiệm thu native/provider thật; chưa hoàn tất Phase 6. Xem [QA-6A](QA6-MEMORY-CAPTURE.md).

> Quyết định Xem sau · 07/11/2026: ảnh chưa gắn chuyến chỉ lưu trên thiết bị; xác nhận đưa vào chuyến rồi mới đồng bộ. Không triển khai upload unassigned memory lên cloud. Giữ bản local nếu upload lỗi. Chi tiết và giới hạn lưu trữ trong [QA-6A](QA6-MEMORY-CAPTURE.md).

> Cập nhật QA-6A · 07/11/2026: đồng bộ Camera/Memory với backend (create key, media hash, version/PATCH note, limits, kiểm ảnh thật, ownership, múi giờ). Lưu metadata và upload retry an toàn theo [hướng dẫn nghiệm thu/API](QA6-MEMORY-CAPTURE.md), không giữ DB transaction khi gọi Cloudinary. 51 ca backend và 33 ca mobile liên quan đạt; TypeScript/export web+Android đạt. Chưa kết luận hoàn tất Phase 6: còn nghiệm thu thiết bị/provider thật, private delivery, dọn asset xóa và pagination thư viện.

> Cập nhật QA-5 · Lịch ngày · 07/11/2026: đã nối origin/giờ đi/thời lượng/phương tiện/quay về qua API versioned và Flyway V17; dùng catalog, điểm đã lưu, GPS hoặc nhập tay, không bật Geocoding trả phí. Mapbox tính cả chặng xuất phát/quay về và giờ đến có dữ liệu. Xem [DAY-SCHEDULE-INTEGRATION.md](DAY-SCHEDULE-INTEGRATION.md) cho API, giới hạn và checklist. Ghim, AI, dẫn đường turn-by-turn và nghiệm thu thiết bị vẫn chưa hoàn tất.

> Cập nhật QA-5 · 07/11/2026: chi tiết địa điểm từ timeline đã nối API; kéo đổi thứ tự/vuốt gỡ tại timeline thật có lưu lịch ngày, rollback khi lỗi và Hoàn tác kiểm tra phiên bản. 45 kiểm tra mobile liên quan đạt ở lượt đó; chờ nghiệm thu gesture web/Android. Cấu hình xuất phát/quay lại được bổ sung trong cập nhật lịch ngày phía trên; ghim vẫn chưa nối. Xem các checklist mới nhất trong [QA-ACCEPTANCE-PLAN.md](QA-ACCEPTANCE-PLAN.md); chưa đánh dấu hoàn tất toàn Phase 4/5.

> Cập nhật Home · 07/11/2026: đã triển khai GET `/api/v1/home/dashboard` và nối lại thiết kế các trạng thái, bao gồm PLANNING dùng card Upcoming. Chọn một chuyến theo ưu tiên trạng thái rồi ngày tạo mới nhất; 433 backend/304 mobile tests đạt. Xem [HOME-DASHBOARD-INTEGRATION.md](HOME-DASHBOARD-INTEGRATION.md) cho API, batch nghiệm thu và giới hạn thời tiết/lịch trình/Memory. Chưa gán hoàn tất toàn Phase dashboard hoặc QA-5/QA-6; các đoạn Home deferred phía dưới là lịch sử.

> Cập nhật QA-4 ngày 06/11/2026: [Places nội bộ + Mapbox](QA4-PLACES-MAPBOX.md) là trạng thái tích hợp mới nhất. Provider bản đồ chuyển sang Mapbox theo người dùng; các đoạn Google Maps/Places planned dưới đây là hướng cũ. SDK, provider persistence và lịch trình chưa nghiệm thu; không coi phần đặc tả cũ là API đã chạy. Google OAuth giữ nguyên.

**Ngày lập:** 02/11/2026

**Trạng thái:** Phase 2 đủ 7 operations và picker Province tạo/sửa (357 backend/215 mobile tests ở lượt đó). Đã khảo sát/chốt đặc tả Phase 3 ngày 03/11: 9 API planned, chưa triển khai runtime. Backend `integration/team-sync` vẫn chưa merge; master data và QA môi trường thực còn mở.

**Frontend:** `E:\travel-mobile-ui`

**Backend:** `E:\travel-system\backend`

> Tài liệu xuất từ kế hoạch đã trao đổi trong chat. Việc xuất file không triển khai API, migration hay thay đổi code ứng dụng. Các endpoint ghi “mới” là hợp đồng đề xuất, không phải endpoint hiện đang tồn tại.

**Bổ sung 02/11/2026:** người dùng xác nhận draft dành cho AI sau này, **ngoài MVP**. Chuyến được tạo qua UI hiện tại là chuyến thật `PLANNING`, không có bước publish. Quy tắc chi tiết và OpenAPI Trip CRUD được chốt tại [TRIP-CRUD-CONTRACT.md](TRIP-CRUD-CONTRACT.md); đặc tả này ưu tiên khi ví dụ roadmap chưa đủ cụ thể. Đến 03/11, cả 7 operations Trip CRUD đã triển khai; các phase/module ngoài phạm vi vẫn theo roadmap.

**Tiến độ sau bước đặc tả:** create/list/detail metadata, PATCH/date-preview/DELETE, danh mục Province và Flyway V10–V11 đã nối frontend; auth/API mặc định development, preview opt-in. Xem [TRIP-API-INTEGRATION.md](TRIP-API-INTEGRATION.md). Bảng hiện trạng bên dưới giữ mốc khảo sát ban đầu; không hiểu là mọi module đã nối. Places/Itinerary/Map/Media/Weather/Home tổng hợp/AI còn theo roadmap; draft/AI ngoài MVP.

### Merge Kỷ niệm/camera · 06/11/2026

Đã nhận frontend Memory/Media và profile editor từ `feat/ui/memory-v2`, resolve giữ Home/nav/Trip CRUD, pagination và session hiện hành. Camera API mở quick capture, lưu local rồi upload/retry, tab Kỷ niệm mở album thật. Đây là tiến độ frontend **Phase 6/9**, chưa nghiệm thu backend media/e2e/thiết bị; không đánh dấu Phase 3/4 hay P0-03 của nhánh nguồn đã hoàn tất. Xem [báo cáo merge](MERGE-MEMORY-V2-2026-11-06.md). Backend và dependency không thay đổi.

### Mốc merge mobile · 02/11/2026

**Follow-up Auth/Profile 03/11:** đã nhận UI Cá nhân và phần đổi email sau đăng ký từ nhánh nguồn sau review; auth thật mặc định development, fixture preview opt-in. Giữ API/session hiện có, sửa loading/tokens/recovery/logout feedback. Đây là hoàn thiện frontend Phase 1/9, chưa xác nhận e2e SMTP/Google hay hoàn tất Profile CRUD/backend phase. Xem [auth-integration.md](auth-integration.md).

| Module/phase | Kết quả lần gộp này | Chưa hoàn tất |
| --- | --- | --- |
| Phase 0 / 2 · Trip | Giữ canonical DTO, list phân trang, create request key, owner-scoped cache và nhánh API tạo/list/detail đã có | PATCH/delete/date preview, QA thiết bị |
| Phase 3 / 4 · Places/Itinerary | Nhập service/hooks/schema và sửa mapping placeId/tripPlaceId/itineraryItemId; không nối UI vào API legacy | Hợp đồng backend thống nhất, origin/transport/pins/version, CRUD tích hợp thật |
| Phase 5 · Maps/Routes | Thêm Maps SDK tùy chọn, giữ sơ đồ preview mặc định, kiểm tra payload/geometry | API Places/Routes đúng provider Google, quota/key, Android build và QA; web vẫn sơ đồ |
| Phase 6 · Memory/Media | Nhập service, sửa multipart web/native và tránh lặp các upload đã được xác nhận khi retry cùng phiên | Idempotency/atomic create-upload, ảnh riêng tư, pagination UI, nối camera/album thật |
| Phase 7 · Weather | Nhập client/schema; không thay fixture hiện tại bằng dữ liệu chưa nối | Mapping dashboard/checklist, forecast horizon và fallback thiếu dữ liệu |
| Auth / UI | Giữ luồng auth, Home bốn trạng thái, camera, modal, safe area và Liquid Glass hiện có | Không nhập bản rewrite Profile/Home/Camera làm mất UI hoặc phụ thuộc API chưa thống nhất |

**Backend chưa merge:** `E:\travel-system` giữ `fix/rag-ai-v2` tại `00b797d`. Không chạy migration hay sửa planning backend trong đợt này. Import mã nguồn mobile không đồng nghĩa API tương ứng đã hoạt động. Kết quả kiểm tra và quyết định giữ/bỏ: [MERGE-MINHDUC-2026-11-02.md](MERGE-MINHDUC-2026-11-02.md).

## 1. Mục tiêu, phạm vi và hiện trạng

Mục tiêu là chuyển toàn bộ giao diện đã xây dựng sang dữ liệu thật, giữ nguyên ngôn ngữ thiết kế, chuyển động và trải nghiệm thao tác; đồng thời bảo đảm dữ liệu nhất quán giữa Home, danh sách chuyến đi, chi tiết chuyến đi, địa điểm, camera và nhật ký.

### Phạm vi đã chốt

- **Nền tảng:** Android và web.
- **MVP online:** chưa xây chỉnh sửa offline, hàng đợi đồng bộ hay giải quyết xung đột offline.
- **Bản đồ và tìm địa chỉ:** Google Maps, Places và Routes.
- **Ảnh:** Cloudinary.
- **Planning và AI:** phase riêng ở cuối, không chặn các module nghiệp vụ cơ bản.
- **Giao diện:** giữ theme sáng, Ocean Teal, Roboto, VI/EN mặc định tiếng Việt và phong cách Liquid Glass hiện tại.
- Không mở rộng sang mạng xã hội, chia sẻ chuyến đi nhiều người, phân quyền actor chi tiết hoặc điều hướng turn-by-turn trong ứng dụng.

### Hiện trạng đã đối chiếu từ code

| Module | Frontend | Backend | Công việc thực tế |
| --- | --- | --- | --- |
| Auth | Có màn hình, API client, session, email link, Google login | Có controller và service | Kiểm thử tích hợp, cấu hình thật, bỏ bypass đúng môi trường |
| Trip | Có danh sách, tạo, sửa, xóa, ba mode chi tiết | Có entity/repository, chưa có CRUD controller | Xây nghiệp vụ và REST API |
| Lịch trình | Store preview hỗ trợ ngày, điểm dừng, sắp xếp, ghim | Có bảng itinerary nhưng thiếu API nghiệp vụ tương ứng | Hoàn thiện mô hình lưu trữ và mutation |
| Địa điểm | Tìm/chọn, địa chỉ riêng, chi tiết | Có Place, có retrieval demo | Xây discovery thật, phân biệt dữ liệu nội bộ/Google/địa điểm riêng |
| Bản đồ | Sơ đồ preview, kéo mở rộng/thu gọn | Chưa có luồng Routes phục vụ UI hoàn chỉnh | Tích hợp SDK và dữ liệu tuyến đường |
| Weather | Dashboard, modal, checklist bằng fixture | Có current/forecast | Chuẩn hóa metadata, giới hạn dự báo và mapping UI |
| Camera | Camera thật, chọn ảnh, preview, xác nhận | Chưa có media API | Upload, lưu metadata, quyền truy cập và xóa ảnh |
| Nhật ký | Album/viewer, ghi chú, favorite preview | Có bảng memories/media, chưa có API hoàn chỉnh | Xây CRUD và truy vấn album |
| Home/thống kê | Bốn trạng thái, dấu ấn, kỷ niệm gần đây | Chưa có API tổng hợp | Xây dữ liệu tổng hợp theo nghiệp vụ |
| Thông báo | Có icon và UI preview | Chưa có module | Thông báo trong app ở mức tối thiểu |
| Tối ưu/AI | Modal preview và apply/undo | Có API thuật toán, một số luồng demo | Rà soát, sửa và nối qua nghiệp vụ chuyến đi |

**Có bảng hoặc entity không có nghĩa module đã sẵn sàng sử dụng.**

Các nguồn đã đối chiếu:

- Frontend: `docs/PROJECT-STATUS.md`, `src/features/home`, `src/features/trip`, `src/features/camera`, `src/features/auth`, shared API client và theme.
- Backend: controller auth/user/weather/planning, Trip/TripPlace/Place, migration SQL và quy tắc backend.
- Tài liệu nghiệp vụ: Phase 4D Memory/Journal, Phase 8 API Design và báo cáo auth/security hiện có.

## 2. Phase 0 — Hợp đồng dữ liệu và nền tảng tích hợp

**Module:** API contract, domain mapping và cấu hình môi trường.

**Phụ thuộc:** Không.

### 2.1. Quy ước API

Tiếp tục dùng `/api/v1`, `ApiResponse` và `ErrorResponse` hiện có.

Response thành công:

```json
{
  "success": true,
  "message": "success",
  "data": {}
}
```

Response lỗi — ví dụ mã mới đề xuất:

```json
{
  "success": false,
  "code": "TRIP_VERSION_CONFLICT",
  "message": "Lịch trình đã thay đổi. Vui lòng tải lại.",
  "errors": {},
  "timestamp": "2026-11-02T03:00:00Z"
}
```

| HTTP status | Ý nghĩa |
| --- | --- |
| 200 | Đọc/cập nhật thành công |
| 201 | Tạo thành công |
| 202 | Yêu cầu đã tiếp nhận, như gửi email |
| 204 | Thành công không có body |
| 400 | Sai cấu trúc hoặc validation |
| 401/403 | Xác thực/quyền truy cập |
| 404 | Không tồn tại hoặc không thuộc người dùng |
| 409 | Trùng dữ liệu, version conflict hoặc trạng thái không cho phép |
| 422 | Input hợp lệ nhưng không thực hiện được về nghiệp vụ |
| 429 | Vượt giới hạn |
| 502/503 | Provider lỗi hoặc chưa khả dụng |

Frontend hiển thị theo `code` và ngôn ngữ, không phụ thuộc nội dung tiếng Anh của `message`.

Danh sách dùng pagination:

```json
{
  "success": true,
  "data": {
    "content": [],
    "page": 0,
    "size": 20,
    "totalElements": 42,
    "totalPages": 3
  }
}
```

- Mặc định `size=20`, tối đa `100`.
- Thứ tự có ID làm tiêu chí phụ để phân trang ổn định.
- Collection nhỏ, có giới hạn như ngày của một chuyến được trả trực tiếp; ghi ngoại lệ trong OpenAPI.
- Trong các bảng API tiếp theo, đường dẫn đều tương đối với `/api/v1`; output mô tả phần `data` trừ khi nói khác.

### 2.2. Chuẩn hóa đối tượng

| Đối tượng | Ý nghĩa |
| --- | --- |
| Trip | Chuyến đi của người dùng |
| Place | Địa điểm thực tế hoặc địa điểm riêng đã lưu |
| TripPlace | Địa điểm được đưa vào chuyến đi |
| ItineraryItem | Điểm dừng đã được xếp vào ngày/lịch |
| Memory | Trải nghiệm có ghi chú và/hoặc ảnh |
| Media | File ảnh thuộc Memory |
| TripDay | Cấu hình ngày: xuất phát, giờ, phương tiện, quay lại |

- Tách `placeId`, `tripPlaceId`, `itineraryItemId`. Không tiếp tục dùng `TripStop.id` cho nhiều vai trò.
- Frontend có DTO và mapper tại feature; không ép backend trả `{vi,en}` cho mọi tên địa điểm.
- Tên người dùng nhập giữ nguyên; nhãn UI dùng i18n; dữ liệu provider có locale và nguồn gốc.
- Việc biểu diễn `DayDetail` là DTO không tự quyết định cách thay thế bảng itinerary hiện có; migration phải tái sử dụng mô hình hiện hữu hợp lý.

### 2.3. Thời gian, trạng thái và đơn vị

- Ngày: `YYYY-MM-DD`.
- Giờ theo lịch địa phương: `HH:mm`.
- Thời điểm sự kiện: ISO 8601 có offset hoặc UTC.
- Trip có `timeZone`, mặc định `Asia/Ho_Chi_Minh` cho MVP Việt Nam.
- Khoảng cách: mét; thời gian di chuyển: giây; thời lượng ghé: phút.
- Ngân sách: số nguyên VND, không tính bằng floating point.
- Giữ `auth.expiresIn` tính bằng **milliseconds**; không đổi ngầm sang giây.

Backend đang có `PLANNING`, `ACTIVE`, `COMPLETED`, `CANCELLED`; frontend có enum khác. Hướng thống nhất:

- `status`: trạng thái nghiệp vụ lưu backend.
- `mode`: `PLANNING | LIVE | RECAP | CANCELLED`, backend tính theo trạng thái/ngày/timezone.
- `readiness`: thông tin còn thiếu; không dùng draft để suy rằng người dùng đã từng đi.
- `COMPLETED/CANCELLED` ưu tiên hơn suy luận ngày.
- Chuyến đang chuẩn bị có ngày đã bắt đầu được hiển thị Live theo ngày; không cần job mỗi phút chỉ để chuyển UI.
- Chuyến tạo thử, chưa có trải nghiệm không làm tăng thống kê khám phá.

### 2.4. Thay lớp preview

- React Query sở hữu dữ liệu server.
- Zustand giữ UI state: panel, lựa chọn tạm, trạng thái camera; không giữ bản sao toàn bộ query data.
- RHF tiếp tục sở hữu form.
- Mock mode riêng cho phát triển; không fallback về fixture khi API thật lỗi.
- Tách cấu hình preview khỏi `__DEV__` để development build kiểm thử được auth/API thật.
- Không gửi fixture lên backend.
- Giữ package-by-feature, thin route, shared Axios client, Expo Router và semantic tokens.

**Đầu ra:** OpenAPI, bảng mapping FE–BE, danh mục lỗi, quy tắc ngày/trạng thái và ma trận local/staging/production.

**Nghiệm thu:** cùng response mẫu render đúng trên Android/web; contract test phát hiện field/enum sai.

## 3. Phase 1 — Auth, session và hồ sơ

**Review 03/11/2026:** code/contract qua backend 337 tests (131 Auth/User/Security), mobile 194 tests và TypeScript. Đã sửa cache khi chuyển account bằng Google link. Chưa nghiệm thu SMTP/Google/deep links trên môi trường thực; rate limit trước public còn thiếu, PUT profile chưa nối UI. **Chưa đánh dấu Phase 1 complete hoặc chuyển Phase 2.** Xem [báo cáo](PHASE-1-AUTH-REVIEW-2026-11-03.md).

**Module:** Authentication và User.

**Phụ thuộc:** Phase 0.

Ưu tiên kiểm thử và sửa thiếu sót code hiện có, không viết lại auth.

### API hiện có

| API | Input | Output |
| --- | --- | --- |
| `POST /auth/register` | `fullName,email,password` | 202: `verificationRequired,resendAfterSeconds` |
| `POST /auth/login` | `email,password` | AuthData |
| `POST /auth/refresh` | `refreshToken` | AuthData mới |
| `POST /auth/logout` | `refreshToken` | Không có payload nghiệp vụ |
| `POST /auth/resend-verification` | `email` | 202: `resendAfterSeconds` |
| `POST /auth/verify-email` | `token` | 204 |
| `POST /auth/forgot-password` | `email` | 202: `resendAfterSeconds` |
| `POST /auth/reset-password` | `token,password` | 204 |
| `POST /auth/google/challenge` | Rỗng | `challengeId,nonce,webClientId,expiresIn` |
| `POST /auth/google` | `challengeId,idToken` | `AUTHENTICATED + auth` hoặc `VERIFICATION_REQUIRED` |
| `POST /auth/google/verify-link` | `token` | AuthData |
| `GET /users/me` | Bearer token | Hồ sơ hiện tại |
| `PUT /users/me` | `fullName,avatarUrl` theo DTO hiện có | Hồ sơ cập nhật |

```text
AuthData {
  accessToken, refreshToken, tokenType, expiresIn,
  user { id, email, fullName, role, avatarUrl }
}
```

### Công việc

- Cấu hình email thật, domain gửi và URL verify/reset cho Android/web.
- Token email chỉ tiêu thụ khi xác nhận POST; mở link không tự tiêu thụ.
- Kiểm thử deep link khi app đang tắt hoặc đang chạy.
- Google OAuth có package/SHA Android và web origin đúng từng môi trường.
- Vào app ngay khi Google đã xác minh và đủ điều kiện liên kết; không hỏi lại mật khẩu.
- Giữ nhánh xác minh bổ sung với email bên thứ ba không đủ điều kiện auto-link hiện có.
- Kiểm thử single-flight refresh; nhiều 401 không tạo nhiều refresh song song.
- Logout/session expiry xóa query cache của tài khoản cũ.
- Android dùng SecureStore; web giữ chính sách session hiện có, không chuyển token sang localStorage chỉ để tiện.
- Throttle login/email/challenge trước public; UI xử lý 429.
- Kiểm chứng các tồn tại của báo cáo auth cũ trước khi đánh dấu đã sửa.

**Nghiệm thu:** register → verify → login → restart → refresh → logout; reset vô hiệu phiên cũ; Google trên Android/web; không lẫn dữ liệu hai tài khoản.

## 4. Phase 2 — Quản lý chuyến đi

**Triển khai 03/11/2026 theo chỉ định của người dùng:** PATCH/date-preview/DELETE và UI sửa/xóa, V11 archive appointment bị bỏ ngày; đã bổ sung GET destinations + picker Province trong tạo/sửa, **7/7 operations**. 357 backend/215 mobile tests, TypeScript và export web/Android đạt. Danh mục chính thức chưa import (main migrations không seed Province); QA thiết bị/HTTP e2e chưa hoàn tất. Các điều kiện production Phase 1 vẫn mở; không merge backend đồng đội hoặc nối planning/AI. Chi tiết: [Phase 2](PHASE-2-TRIP-MUTATIONS.md), [danh mục điểm đến](DESTINATIONS-INTEGRATION.md).

**Module:** Trip CRUD.

**Phụ thuộc:** Phase 1.

### API mới

| API | Input chính | Output |
| --- | --- | --- |
| `POST /trips` | `clientRequestId,title,destination,startDate,endDate,timeZone,budget,preferences` | 201: TripDetail |
| `GET /trips` | `mode,q,page,size,sort` | Page&lt;TripSummary&gt; |
| `GET /trips/{tripId}` | ID | TripDetail |
| `PATCH /trips/{tripId}` | `version` và field được sửa | TripDetail mới |
| `DELETE /trips/{tripId}` | ID, version | 204 |
| `GET /destinations` | `q,page,size` | Danh mục điểm đến nội bộ |

```text
TripSummary {
  id, title,
  destination { id?, name, provinceId?, latitude?, longitude? },
  startDate, endDate, timeZone,
  status, mode, readiness,
  coverImageUrl?, dayCount, stopCount, memoryCount,
  version, updatedAt
}

TripDetail = TripSummary + {
  budget { amount, currency }?,
  preferences[], accommodation?, notes?,
  days[] { id, date, dayNumber },
  unscheduledCount
}
```

### Backend và dữ liệu

- Bổ sung budget, accommodation, notes, timezone, version theo UI.
- Preferences có kiểu rõ ràng, không nhận JSON tùy ý vào field TEXT.
- Flyway migration mới, không sửa migration đã áp dụng.
- `clientRequestId` chống tạo trùng khi server đã ghi nhưng client mất response.
- Owner từ authentication context, không nhận `userId` từ client.
- Optimistic locking cho sửa/xóa; 409 khi version cũ. Version request và mutation phải được mô tả chính xác trong OpenAPI trước coding.

### Ngày chuyến đi

- Tạo ngày theo khoảng ngày trong một transaction.
- Rút ngắn chuyến: điểm của ngày bị loại chuyển về pool; trả số điểm bị ảnh hưởng để UI xác nhận trước commit.
- Không đổi ngày chụp hoặc xóa Memory do sửa ngày chuyến.
- Đổi tên điểm đến không tự thay tọa độ điểm cũ.
- Giới hạn UI như 365 ngày thống nhất với backend.

### Xóa chuyến

Theo thông điệp UI hiện tại, xóa chuyến làm chuyến và kỷ niệm liên quan biến mất khỏi tài khoản.

- Soft delete nghiệp vụ trong transaction.
- File ảnh dọn sau; lỗi Cloudinary không làm dữ liệu xuất hiện lại.
- API đọc và thống kê loại dữ liệu đã xóa.

**Nghiệm thu:** tạo/sửa/xóa đồng bộ list/Home/details; reload không mất; tài khoản khác không truy cập được.

## 5. Phase 3 — Tìm kiếm và chi tiết địa điểm

**Khảo sát/contract 03/11/2026:** xem [PHASE-3-PLACES-CONTRACT.md](PHASE-3-PLACES-CONTRACT.md) và [OpenAPI](api/places-discovery.openapi.json). Cả 9 API bên dưới vẫn **planned**, không phải endpoint đã có. Backend hiện mới có Place entity/repository; client `/places/search` nhập từ đồng đội chưa có endpoint tương ứng. Ưu tiên 3A internal read + provenance/owner-aware references trước custom; 3B Google search/resolve preview; 3C saved locations. Không merge backend hoặc sửa thuật toán planning.

**Quy tắc cụ thể ưu tiên hơn DTO minh họa bên dưới:** resolve Google trả preview `id:null` + typed reference, không insert Place/TripPlace; chỉ INTERNAL/USER có UUID. Lưu Google vào itinerary và retention cần chốt trước Phase 4. Không lưu toàn bộ Google content vào DB hoặc hiển thị trên sơ đồ fallback. Thêm nguồn USER đòi hỏi chặn lookup UUID chéo tài khoản, kể cả initialPlaceIds của Trip create và lookup enrichment trong public planning. Chưa harden thì chưa bật custom writes.

**Module:** Place discovery và địa điểm riêng.

**Phụ thuộc:** Phase 2.

### API mới

| API | Input | Output |
| --- | --- | --- |
| `GET /places/suggestions` | `tripId,page,size` | Địa điểm gợi ý |
| `GET /places/autocomplete` | `q,sessionToken,latitude?,longitude?,locale` | Gợi ý tên/địa chỉ |
| `POST /places/resolve` | `googlePlaceId,sessionToken,locale` | Chi tiết địa điểm đã chọn |
| `GET /places/{placeId}` | ID, locale | PlaceDetail |
| `POST /places/custom` | `clientRequestId,name,address,latitude,longitude` | 201: địa điểm riêng |
| `POST /places/reverse-geocode` | `latitude,longitude,locale` | Địa chỉ tại ghim |
| `GET /users/me/saved-locations` | Pagination | Nhà riêng/nơi lưu trú |
| `POST /users/me/saved-locations` | `type,label,placeId` | Vị trí nhanh đã lưu |
| `DELETE /users/me/saved-locations/{id}` | ID | 204 |

Autocomplete trả tập gợi ý nhỏ có giới hạn thay vì Page database:

```text
{
  items[] { googlePlaceId, primaryText, secondaryText, resultType },
  sessionToken
}
```

```text
PlaceDetail {
  id?, reference, source,
  name, formattedAddress,
  latitude, longitude, provinceId?, category?,
  environmentType, openingHours?, openingStatus, businessStatus, openingStatusAsOf?,
  admission?, amenities[], tips[], description?,
  photos[] { url, attribution? },
  attribution?, dataAvailability, updatedAt?
}
```

### Frontend

- Debounce khoảng 300ms; hủy request cũ và bỏ response đến trễ.
- Không gọi Google mỗi lần render.
- Chọn kết quả: resolve → zoom map → hiện pin → xác nhận.
- Tìm được địa chỉ riêng, không giới hạn vào điểm du lịch.
- Địa chỉ thiếu POI: “Vị trí đã chọn”, địa chỉ thật, nhập tên riêng; không bịa giờ/giá vé.
- Không ảnh: dùng ảnh mặc định đã thiết kế.
- Lọc kết quả có trong chuyến bằng ID/reference, không theo tên.
- Chọn nhiều giữ local draft; chỉ ghi server khi bấm thêm.
- “Nhà mình” là dữ liệu riêng, không thành gợi ý công khai.
- Vị trí hiện tại xin quyền GPS ở client; từ chối quyền vẫn nhập địa chỉ được.

### Dữ liệu Google

Phân biệt catalog nội bộ, dữ liệu người dùng nhập và Google content. Không sao chép lâu dài toàn bộ nội dung Google vào DB rồi coi là dữ liệu sở hữu.

- Áp dụng giới hạn lưu/cache và attribution theo [chính sách Places](https://developers.google.com/maps/documentation/places/web-service/policies).
- Không chuyển ảnh Google Places sang Cloudinary như ảnh người dùng.
- Tách provider reference với bản ghi địa điểm nội bộ; chốt field được lưu và thời hạn trước triển khai.

**Nghiệm thu:** tìm điểm du lịch, địa chỉ nhà, kết quả rỗng, sai khu vực, provider lỗi, chọn pin/xác nhận; không tạo trùng ngoài ý muốn.

## 6. Phase 4 — Lịch trình từng ngày và đã ghé

**Module:** Itinerary và Live Trip.

**Phụ thuộc:** Phase 2–3.

Đây là phase nghiệp vụ trọng tâm, hoàn thành trước tối ưu/AI.

### API mới

| API | Input | Output |
| --- | --- | --- |
| `GET /trips/{id}/places` | `scheduled,page,size` | Điểm trong chuyến/pool |
| `POST /trips/{id}/places` | `clientRequestId,placeIds[],targetDate?` | Các điểm vừa thêm |
| `DELETE /trips/{id}/places/{tripPlaceId}` | ID, version | 204, loại khỏi chuyến |
| `GET /trips/{id}/days/{date}` | Ngày | DayDetail |
| `PATCH /trips/{id}/days/{date}` | `version,origin,startTime,returnToStart,transport,durations[]` | DayDetail |
| `POST /trips/{id}/days` | `version,date` | Ngày mới và Trip mới |
| `PATCH /trips/{id}/stops/{tripPlaceId}` | `version,targetDate?,arrivalTime?,durationMinutes,note,pinned` | Điểm và ngày bị ảnh hưởng |
| `DELETE /trips/{id}/days/{date}/items/{itemId}` | Version | Gỡ lịch, giữ trong pool |
| `PUT /trips/{id}/days/{date}/order` | `version,itemIds[]` | DayDetail |
| `PUT /trips/{id}/places/{tripPlaceId}/visit` | `visited,visitedAt?` | Trạng thái ghé mới |

```text
DayDetail {
  id, date, dayNumber, version,
  origin { placeId?, name, latitude, longitude }?,
  startTime?, returnToStart, transport,
  items[] {
    id, tripPlaceId, placeId, sequence,
    arrivalTime?, departureTime?, durationMinutes,
    pinned, note?, visited, visitedAt?, placeSummary
  },
  nextItemId?, routeSummary?, warnings[]
}
```

### Quy tắc

- MVP một địa điểm một lần trong một chuyến, phù hợp unique constraint hiện tại.
- Gỡ khỏi ngày khác với loại khỏi chuyến.
- Thêm nhiều/chuyển ngày/sửa thời lượng/reorder nguyên tử.
- Reorder phải có đúng tập item của ngày; không thiếu, trùng hoặc chèn item chuyến khác.
- Pin ngăn tối ưu tự di chuyển; người dùng vẫn chủ động sửa được.
- Phân biệt giờ cố định với giờ ước tính; không để tính đường ghi đè giờ người dùng đặt.
- Thiếu dữ liệu trả warning/giờ chưa xác định, không gán giờ giả.
- Origin chưa có trong Live thì ẩn node “Chưa đặt giờ”.
- Visit là xác nhận của người dùng, không bắt GPS hoặc ảnh.
- Visit/bỏ visit dùng chung nguồn dữ liệu cho Home/details.
- Tạo Memory không tự đánh dấu visited, giữ hành vi camera hiện tại.
- Ngày tương lai/pool không có thao tác “Đã ghé”.
- `visited=true` lặp lại không tạo check-in mới.
- Giới hạn số item/ngày và payload phải được ghi trong contract trước implementation; không trả lịch vô hạn trong một response.

### Undo

- Undo là mutation server có kiểm tra version, không đẩy nguyên snapshot Zustand lên dữ liệu thật.
- Lưu phần dữ liệu cần hoàn tác của thao tác vừa thực hiện.
- Chỉ hoàn tác nếu ngày chưa bị sửa tiếp.
- Version khác: thông báo lịch thay đổi và tải lại; không ghi đè thiết bị khác.

**Nghiệm thu:** sửa ngày → reorder → chuyển điểm → pin → visit; đúng sau reload và giữa Home/details.

## 7. Phase 5 — Google Maps và tuyến đường thật

**Module:** Map, location và routing.

**Phụ thuộc:** Phase 3–4.

### Frontend

- Android: spike SDK/package tương thích Expo SDK 57/New Architecture trên development build trước khi chốt dependency.
- Web: Google Maps JavaScript API qua component `.web`.
- Interface chung cho marker/polyline/selected item/bounds/camera movement.
- Giữ map 35%/80%, sticky header và thu gọn/mở lại đã thiết kế.
- Marker đúng số timeline; chạm focus đúng item.
- Điều phối gesture map và kéo sheet.
- Không đổi SDK/framework chỉ để tích hợp map.

### API mới

`POST /trips/{tripId}/days/{date}/route-preview`

Input:

```json
{
  "dayVersion": 5,
  "transport": "CAR"
}
```

Server lấy origin/thứ tự từ DB, không tin khoảng cách client gửi.

Output:

```text
{
  dayVersion, availability, provider, computedAt,
  encodedPolyline?, totalDistanceMeters?, totalDurationSeconds?,
  legs[] {
    fromItemId?, toItemId?, distanceMeters,
    durationSeconds, encodedPolyline?
  },
  warnings[]
}
```

### Quy tắc

- Map hiển thị đường, chưa phải turn-by-turn navigation.
- “Chỉ đường” mở map mở rộng như UI; hành động phụ có thể mở Google Maps để dẫn đường thực tế.
- Routes lỗi không làm mất timeline.
- Chưa có tuyến hợp lệ không hiện km/phút fixture.
- Xe máy không âm thầm tính như ô tô; thiếu hỗ trợ thì báo và cho chọn lại.
- Debounce tính đường sau chỉnh sửa; không gọi theo scroll/animation.
- Tách key Android/web/server và hạn chế theo package/SHA/referrer/API.
- Có quota, timeout, giới hạn waypoint và theo dõi chi phí.
- Không gọi matrix cho mọi điểm ngay khi mở màn hình.
- Không để control/sheet che attribution.

**Nghiệm thu:** marker khớp timeline; polyline đúng thứ tự; phương tiện có kết quả đúng; thiếu GPS/provider lỗi vẫn dùng được chuyến.

## 8. Phase 6 — Camera, upload ảnh và nhật ký

**Module:** Memory, Media và Journal.

**Phụ thuộc:** Phase 1–4.

### Luồng MVP

```text
Chụp/chọn ảnh
→ xử lý ảnh cục bộ
→ xem trước
→ xác nhận
→ upload qua backend
→ Cloudinary
→ lưu Memory/Media
→ cập nhật album và counter
```

Upload qua backend để kiểm soát file/ownership trong một luồng; chưa xây direct upload nhiều bước.

### API mới

| API | Input | Output |
| --- | --- | --- |
| `POST /memories` | Multipart `file` + `metadata` | 201: MemoryDetail |
| `GET /memories` | `tripId?,date?,favorite?,page,size` | Page&lt;MemorySummary&gt; |
| `GET /memories/{id}` | ID | MemoryDetail |
| `PATCH /memories/{id}` | `version,note?,experiencedAt?,favorite?` | Memory mới |
| `DELETE /memories/{id}` | ID, version | 204 |
| `GET /trips/{id}/journal` | `date?,page,size` | Memory có ngày/địa điểm để dựng nhóm |
| `GET /media/{mediaId}/access` | ID thuộc tài khoản | URL ngắn hạn, kích thước, expiry |

Metadata:

```json
{
  "clientRequestId": "uuid",
  "tripId": "uuid",
  "tripPlaceId": null,
  "experiencedAt": "2026-11-02T10:45:00+07:00",
  "note": ""
}
```

```text
MemoryDetail {
  id, tripId, tripPlaceId?, placeId?,
  note, experiencedAt, createdAt, favorite,
  media[] {
    id, thumbnailUrl, previewUrl, fullUrl,
    width, height, mimeType, bytes, expiresAt
  },
  version
}
```

### Lưu trữ và bảo mật

- MVP một ảnh cho mỗi lần lưu camera; chưa làm multi-upload khi UI chưa cần.
- JPEG/PNG/WebP hợp lệ, tối đa 10 MiB/ảnh.
- Kiểm tra MIME thực/decode, không tin tên file.
- Binary không lưu PostgreSQL.
- Cloudinary có quyền truy cập hạn chế, không URL public vĩnh viễn cho ảnh riêng.
- Secret chỉ backend; theo [upload có xác thực của Cloudinary](https://cloudinary.com/documentation/upload_images#authenticated_requests).
- Thumbnail/preview/full phục vụ từng mức hiển thị; không tải toàn album ảnh gốc.
- Không giữ DB transaction/lock trong khi gọi Cloudinary.
- Upload xong nhưng DB fail: dọn file hoặc ghi nhận cleanup retry.
- `clientRequestId` chống duplicate khi gửi lại.
- Không nhận URL tùy ý để server fetch ảnh.

### UX và viewer

- Hiện tiến độ/lỗi/retry; chỉ “Đã lưu” sau server xác nhận.
- Lỗi giữ ảnh preview trong phiên hiện tại để thử lại.
- Chưa có offline queue; không hứa giữ ảnh chưa upload khi đóng app.
- Counter từ server.
- Favorite chuyển từ state toolbar sang dữ liệu bền vững.
- Ghi chú nối PATCH Memory.
- Share/download dùng ảnh đã cấp quyền; URL hết hạn xin lại.
- Web không Web Share thì cho tải ảnh, không báo thành công giả.
- Xóa confirm và cập nhật query sau server thành công.
- Share MVP là file/văn bản, chưa album/link công khai.

**Nghiệm thu:** chụp → lưu → reload → album; retry không trùng; không đọc ảnh tài khoản khác; viewer vẫn mượt với album lớn.

## 9. Phase 7 — Weather và vali chuyến đi

**Module:** Weather và Packing.

**Phụ thuộc:** Phase 2, 5.

### API hiện có

| API | Input | Output hiện có |
| --- | --- | --- |
| `GET /public/weather/current` | `latitude,longitude` | Nhiệt độ, cảm giác, mưa, gió, condition, riskLevel |
| `GET /public/weather/forecast` | Tọa độ, ngày bắt đầu/kết thúc, `includeHourly` | `timezone,dailySummaries,providerName` |

### Bổ sung

- `fetchedAt`, thời điểm quan trắc, khoảng dự báo khả dụng, trạng thái nguồn.
- UV thật nếu provider hỗ trợ, nếu không trả null.
- Không trình bày fixture UV/score/giờ vàng như dữ liệu thật.
- Đợt đầu dùng mức thuận lợi từ riskLevel; chưa tự tạo score 8.5/10 thiếu mô hình đã kiểm chứng.
- Ngoài horizon: “Chưa có dự báo cho ngày này”; không lấy hiện tại thay tương lai.
- Live modal hiển thị thời tiết điểm đến; không gọi là thời tiết vị trí người dùng nếu chưa GPS.
- Chỉ lấy hourly khi mở ngày/modal, không cả chuyến 365 ngày.
- Weather lỗi chỉ ảnh hưởng widget.

### Vali V1 — lưu bền trên thiết bị (thay kế hoạch API)

Không triển khai API Packing cho V1. Checklist lưu tại thiết bị theo `(userId, tripId)`, có schema/version và khôi phục khi mở lại; không chỉ giữ trong component. Trạng thái persistence chưa triển khai, sẽ xử lý sau các lỗi chặn độ ổn định.

```text
PackingSummary {
  items[] { key, checked, reasonCode },
  checkedCount, totalCount, complete, forecastCoverage
}
```

- Checklist cho **cả chuyến**, đúng copy đã chốt.
- Gỡ app/xóa dữ liệu/đổi máy sẽ không giữ checklist; đổi tài khoản không dùng checklist của người khác. Không đồng bộ cloud trong V1.
- Gợi ý rule nhiệt độ/mưa/UV, không cần LLM.
- Forecast cập nhật không tự bỏ tick.
- Chưa có forecast vẫn xem checklist cơ bản, ghi rõ chưa cá nhân hóa.
- Animation/nhắc nhở nhẹ, không bắt buộc hoàn thành.

**Nghiệm thu:** đổi ngày đúng forecast; tick giữ sau restart/trên web; thiếu weather không crash hoặc đưa lời khuyên giả.

## 10. Phase 8 — Home, dấu ấn và các màn tổng hợp

**Follow-up 05/11/2026:** Home tài khoản chưa có chuyến đã nối vào query Trip và dùng lại `NewUserHomeScreen` với thiết kế preview gốc. Chỉ hiện khi query thành công và tổng số chuyến bằng 0; loading/error có trạng thái riêng. CTA tạo dùng API thật, ví dụ giữ sandbox. Các dashboard có chuyến, dấu ấn và dữ liệu tổng hợp vẫn theo phạm vi Phase 8; chưa coi phase này hoàn tất.

**Module:** Dashboard, Journey và Memories overview.

**Phụ thuộc:** Phase 2, 4, 6; weather ghép độc lập.

### API mới

| API | Input | Output |
| --- | --- | --- |
| `GET /home` | Locale | HomeSummary |
| `GET /users/me/journey` | Không | Thống kê |
| `GET /users/me/journey/provinces` | Pagination | Tỉnh/thành đã khám phá |
| `GET /users/me/places` | Pagination | Địa điểm có Memory |
| `GET /memories?size=6&sort=experiencedAt,desc` | Filter theo nhu cầu | Kỷ niệm gần đây |

```text
HomeSummary {
  serverTime, scenario,
  selectedTrip?, selectedDay?, nextStop?,
  completionTasks[],
  journeySummary {
    tripCount, placeCount, provinceCount, memoryCount, photoCount
  },
  recentMemories[], unreadNotificationCount
}
```

### Chọn trạng thái Home

1. Chuyến đang diễn ra.
2. Chuyến sắp đi gần nhất, kể cả còn thiếu thông tin.
3. Đã có chuyến trước đây, chưa có chuyến mới.
4. Người dùng mới.

- Nhiều chuyến đang đi: ưu tiên ngày bắt đầu gần nhất, rồi ID ổn định.
- Backend là nguồn quyết định; không suy từ trang đầu trips.

### Thống kê

- Tỉnh/thành khám phá theo Memory gắn Place có province, đúng tài liệu nghiệp vụ hiện tại.
- Chỉ thêm vào lịch không tăng “đã khám phá”.
- Visited và địa điểm có Memory là hai chỉ số khác nhau.
- Memory không gắn Place tăng memory/photo count, không tự suy tỉnh/thành.
- Xóa Memory cuối của Place cập nhật thống kê.

### Tải dữ liệu

- `/home` dùng DB query có giới hạn; không nối tiếp Google/weather/Cloudinary trong request.
- Weather tải riêng, không chặn Home.
- Recent memories tối đa sáu mục; mở album mới tải thêm.
- Mutation thật dùng invalidation/query update có phạm vi.
- Template minh họa cho người mới không tính là chuyến thật.
- Chỉ tạo chuyến từ template khi người dùng xác nhận.

**Nghiệm thu:** bốn trạng thái bằng DB; sửa/visit/xóa/ảnh mới đồng bộ các màn.

## 11. Phase 9 — Thông báo trong app và hồ sơ

**Chốt 08/11/2026:** thông báo/push nằm ngoài V1 báo cáo; các API Notification bên dưới chỉ là thiết kế hoãn lại. Giữ luồng hồ sơ đã tích hợp, không xây thêm Notification trước khi chốt độ ổn định.

**Module:** Notification và Profile.

**Phụ thuộc:** Phase 1, 2, 8.

MVP thông báo trong app; push và lịch nhắc nền ngoài đợt này.

### API mới

| API | Input | Output |
| --- | --- | --- |
| `GET /notifications` | `unreadOnly,page,size` | Page&lt;Notification&gt; |
| `GET /notifications/unread-count` | Không | `count` |
| `PUT /notifications/{id}/read` | `read` | Notification mới |
| `POST /notifications/read-all` | Không | 204 |

```text
Notification {
  id, type, title, body,
  tripId?, target?, readAt?, createdAt
}
```

- Dữ liệu có thật, không tạo notification mới mỗi lần mở Home.
- Deep link kiểm tra resource tồn tại và thuộc tài khoản.
- Empty/loading/error rõ ràng.
- Profile dùng `/users/me`, bỏ tên/email giả.
- Đổi VI/EN cập nhật query phụ thuộc locale; không đổi nội dung người dùng nhập.
- Không mở thêm tính năng tài khoản chưa có UI hoàn chỉnh.

**Nghiệm thu:** số chưa đọc đúng, đọc không lặp, profile/logout hoạt động Android/web.

## 12. Phase 10 — Kiểm thử tích hợp, hiệu năng và nghiệm thu MVP

**Module:** Quality, deployment và observability.

**Phụ thuộc:** Các phase nghiệp vụ trên.

### 12.1. Quy trình cho từng module

```text
Chốt OpenAPI
→ Migration và service backend
→ Unit/controller/integration tests
→ API hooks + mapper frontend
→ Thay một luồng preview
→ Kiểm thử Android + web
→ Tài liệu và nghiệm thu module
```

Không đợi xong toàn bộ backend mới nối frontend.

### 12.2. End-to-end

1. Register → email → login → tạo chuyến → tìm địa chỉ → thêm điểm.
2. Chọn ngày → sửa origin/giờ/thời lượng → reorder → reload.
3. Live → chỉ đường → visit → Home cập nhật.
4. Chụp → upload → album → favorite/note → share/download → xóa.
5. Sửa ngày chuyến → điểm về pool, Memory được giữ.
6. Xóa chuyến → list/Home/journal/stats loại dữ liệu đã xóa.
7. Hai phiên sửa một ngày → 409, không mất dữ liệu.
8. Logout/login tài khoản khác → không còn cache/ảnh tài khoản cũ.
9. Google/weather/Cloudinary lỗi → retry đúng module, phần khác hoạt động.

### 12.3. Hiệu năng

Mục tiêu staging ban đầu, cần ghi mức tải và môi trường khi đo; chưa là cam kết:

- CRUD/read DB thường: p95 khoảng 500ms hoặc thấp hơn.
- Home summary: p95 khoảng 700ms hoặc thấp hơn.
- Tách thời gian provider/upload khỏi thời gian DB.
- Đo số SQL, N+1, index owner/trip/date/deleted state.
- Không tải toàn ảnh gốc hoặc itinerary tất cả trips tại Home.
- Debounce search, cancel request cũ, không gọi theo frame animation.
- QA gesture trên Android thật và release build; web không thay thế native QA.
- Không Redis/Kafka/microservices/cache nhiều tầng khi chưa đo bottleneck.

### 12.4. Cấu hình/vận hành

- Staging tách DB/Google/Cloudinary/email khỏi production.
- CORS đúng origin web và header contract.
- HTTPS cho web camera/API production.
- Secrets không fallback literal trong production.
- Thu hẹp endpoint public/Actuator; planning demo không thuộc release route.
- Rate limit search/routes/upload/auth, giới hạn payload.
- Log request ID/thời gian/provider failure; không log token/ảnh/ghi chú/địa chỉ nhạy cảm.
- Backup DB, kiểm tra restore và migration.
- Cleanup media bằng trạng thái DB + job nhỏ; chưa cần message broker.
- Theo dõi tối thiểu: 5xx, latency, DB pool, upload failure, Google/Cloudinary usage, email failure.

### 12.5. Điều kiện phát hành MVP cơ bản

- Không fixture trong luồng thật.
- Không nút giả hoặc thành công giả.
- Auth bắt buộc ở cấu hình nghiệm thu.
- Không lỗi ownership/mất dữ liệu/upload trùng.
- Android/web đi toàn bộ luồng chính.
- Tối ưu/AI chưa đạt thì ẩn hoặc báo chưa khả dụng.
- OpenAPI, hướng dẫn môi trường và tiến độ cập nhật.
- Tuân thủ bộ test/backend testing skill khi triển khai; frontend kiểm tra TypeScript, contract và behavior. Không tự chạy lint trái yêu cầu hiện tại của người dùng.

Trong lần lập kế hoạch này chỉ đọc code/tài liệu, chưa chạy lại test hoặc chứng nhận production readiness.

## 13. Phase 11 — Planning, tối ưu và AI

**Module:** Optimization và AI Copilot.

**Phụ thuộc:** Trip/itinerary/place/routes thật đã ổn định.

Triển khai cuối theo lựa chọn của người dùng. Không nối UI thẳng vào endpoint demo rồi coi là hoàn tất.

### Tồn tại cần xử lý

- TSP/optimize-and-audit chưa phải luồng lưu chuyến hoàn chỉnh.
- Một số endpoint có cả public/private mapping.
- Draft generation/retrieval gắn `rag-demo`, giới hạn và dữ liệu demo.
- DTO có chỗ nhận 20 điểm nhưng solver cap **16**.
- Chưa giả định output giữ đúng fixed times/pins/visited/phương tiện.

### API nghiệp vụ mới

| API | Input | Output |
| --- | --- | --- |
| `POST /trips/{id}/days/{date}/optimization-preview` | `dayVersion,objective` | Preview tối ưu |
| `POST /trips/{id}/days/{date}/optimization-apply` | `dayVersion,orderedItemIds[],clientRequestId` | DayDetail đã áp dụng |

```text
OptimizationPreview {
  baseVersion,
  current { itemIds[], distanceMeters?, durationSeconds? },
  proposed { itemIds[], distanceMeters?, durationSeconds? },
  savings { distanceMeters?, durationSeconds? },
  warnings[], calculationStatus, generatedAt
}
```

### Hành vi

- Server đọc lịch đã lưu; không nhận điểm không thuộc trip.
- Preview không sửa DB.
- Kéo sửa thứ tự trong modal như UI hiện có.
- Sửa thứ tự preview phải tính lại số km/phút hoặc báo đang tính; không giữ tiết kiệm cũ.
- Apply kiểm tra membership/pins/version, tính tuyến theo thứ tự cuối.
- Live chỉ tối ưu phần chưa ghé, giữ lịch sử.
- Không thay giờ cố định/đổi ngày nếu chưa xác nhận.
- Thống nhất cap thuật toán, tính cả anchor nếu tham gia solver; quá cap giải thích và giữ thủ công.
- Chỉ công bố tiết kiệm khi hai phương án cùng provider/phương tiện/giả định.
- Không cải thiện thì thể hiện trung thực.
- AI giải thích/gợi ý, output có schema/validation, không tự ghi itinerary.
- Tối ưu xác định hoạt động khi AI không khả dụng.
- Request dài có loading/cancel/timeout; chưa tự thêm job queue trước khi đo.
- Trước public giới hạn điểm/ngày/tần suất/chi phí downstream.

**Nghiệm thu:** pin, origin, round-trip, phương tiện, giờ đóng cửa, thiếu weather, tràn ngày, visited, stale version, AI output không hợp lệ.

## 14. Thứ tự triển khai và nguyên tắc chốt

```text
0. Contract và nền tảng
→ 1. Auth
→ 2. Trip CRUD
→ 3. Places
→ 4. Itinerary + visited
→ 5. Maps + Routes
→ 6. Camera + Memory
→ 7. Weather + Packing
→ 8. Home + Journey
→ 9. Notification + Profile
→ 10. Nghiệm thu MVP Android/Web
→ 11. Optimization + AI
```

### Nguyên tắc

- Giữ UI đã chốt; chỉ điều chỉnh copy/state khi dữ liệu thật không có thông tin đang minh họa.
- Mỗi module có contract/migration/frontend integration/test/nghiệm thu riêng.
- Không fixture, thuật toán giả hoặc demo fallback trong production.
- Không offline sync/push/cộng tác/iOS trong đợt này.
- Ownership bắt buộc dù RBAC chưa hoàn thiện.
- Dependency mới đánh giá tương thích và xin phép theo quy định khi triển khai.
- Tiến độ phân biệt: **đã code / đã nối API / đã test / đã QA thiết bị / đã triển khai**.
- Không tự commit, nâng dependency hoặc thay framework khi chưa được yêu cầu.

### Checklist review trước khi triển khai

- [ ] Thống nhất contract và trạng thái Trip/mode/readiness.
- [ ] Xác nhận hành vi xóa chuyến và kỷ niệm liên quan.
- [ ] Xác nhận sửa ngày đưa điểm bị ảnh hưởng về pool.
- [ ] Chốt mapping ID và version cho mutation.
- [ ] Chốt schema và giới hạn từng endpoint trong OpenAPI.
- [ ] Kiểm tra Google project/billing/key restrictions/quota.
- [ ] Chuẩn bị Cloudinary và chính sách ảnh riêng tư.
- [ ] Chuẩn bị email, link và OAuth theo môi trường.
- [ ] Chốt fixture chỉ phục vụ development/test.
- [ ] Nghiệm thu từng module trước khi chuyển phase.

**Đích đến MVP:** đăng nhập → tạo chuyến → tìm địa điểm → xếp lịch → đi và đánh dấu → chụp/lưu kỷ niệm → nhìn lại hành trình, dùng cùng một nguồn dữ liệu thật trên Android và web.
