# Phase 3 — Khảo sát và contract tìm kiếm/chi tiết địa điểm

> Cập nhật 06/11/2026: người dùng chọn **Mapbox**, hoàn tất catalog nội bộ + cấu hình trước. Đọc [QA4-PLACES-MAPBOX.md](QA4-PLACES-MAPBOX.md) và [OpenAPI runtime](api/places-qa4.openapi.json). Nội dung Google/9 operations planned dưới đây giữ làm lịch sử, không phải runtime/hướng provider hiện hành. Google sign-in không thay đổi.

Ngày: **03/11/2026** · Contract **0.1.0** · **Đặc tả để triển khai, chưa có runtime API Phase 3**.

Phạm vi lượt này: đối chiếu code hai repository, chốt bước tìm/xem/xác nhận lựa chọn, xác định phần thiếu và thứ tự triển khai. Không thay code runtime, migration, env, dependency; không merge backend `integration/team-sync`; không sửa planning/AI. Phase 2 có 7 operations đã triển khai nhưng QA UI → backend/thiết bị và master data vẫn chưa nghiệm thu.

OpenAPI: [places-discovery.openapi.json](api/places-discovery.openapi.json). Tất cả operation trong file đều có `x-implementation-status: planned`. Contract này cụ thể hóa Phase 3 trong [roadmap](FRONTEND-BACKEND-INTEGRATION-PLAN.md), không thay contract Trip CRUD.

## 1. Kết quả khảo sát thực tế

| Thành phần | Hiện trạng đã xác nhận | Quyết định tích hợp |
| --- | --- | --- |
| Backend `place/entity/Place.java`, `PlaceRepository.java` | Có UUID nội bộ, providerPlaceId, tên/địa chỉ/tọa độ/Province, giờ mở cửa và PlaceType. Chưa có Place discovery controller/service/provider; controller trong module chỉ có Destinations | Giữ model cốt lõi và phân lớp; thêm API theo use case, không nối UI vào repository |
| Backend V1/V4/V5 | name/lat/lng bắt buộc; provider_place_id chỉ có index thường, chưa unique; chưa có source/owner hay lưu vị trí nhanh | Cần migration mới cho provenance/ownership/idempotency. Không sửa V1–V11; kiểm tra lại số migration trước khi code |
| `PlaceType` | INDOOR/OUTDOOR/HYBRID/UNSPECIFIED là loại không gian dùng cho rule thời tiết | Không dùng enum này làm category “trường học/biển/bảo tàng” |
| `TripPlace` / `itinerary_items` | Membership và lịch hẹn là hai identity khác nhau; V11 có archive lịch hẹn | Giữ `placeId`, `tripPlaceId`, `itineraryItemId` riêng. Không đưa lịch cá nhân vào PlaceDetail |
| Mobile `api/maps-api.ts`, `maps-types.ts`, `maps-hooks.ts` | Client nhập từ đồng đội gọi GET `/places/search?query=...`, mong array có sẵn tọa độ; endpoint này không tồn tại trên backend hiện tại | Không dùng làm contract chuẩn. Autocomplete trả prediction; chỉ resolve khi chọn mới lấy tọa độ |
| Mobile `api/trip-place-api.ts`, `trip-types.ts` | Có client single-add/PUT/remove TripPlace nhưng backend hiện tại chưa có controller tương ứng; input cho phép gửi provider ID cùng dữ liệu client | Để Phase 4 thay theo contract owner/version/batch; không tin tên/tọa độ Google do client gửi |
| `PlacePickerScreen`, `TripPlacePickerScreen`, `TripStopDetailsScreen` | Search/draft/selection đang dùng fixtures và preview store; `PlaceDetailsContent` tự đọc fixture giờ/giá, có default 45 phút | Tách phần trình bày khỏi nguồn dữ liệu, thêm connected container/query; không render fixture/default như dữ liệu thật |
| `ConnectedTripDetailsScreen`, form tạo | API mode mới có metadata; thao tác Places chưa nối, form chặn gửi fixture IDs | Giữ chặn cho đến khi luồng ghi lịch Phase 4 sẵn sàng; không báo “đã thêm” từ thao tác local |
| Native map | Đã có react-native-maps, `PROVIDER_GOOGLE`, bật opt-in và cần development build/key. Web dùng sơ đồ fallback | Giữ gestures/layout. Khi dữ liệu Google thật được hiển thị trên bản đồ phải dùng Google Map; web chưa có Google Map thì dùng chi tiết dạng không bản đồ kèm attribution, không vẽ dữ liệu đó lên sơ đồ giả |
| Public RAG demo | `PlaceRetrievalController`/`PlaceIndexController` chỉ bật profile rag-demo, đọc approved retrieval profiles ở Đà Nẵng | Không dùng thay API Places. Không tạo retrieval profile/index cho địa điểm USER hay đưa Google content vào RAG |

