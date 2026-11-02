# Trip CRUD — Schema và hợp đồng tích hợp MVP

Ngày: **02/11/2026**, cập nhật **03/11/2026**. Phiên bản hợp đồng: **1.1.0**.

**Trạng thái:** đã triển khai create/list/detail/PATCH/date-preview/DELETE và nối UI sửa/xóa. GET destinations vẫn là đặc tả; không coi cả 7 operations đã hoạt động. Xem [Phase 2](PHASE-2-TRIP-MUTATIONS.md) và [hướng dẫn tích hợp](TRIP-API-INTEGRATION.md).

Tài liệu máy đọc: [trip-crud.openapi.json](api/trip-crud.openapi.json). Roadmap: [FRONTEND-BACKEND-INTEGRATION-PLAN.md](FRONTEND-BACKEND-INTEGRATION-PLAN.md).

## 1. Phạm vi và quyết định đã chốt

- Android + web; online; người dùng quản lý chuyến đi riêng của mình.
- **Không có draft trong MVP. Draft là luồng AI dự kiến sau này**, không suy từ việc chuyến chưa có địa điểm và không thêm `isDraft`/publish API.
- Tạo chuyến thành công ghi `status=PLANNING`; đến ngày đi sẽ hiển thị LIVE theo lịch, không cần người dùng kích hoạt hoặc AI hoàn thiện.
- Chỉ chốt Trip CRUD, danh mục điểm đến, cấu hình ngày tối thiểu và chính sách thay đổi ngày/xóa. Chưa code camera/media/weather/planning/AI.
- Không thay UI, chạy migration, thêm dependency hoặc viết controller trong bước này.
- Giữ enum backend hiện có `PLANNING,ACTIVE,COMPLETED,CANCELLED`. Không cho client tự ghi status trong create/patch. MVP chưa thêm nút bắt đầu/kết thúc/hủy chuyến.
- Bản nháp form chưa submit chỉ là local form state; không phải bản ghi Trip phía server.

## 2. Kết quả đối chiếu code hiện tại

| Nguồn | Hiện trạng | Quyết định tích hợp |
| --- | --- | --- |
| `trip/entity/Trip.java` | name/destination/dates, preferences TEXT, constraints TEXT, status | DTO dùng title; giữ cột name, bổ sung field có kiểu |
| `trip/repository/TripRepository.java` | Owner-scoped reads có sẵn, list trả toàn bộ | Dùng owner scope, thêm phân trang/projection |
| `BaseEntity` | UUID/audit/soft-delete, chưa version | Chỉ thêm `@Version` ở Trip, không ảnh hưởng mọi entity |
| V1 migration | trips, trip_places, itineraries/items, memories/media đã có | Không sửa V1; migration tiếp theo theo thứ tự thực tế |
| Form tạo | Destination 120, title 120, 365 ngày, budget tối đa 10^12 VND, 8 preferences | Backend dùng cùng giới hạn |
| Form sửa | Accommodation 200, notes 1000, cho sửa ngày quá khứ | Giữ giới hạn; sửa không áp rule startDate >= hôm nay |
| Preview store | createDraft luôn status=draft, initialStops đưa pool | Tích hợp thật bỏ draft; initialPlaceIds vẫn vào pool, không tự xếp ngày |
| TripStop.id | Đang dùng chung cho nhiều vai trò | Tách placeId/tripPlaceId/itineraryItemId ở API |
| Đổi ngày preview | Giữ ngày trùng, điểm ngày mất đưa pool | Giữ nguyên nguyên tắc này, thêm version + xác nhận server |
| Cover/thống kê | Có fixture | Không đưa ảnh/con số fixture vào dữ liệu server |

Không có CRUD controller Trip tại thời điểm khảo sát. Schema/OpenAPI bên cạnh là đích triển khai mới.

## 3. Trạng thái, ngày và định danh

### 3.1. Status lưu và mode hiển thị

`status` là field read-only trong API CRUD này, vẫn giữ các giá trị backend có sẵn. `mode` được tính khi đọc, không có cột riêng và không cần cron chuyển trạng thái.

Áp dụng lần lượt:

