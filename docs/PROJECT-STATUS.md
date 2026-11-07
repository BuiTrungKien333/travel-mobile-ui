# Tiến độ Travel Mobile UI

### Quyết định Xem sau · 07/11/2026

Ảnh chưa gắn chuyến chỉ lưu trên thiết bị; chỉ đồng bộ khi người dùng đưa vào chuyến. Giữ bản local khi upload lỗi. Đã làm rõ thông báo VI/EN và thống nhất bộ lọc/số đếm Xem sau chỉ nhận local chưa có tripId. Không triển khai cloud cho ảnh chưa gắn chuyến. Quy tắc lưu, giới hạn storage và checklist ở [QA6-MEMORY-CAPTURE.md](QA6-MEMORY-CAPTURE.md).

### QA-6A · Camera và lưu kỷ niệm · 07/11/2026

- Sửa lệch contract sau merge: backend có version memory, PATCH ghi chú, GET giới hạn ảnh và create key/fingerprint; Flyway V18 thêm index/metadata upload. Retry create/upload không tạo bản ghi/asset khác cho cùng yêu cầu/nội dung. Không nhận URL media tùy ý trong JSON tạo memory.
- Kiểm tra MIME/header ảnh thật và giới hạn byte/pixel/cạnh. Provider upload nằm ngoài DB transaction; finalization kiểm tra lại quyền và memory chưa xóa. Pagination memory lấy ID trước, media sau, giới hạn 50/trang.
- Frontend giữ giao diện, sửa ngày/giờ theo Việt Nam, bỏ fallback nhầm Place ID, ẩn nháp không thuộc tài khoản và chặn upload khi đổi phiên trong lúc export ảnh.
- Xác minh: 51 ca backend liên quan đạt với PostgreSQL 17/Flyway và mock đúng biên Cloudinary; 33 ca mobile liên quan, TypeScript strict/no-unused và export web/Android đạt. Đây chưa phải nghiệm thu camera native hay Cloudinary thật. Checklist/API và giới hạn còn lại trong [QA6-MEMORY-CAPTURE.md](QA6-MEMORY-CAPTURE.md); private delivery, dọn asset khi xóa và pagination UI vẫn chưa hoàn tất.
- Đã khởi động lại backend dev 18081: health UP, Flyway V18 thành công, OpenAPI có create/PATCH memory và GET upload limits. Giữ PostgreSQL/data hiện có. Ba biến Cloudinary có giá trị trong cấu hình dev; chưa xác minh upload với tài khoản provider thật hoặc thao tác native.

### QA-5 · Lịch trình trong ngày · 07/11/2026

- Nối modal lịch ngày với API `PUT /trips/{id}/itinerary/days/{date}/schedule`, thêm snapshot xuất phát, giờ đi, phương tiện và quay về qua Flyway V17. Cấu hình/thời lượng lưu nguyên tử; không đổi các ngày khác. Kiểm tra phiên bản sau khi provider trả về để tránh ghi đè dữ liệu mới.
- Giữ thiết kế modal, dải ngày và timeline. Tìm từ catalog/điểm đã lưu, GPS foreground bằng `expo-location` đã được duyệt, hoặc nhập tay. Địa chỉ thiếu tọa độ có chú thích rõ; không thêm Geocoding trả phí theo lựa chọn MVP của người dùng.
- Mapbox hiển thị điểm S, tính chặng xuất phát/quay về, giờ đến theo từng chặng và tối ưu tuyến vòng. Không có dữ liệu tuyến thì để trống giờ chưa tính được, không bịa km/phút. Checklist, API/body và hướng dẫn build trong [DAY-SCHEDULE-INTEGRATION.md](DAY-SCHEDULE-INTEGRATION.md).
- Chờ nghiệm thu quyền GPS trên thiết bị. Expo Doctor 20/21: còn lệch phiên bản vá của 13 package SDK 57 có sẵn; không nâng cấp ngoài phạm vi.
- Xác minh: 42 kiểm tra backend liên quan (PostgreSQL Testcontainers/Flyway), 56 kiểm tra mobile, TypeScript strict/no-unused và export web/Android đạt. Bao gồm ca lịch đổi trong lúc chờ provider: không giữ DB transaction khi gọi Mapbox, không ghi đè cấu hình/thời lượng mới. Logic đọc/tối ưu tuyến nằm ở service, controller chỉ nhận request và trả response.
- Runtime dev: PostgreSQL hiện có giữ dữ liệu/volume; API 18081 health UP, Flyway V17, OpenAPI có endpoint schedule và request không đăng nhập trả 401. Người dùng đã cấu hình token backend; đã khởi động lại và gọi Mapbox Directions thật với hai tọa độ mẫu tại Đà Lạt: driving/walking đều HTTP 200, có một leg và polyline; khoảng cách 875,303 m, thời gian lần lượt 191,513 s và 587,088 s. Đây là kiểm tra provider với tọa độ công khai, chưa thay cho nghiệm thu chuyến thật qua UI/GPS. Không lưu token vào tài liệu hoặc bật Geocoding tính phí.

### QA-5 · Kéo/vuốt timeline và Hoàn tác · 07/11/2026

- Nối gesture kéo đổi thứ tự và vuốt gỡ từ bản UI vào API lịch ngày có kiểm tra phiên bản. Giữ khung giờ theo vị trí, thời lượng/ghi chú theo địa điểm, không sửa ngày khác hoặc xóa địa điểm khỏi danh mục chuyến.
- Có phản hồi ngay trong lúc lưu; lỗi trả lại dữ liệu query, cho thử lại. Hoàn tác dùng phiên bản sau lần lưu thành công, không ghi đè lịch mới từ cửa sổ khác. Chặn ghi lặp và khóa gesture ở ngày chỉ đọc.
- 45 kiểm tra mobile liên quan, TypeScript strict/no-unused và export web/Android đạt. Checklist nghiệm thu web/Android ở đầu [kế hoạch QA](QA-ACCEPTANCE-PLAN.md); chờ người dùng thử gesture thực tế. Không đổi backend hoặc thêm dependency trong lượt này.

### QA-5 · Chi tiết địa điểm từ timeline · 07/11/2026

- Luồng thật mở màn hình chi tiết địa điểm khi chạm timeline, tái sử dụng bố cục bản đồ kéo mở rộng, địa chỉ, thông tin địa điểm và card lịch ghé. Form sửa giờ, thời lượng và ghi chú nằm trong modal riêng.
- Dùng API lịch ngày có kiểm tra phiên bản để lưu và gỡ lần ghé trong ngày. Đánh dấu đã ghé dùng Place UUID, cập nhật dữ liệu Home và timeline qua cache hiện có.
- Chuyến kết thúc hoặc hủy giữ chế độ chỉ đọc. Metadata chưa có được ghi rõ, ảnh mẫu chỉ dùng để minh họa, ghim địa điểm còn chờ API.
- Checklist mới ở đầu [kế hoạch nghiệm thu](QA-ACCEPTANCE-PLAN.md). Chờ người dùng kiểm tra Android/web.

### QA-5B · Chi tiết chuyến đi và Mapbox · 07/11/2026