Không tìm thấy Places/Geocoding provider hoặc cấu hình chuyên biệt trong code backend đang làm việc. Google OAuth đăng nhập là module khác; không suy rằng key/cấu hình Places đã có. Không đọc hoặc thay secret trong env để khảo sát.

## 2. Những vấn đề cần giải quyết trước khi nối UI

| Ưu tiên | Tác động thực tế | Hành động bắt buộc |
| --- | --- | --- |
| P1 | Chưa có owner/source cho địa điểm riêng. Khi thêm USER Place mà vẫn dùng lookup công khai hoặc chỉ kiểm tra UUID tồn tại có thể truy cập chéo tài khoản | Thêm owner/source, kiểm ownership tại detail/saved location và mọi read/write tham chiếu Place. `TripCrudRepository.referencesExist` hiện chỉ kiểm tồn tại; `TripOptimizationServiceImpl` cũng enrich giờ/loại từ `findById` qua endpoint có public alias. Phải giới hạn các lookup này trước khi bật custom Place |
| P1 | Client search không khớp backend; nối thẳng sẽ 404 hoặc parse lỗi và không có luồng resolve đáng tin | Tạo API mới và Zod boundary đúng OpenAPI, retire client search cũ khi không còn caller; giữ Routes/Weather ngoài phạm vi |
| P1 | Lưu Google name/address/photo lâu dài vào Place hiện tại không có provenance/retention sẽ tạo sai nguồn dữ liệu; ảnh không có attribution | Phase 3 resolve chỉ trả preview, chưa materialize Place Google. Không persist/prefetch catalog Google hoặc đưa vào embedding. Chốt materialization/retention trước khi bật ghi Google vào lịch ở Phase 4 |
| P2 | Fixture giờ/giá/thời lượng có thể trông như thông tin thật; category bị nhầm với loại indoor/outdoor | Connected presenter nhận dữ liệu tường minh; thiếu trả null/UNKNOWN, ẩn badge sai, ảnh fallback có sẵn |
| P2 | Gõ nhanh, double tap, retry hoặc đổi tài khoản có thể dùng kết quả cũ/tạo bản ghi riêng trùng | Debounce/cancellation và query identity; owner-scoped cache; custom/saved-location có request key; pending khóa submit |

P1 về privacy là **điều kiện trước khi thêm tính năng**, chưa phải bằng chứng địa chỉ USER hiện bị lộ: hiện chưa có API tạo private Place. Không mở rộng audit RBAC hoặc sửa thuật toán planning trong task này.

## 3. Identity và ranh giới dữ liệu

- `placeId`: UUID Place nội bộ, có thể dùng làm FK TripPlace. `googlePlaceId`: chuỗi opaque Google; không cast thành UUID hoặc gán vào `TripStop.id`.
- `PlaceReference` là tagged union: `{kind:"INTERNAL",placeId}`, `{kind:"USER",placeId}` hoặc `{kind:"GOOGLE",googlePlaceId}`. Phân biệt bằng kind, không dựa vào độ dài/tên.
- `PlaceDetail.id` là UUID với INTERNAL/USER, **null với GOOGLE preview**. Mọi response có `reference` và `source`; không tự mint UUID rồi coi như đã lưu.
- Mở preview/resolve không tạo TripPlace, không xếp ngày và không tăng Trip.version. POST custom chỉ tạo bản ghi riêng của account khi người dùng chủ động lưu, chưa thêm vào chuyến đi.
- Mục “Lịch trình của bạn”, ghi chú/thời lượng cá nhân, đã ghé, ghim và gỡ khỏi lịch lấy từ TripPlace/Itinerary ở Phase 4; không thuộc PlaceDetail công khai.
- Tên tự gõ cho địa điểm riêng là dữ liệu người dùng. Tên/địa chỉ provider không tự trở thành dữ liệu sở hữu chỉ vì người dùng bấm xác nhận. Không cho client đổi Google source thành USER để bỏ qua retention.