1. `CANCELLED` → `CANCELLED`.
2. `COMPLETED` → `RECAP`.
3. Thiếu khoảng ngày hợp lệ ở dữ liệu cũ → `PLANNING`, `readiness.hasDates=false`.
4. Hôm nay trước startDate → `PLANNING`.
5. startDate <= hôm nay <= endDate → `LIVE`.
6. Hôm nay sau endDate → `RECAP`.

`PLANNING`/`ACTIVE` đều dùng quy tắc ngày ở bước 3–6; không để giá trị ACTIVE cũ khóa chuyến ở Live mãi. Chuẩn hóa dữ liệu bất thường riêng trong migration audit, không cập nhật DB bằng GET.

- Hôm nay lấy từ server `Clock` và timezone của chuyến, không dùng MOCK_TODAY/client clock.
- Ngày bắt đầu/kết thúc tính bao gồm cả hai đầu. 00:00 ngày bắt đầu là Live; 00:00 ngày sau endDate là Recap.
- Giới hạn MVP timezone **Asia/Ho_Chi_Minh**. Chưa nhận các timezone khác; không dùng offset +07:00 thay IANA ID.
- Response có `serverTime`, `evaluatedDate` để UI biết mode được tính khi nào; refetch khi app foreground/qua nửa đêm.
- Recap theo ngày không tự chứng minh có trải nghiệm, không tự tăng số tỉnh/thành khám phá. Quy tắc thống kê giữ ở phase Journey.
- Không ghép lại enum `draft/planned` để điều khiển UI thật. Mode server là nguồn chính.

### 3.2. ID

| Field | Ý nghĩa |
| --- | --- |
| tripId | UUID chuyến đi |
| placeId | UUID địa điểm nội bộ; không phải Google place ID |
| tripPlaceId | UUID liên kết trip_places |
| itineraryItemId | UUID điểm đã xếp lịch |
| dayId | UUID cấu hình ngày, khác date và dayNumber |

MVP một Place xuất hiện tối đa một lần trong một Trip, giữ unique `(trip_id,place_id)`. Provider ID không được gửi thay UUID vào initialPlaceIds.

## 4. Field và validation

Độ dài chuỗi được đo bằng số UTF-16 code units để khớp Java String/JS/Zod hiện tại. Chuỗi được trim, không đổi tên riêng theo locale.

| Field | Create | PATCH | Giới hạn/hành vi |
| --- | --- | --- | --- |
| clientRequestId | Bắt buộc UUID | Không nhận | Chống tạo trùng theo owner |
| title | Optional string | Nếu có: string không rỗng | Tối đa 120; create bỏ trống sau trim → destination.name |
| destination | Bắt buộc object | Nếu có: thay toàn bộ object | name 1–120; provinceId optional UUID nội bộ |
| startDate/endDate | Bắt buộc | Nếu sửa phải gửi cả hai | Date thật, end >= start, 1–365 ngày |
| timeZone | Optional, default Asia/Ho_Chi_Minh | Không cho sửa | Chỉ timezone MVP đã nêu |
| budget | Optional/null | null để xóa | `{amount,currency}`; amount nguyên 0–10^12, currency VND |
| preferences | Optional, default [] | Thay nguyên mảng | Tối đa 8, không trùng, enum bên dưới |
| accommodation | Optional/null | null để xóa | Trim, tối đa 200; rỗng → null; chỉ text, chưa lưu nơi ở dạng Place |
| notes | Optional/null | null để xóa | Trim, tối đa 1000; rỗng → null |
| initialPlaceIds | Optional, default [] | Không nhận | Tối đa 100 UUID không trùng, tất cả phải truy cập được |
| version | Không nhận | Bắt buộc integer >= 0 | Version Trip đọc gần nhất |
| acknowledgeDateImpact | Không nhận | Optional, default false | Chỉ dùng khi đổi ngày làm mất lịch của điểm đã xếp |

Preferences giữ nguyên ID frontend:

```text
nature, food, culture, relaxation,
photography, adventure, shopping, beach
```

Quy tắc bổ sung:

