# QA-4 — Địa điểm nội bộ và cấu hình Mapbox

Cập nhật **06/11/2026**. Người dùng chọn hoàn tất danh mục nội bộ và cấu hình Mapbox trước; **chưa thêm Mapbox SDK hoặc thay bản đồ native/web trong lượt này**. Google OAuth giữ nguyên. Tài liệu này cập nhật hướng provider của đặc tả Phase3 ngày 03/11; chưa tuyên bố toàn bộ QA-4 đã nghiệm thu.

## Phần đã nối

- Form tạo chuyến mở picker thật; gửi UUID Place trong `initialPlaceIds`. Không gửi fixture/provider ID/TripPlace ID vào trường này.
- Gợi ý lấy từ `places` gắn `place_retrieval_profiles.approved=true`, `source=INTERNAL`, phân trang theo Province hoặc chuyến thuộc owner; loại các điểm đã có. Không dùng embedding/AI/Mapbox để đọc catalog này. Tìm tên/địa chỉ nội bộ không phân biệt dấu/hoa thường; `%`, `_`, `\` là ký tự thường. Không đoán Province từ destination tự nhập.
- Chi tiết Place dùng dữ liệu máy chủ. Thiếu ảnh/giá vé/giờ hoạt động/thời lượng phải hiện thiếu, không mượn giá hoặc thời gian 45 phút từ fixture.
- Chi tiết chuyến hiển thị danh sách Place đã lưu, thêm nhiều điểm bằng batch nguyên tử. Retry cùng UUID giữ link cũ và metadata, không nhân đôi. Danh sách/count được invalidation sau thành công.
- Điểm mới ở **Chờ xếp lịch**, chưa gán ngày/giờ. Lịch trình thuộc phase tiếp theo; UI ghi rõ giới hạn này.
- Có loading/error/empty/retry, debounce và AbortSignal. Lỗi không đổi sang catalog mẫu. Giữ lựa chọn khi lỗi lưu; khóa double submit/Back khi lưu; có thể xóa toàn bộ lựa chọn cũ trong form tạo.

## API để test Postman

Prefix `http://localhost:18081/api/v1`, Bearer token. OpenAPI runtime: [places-qa4.openapi.json](api/places-qa4.openapi.json). Không tạo Postman Collection.

| Method/path | Input | Kết quả |
| --- | --- | --- |
| GET `/places/suggestions` | `tripId` **hoặc** `provinceId`; `q` max 200, `page=0,size=20` (max 100), `locale=vi|en` | Page PlaceSummary; reason null/DESTINATION_NOT_LINKED/EMPTY_CATALOG |
| GET `/places/{placeId}` | UUID Place, locale | PlaceDetail INTERNAL/USER của owner; unknown/foreign cùng 404 PLACE_001 |
| POST `/trips/{tripId}/places/batch` | `{"placeIds":["UUID_PLACE_1","UUID_PLACE_2"]}`, 1–50 UUID khác nhau | 200 ApiResponse mảng TripPlace, toàn bộ commit/rollback, retry không nhân đôi |
| GET `/trips/{tripId}/places` | UUID chuyến của owner | Danh sách membership đã lưu, id=TripPlace, placeId=Place |
| GET `/places/addresses` | q 3–200, locale; lat/lng tùy chọn phải đi cùng | Preview Mapbox tạm; mặc định 503 PLACE_004 khi chưa bật |

`suggestions` mở rộng cho trước-khi-tạo-chuyến: provinceId lấy từ API Destinations. Không có cả trip/province trả empty DESTINATION_NOT_LINKED; gửi cả hai trả 400. Trip khác owner/đã xóa trả 404 trước khi đọc catalog. Batch có một ID sai/không được đọc trả 404, không thêm điểm nào.

```http
GET http://localhost:18081/api/v1/destinations?q=da%20nang
GET http://localhost:18081/api/v1/places/suggestions?provinceId=<id_tu_destinations>&q=son%20tra&page=0&size=20&locale=vi
GET http://localhost:18081/api/v1/places/<place_id>?locale=vi
GET http://localhost:18081/api/v1/trips/<trip_id>/places
Authorization: Bearer <access_token>
```