### DTO chính

`PlaceSummary`: `id` (UUID), `reference`, `source` (INTERNAL/USER), `name`, `formattedAddress?`, `location` ({latitude,longitude}), `provinceId?`, `category?`, `photo?`.

`PlaceDetail`: `id?`, `reference`, `source`, `name`, `formattedAddress?`, `location?`, `provinceId?`, `category?`, `environmentType`, `openingHours?`, `openingStatus`, `businessStatus`, `openingStatusAsOf?`, `admission?`, `amenities[]`, `tips[]`, `description?`, `photos[]`, `attributions[]`, `dataAvailability`, `evaluatedAt`.

- Dấu `?` trong mô tả DTO nghĩa là giá trị có thể null; JSON schema chỉ rõ required/nullability. Các array trả `[]`, không trả dữ liệu mẫu.
- Category là `{code,label}` phục vụ hiển thị; environmentType dùng enum PlaceType cũ. Không suy loại không gian từ Google primaryType bằng mapping tùy tiện.
- `openingStatus`: OPEN/CLOSED/UNKNOWN, có thời điểm đánh giá; thiếu timezone/schedule đáng tin thì UNKNOWN. `businessStatus`: OPERATIONAL/CLOSED_TEMPORARILY/CLOSED_PERMANENTLY/UNKNOWN; không đồng nhất “đóng cửa tối nay” với “ngừng hoạt động”.
- `openingHours` chỉ trả thông tin hiển thị và nguồn; không ép giờ Google vào hai field opening_time/closing_time vốn không thể hiện đầy đủ tuần/ngày lễ.
- `admission`: `{amount?,currency:"VND",text,source:"INTERNAL"}` hoặc null. Giá 0 chỉ khi đã biết miễn phí; Google priceLevel không phải vé vào cổng.
- `dataAvailability` cho hours/admission/photos/description: AVAILABLE/NOT_PROVIDED/PROVIDER_UNAVAILABLE. Null không có nghĩa miễn phí hoặc mở 24h. Không mặc định thời lượng tham quan 45 phút vào dữ liệu Place.
- Google cần có location để cho xác nhận ghim; kết quả thiếu tọa độ được thông báo chưa thể định vị, không dùng 0,0 hoặc tâm Đà Lạt làm vị trí thay thế.

## 4. Contract API

Prefix `/api/v1`, Bearer access token, response `ApiResponse`/error envelope hiện có. Locale query `vi|en`, mặc định vi; văn bản user nhập không dịch giả. Page mặc định 0/size20, tối đa 100; count/content trong cùng snapshot khi cần. DTO và client không nhận ownerId từ body/query.

### 4.1. GET /places/suggestions

Input `tripId` UUID bắt buộc, `page,size,locale`. Owner trip được kiểm trước đọc danh mục; deleted/khác owner trả TRIP_001/404. Chỉ trả INTERNAL từ Province đã liên kết, loại Place có trong trip_places của chuyến, thứ tự ổn định `name,id`; không gọi Google/AI và không dùng score giả.

Output page `content: PlaceSummary[]`, metadata, `reason: null|DESTINATION_NOT_LINKED|EMPTY_CATALOG`, `context:{serverTime,evaluatedDate}`. Tên điểm đến tự nhập với provinceId null trả rỗng + DESTINATION_NOT_LINKED, hướng người dùng sang tìm kiếm; không đoán Province từ text. Chưa có catalog trả rỗng hợp lệ.

### 4.2. GET /places/autocomplete

Input `q` trim 2–200 ký tự, `sessionToken` UUID v4, `latitude` và `longitude` tùy chọn nhưng phải đi cùng, `locale`. Tọa độ finite trong [-90,90]/[-180,180]; dùng làm location bias, không restriction cứng theo thành phố. Provider request giới hạn Việt Nam cho MVP, không giới hạn loại chỉ POI du lịch; không trả query predictions.