- Create không cho ngày bắt đầu trước hôm nay theo timezone chuyến; tạo cùng ngày được.
- PATCH được sửa ngày quá khứ cho phép hiệu chỉnh lịch sử. Chuyến CANCELLED chỉ đọc/xóa; PATCH trả 409.
- PATCH thiếu field → giữ nguyên; null chỉ được dùng cho budget/accommodation/notes hoặc provinceId trong object destination.
- Không có changes hợp lệ ngoài version/control flag → 400. Field lạ/read-only trong request → 400; không bind entity trực tiếp.
- Destination PATCH thay cả name/provinceId; provinceId không gửi thì xóa liên kết province. Không tự xóa/đổi tọa độ Place trong trip.
- Không nhận latitude/longitude do tự geocode text destination. Trip CRUD không gọi Google; route/weather dùng origin/Place thật ở phase sau.
- Không có tọa độ/giờ/giá vé thì để thiếu, không mượn fixture.
- Không áp PREVIEW_ENTRY_LIMIT=20 lên dữ liệu thật.

## 5. DTO đọc

```text
TripSummary {
  id: UUID,
  title: string,
  destination: { name: string, provinceId: UUID|null },
  startDate: date|null, endDate: date|null,
  timeZone: "Asia/Ho_Chi_Minh",
  status: PLANNING|ACTIVE|COMPLETED|CANCELLED,
  mode: PLANNING|LIVE|RECAP|CANCELLED,
  readiness: { hasDates: boolean, hasPlaces: boolean, unscheduledCount: integer },
  dayCount: integer, stopCount: integer, memoryCount: integer,
  coverImageUrl: string|null,
  version: integer,
  createdAt: UTC instant, updatedAt: UTC instant
}

TripDetail = TripSummary + {
  budget: { amount: integer, currency: "VND" }|null,
  preferences: Preference[], accommodation: string|null, notes: string|null,
  days: { id: UUID, date: date, dayNumber: integer }[]
}

TripReadContext { serverTime: UTC instant, evaluatedDate: date }
```

- Single read/create/update: `data = { trip: TripDetail, context: TripReadContext }`.
- List: `data = { content: TripSummary[],page,size,totalElements,totalPages,context }`.
- Null được trả rõ cho các field nullable. API không trả entity/User/constraints/request hash.
- days tăng dần theo date; dayNumber tính từ startDate, không lưu số thứ tự tách biệt.
- stopCount đếm distinct TripPlace, gồm pool. unscheduledCount đếm TripPlace chưa có item trong itinerary chính.
- memoryCount chỉ đếm Memory chưa soft-delete thuộc chuyến còn hoạt động. Phase chưa có Memory thì query DB trả đúng 0, không hardcode giả.
- coverImageUrl=null cho tới khi có media hợp lệ. Thumbnails mẫu do UI fallback, không lưu URL asset fixture vào DB.
- List không tải days/items/media để đếm trong Java; dùng projection/aggregate có giới hạn.

## 6. Endpoint chi tiết

Tất cả dưới `/api/v1`, bắt buộc Bearer token, header Accept-Language: vi/en. Owner lấy authentication context. Chưa xây phân quyền actor chi tiết nhưng không được bỏ ownership.

### 6.1. POST /trips

```json
{
  "clientRequestId": "53e01bb8-6dbf-4368-b4f7-39289ec53913",
  "title": "Khám phá Đà Lạt",
  "destination": { "name": "Đà Lạt", "provinceId": null },
  "startDate": "2026-11-20",
  "endDate": "2026-11-22",
  "timeZone": "Asia/Ho_Chi_Minh",
  "budget": { "amount": 3000000, "currency": "VND" },
  "preferences": ["nature", "photography"],
  "accommodation": null,
  "notes": null,
  "initialPlaceIds": []
}
```

- 201 lần đầu, 200 replay cùng key/cùng payload; envelope TripDetail + context.
- Response Location: `/api/v1/trips/{id}` ở lần tạo mới.
- Một transaction tạo Trip + một itinerary mặc định + ngày + TripPlace ban đầu vào pool.
- initialPlaceIds không tự xếp ngày 1, không gán giờ, visited hoặc pin.
- Validate tất cả ID/quyền trước commit; một ID sai làm rollback toàn bộ.
- Ngoại lệ: danh mục địa điểm chưa tích hợp thì UI gửi [] và thêm điểm sau; không chuyển fixture thành UUID hoặc âm thầm bỏ điểm đã chọn.
- Unique `(user_id,client_request_id)` + fingerprint canonical normalized request. Cùng key khác payload → TRIP_004/409. Hai request cùng lúc chỉ tạo một Trip.
- Chỉ loại create-only validation phụ thuộc thời điểm (startDate >= today) khỏi replay cùng payload đã thành công; replay ngày hôm sau vẫn nhận Trip hiện tại. Payload cấu trúc vẫn được validate.
- Nếu key trỏ tới Trip đã soft-delete → 404, không tạo Trip thay thế. Một lần tạo chủ động mới phải có key mới.
- Replay trả dữ liệu hiện tại, không khôi phục response cũ và không hoàn tác chỉnh sửa đã có.
- Không tạo infrastructure idempotency tổng quát cho cả hệ thống chỉ để xử lý endpoint này.