```http
POST http://localhost:18081/api/v1/trips/<trip_id>/places/batch
Authorization: Bearer <access_token>
Content-Type: application/json

{"placeIds":["UUID_PLACE_LAY_TU_SUGGESTIONS"]}
```

Để tạo chuyến kèm điểm, dùng body Trip CRUD hiện có và thay `initialPlaceIds:[]` bằng UUID từ suggestions. Không dùng UUID minh họa thành dữ liệu thật.

## Mapbox có đáp ứng nhu cầu?

| Nhu cầu | Hướng sử dụng |
| --- | --- |
| Bản đồ, marker, zoom, đường nối | Mapbox Maps phù hợp; SDK tích hợp sau khi duyệt dependency và có token |
| Tìm số nhà/đường/địa chỉ | Geocoding v6; cần đo độ chính xác bằng địa chỉ Việt Nam thực tế |
| POI du lịch/quán ăn | Giữ catalog nội bộ. Geocoding v6 không cung cấp POI |
| Tuyến đường, km/phút | Directions/Matrix ở bước bản đồ/lịch trình; giữ thuật toán tối ưu hiện có |
| Giá vé, ảnh, giờ mở cửa, tiện ích | Nguồn nội bộ có quyền sử dụng hoặc người dùng cung cấp; không suy từ địa chỉ |
| Địa chỉ riêng lưu lâu dài | Phân biệt dữ liệu tự nhập/GPS với kết quả provider; chốt quyền lưu trước khi ghi Postgres |