Output `{items:[{googlePlaceId,primaryText,secondaryText,resultType:"PLACE_PREDICTION"}],sessionToken,provider:"GOOGLE",attributions:[...]}`. Tối đa 5 predictions, không pagination, chưa có placeId/tọa độ. Không suy địa chỉ nhà thành “điểm du lịch”; phân loại chính xác sau resolve. Không dùng query token làm auth/idempotency token.

### 4.3. POST /places/resolve

Body `{googlePlaceId,sessionToken,locale}`. Google ID opaque 1–255 ký tự, không nhận URL để server fetch. Server gọi Place Details (New), field mask cố định; **200 PlaceDetail preview, id=null/source=GOOGLE**, không insert Place hoặc TripPlace. Cùng Google ID sau này được nhận diện bởi reference, không bởi tên.

Một autocomplete session kết thúc khi gọi Details; client tạo token mới cho lần chọn/tìm tiếp. Không tự động retry resolve với token đã dùng sau timeout không rõ kết quả. Nếu cần thử Details lại, quay lại phiên search mới; không hứa exactly-once với API ngoài. Khi không có location, hiển thị chi tiết nhưng không cho xác nhận map.

### 4.4. GET /places/{placeId}

Input UUID + locale. INTERNAL đọc được sau login; USER chỉ owner; UUID khác owner và không tồn tại cùng trả PLACE_001/404. Không trả owner ID hay dữ liệu Trip/Memory của người khác. **Chưa hỗ trợ persistent Google Place trong đợt đầu**; legacy provider_place_id chưa được xác minh nguồn không tự coi là GOOGLE.

200 PlaceDetail. Việc resolve Google hoặc xem detail không đánh dấu đã ghé và không tăng Trip.version.

### 4.5. POST /places/custom

Body `{clientRequestId,name,address?,latitude,longitude,locationOrigin:"USER_PIN"|"DEVICE_GPS"}`. Name trim 1–120, address trim tối đa 2000 hoặc null, UUID v4 request key; lat/lng bắt buộc/range finite. Server gán source USER và owner từ auth; không nhận source/ownerId/provider ID/category/ticket/opening-hours tùy ý từ client. Address là dữ liệu người dùng nhập; kết quả reverse-geocode chỉ là dữ liệu provider để xem, không tự lưu như address user.

201 + Location `/api/v1/places/{id}` và PlaceDetail; replay cùng owner/key/normalized payload trả 200 cùng id; khác payload trả PLACE_002/409. Không deduplicate địa điểm riêng bằng tên/tọa độ (nhiều căn hộ có thể trùng tọa độ). Không tạo Province/địa điểm công khai hoặc retrieval profile từ thao tác này. Chưa có API sửa/xóa Place gốc; “Gỡ khỏi lịch” chỉ xóa membership ở Phase 4.

### 4.6. POST /places/reverse-geocode

Body `{latitude,longitude,locale}`. Chỉ phục vụ pin người dùng đặt, không gọi theo từng frame kéo bản đồ; debounce sau khi thả ghim hoặc nút xác nhận vị trí.

Output 200 `{formattedAddress:null|string,location:{...},attributions:[],provider:"GOOGLE",evaluatedAt}`. Không có địa chỉ vẫn giữ tọa độ và cho nhập địa chỉ riêng. Không tạo Place, không dùng reverse-geocode để suy tên cơ sở/giờ mở cửa. Geocoding là API riêng, cấu hình/chi phí/quy tắc lưu riêng với Places.

### 4.7. GET /users/me/saved-locations

Input page,size,locale. 200 page với `content:[{id,type:"HOME"|"LODGING",label,place:PlaceSummary,createdAt}]` và metadata/context, sort `createdAt DESC,id DESC`; chỉ account hiện tại. Saved-location id khác placeId. Không công khai địa chỉ nhà hoặc đưa vào suggestions của tài khoản khác.

### 4.8. POST /users/me/saved-locations

Body `{clientRequestId,type,label,placeId}`. Label trim 1–120, placeId UUID INTERNAL hoặc USER của chính account. Không nhận Google preview reference cho đến khi materialization ở Phase 4 được chốt.