### 6.2. GET /trips

Query: `page=0&size=20&sort=createdAt,desc`, optional `mode`, `q`.

- page >=0; size 1–100; q trim, tối đa 120; không phân biệt hoa thường, tìm literal substring trong title/destination.
- q rỗng tương đương không lọc; không hứa tìm không dấu ở Trip list đợt đầu.
- mode đúng enum read, lọc bằng cùng quy tắc ngày với DTO trước phân trang, không lọc trang đã lấy trong Java.
- sort whitelist: createdAt/updatedAt/startDate, mỗi lần một field asc/desc; thêm id cùng chiều; null startDate cuối.
- Không nhận sort theo field entity tùy ý. Page vượt cuối trả content=[], totals thật.
- List chỉ Trip của owner, deleted_at IS NULL.
- context dùng cùng Clock instant cho cả request. MVP một timezone cố định giúp filter SQL nhất quán.

### 6.3. GET /trips/{tripId}

- 200 envelope TripDetail + context.
- UUID sai → COMMON_008/400; không tồn tại/deleted/owner khác → cùng TRIP_001/404.
- Không gọi provider bên ngoài. Không lấy toàn itinerary item/ảnh trong DTO metadata này.

### 6.4. PATCH /trips/{tripId}

```json
{
  "version": 3,
  "title": "Đà Lạt cùng gia đình",
  "budget": null,
  "notes": "Mang áo khoác"
}
```

- Không đổi lịch: patch metadata rồi trả 200 envelope mới.
- Có đổi ngày: kiểm tra version, ngày và impact trong cùng transaction. Không gọi Routes/weather/AI.
- Version stale → TRIP_002/409, UI giữ form, refetch rồi cho người dùng xem lại; không tự retry với version mới.
- Nếu body chỉ lặp giá trị đang có: thành công, không tăng version/updatedAt khi không có thay đổi.
- Nếu có thay đổi: version tăng một lần; toàn operation atomic.
- Initial date impact check đã đọc trước không thay thế kiểm tra lại khi commit.
- Cập nhật child schedule sau này phải tăng version Trip khi làm đổi metadata/impact (range, place membership, lịch xếp ngày). Thao tác note/favorite Memory riêng không làm tăng Trip version.

### 6.5. POST /trips/{tripId}/date-change-preview

Input:

```json
{ "version": 3, "startDate": "2026-11-21", "endDate": "2026-11-22" }
```

Output data:

```json
{
  "baseVersion": 3,
  "startDate": "2026-11-21",
  "endDate": "2026-11-22",
  "dayCount": 2,
  "removedDates": ["2026-11-20"],
  "addedDates": [],
  "movedToPoolCount": 2,
  "requiresAcknowledgement": true
}
```

- Stateless, chỉ đọc, không lưu preview token/snapshot/job.
- Giữ nguyên các ngày trùng date, dayId và cấu hình; ngày mới dùng default.
- Ngày bị loại: itinerary item được gỡ khỏi lịch active bằng `removed_at` (V11), TripPlace còn lại trong pool; note/duration/visited của TripPlace được giữ. Các appointment cũ giữ nguyên note, start/end time và mọi dữ liệu khác để không mất dữ liệu legacy. Không ghi đè ghi chú của TripPlace hoặc tạo shadow item store. Source of truth của pool là TripPlace; lịch active là các item `removed_at IS NULL`. Phase Itinerary sau này phải dùng cùng quy tắc và xử lý migration/recovery dữ liệu appointment đã lưu. Pin chưa có cột backend nên không tự tạo hoặc suy diễn pin.
- Memory/media/experiencedAt không đổi. Memory không phụ thuộc bắt buộc vào dayId sắp bị gỡ.
- Chỉ requiresAcknowledgement khi movedToPoolCount >0. Bỏ ngày rỗng không cần confirm riêng.
- PATCH thiếu acknowledgeDateImpact=true khi impact có điểm → TRIP_003/409, không ghi gì; client mở confirm với dữ liệu preview rồi PATCH cùng version.
- Không tự dịch điểm từ ngày 20 sang ngày 21 khi đổi startDate; giao nhau theo calendar date.