[Search Box docs](https://docs.mapbox.com/api/search/search-box/) hiện ghi Mỹ/Canada/Châu Âu và chỉ cho dùng kết quả tạm. [Blog mở rộng](https://www.mapbox.com/blog/mapbox-search-box-api-expanded-poi-coverage-smarter-search) nói thêm nhiều quốc gia nhưng chưa xác nhận Việt Nam cụ thể. Không bật Search Box cho MVP hoặc hứa chất lượng ngang Google trước khi xác minh coverage và test thực tế.

### Ngân sách

[Bảng giá kiểm tra 06/11/2026](https://www.mapbox.com/pricing): Maps Mobile có mốc miễn phí 25.000 MAU/tháng; GL JS 50.000 map loads; Temporary Geocoding 100.000 requests. Đây là các quota riêng. React Native cần đối chiếu thêm [hybrid framework billing](https://docs.mapbox.com/accounts/guides/pricing/#hybrid-frameworks) và dashboard tài khoản.

Permanent Geocoding niêm yết mức đầu $5/1.000 requests, hướng dẫn liên hệ sales. [Quyền lưu kết quả](https://docs.mapbox.com/api/search/geocoding/#storing-geocoding-results) khác temporary/permanent. Không mặc định permanent miễn phí hoặc bật chỉ để nút thêm hoạt động. Budget alert không phải hard cap. Trước production cần giới hạn request tại gateway/account và theo dõi usage; adapter hiện chưa có rate limit phân tán.

### Cấu hình backend

1. Tạo token riêng cho backend, chỉ cấp quyền cần thiết, không có quyền ghi/tải SDK nếu không dùng. Không gửi token qua chat, commit Git hoặc đặt token backend trong EXPO_PUBLIC_*.
2. Khi chủ động muốn gọi thử, thêm vào `E:/travel-system/backend/.env` rồi restart backend:

```dotenv
MAPBOX_GEOCODING_ENABLED=true
MAPBOX_ACCESS_TOKEN=<token_cua_ban>
MAPBOX_TIMEOUT_SECONDS=5
```

Mặc định false; catalog nội bộ vẫn hoạt động. Bật thiếu token fail fast. Không sửa Google sign-in/email links. Lượt triển khai không thay env cá nhân hay gọi Mapbox tính phí.

```http
GET http://localhost:18081/api/v1/places/addresses?q=100%2F25%20Quang%20Trung%2C%20Go%20Vap&locale=vi
Authorization: Bearer <access_token>
```

Response `data` có `items:[{providerPlaceId,name,formattedAddress,location:{latitude,longitude},featureType}]`, `provider:"MAPBOX"`, `storage:"TEMPORARY"`, `attribution:string|null`. providerPlaceId là opaque string, không phải UUID Place.

Adapter cố định host HTTPS, giới hạn 5 kết quả/VN/VI hoặc EN, timeout 1–10 s, permanent=false, không retry/cacheDB, header private,no-store. Chuyển đúng Mapbox `[longitude,latitude]`. Quota/network/config trả 503 PLACE_004; payload sai trả 502 PLACE_005, không lộ token/raw provider error. Parse qua ObjectMapper ứng dụng để tránh xung đột Jackson2/3 ở Spring Boot 4.

**Chưa nối addresses vào UI; không được dùng preview tạm để tạo Place/TripPlace.** Đổi tên kết quả thành “Nhà mình” không đổi quyền lưu provider. Sau khi chốt quyền lưu sẽ nối preview/xác nhận, attribution, materialization và Mapbox SDK. Không tự thêm Search Box, navigation SDK hay billing dịch vụ khác.

## Nghiệm thu UI vòng này

1. Backend 18081/frontend hiện hành; login thật, không bật UI_PREVIEW_ENABLED.
2. Tạo chuyến → chọn **Đà Nẵng từ Province**. Dev catalog đang có 8 điểm Đà Nẵng; không tự seed catalog Đà Lạt vào tài khoản thật.
3. Thêm địa điểm → tìm có/không dấu, mở chi tiết kiểm đúng tên/địa chỉ/sơ đồ vị trí. Giá vé/ảnh thiếu phải hiện thiếu.
4. Chọn 2 điểm → Lưu lựa chọn → tạo chuyến. Chi tiết phải có 2 điểm, reload/refresh vẫn còn.
5. Trong chi tiết → Thêm địa điểm: hai điểm đã có không được gợi ý lại. Thêm điểm mới → count/list cập nhật. Gửi lại batch cùng IDs bằng Postman không nhân đôi.
6. Tắt backend khi chọn/lưu → lỗi/retry, giữ lựa chọn, không hiện fixture. Bỏ chọn hết trong form tạo → lưu lựa chọn rỗng được.
7. Destination tự nhập/Province không có catalog → empty rõ ràng, vẫn tạo chuyến không điểm được. Account khác không đọc/chỉnh/link private Place.
8. Chưa cấu hình Mapbox → addresses trả 503. Sau cấu hình đo địa chỉ số nhà/hẻm có/không dấu tại TP.HCM/Hà Nội/Đà Nẵng/Đà Lạt; kiểm vị trí ở lượt SDK. Không suy POI từ kết quả đường/phường.

## Migration và phần còn lại

**Điều chỉnh theo người dùng ngày 06/11/2026:** `place_retrieval_profiles` là metadata kiểm duyệt của Place, không phải một bản sao địa điểm để tạo UUID mới. Public gợi ý chỉ lấy profile approved; còn địa chỉ ngoài danh mục (nhà riêng, nhà họ hàng, trường học...) đi qua luồng tìm địa chỉ/xác nhận riêng rồi lưu riêng cho owner. Tìm địa chỉ không bị khóa theo Province của trip; Province chỉ quyết định gợi ý. Luồng địa chỉ riêng chưa nối UI/lưu provider trong increment hiện tại.

Người dùng xác nhận **chưa cần tọa độ chính xác**, sẽ chỉnh sau. Giữ nguyên tọa độ và các cờ chất lượng; không thêm bộ lọc `coordinates_quality` hoặc kiểm duyệt vị trí mới. 8 profile dev đang approved dù `APPROXIMATE_DEMO`/`hours_quality=UNKNOWN`; vẫn được gợi ý. Không suy giờ mở cửa/giá vé từ approved.

V15 thêm source/owner; Place legacy đã gắn chuyến/lịch/kỷ niệm chuyển USER với owner của tham chiếu sớm nhất, giữ link/ảnh/itinerary. Đây là cách ưu tiên riêng tư khi legacy thiếu provenance: catalog từng có tham chiếu có thể không còn trong gợi ý. Cần phân loại lại nguồn công khai trước production, không tự công khai địa chỉ riêng để khôi phục gợi ý. Seed độc lập không có tham chiếu vẫn INTERNAL.

V16 sửa riêng trường hợp catalog legacy đã được duyệt bị V15 phân loại USER chỉ vì đã có người lưu vào trip: khôi phục INTERNAL khi Place đã tồn tại và profile đã duyệt trước V15. Không xóa link, không chuyển USER mới sang public. Retrieval/indexing cũng chỉ đọc INTERNAL approved để không đưa USER vào kho gợi ý chung; không đổi thuật toán planning/AI.

Backend còn các tuyến legacy `/places/search` và `/routes` của Geoapify; adapter Mapbox mới không thay chúng hoặc dependency react-native-maps tự động. Directions/Matrix và renderer được chuyển ở bước bản đồ riêng. Không tuyên bố toàn hệ thống đã hiển thị hoặc tính tuyến bằng Mapbox.

Create/add/batch/detail kiểm INTERNAL hoặc owner. Public optimizer chỉ enrich INTERNAL, không sửa thuật toán planning/AI. USER không vào suggestions. Không đổi migration V1–V14, dependency hay chạy lint.

Chưa nghiệm thu toàn QA-4: cần UI Android/web, live Mapbox key/coverage/billing, SDK, reverse geocode/custom/saved-locations và quy trình lưu địa chỉ provider. Home tổng hợp vẫn deferred theo lựa chọn trước; không ngầm chuyển phase.

## Bằng chứng kiểm tra ngày 06/11/2026

- Mốc mới sau yêu cầu nguồn approved: **28/28** kiểm tra liên quan đạt (Places, fresh/upgrade V16, seed và retrieval). Bao gồm pending/missing/revoked profile không hiện gợi ý; USER không xuất hiện dù có approved profile; catalog legacy approved được khôi phục và private mới vẫn riêng tư. Không chạy lại mobile/TS vì không đổi source hoặc schema frontend trong lượt này; các mốc full bên dưới là lượt trước.
  - Dev đã lên V16, backend18081 chạy mã mới; còn đủ 8 Place INTERNAL approved, counts 2 trips/8 places/0 memberships/memories giữ nguyên. Không điều chỉnh tọa độ, profile quality hoặc gọi Mapbox.

- Backend full suite cuối **421/421**, không skip/failure/error; PostgreSQL Testcontainers, fresh/upgrade V11→V15, giữ lịch qua đêm/checksum cũ, quyền Place, batch rollback/retry, cancelled trip và HTTP provider mock. Lượt clean đã loại class Google Places thử nghiệm chưa phát hành; backend không có API Google Places mới từ lượt này.
  - Profile test khóa Mapbox ở false/token rỗng để việc cấu hình `.env` dev sau này không tạo lời gọi provider từ integration test; rerun **18/18** ca Place/Mapbox sau thay đổi này đạt.
- Mobile full suite **290/290**; sau tinh chỉnh copy rerun **41/41** ca liên quan đạt; `tsc --noEmit --noUnusedLocals --noUnusedParameters` và `git diff --check` đạt. Không lint hoặc thêm dependency.
- Dev **18081** đã khởi động với V15; trước/sau giữ nguyên 2 trips, 8 places, 0 trip_places/memories/itinerary_items. Health 200; anonymous suggestions/addresses 401; CORS 8082 cho phép; 4 tuyến runtime đã đăng ký trong OpenAPI. Không seed thêm, sửa `.env` cá nhân hoặc gọi Mapbox live.
- Chưa có visual QA Android/web, FPS/gesture/SDK Mapbox, coverage địa chỉ hoặc billing tài khoản thật. Không suy các điều kiện đó từ unit/integration tests.