- Nối giao diện chi tiết Sắp khởi hành, Đang diễn ra và Đã kết thúc với dữ liệu chuyến, lịch, thời tiết, điểm đã ghé và nhật ký theo ngày. Tái sử dụng map pane, dải ngày, timeline và sheet tối ưu.
- Bản đồ tương tác Mapbox trên web và native development build mới. Bản cũ có ảnh tĩnh dự phòng, thiếu tọa độ hoặc cấu hình vẫn hiển thị dữ liệu lịch đã lưu.
- Backend kiểm quyền chủ chuyến và ngày, gọi Directions/Optimization bên ngoài truy vấn dữ liệu. Gợi ý thứ tự cần người dùng áp dụng bằng API có kiểm tra phiên bản lịch trình.
- Backend 33/33 ca liên quan, mobile 311/311, TypeScript strict và export bundle web/Android đạt. Backend dev 18081 đã đăng ký ba API, health 200, route thiếu token phiên 401 và CORS cho web 8082 đạt.
- Kiểm tra và cấu hình trong [QA-5B](QA-ACCEPTANCE-PLAN.md#qa-5b--chi-tiết-chuyến-đi-và-mapbox--07112026). Token Mapbox và kiểm tra thực tế trên Android/iOS còn chờ. Expo Doctor đạt 20/21 kiểm tra, còn lệch các phiên bản vá SDK 57.

### QA-5A · Xếp lịch thủ công theo ngày · 07/11/2026

- Đã nối lịch theo ngày và nhóm Chờ xếp lịch ở chi tiết chuyến. Có chọn ngày, giờ đến, thời lượng, ghi chú, đổi thứ tự và gỡ khỏi ngày. Home làm mới điểm đến tiếp theo khi lịch thay đổi.
- API lưu từng ngày kiểm tra quyền, ngày hợp lệ, Place thuộc chuyến và phiên bản hiện tại. Giữ ID các điểm còn lại, lịch ngày khác và các địa điểm đã lưu. Hướng dẫn UI và body mẫu trong [kế hoạch nghiệm thu](QA-ACCEPTANCE-PLAN.md#qa-5a--xếp-lịch-thủ-công-theo-ngày).

### Thời tiết chuyến đi · 07/11/2026

- Home và chi tiết chuyến đã nối modal Liquid Glass vào `GET /api/v1/trips/{tripId}/weather`. Chuyến sắp đi có chọn ngày, dự báo theo giờ và gợi ý chuẩn bị. Chuyến đang đi thêm nhiệt độ hiện tại và cảm giác như. Giữ cache 10 phút theo tài khoản/chuyến/ngày và làm mới khi thay đổi dữ liệu chuyến.
- Backend giới hạn ngày, kiểm tra quyền sở hữu và tọa độ, trả lỗi rõ nếu Open-Meteo thiếu dữ liệu hoặc không phản hồi. Đã xác nhận `/current` và `/forecast` gọi Open-Meteo thật ở backend dev 18081. Quy tắc chọn tọa độ và phạm vi dự báo ghi ở [Home với dữ liệu thật](HOME-DASHBOARD-INTEGRATION.md).

### Ảnh bìa mặc định chuyến đi · 07/11/2026

- Chuyến chưa có cover dùng một trong 14 ảnh WebP người dùng cung cấp ở `assets/images/examples` (thư mục thực tế hiện có, chưa có `asset/samples`). Phân phối theo hash Trip ID để chọn đa dạng nhưng ổn định qua render/reload/sửa tên hoặc trạng thái; không ghi ảnh thay thế vào DB hoặc sinh ảnh mới.
- Dùng chung cho card Home, danh sách chuyến và fallback bìa album chuyến; ảnh bìa đã có/ảnh album thật tiếp tục được ưu tiên. Không thay ảnh ví dụ onboarding hoặc ảnh địa điểm bằng ảnh bìa chuyến.

### Typography Home · 07/11/2026

- Thống nhất Home thật và preview: lời chào/tên chuyến chính 20/28 semibold, tiêu đề card 18/26, tiêu đề nhóm/phụ 16/24, nội dung và nút tạo chuyến 14/20, metadata 12/16. Màn người mới giảm lời chào/mô tả; màn đã đi dùng cùng tiêu đề card 18; số dấu ấn giảm 24 xuống 20. Badge LIVE 12 để dễ đọc, tên điểm mẫu 14 và giờ 12.
- Dùng typography tokens/AppText hiện có; giữ font scaling hệ thống và vùng chạm, không thay typography toàn ứng dụng hoặc logic chọn trạng thái/API. Chưa xác nhận trực quan trên thiết bị trong lượt chỉnh chữ này.

### Home dữ liệu thật · 07/11/2026 — cập nhật mới nhất

- Đã nối GET `/api/v1/home/dashboard` vào các thiết kế Home hiện có. Ưu tiên LIVE → UPCOMING (1–7 ngày) → PLANNING (>7 ngày/chưa có ngày) → RETURNING → NEW. PLANNING dùng lại card Sắp khởi hành với nhãn phù hợp; mỗi nhóm chọn chuyến mới tạo nhất, một card, xét toàn tài khoản.
- Các card nhận ngày/số điểm/điểm tiếp theo/dấu ấn/ảnh thật; loading/error không fallback mock. CRUD cập nhật cache Home; Đã ghé ghi backend; camera/chỉ đường mở đúng chuyến. Giữ nguyên thiết kế và bottom navigation.
- Backend **433/433**, mobile **304/304**, TypeScript/no-unused và diff-check đạt. Backend dev 18081 đã chạy API mới, không sửa dữ liệu dev. Chờ kiểm tra UI; thời tiết thật, itinerary QA-5 và Memory/Camera QA-6 chưa được gán hoàn tất.
- Quy tắc/API/giới hạn/batch test: [HOME-DASHBOARD-INTEGRATION.md](HOME-DASHBOARD-INTEGRATION.md). Các đoạn Home deferred/chọn chuyến gần nhất bên dưới là lịch sử, được cập nhật này thay thế.

Cập nhật: **06/11/2026**. Phạm vi: frontend Home, danh sách/tạo/chi tiết chuyến đi, camera và chuẩn bị hợp đồng tích hợp. Ngày trong fixture Home vẫn là **21/10/2026** để tái hiện các trạng thái.

### Nhãn chuẩn bị chuyến đi · 06/11/2026

- Áp dụng yêu cầu mới: hơn 7 ngày trước khởi hành → **Đang lên kế hoạch / Planning**; còn 1–7 ngày → **Sắp khởi hành / Upcoming**. Tới ngày bắt đầu và hết ngày kết thúc giữ Đang diễn ra; completed/cancelled và mode backend vẫn được ưu tiên.
- Đây là phân loại hiển thị trong mode API **PLANNING**, không thêm enum/database status hoặc thay ý nghĩa filter `mode=PLANNING` (vẫn bao gồm cả hai nhóm). Danh sách thật chưa có bộ lọc trạng thái UI; không thêm control mới trong lượt này.
- Card danh sách và header chi tiết dùng cùng helper; API mode dùng `context.evaluatedDate` của backend, preview dùng ngày của preview. Tính theo ngày lịch UTC từ date-only, không lấy múi giờ/đồng hồ thiết bị. PLANNING chưa có ngày giữ nhãn Planning; không tự suy LIVE đè mode server.
- Giữ bốn kịch bản Home và cách chọn chuyến tương lai gần nhất; đồng hồ “Còn N ngày” vẫn là thông tin đếm ngược, không tạo thêm một trạng thái Home. Không đổi layout, quyền chỉnh sửa hoặc bắt đầu QA-5 trong lượt này.
- Kiểm tra: mobile full suite **294/294**, TypeScript/no-unused và diff check đạt; bao gồm ranh giới 1/7/8 ngày, đầu/cuối chuyến, đổi tháng/năm/năm nhuận, mode backend ưu tiên và nhãn badge/header VI/EN. Không sửa backend nên không chạy lại backend tests; không chạy lint hoặc thêm dependency. Chưa visual QA trên thiết bị cho nhãn mới.

### QA-4 — catalog thật và Mapbox · 06/11/2026

**Phản hồi người dùng mới nhất:** đã test xong luồng gợi ý/tìm/thêm địa điểm nội bộ, yêu cầu chuyển bước. Ghi nhận vòng test phạm vi này hoàn tất; Mapbox live/địa chỉ riêng và độ chính xác tọa độ vẫn để sau. Bước tiếp theo đề xuất là QA-5A kết nối lịch trình thủ công từng ngày; chưa bắt đầu triển khai hoặc tuyên bố API itinerary/Live/Recap đã nghiệm thu.

**Điều chỉnh mới theo người dùng:** nguồn gợi ý phải join `place_retrieval_profiles.approved=true` cùng INTERNAL/Province, không lấy toàn bộ Place nội bộ. Không yêu cầu tọa độ chính xác hoặc lọc quality; giữ dữ liệu hiện tại. V16 khôi phục catalog legacy đã duyệt bị V15 phân loại riêng tư; USER mới không bị công khai. Retrieval/index chỉ INTERNAL approved. **28/28** tests liên quan đạt; schema/frontend không đổi. Địa chỉ ngoài catalog vẫn là luồng tìm/xác nhận/lưu riêng, chưa nối provider UI như đã ghi trong scope.

Kiểm tra cuối: backend full suite **421/421**, mobile full suite **290/290** + latest affected rerun **41/41**; TypeScript/no-unused và diff check đạt, không lint. Backend dev **18081** đã chạy mã mới với V15; trước/sau giữ nguyên 2 trips, 8 places, 0 memberships/memories/itinerary-items. Health 200, anonymous Places 401, CORS 8082 và đăng ký 4 tuyến mới trong OpenAPI đạt. Không gọi Mapbox live hoặc tự nghiệm thu Android/web.

- Người dùng yêu cầu chuyển QA-4 và đổi provider Maps sang Mapbox, chọn **catalog nội bộ + cấu hình trước**, chưa thêm SDK. Chi tiết/API/test UI ở [QA4-PLACES-MAPBOX.md](QA4-PLACES-MAPBOX.md), hợp đồng chạy ở [places-qa4.openapi.json](api/places-qa4.openapi.json).
- Nối gợi ý/tìm kiếm/chi tiết INTERNAL vào form tạo chuyến, gửi UUID thật trong initialPlaceIds; connected detail đọc membership thật và thêm nhiều điểm qua batch nguyên tử/retry không trùng. Điểm mới ở Chờ xếp lịch, chưa gán ngày/giờ. Không dùng fixture khi API lỗi hoặc thiếu catalog.
- Backend V15 phân biệt source/owner; legacy có tham chiếu chuyến/lịch/kỷ niệm được ưu tiên riêng tư, giữ link và dữ liệu cũ. Create/add/batch/detail kiểm quyền; public optimizer không enrich USER; chuyến CANCELLED không sửa membership. Không sửa thuật toán planning/AI.
- Adapter Mapbox Geocoding v6 `/places/addresses` đã chuẩn bị, mặc định tắt; temporary/no-store, không persist vào Trip/Place, không gọi provider có phí trong phiên. SDK, tìm địa chỉ trong UI và quyền lưu provider chưa tích hợp; Google OAuth giữ nguyên.
- **QA-4 đang chờ nghiệm thu UI và cấu hình/provider**, không đánh dấu hoàn tất toàn Phase 3. QA-1 vẫn đã nghiệm thu; Home tổng hợp vẫn deferred. Các ghi chú cũ “Places chưa nối/chưa sang QA-4” phía dưới là lịch sử trước cập nhật này.

### Typography Home người mới và tạo chuyến · 06/11/2026

- Tinh gọn copy tiếp theo: bỏ dòng “Bạn có thể bổ sung chi tiết sau” ở thẻ chuyến đầu tiên; bỏ caption Chọn điểm đến bị lặp khi chưa chọn nơi đến trong create form. Giữ label và giá trị chính, cùng vùng miền khi đã có destination. Xóa key newDetail VI/EN không còn dùng.
- Home mới dùng AppText `title`24/32 cho lời chào, `subheading`18/26 cho hai tiêu đề thẻ, body16/24 cho hướng dẫn chính và tên điểm mẫu, secondary14/20, metadata/eyebrow12/16; CTA tạo chuyến16/24. Newscreen dùng chung cho API account rỗng và preview nên cả hai nhận cùng thay đổi. JourneyInvitationCard giữ typography returning cũ; ItineraryStopList giữ live cũ, chỉ chuẩn hóa phần sample.
- Form tạo chuyến: header24/32, tên điểm đến/ngày/nhóm nội dung16/24, label/chips/link14/20, helper/count12/16; input14/20 và CTA16/24. Chuẩn hóa chiều cao dòng ở picker nơi đến/ngày, tên Province16/24, ô tìm kiếm14/20. Ô nhập tên/ngân sách/search và nút tạo dùng minHeight để giãn theo font hệ thống; ngày/tên điểm không bị ép một dòng, các hàng có wrap và minWidth0. Không đổi palette, logic submit/API hoặc bật picker Places đang chờ tích hợp.
- **33 tests liên quan đạt, TypeScript/no-unused và diff check đạt**; không chạy lint hoặc thêm dependency. Chưa visual QA Android/iOS với font hệ thống lớn; kiểm tra trực tiếp còn cần trong vòng nghiệm thu. File log local `.expo/new-home-create-typography-*`.

### QA-1 đã nghiệm thu; chuyển QA-3 theo phụ thuộc · 06/11/2026

- Người dùng xác nhận QA-1 hoạt động hoàn hảo, chốt nghiệm thu chức năng Auth; điều kiện production vẫn theo kế hoạch riêng.
- QA-2 source review: Home API có chuyến hiện fallback list, chưa nối dashboard ba trạng thái còn lại hoặc GET/home. Người dùng chọn **kiểm Trip CRUD trước**, rồi quay lại Home sau Places/Itinerary/Memory. Không đổi UI_PREVIEW, không suy Home từ trang đầu list và không nhập fixture vào DB.
- QA-3 đã rà FE/BE/DB: list/create/read/PATCH/version/date preview/DELETE và destination catalog. Sửa double submit ở create form bằng guard trước RHF validation: regression trước sửa2 request, sau sửa1 request/1 điều hướng. Backend idempotency và retry key giữ nguyên. Bỏ fallback404 DELETE vừa thêm vì source/integration xác nhận xóa lại chính chủ đã trả204; không che lỗi thật hoặc giảm test ownership/rollback.
- **41 mobile tests,29 backend tests, TS/no-unused và diff check đạt.** Backend tests dùng PostgreSQL Testcontainers riêng. Dev 18081 anon Trips/Destinations401 và PATCH preflight8082 đạt; không tạo dữ liệu dev để ép QA. Chưa nghiệm thu UI Trip CRUD; xem batch T01–T10 và API/body trong [QA-ACCEPTANCE-PLAN.md](QA-ACCEPTANCE-PLAN.md). UI list chưa có controls tìm kiếm/lọc/sort dù API đã hỗ trợ; các module Places/lịch trình/thời tiết chưa được gán hoàn tất.
- Mốc Git cập nhật trong lúc QA: mobile `3a515be`, backend `afbfa5c`; không reset/merge/commit/push trong lượt này. Mốc và trạng thái trong các mục cũ bên dưới là lịch sử.

### Khởi động nghiệm thu sau merge · 06/11/2026

- **Tinh chỉnh kích thước Auth:** logo120×40→144×48 theo token riêng Auth; CTA Đăng nhập/Tạo tài khoản và link Đăng ký/Đăng nhập ở footer tăng chữ14→16, line-height24. AppButton có `labelSize="large"` opt-in, các module khác và input14 giữ nguyên. Đây là ngoại lệ mới cho quy ước label/link14 ở mốc Typography ngay dưới.
- **QA-1 · Typography Auth:** thêm `AppText` variants `title`24/32 semibold, `subheading`18/26 semibold, `bodyLarge`16/24 regular từ theme tokens. Áp dụng AuthScaffold, các màn login/register/email/verify/reset/Google-link/session và profile/editor; body chính/hướng dẫn/feedback16, secondary/link/label/legal14, caption12, input14 giữ nguyên. Footer link có vùng chạm tối thiểu44 và wrap, scaffold không tạo khoảng trống cho subtitle/footer rỗng. `body`14 và `heading`24 bold cũ giữ nguyên cho module khác. Google web giữ font SDK, cùng khung52/radius10 với AppButton, không sửa DOM bên trong iframe. Không đổi API, storage hoặc quy trình auth. Bộ Auth50/50, TypeScript/no-unused và diff check đạt; xem QA-ACCEPTANCE-PLAN.md cho kiểm tra font scaling/thiết bị còn cần thực hiện.
- **QA-1 · UI khôi phục phiên:** `SessionGate` dùng logo WeGo, nền mint mềm, thanh indeterminate chuyển động bằng Reanimated qua `useAmbientMotion` (dừng khi background/Reduce Motion), trạng thái lỗi và Retry đồng bộ; safe area + cuộn cho màn hình nhỏ/font lớn, VI/EN và semantic tokens. Không thêm delay, không đổi auth/storage/backend. 32 tests Auth UI/session/transport đạt, TS/no-unused và diff check đạt; chưa visual QA Android/Web (công cụ browser không khởi tạo được). Web vẫn memory-only nên reload mất phiên; Android SecureStore vẫn restore. Giữ phiên qua reload trên web là yêu cầu riêng chưa implement.
- **QA-1 Auth — source và tự động đã kiểm chứng:** đọc FE → Axios/schema/session → controller/service/repository/PostgreSQL; sửa logout vẫn thu hồi refresh token phía server nếu xóa SecureStore thất bại, đồng thời giữ lỗi STORAGE để phục hồi. Regression tái hiện trước sửa, đạt sau sửa. Bộ Auth mobile 49/49, TypeScript/no-unused đạt; backend Auth/Security 106/106 trên Testcontainers PostgreSQL riêng, 0 fail/error/skip. HTTP dev18081 đạt 6 case validation/auth/method và Google challenge 200 (không xác minh Google thật). SMTP có cấu hình, chưa gửi/nhận inbox trong lượt này; chưa nghiệm thu UI/Android/Google thật hoặc tải cao. Không tạo Postman Collection theo yêu cầu; method/URL/body để test nằm trong QA-ACCEPTANCE-PLAN.md. Chờ người dùng test QA-1 trước khi sang QA-2; rate limit trước public, logout access-token TTL, mail queue không bền và link Điều khoản/Quyền riêng tư chưa tương tác được ghi rõ trong kế hoạch. Không đổi backend runtime, env, dependency hay skin UI ở QA-1; không commit/push.
- **QA-0 hoàn tất phần nền:** backend dev đã lên V14/16 migrations, health 200 và CORS frontend8082 đạt, không reset/repair; 13 history rows và dữ liệu 9 bảng giữ nguyên. 403 tests xanh qua full-suite + rerun class ảnh hưởng. Sửa compile duplicate enum, đếm/xóa memory khác owner, tests dùng contract Trip cũ và Cloudinary thiếu config chặn boot (upload chưa cấu hình trả 503). Backend hiện chạy cổng18081. Chưa nghiệm thu UI, email/Google/media thật; tiếp theo QA-1A Login. Các bullet khảo sát bên dưới là mốc trước khi sửa.
- **Follow-up QA-0:** đã đọc metadata `flyway_schema_history`/schema của `travel_db` bằng transaction chỉ đọc. 13/13 script/checksum khớp parent `90afbb0`; source merge thiếu tên V4–V8 lịch sử ngoài duplicate V9/V10/V11. Chưa sửa/áp dụng migration; bước tiếp là khôi phục history và thêm migration mới, tách seed demo, kiểm tra trên DB riêng. Chi tiết trong kế hoạch QA.
- Chốt vòng lặp source FE/BE/DB → sửa có phạm vi → test phù hợp → người dùng test UI → hồi quy/chốt phase tại [QA-ACCEPTANCE-PLAN.md](QA-ACCEPTANCE-PLAN.md). QA-* không thay số phase tích hợp.
- Backend thực tế đã merge minhduc tại `8fc64b7`; nguồn tiến độ trước đó nói chưa merge là mốc lịch sử. Dev hiện cả FE và backend env dùng port 18081.
- QA-0 phát hiện source Flyway trùng V9/V10/V11; chưa sửa migration khi chưa đối chiếu history/schema DB đang dùng. QA-1A đã đọc source Login, chưa nghiệm thu runtime; không coi kết quả tests của commit cũ là chứng minh backend mới đạt.
- Lượt này chỉ source/preflight và tài liệu, không chạy test/backend/SQL, không sửa runtime hoặc env, không commit/push.

### Merge memory-v2 · 06/11/2026

- Nhận album/Kỷ niệm, quick capture, lưu ảnh local + upload/retry, profile editor và sửa gesture root/device URL. Resolve trên canonical API/query/session hiện hành; Home bốn trạng thái và bottom navigation mới nhất được giữ.
- Source có thay đổi Trip/P0-03 dùng cấu trúc khác; giữ toàn bộ module Trip của target, chưa đánh dấu day settings/pins/recovery của source đã tích hợp. Package và native config giữ nguyên; backend không merge, không push.
- **281/281 mobile tests**, TypeScript strict/no-unused và Metro web/Android bundling đạt; chưa QA thiết bị hoặc backend e2e. Xem [quyết định merge và giới hạn](MERGE-MEMORY-V2-2026-11-06.md).

### Bottom navigation web/Android · 05/11/2026

- Tinh chỉnh theo ảnh đối chiếu 06/11: Home/Cá nhân dịch ra ngoài đối xứng tối đa 8dp, giữ nguyên hai tab sát camera và tự giới hạn theo chiều rộng. Camera dùng đường kính 58dp, lõi 54dp, vòng trắng 2dp; SVG gradient có tọa độ rõ ràng, bỏ lớp backdrop riêng và chỉ animate halo thay vì phóng cả nút. 6 tests navigation đạt, TypeScript/no-unused đạt; chưa xác nhận trực quan bản mới trên Android.
- `floatingNavigationLayout` tính vị trí hai nhóm tab, chấm active và camera từ cùng chiều rộng frame đã đo; bỏ phân bổ bằng flex độc lập và margin theo tâm toàn màn hình. Giữ 4 icon, camera giữa, notch và màu Ocean Teal.
- Frame bao trọn phần camera nhô lên để vùng chạm native không vượt ngoài parent. Body/row có chiều cao rõ ràng; safe-area bottom tính một lần, giữ khoảng nổi tối thiểu. Gap âm cũ được thay bằng 0 (trước đó renderer đã clamp về 0); không dùng negative gap để ép icon gần nhau.
- Web/native dùng chung `NavigationBarSurface` và SVG mặt nền; tách rgba thành RGB + alpha của SVG, bỏ filter shadow trong SVG native. Shadow dùng View, web bổ sung CSS backdrop blur cùng path; Android dùng nền bán trong suốt, không tuyên bố có native Liquid Glass/blur.
- **224 tests đạt**, gồm 4 test mới về các viewport, tọa độ giữa platform, hit targets/clearance, tab events/keyboard và SVG material chung; TypeScript strict/no-unused đạt. Metro web và Android đều trả bundle HTTP 200 có các module navigation mới (Android retry sau lượt cold bundle timeout). Không thêm dependency, không lint/Expo Doctor. Chụp cửa sổ Pixel 7 qua computer-use bị timeout sau một lượt phục hồi; chưa xác nhận trực quan Android, không coi test hình học/bundle là screenshot QA.

### Home tài khoản mới sau đăng nhập · 05/11/2026

- Sửa tab Home API trước đó trỏ thẳng vào danh sách chuyến đi: `ConnectedHomeScreen` chỉ hiển thị Người dùng mới sau khi query thành công và `totalElements=0`; loading/error có phản hồi/thử lại riêng.
- Tách `NewUserHomeScreen` dùng chung cho preview và API, giữ nguyên logo/header, greeting, card chuyến đầu tiên/animation/CTA và lịch trình mẫu Glassmorphism. API không hiện nhãn cả app là phiên preview; ví dụ vẫn là sandbox có nhãn minh họa, không tạo fake Trip.
- Tạo chuyến đi mở form/API hiện có; server query được invalidate sau tạo/xóa. Không đổi auth/preview flag hoặc copy server data vào fixture store. Home có chuyến vẫn dùng fallback list thật đến phase dashboard tổng hợp.
- TypeScript strict/no-unused và **220 tests đạt**, gồm 5 test mới về route, empty/loading/error/retry, thay đổi số chuyến và action tạo/sample. Export Android/Hermes và web đạt; web chạy lại trực tiếp Expo CLI sau lỗi wrapper PowerShell. Không lint theo yêu cầu; chưa nghiệm thu trực tiếp tài khoản thật trên UI máy ảo.

## Hợp đồng Trip CRUD · 02/11/2026

### Phase 3 — Khảo sát và contract Places · 03/11/2026

- Đã đối chiếu backend/mobile và xuất [contract triển khai](PHASE-3-PLACES-CONTRACT.md) + [OpenAPI 9 operations planned](api/places-discovery.openapi.json). Chưa thêm API Phase 3 hoặc nối UI.
- Backend chỉ có model/repository Place, chưa có discovery/provider; client search nhập từ đồng đội chưa khớp endpoint. UI tìm/chi tiết vẫn dùng fixtures; connected cần nhận dữ liệu tường minh, không tự đọc giá/giờ mẫu.
- Chốt tách UUID nội bộ / Google reference / TripPlace / ItineraryItem. Google resolve chỉ preview, không DB write; không lưu toàn bộ nội dung provider. Custom cần source/owner/idempotency và guard mọi tham chiếu, gồm Trip initialPlaceIds và public planning metadata lookup, trước khi bật.
- Tiếp theo: lát cắt 3A internal suggestions/detail và bảo vệ provenance/ownership trước custom; rồi 3B Google preview. Materialize Google vào lịch, Photos, QA thiết bị/HTTP e2e và Phase 1 production gates còn mở. Backend đồng đội vẫn chưa merge.
- Lượt này chỉ tài liệu: kiểm tra OpenAPI/schema/examples/refs và diff; không chạy lại app/backend tests/build, không gọi Google thật hoặc DB cá nhân. Các số kiểm thử bên dưới là mốc Phase 2 đã chạy trước đó.

### Phase 2 — Danh mục điểm đến và picker API · 03/11/2026

- Đã thêm GET `/api/v1/destinations`: authentication, pagination, tìm tên có/không dấu hoặc code, ký tự LIKE được escape. Chỉ đọc Province nội bộ; không gọi Google/provider.
- Picker tạo/sửa dùng ID Province thật, RHF giữ tên + ID; tên tự nhập bỏ ID cũ kể cả tên trùng. Có debounce/cancellation, loading/empty/error/retry/load more, VI/EN và preview cục bộ giữ nguyên.
- **357 backend tests, 215 mobile tests**, TypeScript/no-unused và export web + Android/Hermes đạt. Không lint/dependency/migration mới, chưa QA thiết bị/HTTP e2e hoặc đo latency production.
- **7/7 operations Trip CRUD đã triển khai**; main migrations không seed Province, cần import nguồn chính thức trước production. Backend đồng đội chưa merge; Phase 1 production gates vẫn mở. Xem [DESTINATIONS-INTEGRATION.md](DESTINATIONS-INTEGRATION.md).

### Mốc trước: Phase 2 — Sửa/xóa chuyến đi và kết nối UI · 03/11/2026

- Theo chỉ định chuyển phase của người dùng sau review Phase 1: đã triển khai PATCH, date-change-preview, DELETE trên backend hiện tại; không merge `integration/team-sync`, không sửa planning/AI/auth.
- Owner scope trước conflict, khóa Trip + version, PATCH phân biệt omitted/null, no-op giữ version/updatedAt; đổi ngày atomic và kiểm lại impact khi ghi; DELETE soft-delete Memory liên quan, không xóa media/Place dùng chung.
- V11 thêm `itinerary_items.removed_at` để gỡ lịch mà vẫn giữ note/time legacy; active reads loại archive. Ngày giao nhau giữ ID/cấu hình; TP membership/note/duration/visited được giữ, thiếu membership legacy được đưa lại pool. Không tự chạy migration trên DB cá nhân.
- UI thật có menu sửa/xóa, dùng lại form/modal, disable pending, xác nhận ngày, giữ form khi lỗi và yêu cầu review version mới; không tự retry 409. Chỉ PATCH dirty fields, sửa được ngày quá khứ; xóa cập nhật list/Home và cache liên quan.
- **350 backend tests**, **208 mobile tests**, TypeScript/no-unused và export web + Android/Hermes đạt. Không lint/dependency mới, chưa QA browser/thiết bị hoặc HTTP e2e UI → backend thật. GET destinations và nghiệm thu môi trường thực vẫn mở; không coi toàn bộ Phase 2 production-complete. Xem [PHASE-2-TRIP-MUTATIONS.md](PHASE-2-TRIP-MUTATIONS.md).

### Review Phase 1 · 03/11/2026

- Đối chiếu backend/frontend Auth/session/profile, chạy toàn bộ backend **337 tests đạt** (131 thuộc Auth/User/Security, PostgreSQL Testcontainers) và mobile **194 tests đạt**, TypeScript/no-unused và export web + Android/Hermes đạt.
- Sửa cache còn lại khi Google magic link chuyển từ account A sang B không qua logout; refresh cùng user vẫn giữ cache. Thêm test SessionManager + QueryClient và real Axios/Auth API pipeline (HTTP adapter thay server).
- Code/contract đạt các kiểm tra đã chạy; **chưa chốt nghiệm thu môi trường thực/production**. Còn rate limit trước public, URL email dev cần khớp web/native, SMTP/Google/deep-link/device QA thật; PUT profile chưa nối UI.
- Không merge/sửa backend, không Phase 2. Chi tiết mức độ tác động, đánh đổi logout/email/web session và checklist nghiệm thu: [PHASE-1-AUTH-REVIEW-2026-11-03.md](PHASE-1-AUTH-REVIEW-2026-11-03.md).

### Bổ sung Auth/Cá nhân từ `minhduc` · 03/11/2026

- Đưa UI Cá nhân mở rộng (tên/email/vai trò/avatar chữ cái, ngôn ngữ, đặt lại mật khẩu qua email, đăng xuất), nút đổi email sau đăng ký và logo WeGo vào code hiện tại. Không nhập lại service auth trùng lặp.
- Review sửa: bỏ cắt tên “Demo”, dùng token thay kích thước viết tay, giữ tên dài, error/retry và loading đúng khi query bị disable, điều hướng recovery về đúng tài khoản; logout cục bộ có thông báo trên web/native và không chuyển trang theo response của phiên cũ.
- Auth/API thật mặc định development; preview là opt-in `EXPO_PUBLIC_UI_PREVIEW=true`, release luôn auth. Không sửa env cá nhân. Input giữ 14, theme sáng và VI/EN; không thay UI các module khác hoặc merge backend.
- TypeScript/no-unused và **186/186 tests**, export web và Android/Hermes đạt. Không lint, không dependency/config native mới, chưa e2e backend/email/Google hoặc QA thiết bị. Xem [hướng dẫn auth](auth-integration.md).

### Merge mobile `minhduc`

- Gộp vào `feat/ui/memory`, ưu tiên UI và chuẩn hiện tại; giữ Home/camera/album/modal/gesture, không nhập các rewrite giao diện làm mất tính năng đã chốt.
- Giữ Trip API canonical đã triển khai, loại contract Trip legacy xung đột, thống nhất query keys theo owner; tách Place API và sửa mapping ba loại ID.
- Nhập service Places/Itinerary/Weather/Memory dưới dạng chưa nối UI; Maps SDK `1.27.2` tùy chọn, mặc định tắt. Một `app.config.js` giữ đủ OAuth/dev-client/scene/camera; không để config TypeScript ghi đè.
- Kiểm tra lần merge: **177/177 tests**, TypeScript/no-unused, export web và Android/Hermes chế độ API đạt. Expo Doctor **20/21**, còn 9 package lệch patch có sẵn; không nâng ngoài phạm vi. Không lint, chưa QA thiết bị/native map hoặc e2e backend trong lần merge.
- Backend **chưa merge** theo yêu cầu; giữ `fix/rag-ai-v2` tại `00b797d`, working tree sạch. Không tính các service vừa nhập là hoàn thành phase tích hợp. Xem [báo cáo và giới hạn](MERGE-MINHDUC-2026-11-02.md).

### Đã triển khai vertical slice đầu tiên

- Backend có POST /api/v1/trips, GET /api/v1/trips, GET /api/v1/trips/{id}; Flyway V10 thêm metadata/version/create key và trip_days. Tạo Trip + itinerary + ngày/pool atomic, chống duplicate concurrent, owner scope và pagination thật.
- Frontend thêm DTO/Zod, Axios API functions, React Query theo owner, nhánh tạo/list/details thật với pending/error/retry. Giữ UI preview; bật tích hợp bằng EXPO_PUBLIC_UI_PREVIEW=false. Không sửa env cá nhân hay chạy migration lên DB local của người dùng.
- Draft thuộc AI, ngoài MVP. Chuyến mới PLANNING, mode theo calendar server. Nhánh tích hợp không dùng sample stops/weather/route/media làm dữ liệu thật.
- Home ở API mode tạm dùng list chuyến thật; details đọc metadata/ngày, còn timeline/map thực/PATCH/delete/Places/weather/media chờ phase sau. Preview bốn trạng thái không bị thay.
- Hướng dẫn chạy, cấu hình địa chỉ theo thiết bị, lưu ý đăng nhập lại sau reload web và giới hạn: [TRIP-API-INTEGRATION.md](TRIP-API-INTEGRATION.md).
- Kiểm tra: toàn bộ backend **337 tests đạt** (PostgreSQL Testcontainers, Flyway và auth thật), frontend **171 tests đạt**, TypeScript/no-unused đạt; export web và Android/Hermes ở chế độ API đạt. Không lint, chưa QA trực quan/thiết bị hoặc đo latency production.

### Mốc đặc tả trước triển khai

- Đã đối chiếu UI/form/store với entity/repository/migration backend, xuất [đặc tả Trip CRUD](TRIP-CRUD-CONTRACT.md) và [OpenAPI JSON](api/trip-crud.openapi.json): 7 operations, 24 schemas.
- Người dùng xác nhận draft thuộc luồng AI sau này, ngoài MVP. Chuyến tạo mới dùng PLANNING; mode hiển thị tính theo ngày/timezone. Preview hiện tại chưa đổi.
- Đặc tả có validation, owner scope, pagination, idempotency create, version cho cập nhật/xóa, preview tác động đổi ngày, soft-delete và kế hoạch migration; không viết lại auth hoặc planning.
- Tại mốc đặc tả ban đầu chưa có Trip controller/service/migration; vertical slice nêu phía trên được triển khai tiếp sau đó. PATCH/delete/date preview/destinations vẫn chưa triển khai.
- Kiểm tra contract và ví dụ bằng JSON Schema/internal references; không chạy app/backend tests hoặc lint trong thay đổi tài liệu này. Chưa phải kiểm thử tích hợp hay chứng nhận API hoạt động.

## Tìm và thêm địa điểm · 27/10/2026

- Cập nhật chi tiết địa điểm: khung bản đồ kéo giãn dùng chung với trip details, thông tin/ảnh/địa chỉ/giờ/giá bên dưới, nút chọn cố định. Header không có tiêu đề chữ, nút map compact 32px với vùng chạm 44px. TypeScript, 153 tests và export Android/Hermes đạt; thông tin vẫn là fixture.

- Chi tiết mở màn Stack riêng `/trip/add-places`, thay picker modal và bước hỏi thêm vào ngày/pool. Giao diện dùng chung ở bước tạo chuyến, giữ dữ liệu form khi quay lại.
- Tìm tên VI/EN, không dấu và địa chỉ; xem ghim/phóng tới vị trí, xác nhận, chọn nhiều điểm, chọn ngày/chờ xếp, lọc đã chọn, đặt ghim riêng có tên. Draft chỉ được lưu khi bấm thêm. Địa chỉ và tọa độ được giữ trong store.
- Bản đồ và dữ liệu tìm kiếm là preview cục bộ, có nhãn ngay trong UI; chưa kết nối Google Maps, API Places hoặc GPS. Không thêm dependency. Xem [PLACE-SEARCH.md](PLACE-SEARCH.md).
- TypeScript/no-unused, toàn bộ 149 tests và export Android/Hermes đạt. Công cụ trình duyệt lỗi môi trường nên chưa QA trực quan hoặc trên điện thoại; không chạy lint theo yêu cầu.

## Tìm địa chỉ cụ thể · 28/10/2026

- 29/10: hoàn thiện màn camera riêng từ nút giữa navigation: khung vuông, flash, zoom kỹ thuật số 1×/2×/3×, chọn ảnh hệ thống, camera trước/sau, xem trước/xác nhận, counter ảnh chuyến và lối tắt. Ba module Expo camera/image-picker/image-manipulator mới; cần development build mới. Ảnh vẫn thuộc phiên preview, chưa backend/persistence. Có native-module guard cho build cũ. Xem [CAMERA.md](CAMERA.md).

- 29/10: modal Điểm xuất phát đổi thành Sửa lịch trình trong ngày. Tìm tên/địa chỉ mẫu không dấu, nhập địa chỉ riêng hoặc chọn nhanh từ các điểm trong ngày. Có danh sách thời lượng 30/60/90 phút/Khác (5–480), tổng thời gian trực tiếp. Lưu origin + thời lượng bằng một mutation nguyên tử, giữ giờ đến/thứ tự/phương tiện. TypeScript và 164 tests đạt; chưa QA trên điện thoại.

- Chi tiết điểm trên timeline: thêm phân loại/trạng thái mẫu, chip tiện ích/lưu ý, card lịch ghé thăm có switch ghim và nút Sửa mở modal riêng. Lưu giữ người dùng tại màn chi tiết, card tự cập nhật. Bổ sung giới thiệu và dải ảnh địa điểm/khu vực từ asset có sẵn; chưa có API thông tin/mở cửa.

- Chi tiết địa điểm từ timeline chuyển sang route Stack riêng, dùng lại giao diện/bản đồ của thêm địa điểm. Có form giờ/thời lượng/ghi chú/ghim, lưu về timeline, bỏ điểm có xác nhận; trạng thái Đã ghé đồng bộ store, footer Chỉ đường mở rộng bản đồ + Đã ghé. Chuyến hủy chỉ xem, check-in tương lai/pool tạm khóa. Xem [PLACE-SEARCH.md](PLACE-SEARCH.md).

- Thêm kết quả địa chỉ với màn “Vị trí đã chọn”: địa chỉ, tên riêng bắt buộc, thông tin chưa có dữ liệu. Dùng lại bản đồ kéo mở rộng, lấy vùng riêng cho địa chỉ. Có fixture Quang Trung/Gò Vấp để thử tìm kiếm; chưa kết nối Google Maps. Xem [PLACE-SEARCH.md](PLACE-SEARCH.md).

## Chi tiết chuyến đi · 21/10/2026

- Planning mới nhất: sơ đồ 35%/80%, dải ngày gọn 96px và thêm ngày bằng `+`; cuộn xuống ghim Back/tên/sửa/mở bản đồ trên dải ngày, vuốt nhanh ngược lên hoặc bấm mở lại trả về 35%. Dùng chung một Animated.FlatList; **112 tests**, TS/no-unused, Android/Hermes export đạt; đã thử web, native gesture chưa QA.

- Hoàn thành MVP frontend và điều chỉnh ba mode theo ngày: Planning / Live / Recap. AppBar gọn không cover; date strip + tab Chưa xếp lịch; sơ đồ ~36% phía trên và FlatList timeline phía dưới. Chạm số cuộn/highlight đúng stop. Recap ưu tiên album, Live ưu tiên chỉ đường/camera.
- Quản lý lịch: pool chưa xếp, thêm/sửa/chuyển ngày/gỡ, ghim, drag + mũi tên sắp xếp, preview thứ tự mẫu, áp dụng và hoàn tác. Chỉnh thông tin/ngày/lưu trú/ngân sách/sở thích/ghi chú và xóa có xác nhận; check-in/ảnh dùng chung dữ liệu Home.
- Route group `(workspace)` giữ một session store cho tabs và details trong auth guard; URL tabs không đổi. Địa điểm chọn khi tạo chuyến chuyển vào pool, không tự gán ngày 1/giờ giả.
- Backlog bao gồm pool và stop thiếu giờ trong ngày; reorder chỉ xử lý stop có giờ rồi ghép lại, giữ pins/giờ/backlog. Timeline có số khớp sơ đồ và khung giờ tham quan; share Recap là bản tóm tắt văn bản, không phải link công khai.
- TypeScript và **104/104 tests** đạt; export Android/Hermes + Web đạt. Đã kiểm tra luồng marker/backlog/xếp lịch, Live check-in/camera mẫu và Recap album trên web; native gesture/keyboard/a11y/share/performance chưa QA. Không lint, không dependency mới.
- Bản đồ, tối ưu và thời tiết vẫn thuộc preview; chưa nối backend, chưa có lưu qua reload hoặc camera thật. Xem [thiết kế và kết quả triển khai](TRIP-DETAIL-DESIGN.md).

## Rà soát Trips và đề xuất màn chi tiết · 21/10/2026

- Người dùng đã hoàn thiện UI danh sách/tạo chuyến trong `src/features/trip`; đã review code và chạy TypeScript + 74 tests hiện có, đều đạt.
- Đã sửa các phát hiện trong lượt tiếp theo: picker dùng session riêng và commit sau đóng; đổi thành phố bỏ địa điểm cũ; list/plan dùng một scoped store, không cắt bốn mục; ngân sách/sở thích được lưu và đọc lại; form RHF + Zod và copy VI/EN. Chi tiết trong [TRIPS-REVIEW.md](TRIPS-REVIEW.md).
- Bổ sung 13 regression tests, toàn bộ suite **87/87 đạt**, TypeScript và export Android/Hermes + Web đạt. Chưa QA trên điện thoại. Không chạy lint hay thêm dependency.
- Header tạo chuyến tăng khoảng đệm trên thành **safe area + 32px** theo yêu cầu; vẫn giữ khoảng đệm bên dưới và bố cục form.
- Đã đề xuất màn chi tiết lấy timeline từng ngày làm trung tâm, bản đồ là cách xem thứ hai, địa điểm chưa xếp và tối ưu có preview/undo: [TRIP-DETAIL-DESIGN.md](TRIP-DETAIL-DESIGN.md). Đề xuất này đã được hiện thực ở mức MVP frontend trong lượt tiếp theo; chưa sửa planning backend.

## Safe area dùng chung · 21/10/2026

- Khởi tạo provider với số đo cửa sổ ban đầu; chuyển screen frames và top-inset consumers sang `ScreenSafeArea`/`useScreenInsets` dùng chung.
- Lề trên dựa safe area và status bar hệ điều hành trên Android, không gán một chiều cao chung cho mọi điện thoại hoặc cộng đôi status bar/inset. Giữ khoảng đệm nội dung theo theme.
- Bao phủ Home, Trips, Memories, Profile, auth, camera mẫu và các toolbar/panel toàn màn hình. Bỏ mốc top 20px trong modal tạo chuyến, dùng inset + spacing theme.
- Thêm 7 tests cho inset bằng 0, notch, tránh lề đôi, provider đã dịch xuống và iOS/web. Toàn bộ suite **74/74 đạt**, TypeScript và export Android/Hermes đạt; không chạy lint. Cần kiểm tra layout thực tế trên Android/iOS vì ADB chưa có thiết bị.

## Khắc phục native photo module · 21/10/2026

- Home không còn import eager `expo-media-library`/`expo-sharing`/`expo-file-system`; chỉ kiểm tra/tải khi dùng chức năng ảnh. Runtime thiếu module nhận lỗi có nội dung VI/EN, không crash Home hoặc giả báo thành công.
- Giữ API SDK 57, không downgrade sang legacy và không nâng dependency. Hướng dẫn build/cài lại ở [HOME-PREVIEW.md](HOME-PREVIEW.md).
- Thêm 8 regression tests cho lỗi module thiếu và hành vi save/share/permission. Toàn bộ suite hiện tại **67/67 đạt**, TypeScript và export Android/Hermes đạt. Không chạy lint. Chưa thử native trên điện thoại vì ADB chưa có thiết bị kết nối.

## Hiện trạng

| Hạng mục             | Trạng thái                                                                        | Phần còn lại                                                                                   |
| -------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Nền tảng UI          | Expo SDK 57, TypeScript strict, React Compiler, theme sáng, VI/EN mặc định VI     | Kiểm tra trên các kích thước/thiết bị mục tiêu                                                 |
| Auth                 | Đã có giao diện và code tích hợp; có tài liệu email/password, magic link, Google  | Không rà soát lại backend/auth trong lần chốt Home này; cấu hình môi trường theo tài liệu auth |
| Home · Người mới     | Hoàn thành UI và tương tác mẫu                                                    | API tạo chuyến/lập kế hoạch khi backend sẵn sàng                                               |
| Home · Sắp khởi hành | Hoàn thành UI, forecast/chọn ngày, checklist, nhắc hoàn thiện, album gần đây      | Forecast thật, dữ liệu chuyến, lưu checklist                                                   |
| Home · Đang đi       | Hoàn thành UI, timeline/check-in, thời tiết, nhật ký/ảnh mẫu                      | Dữ liệu thực tế, camera thật, lưu check-in/nhật ký                                             |
| Home · Đã đi         | Hoàn thành UI, dấu ấn và album gần đây                                            | Thống kê/lịch sử/ảnh từ backend                                                                |
| Header / navigation  | Dùng chung logo, nút thông báo, thanh kính và camera giữa                         | API thông báo; nội dung đầy đủ cho các tab ngoài Home                                          |
| Trình xem ảnh        | Có zoom/pan/paging/drag dismiss, toolbar, share/save và xóa preview               | QA gesture, quyền media, trợ năng, hiệu năng trên máy thật                                     |
| Rà soát Home         | Đã dọn cấu trúc, xử lý lỗi thực tế, bổ sung regression tests và cập nhật tài liệu | Lint chưa chạy theo yêu cầu; native QA còn chờ                                                 |

## Thay đổi trong lần rà soát

- Tách album và khung kính dùng chung khỏi các component dành riêng cho chuyến đang đi.
- Tách store preview, types và provider; thêm tests cho bốn scenario, draft, check-in, ảnh/ghi chú và vali.
- Bỏ modal/nhánh copy không còn sử dụng; bỏ bản ghi kỷ niệm tự phát sinh ngoài store.
- Chặn mở thumbnail lỗi; bổ sung điều khiển bàn phím cho viewer web.
- Dùng chung lifecycle motion theo focus/AppState/Reduced Motion và panel preview; không thêm memo/dependency đại trà.
- Bundle icon bản đồ WebP khoảng 19 KB thay PNG khoảng 1,53 MB, giữ PNG nguồn.
- Import đúng bốn font Roboto đang dùng thay vì kéo cả bộ font vào bundle native.

## Chốt UI sau rà soát và bàn giao

- Người mới: bỏ heading **CHUYẾN ĐI CỦA BẠN**; bỏ mảng glow xanh góc trên phải card **VÍ DỤ MINH HỌA**, giữ weather widget.
- Home hiện được chốt frontend bốn trạng thái; chưa có yêu cầu xây module tiếp theo.
- Đã xuất [ngữ cảnh bàn giao](AGENT-HANDOFF.md) và [lời nhắn mở chat mới](NEXT-CHAT-PROMPT.md), gồm quyết định UI, vị trí code, ranh giới mock/auth và giới hạn kiểm tra. Lần bàn giao chỉ sửa tài liệu, không chạy lại tests/bundle.

## Điều kiện trước khi tích hợp và phát hành

1. Chốt phần Home ở mức **UI với dữ liệu mẫu**; có thể chuyển sang module UI tiếp theo.
2. Thử trên Android/iOS: màn hình nhỏ, font lớn, safe area/bàn phím, screen reader, gesture ảnh, cấp/từ chối quyền và share/save; đo hiệu năng trên release build.
3. Khi backend sẵn sàng, nối API từng luồng và bổ sung loading/error/retry theo hợp đồng thật. Chức năng planning chưa sửa trong giai đoạn này.
4. Tắt `UI_PREVIEW_ENABLED` khi quay lại tích hợp auth. Sau đó thay dữ liệu Home mock bằng query hooks; hai công việc độc lập.

Đây là mốc hoàn thành frontend preview, chưa phải chứng nhận sẵn sàng production cho toàn bộ ứng dụng.

## Tài liệu

- [Hướng dẫn Home preview](HOME-PREVIEW.md)
- [Báo cáo rà soát Home và bằng chứng kiểm tra](HOME-REVIEW.md)
- [Auth integration](auth-integration.md)
- [Google Sign-In](google-auth.md)