### 6.6. DELETE /trips/{tripId}?version=3

- version integer >=0 bắt buộc trong query, không body DELETE, không thêm header ETag/If-Match ở MVP.
- Check owner trước khi tiết lộ conflict. Stale version trên Trip còn tồn tại → 409.
- Soft delete Trip và Memory liên quan trong cùng transaction; mọi query con phải chặn truy cập qua Trip đã xóa.
- Không xóa Places dùng chung, user hoặc Memory ngoài chuyến.
- Giữ metadata/file reference cho quy trình cleanup ở phase Media; không gọi Cloudinary trong request Trip CRUD.
- Lặp lại DELETE đúng owner trên Trip đã deleted trả 204; version được validate cấu trúc nhưng không buộc khớp phiên bản sau delete. Unknown/owner khác trả 404.
- API đọc sau đó 404. Không có restore API MVP.
- Confirm UI đổi copy từ “xóa khỏi phiên xem trước” sang nội dung dữ liệu thật khi nối API.

### 6.7. GET /destinations

- `q,page,size`, mặc định page0/size20; max100; q trim max120.
- Dùng danh mục Province nội bộ; không gọi Places/Google khi mở picker.
- Mỗi item `{id,code,name}` là Province. Client gửi selected item.id thành destination.provinceId, và name hiển thị phù hợp.
- Tên thành phố như Đà Lạt vẫn được nhập ở destination.name khi chưa có danh mục city; provinceId nullable, không dùng ID tỉnh giả làm ID thành phố.
- Seed “63 tỉnh/thành” trong V1 là dữ liệu lịch sử cần kiểm kê theo nguồn hành chính hiện hành trước production; task này không tự thay danh mục hoặc mã.
- Page có metadata giống chuẩn; không trả tất cả không giới hạn. Trip vẫn tạo với name + provinceId=null nếu master data chưa sẵn sàng.

## 7. Migration và nguồn dữ liệu — kế hoạch triển khai

Chưa chạy migration trong lần chốt contract này. Số V kế tiếp phải lấy từ thư mục migration tại thời điểm code, không sửa hoặc hardcode lại V1–V9.

### 7.1. Trip

Giữ các cột name/destination/status/audit/deleted_at; bổ sung:

| Cột | PostgreSQL đề xuất | Hành vi |
| --- | --- | --- |
| time_zone | varchar(64) NOT NULL | Backfill Asia/Ho_Chi_Minh |
| version | bigint NOT NULL DEFAULT 0 | @Version chỉ Trip |
| destination_province_id | UUID NULL FK provinces | Không đổi nghĩa destination text |
| budget_amount | bigint NULL | 0..10^12 |
| budget_currency | varchar(3) NULL | Cùng null với amount, nếu có VND |
| accommodation | varchar(200) NULL | Không dùng constraints TEXT để giấu form data |
| notes | varchar(1000) NULL | Ghi chú trip |
| client_request_id | UUID NULL | Required cho create mới; nullable cho legacy |
| create_request_hash | varchar(64) NULL | SHA-256 normalized create body, không chứa token |

- preferences đang TEXT: chuẩn hóa JSON array qua converter có kiểu, giữ column để tránh migration jsonb không cần thiết. Enum Java ID mapping đúng 8 giá trị frontend.
- Không tự ép preferences/constraints legacy không đọc được thành [] rồi làm mất dữ liệu. Inventory và xuất lỗi migration để xử lý; không dùng constraints cho field mới.
- DB checks ngày theo cặp/null legacy, range1–365 khi có; budget, currency, timezone.
- Không đặt CHECK start_date >= CURRENT_DATE: chuyến sẽ thành quá khứ hợp lệ theo thời gian.
- Không siết name/destination legacy xuống120 bằng cắt chuỗi tự động. Validator áp create/update mới; audit/backfill dữ liệu cũ có báo cáo.
- Unique `(user_id,client_request_id)` giữ cả soft-deleted rows, không tái sử dụng key đã xóa.
- Index hữu dụng ban đầu: owner + createdAt + id, partial deleted_at IS NULL. Không thêm index cho mọi field không đo.