201 + Location và SavedLocation; cùng owner/key/body replay 200, khác body PLACE_002/409. Không tự giới hạn mỗi account chỉ có một nơi lưu trú; không thêm uniqueness theo type ngoài yêu cầu. Xác nhận lưu là thao tác riêng, không tự lưu khi chỉ mở search.

### 4.9. DELETE /users/me/saved-locations/{id}

UUID saved-location. Xóa liên kết của account hiện tại; 204 kể cả không còn row phù hợp, không lộ sự tồn tại của row account khác. Không xóa Place/TripPlace/Memory liên quan. MVP chưa có cập nhật saved-location; có thể xóa và thêm lại.

### Lỗi bổ sung dự kiến

| HTTP | Code đề xuất, chưa tồn tại runtime | Hành vi UI |
| --- | --- | --- |
| 400 | COMMON_003/006/008/009 hiện có | Chỉ lỗi field hợp lệ; không retry tự động |
| 401/403 | Auth hiện có | Luồng session hiện có xử lý |
| 404 | PLACE_001; TRIP_001 hiện có | Không tồn tại/không được đọc; không lộ owner |
| 409 | PLACE_002 | Request key đã dùng cho payload khác, giữ form |
| 429 | PLACE_003 | App rate limit, Retry-After; giữ query/selection |
| 503 | PLACE_004 | Provider chưa cấu hình/tạm lỗi/quota ngoài; không trả empty success giả |
| 502 | PLACE_005 | Payload provider không hợp lệ, lỗi hiển thị có thể thử lại chủ động |

Quota Google không phải lỗi user sai địa chỉ; map sang 503 theo contract này, không expose raw body/key/stacktrace. Timeout mạng/provider map PLACE_004/503. Tên symbolic/ErrorCode và message VI/EN sẽ được thêm cùng implementation; không reuse GOOGLE_SERVICE_UNAVAILABLE của module đăng nhập.

## 5. Google: chi phí, provenance và lưu dữ liệu

Các quyết định sau dựa trên tài liệu chính thức đã đối chiếu ngày 03/11/2026; re-check khi triển khai, nhất là billing region/terms áp dụng.