### 7.2. Itinerary và ngày

- MVP một itinerary chính/mặc định mỗi Trip. Kiểm kê/tránh duplicate trước khi thêm unique trip_id cho mô hình một itinerary.
- Thêm trip_days: id, trip_id FK, date, start_place_id nullable, start_location nullable, start_time nullable, return_to_start defaultfalse, transport default CAR, created_at, updated_at.
- Unique `(trip_id,date)`; ngày không nằm trong range bị chặn tại service trong transaction. days DTO không bao stops.
- Tạo trip và days cùng transaction, tối đa365 dòng, không gọi365 lần API.
- Backfill days theo calendar date hợp lệ của Trip cũ. Range thiếu vẫn đọc được với days=[], hasDates=false; sửa cung cấp cả hai ngày.
- Item hiện tham chiếu itinerary_id/place_id/date; không đổi hàng loạt FK trong phase CRUD. Khi nối lịch trình, liên kết tripPlace/resolve uniqueness trước; chưa tạo shadow item store.
- trip_places giữ nguồn membership và pool; itinerary_items giữ lịch hẹn. Readiness không cần thêm cột đếm rồi đồng bộ thủ công.

### 7.3. Xóa liên quan

- Chưa có entity Memory/Media cũng không được hardcode “chưa có dữ liệu”. Service delete phải xử lý bảng memories hiện hữu hoặc chứng minh schema không có dữ liệu liên quan trong kiểm thử tích hợp.
- Media physical cleanup là phase sau; sau Trip delete mọi API Memory/Media vẫn phải kiểm tra parent và owner.
- Không bật cascade REMOVE từ Trip tới Place.

## 8. Lỗi và bảo vệ dữ liệu

Theo pattern ErrorCode hiện tại: tên enum có thể rõ nghĩa, wire code dùng prefix + số. Roadmap từng có TRIP_VERSION_CONFLICT minh họa; contract chi tiết này chốt wire code bên dưới.

| Code | HTTP | Ý nghĩa |
| --- | --- | --- |
| COMMON_003 | 400 | Field/cross-field validation (errors map) |
| COMMON_006 | 400 | JSON hỏng/field request không nhận |
| COMMON_008 | 400 | UUID/query sai kiểu |
| AUTH_001 | 401 | Chưa đăng nhập/access token không hợp lệ |
| AUTH_007 | 403 | Account khóa/xóa, theo auth hiện có |
| TRIP_001 | 404 | Trip không có/đã xóa/owner khác |
| TRIP_002 | 409 | Version conflict |
| TRIP_003 | 409 | Đổi ngày cần xác nhận đưa điểm về pool |
| TRIP_004 | 409 | clientRequestId đã dùng cho payload khác |
| TRIP_005 | 400 | provinceId/initialPlaceIds không hợp lệ hoặc không được truy cập |
| TRIP_006 | 409 | Trip CANCELLED chỉ đọc/xóa |

- ErrorResponse giữ nguyên envelope backend; errors map tên field đúng request như startDate, destination.provinceId, initialPlaceIds.
- Không trả tên/email owner khác, stack trace, câu SQL hoặc dữ liệu Place riêng để giải thích 404/invalid reference.
- Request body có giới hạn; không retry POST create bằng key mới khi timeout; không blind retry409.
- Log requestId + operation + thời gian, không log raw notes hoặc địa chỉ riêng. Auth/session không thay trong task này.

## 9. Mapping frontend và trình tự code tiếp theo

### 9.1. Thay nguồn dữ liệu, không thay bố cục

- API layer mới ở feature trip: endpoints, DTO schema, mapper, query keys và hooks.
- Create form gửi destination object, budget object/null, preferences enum và initialPlaceIds thật; không gửi initialStops object từ fixture.
- Đổi createDraft thành create mutation ở nhánh API; giữ nhánh preview độc lập. Create thành công mới đóng form/navigate bằng server UUID.
- Retry lần submit bất định dùng lại clientRequestId của đúng snapshot payload. Người dùng sửa payload sau lỗi phải tạo key mới; không dùng lại key cũ với payload mới.
- List dùng useInfiniteQuery hoặc page queries; không copy về Zustand. Detail dùng query khác, cùng cache key owner/session.
- Mapper display giữ title server (không thay theo locale), format dates tại UI; mode từ server, không getTripStatus(draft/planned) trên dữ liệu thật.
- Data query nullable không bị map thành ngày mặc định/nhiệt độ/ảnh/stop giả.
- Sau PATCH invalidate detail + list + Home; sau DELETE remove cache liên quan và về list; logout clear cache.
- Pending/error/retry bằng UI hiện có; 409 giữ form người dùng, không silently overwrite.
- Các chức năng itinerary chưa nối API giữ trong preview hoặc disable rõ ở bản tích hợp thử, không mutateTrip local lên một Trip đã lưu server rồi báo thành công.

### 9.2. Thứ tự triển khai đầu tiên

1. Review contract MD/OpenAPI này.
2. Kiểm tra auth thật với một tài khoản owner A/B, chưa bật bypass ở cấu hình tích hợp.
3. Migration Trip/trip_days và typed persistence.
4. POST/GET list/GET detail với owner + idempotency.
5. Nối tạo → list → detail → reload (initialPlaceIds=[] tới khi Place API sẵn sàng).
6. PATCH + date preview + delete + test transaction/concurrency.
7. Nối form sửa/xóa, nghiệm thu Android/web.
8. Phase Places/Itinerary tiếp theo; planning/AI vẫn để cuối.

## 10. Test matrix và tiêu chí nghiệm thu

| Nhóm | Case bắt buộc |
| --- | --- |
| Create | Full/minimal; title fallback; zero budget khác null; preference invalid/duplicate; invalid real date; range1/365/366; start quá khứ |
| Idempotency | Cùng key/cùng body; default/trim canonical; khác payload409; hai request song song một Trip; replay qua hôm sau; deleted key không tái tạo |
| Ownership | A list không có B; A đọc/sửa/xóa/preview Trip B cùng404; private Place B không add được |
| Mode | Trước/bắt đầu/kết thúc/sau endDate; clock UTC đổi ngày VN; COMPLETED/CANCELLED ưu tiên; ACTIVE cũ không mắc Live; legacy null dates |
| List | Empty, page cuối/vượt cuối, maxsize, invalidsort, literal q, mode trước paging, stable tie ID |
| PATCH | Missing giữ/null xóa; field lạ400; readonly400; chỉversion400; no-op giữversion; hai update cạnh tranh một409 |
| Dates | Giữ ngày giao nhau/dayId; thêm ngày default; removed empty không confirm; removed cóitem cầnconfirm; rollback toàn bộ khi lỗi; giữ TripPlace/Memory/visited |
| Delete | Softdelete và Memory; parent queries blocked; Place không xóa; replay204; stale409; atomic rollback |
| DB | Flyway fresh+upgrade, schema validate, unique/index/checks, PostgreSQL Testcontainers; không chỉ mock repository |
| Frontend | Response Zod; requests đúng keys; pending doubletap; retry key; error field; pagination; nofixture fallback; cache logout |
| E2E | Auth thật → tạo → list → detail → reload → sửa → xóa; Android và web |

- Backend test theo skill testing-mastery khi bắt đầu viết test; không hạ yêu cầu transaction/security để chạy nhanh.
- Contract được kiểm tra parse JSON, internal $ref và ví dụ; điều đó không thay integration test.
- Bước đặc tả này không chạy app test/lint/backend build vì chưa thay code; chưa tuyên bố API hoạt động.

## 11. Mốc bàn giao đặc tả (trước khi triển khai)

- Đã đối chiếu và chốt contract/schema đề xuất.
- Đã ghi rõ draft AI ngoài MVP, status khác mode, owner/version/idempotency, date impact và soft delete.
- Chưa tạo migration/controller/service/query hooks; chưa sửa preview/UI/auth/configuration.
- Bước kế tiếp là implement vertical slice **create → list → detail → reload** sau review, rồi PATCH/delete; không triển khai planning trong đợt đó.