- Dùng Places API **New**, server gọi HTTPS `places.googleapis.com`, key qua header và cấu hình secret backend; không forward key cho mobile hoặc nhận provider URL do client chỉ định. OAuth client ID không thay được Maps API key.
- Autocomplete session do client tạo, cùng token cho các lần gõ và lần Details kết thúc; credentials cùng Google Cloud project. Không tái dùng token cho địa điểm tiếp theo. [Session flow](https://developers.google.com/maps/documentation/places/web-service/using-session-tokens).
- Mask cơ bản khi resolve: `id,displayName,formattedAddress,location,primaryType,primaryTypeDisplayName,businessStatus,attributions`. Bật chi tiết giờ mới thêm `currentOpeningHours,regularOpeningHours,utcOffsetMinutes`; các field này có thể nâng SKU. Không dùng wildcard hoặc fetch Details cho mọi prediction. [Fields/SKUs](https://developers.google.com/maps/documentation/places/web-service/place-details).
- **Không lưu bền preview Google** vào Place, logs, analytics, React Query persistence, AsyncStorage hoặc media storage. Phase 3 không thêm shared cache/provider content DB. Query Google dùng session-local state hoặc query cache vô hiệu sau khi đóng/đổi account, `gcTime:0`, không persist. HTTP `Cache-Control: private, no-store`; không tự prefetch/retry khi focus/refocus.
- Google Place ID được phép lưu theo ngoại lệ riêng. Điều khoản ngoài EEA hiện cho cache tọa độ Places tối đa 30 ngày, không áp dụng chung cho name/address/photos. Phase 3 chưa cần cache này. **Trước Phase 4** phải chốt lưu provider references và refresh/delete tọa độ, cùng cách đáp ứng model Place/solver hiện đòi name/lat/lng non-null; không sửa model hoặc planning ngầm trong lượt đặc tả này. [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies), [Service terms §14](https://cloud.google.com/maps-platform/terms/maps-service-terms).
- Google data trên map phải dùng Google Map; mode không có map cần attribution Google hiển thị rõ. Attribution provider không bị che bởi glass UI hoặc crop ảnh. [Attribution](https://developers.google.com/maps/documentation/places/web-service/policies).
- Đợt đầu Google `photos=[]` và dùng ảnh mặc định, `dataAvailability.photos=NOT_PROVIDED`; **chưa bật Photos API**. Khi bổ sung ảnh thật phải có transport không lộ key, authorAttributions và không lưu/copy ảnh Google sang Cloudinary; photo resource name có thể hết hạn, không lưu làm URL vĩnh viễn. Đây là subtask riêng, không bắt đầu bằng proxy ảnh tự do. [Photos](https://developers.google.com/maps/documentation/places/web-service/place-photos).
- Ticket/amenities/tips/description chỉ dùng nội dung nội bộ có nguồn hoặc thông tin user hợp lệ; không gọi AI bịa và không lấy Google priceLevel làm vé. App cần Terms/Privacy công khai trước khi bật provider ngoài môi trường dev.

## 6. Kế hoạch dữ liệu và module

### Lát cắt 3A — Internal/private discovery trước

1. Thêm migration kế tiếp với provenance và ownership tối thiểu cho Place: `source` INTERNAL/USER, `owner_user_id` nullable, ràng buộc USER phải có owner và INTERNAL không có owner. Legacy backfill INTERNAL chỉ với dữ liệu dự án đang quản lý; kiểm kê provider_place_id trước, không suy provider từ chuỗi.
2. Custom request key/hash unique theo owner; có thể đặt trên Place USER để tránh thêm bảng request ledger riêng. Saved locations có owner/type/label/place FK/request key/hash/timestamps và unique(owner,clientRequestId). Không thêm Redis, event bus, repository framework mới.
3. Harden chỗ tham chiếu Place đang có (Trip create initialPlaceIds, mọi read/write đọc Place theo ID) cùng đợt migration private. USER của B không thể lọt vào Trip A; lookup không chỉ kiểm `exists`. Public planning không được enrich metadata USER qua `PlaceRepository.findById`; guard lookup tối thiểu, không sửa thuật toán/AI. Nếu chưa làm guard, chỉ bật INTERNAL read APIs, chưa bật POST custom/saved-location ghi riêng. Đây là gate, không phải lý do mở rộng task thành refactor planning.
4. Tạo bounded read projections cho suggestions/detail/saved-locations. Giữ PlaceRepository dùng trong planning, không đổi thành API public trả entity hoặc tái dùng hàm findByProvinceId unbounded cho pagination.
5. Thêm custom creation và saved locations với ownership/idempotency. Không insert USER vào place_retrieval_profiles/embeddings. Negative test rag-demo nếu bật profile để chứng minh private không vào catalog/index, không rewrite retrieval algorithm.
6. Sau backend tests, tách connected presentation/query khỏi fixture: dùng lại shell map/header/card và Ocean Teal/Roboto/safe areas/VI–EN. Không đổi layout sang UI mới và không đẩy server state vào preview store.

### Lát cắt 3B — Google search và pin preview

1. Provider interface nhỏ đúng Places/Geocoding operations; implementation dùng HTTP client hiện có, configuration properties có enabled/key/connect/read timeout. Không thêm cache/retry framework nếu không cần.
2. Bật provider khi có Google Cloud project, billing/Places New/Geocoding enabled, key restrictions/quota; kiểm tra tên biến env khi code, không đổi env cá nhân tự động hoặc yêu cầu gửi secret vào chat.
3. Autocomplete min2 ký tự, debounce dùng hook 400 ms đang có, cancel request cũ, chỉ render kết quả khớp query/session hiện tại. Giữ selected draft qua đổi query/ngày; so reference để lọc đã có trong chuyến.
4. Resolve on tap, chống double tap; animate tới pin chỉ sau response hiện tại. Bỏ kết quả đến muộn sau back/logout. Address result: “Vị trí đã chọn”, địa chỉ và tên user tự nhập; thiếu POI info dùng null/default image.
5. Request Google `retry:false` tự động; không retry 4xx hoặc quota. Server không blind retry call tính phí; có timeout và rate limit account/provider budget cấu hình được trước public. GPS bị từ chối vẫn search text/đặt pin được; không gọi GPS ngầm.
6. Web chưa có Google Map: xem chi tiết không map với attribution. Native bật Google SDK/key và development build riêng; không ép bật flag hoặc thêm web SDK trong subtask contract này.

### Lát cắt 3C / cầu nối Phase 4

- Saved locations có thể triển khai sau search chính nếu không cản MVP. Google Photos và full giờ mở cửa là nâng cấp chủ động, không bắt buộc tải theo mỗi lần gõ.
- Phase 4 phải chốt batch-add pool/day với Trip.version, ownership, idempotency, all-or-nothing và identity mapping. Draft gồm references/custom inputs, không chứa fake Place UUID. Chưa có API ghi thì nút không được báo lưu thành công.
- Materialize Google vào lịch là **gate còn mở**, vì schema/solver hiện yêu cầu dữ liệu tồn tại lâu dài nhưng provider content bị giới hạn lưu. Có thể bắt đầu 3A/3B tìm/xem trước mà không thay solver; không coi Google scheduling đã được thiết kế xong chỉ từ resolve preview.
- Home thật, weather/Routes, tối ưu Held–Karp/AI, camera/journal upload thuộc phase khác; không mở rộng vào các module này.

## 7. Ma trận nghiệm thu khi triển khai

| Nhóm | Trường hợp bắt buộc |
| --- | --- |
| Security | 401, khóa account; trip không phải owner; private Place/saved-location của account B; đoán UUID qua initialPlaceIds; logout/account switch khi request pending |
| DB | Page ổn định/count đúng, empty/null Province, exclude membership; custom request replay/concurrent same key/different body; transaction rollback và không tạo duplicate |
| Provenance | USER không vào suggestions công khai/RAG index; Google preview không có DB write; không gửi key, raw provider URL, query/địa chỉ riêng vào logs; expiry/cache semantics |
| Search | Tên có/không dấu nội bộ, địa chỉ nhà đủ số/hẻm, sai khu vực, kết quả rỗng, q dài/blank; gõ nhanh/clear/cancel; session token mới sau Details |
| Provider | Fake provider thành công/empty/missing fields/location/timeout/429/bad payload/not-configured; không gọi Google thật trong unit/CI, không assert “miễn phí/mở cửa” từ null |
| UI | Loading/error/retry/no results; giữ multi-selection; không ảnh; ngày/pool selection; safe area/keyboard/touch44/font scaling/VI–EN; map expand và back; web no-map attribution |
| Performance/cost | Không Details fanout mỗi prediction/render; cancellation không đồng nghĩa hoàn lại call đã gửi; bounded SQL, bounded payload; không tự đoán latency production từ unit tests |
| Phase boundary | Back/cancel không thêm TripPlace; custom save không xếp lịch; Google reference không biến thành UUID; thông tin đã ghé/ghi chú chờ Phase 4 |

Backend tests: JUnit/MockMvc với auth/security thật, PostgreSQL Testcontainers cho ownership/constraints/idempotency; mock đúng external boundary. Mobile tests: Zod/transport/query và actual event handlers cho race/draft/selection, không chỉ test helper tạo lại logic implementation. Chỉ chạy lint khi người dùng đổi chỉ dẫn hiện tại; kiểm tra TS/tests/export đúng phạm vi thay đổi.

## 8. Kết quả của lượt đặc tả này

- Đã kiểm tra source thực tế và chính sách provider, xuất Markdown + OpenAPI, cập nhật plan/status/handoff.
- Chưa thêm API Phase 3, migration, provider config, seed hay UI kết nối. Chưa gọi Google thật, chưa dùng DB cá nhân, chưa chạy nghiệm thu Phase 2 thực tế.
- Đã kiểm tra 9 operation planned, 33 schemas, 7 examples, internal refs/path params, identity/nullability và input sai bằng JSON Schema đã chuyển nullable OpenAPI 3.0; 42 local doc links hợp lệ và diff check đạt. Chưa có thư viện full OpenAPI validator trong môi trường, không cài thêm dependency. Không chạy test/build runtime cho lượt chỉ tài liệu. Các con số 357 backend/215 mobile trong status thuộc lượt Phase 2 trước, không phải test Phase 3 đã chạy.
- Bước triển khai tiếp theo cụ thể: **3A — Place source/owner + owner-aware references + GET suggestions/detail + POST custom**, rồi mới nối connected presenter. Saved locations/Google 3B theo phụ thuộc nêu trên; không merge nhánh backend đồng đội.
