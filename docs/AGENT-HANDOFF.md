# Bàn giao ngữ cảnh cho agent tiếp theo

## Mốc hiện hành · Phần 10 — P1-02 · 06/11/2026

Code P1-02 đã triển khai; **QA điện thoại còn chờ** theo [P1-02-ACCEPTANCE.md](P1-02-ACCEPTANCE.md). Dừng review/push, không tự commit/push. Các mốc P1-01/P0 bên dưới là lịch sử; phần tiếp theo P1-03 khi người dùng yêu cầu.

`backOrReplace` giữ caller của ảnh, fallback đúng album/deep link. Timeline giữ offset theo ngày/pool qua end-drag/momentum, không ghi đè handler Reanimated bản đồ; picker giữ offset kết quả khi preview. `useUnsavedExit` dùng Router compatibility exports để chặn busy và hỏi dirty cho route/local form. Form chuyến/ngày/lượt ghé/reorder gửi dirty state cho host; ghi chú/profile tự guard. `TripDetailsSheet`/`usePickerSheetMotion` có beforeClose tùy chọn: xác nhận trước animation, swipe bị từ chối trở về vị trí mở. Caller cũ giữ callback commit sau animation. Keyboard avoidance Android/iOS, AppInput hint, focus/ref thời lượng và picker giờ đã nối.

`QueryFeedback`/`requiredQueryState` giữ cached content khi lỗi nền và ưu tiên lỗi chưa có data hơn pending. Xóa chuyến dùng mutex commit, trạng thái bận và callback screen cha sau cleanup, tránh mất điều hướng khi removeQueries unmount content. Lưu thành công có notice; hủy preview ảnh hưởng ngày không tính đã lưu. Không sửa backend/.env/dependency. Giữ thay đổi format bảng người dùng đang thực hiện trong MOBILE-MVP-IMPLEMENTATION-PLAN.md, không hoàn nguyên.

Kiểm chứng: TypeScript đạt; 25 focused đạt; full 312/306 đạt/6 lỗi harness cũ (trip-ui-flows 4, trip-weather-details 2). Lint repo 51 lỗi/3 cảnh báo cũ; changed scope còn lỗi refs cũ trong hook motion và warning DateTimePicker cũ. Source HEAD của hook cũng lỗi refs qua stdin (log baseline), không disable lint. Logs backend/target/p102-*.log; chưa QA thiết bị. Không tuyên bố full suite/lint xanh.

## Mốc hiện hành · Phần 9 — P1-01 · 06/11/2026

Người dùng yêu cầu triển khai P1-01. Code hoàn tất, **QA giao diện điện thoại còn chờ** theo [P1-01-ACCEPTANCE.md](P1-01-ACCEPTANCE.md). Dừng cho người dùng review/push, không tự commit/push. Mốc P0-04 bên dưới là lịch sử; phần tiếp theo sau review là P1-02 khi người dùng yêu cầu.

AppText thêm screenTitle/sectionTitle/cardTitle dùng scale hiện có; AppButton tối thiểu 48 và padding cho text wrap. StatusBadge dùng chung Home/trip/photo/category; ContentImage có fallback, TripCard dùng cover thật thay ảnh mẫu. Header, Home/Trips/Memories/Profile và sheet được căn theo token. Home dùng `selectHomeJourney` với TripSummary thật (ACTIVE/READY/PLANNING/COMPLETED/CANCELLED), không biến draft có ngày thành ongoing hoặc đếm cancelled là completed. CTA tạo mở CreateTripModal trực tiếp, completed mở album, ongoing giữ HomeLiveJourney. MemorySyncBadge chỉ trình bày checkpoint P0-04, không đổi cơ chế lưu/upload. Ngày chọn có nền/gạch chân/chữ đậm, stop focus có nhãn và viền.

`place-reference.ts` chỉ có giới thiệu Hồ Xuân Hương/Ga Đà Lạt kèm nguồn Vietnam Tourism, khớp tên đầy đủ + vùng tọa độ, loại địa chỉ tự đặt. Giới thiệu mở/thu gọn trong PlaceDetailsContent cho cả kết quả search và điểm đã lưu; không mượn ảnh/giờ/vé mẫu. Không sửa backend, .env, dependency/native config. TypeScript/lint file sửa đạt; 17 test trọng tâm đạt; full 305/299 đạt/6 lỗi cũ ở trip-ui-flows (4), trip-weather-details (2), không skip/cancel. Logs trong backend/target/p101-*.log. Chưa chạy/đánh giá hình thức trên thiết bị thật.

## Mốc hiện hành · Phần 8 — P0-04 · 06/11/2026

Người dùng đã yêu cầu và cho phép triển khai **toàn bộ P0-04 trong một lượt**. Code đã hoàn tất; nghiệm thu điện thoại còn chờ theo [P0-04-ACCEPTANCE.md](P0-04-ACCEPTANCE.md). Các câu “P0-04 chưa triển khai/phần tiếp theo” trong snapshot cũ bên dưới là lịch sử.

Ảnh local có `userId`; provider tạo store theo user + session generation. SessionManager cung cấp accepted user ID; callback auth cập nhật generation trong auth store. Không tự gắn chủ cho ảnh cũ thiếu user ID. Đọc native/SecureStore và web/IndexedDB theo từng record; giữ record lỗi để tránh mất dữ liệu. Upload giữ request ID trước HTTP, server ID/version sau create, media ID/version sau upload. Hook đọc metadata mới nhất từ store khi mutate; note giữ version lúc mở editor. Shared operation gate bao gồm upload/note/delete/export/assign, không cho gán lại sau create chưa rõ kết quả. Xóa có `deletePending` bền vững và nút retry; API xem MEDIA_001 404 là đã xóa. Merge không làm sống lại backup đã upload khi server list xác nhận ảnh không còn; local album shell chỉ đọc khi chưa tải được danh sách chuyến.

Backend thêm **V19__idempotent_capture_uploads.sql**: unique `(memory_id, client_request_id)` và SHA-256 payload. `POST /media/upload` nhận optional UUID `clientRequestId`, dùng memory row lock để serialize, replay cùng nội dung trả cùng media ID; đổi nội dung trả UPLOAD_006/409. API cũ không gửi key vẫn tương thích. Restart backend để chạy migration rồi reload mobile. Không sửa .env/dependency, không cài/build native. Các thay đổi itinerary/poolUpdates từ P0-03 đã tồn tại trong backend working tree trước lượt này và được giữ nguyên. Không tự commit/push. Sau review/QA, phần kế tiếp trong kế hoạch là P1-01 theo yêu cầu tiếp theo của người dùng.

Kiểm chứng phần 8: backend 21/21 (6 integration PostgreSQL thật + 15 unit); mobile full 299/292 đạt/7 lỗi harness cũ, không skip/cancel; sau bổ sung ưu tiên bản ảnh riêng khi cloud có cache, 19 test memory/HTTP đạt. TypeScript và lint file sửa đạt. Cụm PostgreSQL test `target/p004-test-db` đã dừng/xóa, log/report còn trong target. Chi tiết và tên nhóm lỗi cũ xem checklist P0-04; chưa QA thiết bị.

## Định hướng hiện hành của người dùng · 05/11/2026

Đây là dự án môn Phát triển ứng dụng di động của sinh viên năm cuối. Ưu tiên app chạy tốt trên thiết bị, dữ liệu/logic đúng, luồng thao tác rõ ràng, dễ sử dụng, UI/UX mượt và đẹp. Hoàn thiện từng luồng từ API đến giao diện; giữ WeGo/Ocean Teal/Roboto và các quyết định thiết kế đã chốt. Các việc vận hành production như CI/CD nâng cao, quota quy mô lớn, backup/monitoring, phát hành store thực hiện sau khi hoàn thiện đồ án nếu còn thời gian. Vẫn giữ validation, quyền sở hữu dữ liệu và bảo vệ dữ liệu đã lưu. Kế hoạch hiện hành: [MOBILE-MVP-IMPLEMENTATION-PLAN.md](MOBILE-MVP-IMPLEMENTATION-PLAN.md).

Các snapshot và kết quả preview bên dưới là lịch sử; đọc mã nguồn hiện tại và tài liệu contract API khi triển khai.

**Mốc mới nhất — Phần 7, 06/11/2026:** người dùng cho phép làm toàn bộ P0-03 trong một lượt. Đã triển khai code sáu luồng, QA điện thoại chưa thực hiện; dùng [P0-03-ACCEPTANCE.md](P0-03-ACCEPTANCE.md) để nghiệm thu. Backend thêm `SaveItineraryRequest.poolUpdates` và DTO metadata pool, ownership/version/không còn scheduled/unique ID được kiểm tra trong cùng transaction với save itinerary; giữ constructor/request cũ. Mobile `scheduleMutationRequest` thay các cặp PATCH→PUT khi trả điểm về pool. Điểm assigned chưa có giờ vẫn ở ngày đó; progress ưu tiên `plannedOrder`, fixture cũ thiếu order mới dùng giờ. Home có `HomeLiveJourney`, guard check-in dùng `useTripVisit`, chỉ đường bằng tọa độ/phương tiện. Form info/dates/reorder giữ version lúc mở, stop-details giữ form khi lỗi và theo điểm sang ngày mới. Preview tối ưu so sánh trước/sau và chặn proposal không khớp; Apply có guard và invalidate cả trip queries. Camera giữ bản riêng trước, library export tùy quyền không chặn upload; phân biệt trạng thái, chặn rời lúc ghi và hỏi trước khi bỏ ảnh chưa lưu. SavedLater chặn gán lặp, kiểm tra timestamp trước gán local và có đường mở album sau upload lỗi. Có 32 test PostgreSQL đạt; backend không có migration mới nên restart là đủ. Các test native/HTTP dùng double, không coi là QA thiết bị. P0-04 và production chưa triển khai. Dừng review/push sau lượt này; không tự commit/push. Các mục “mốc mới nhất/phần kế tiếp” trong snapshot phần 5–6 dưới đây là lịch sử.

**Mốc mới nhất — Phần 6 (P0-03, thêm điểm/xếp ngày):** `/trip/add-places` dùng `useAddTripPlaces` → `addTripPlaces`: validate lựa chọn, đọc trip/pool và chỉ POST điểm thiếu; xếp ngày đọc itinerary mới, chép nguyên lượt ghé rồi append với token hiện tại. Không đi qua adapter từ pool snapshot cũ vì có thể làm mất lượt ghé mới. Retry đối chiếu cả pool và ngày đích, kể cả mất response; điểm đã ở ngày khác báo lỗi, không tự di chuyển. Picker giữ lựa chọn qua refetch/preview/search, có nhãn điểm đã lưu; debounce không cho chọn kết quả cũ, điểm riêng có ID ổn định không phụ thuộc độ dài danh sách. Back handler và guard ref chặn thao tác lúc lưu; route `usePreventRemove` qua Expo Router compatibility export, effect quay lại sau mutation settle để không bị chặn nhầm. Background query error còn data không unmount picker. 20 test mới + 19 test tạo chuyến đạt; full 271/252 đạt/19 lỗi cũ, lint 51 lỗi/3 cảnh báo cũ, TypeScript/lint file sửa đạt. Chưa QA thiết bị, không sửa backend. Xem [checklist phần 6](api-contract-integration.md#existing-trip-place-selection). Tiếp theo là sửa lịch/di chuyển ngày/reorder/lưu/hủy của P0-03; còn Đang đi, chụp ảnh, tối ưu để rà tiếp. Dừng review/push trước khi làm tiếp, không chuyển sang production.

**Phần 5 (P0-03, tạo chuyến):** `CreateTripModal` dùng `useCreateTripWithPlaces` → `createTripWithPlaces`. Giữ request ID/`tripId`, cho retry điểm còn thiếu hoặc mở chuyến có xác nhận; không đóng form khi thêm điểm lỗi. Từ phần 6, identity và mapping request chuyển sang `api/place-selection.ts` để dùng chung, test hồi quy vẫn đạt. Checklist: [trip-creation-recovery](api-contract-integration.md#trip-creation-recovery).

**Kiểm tra cuối phần 7:** backend compile + 32 integration PostgreSQL đạt; cụm `target/p003-test-db` đã dừng/xóa, không còn server test trên port 55439. Mobile 86 test trọng tâm đạt; full suite 288/279 đạt/9 lỗi cũ (giảm từ 19), có response fixture thật từ test backend. TypeScript đạt, lint file sửa 0 lỗi/1 cảnh báo cũ `require()` camera; lint toàn repo 51 lỗi/3 cảnh báo cũ. Chưa QA thiết bị. Logs kiểm tra nằm trong `travel-system/backend/target/p003-*.log` (ignored). Test focused gồm create/add/picker/stop/live/optimization/camera/assignment; không chạy build native hoặc cài SDK mới.

Cách triển khai mặc định: làm từng phần theo kế hoạch; hoàn tất mỗi phần thì dừng để người dùng xem và push lên GitHub. Ngoại lệ người dùng cho phép làm toàn P0-03 trong một lượt đã được thực hiện ở phần 7; không tự suy ra phải làm luôn toàn P0-04. Chỉ chuyển sang phần tiếp theo khi người dùng yêu cầu tiếp tục. Phần 1 đã hợp nhất cấu hình Expo vào `app.config.ts`; xem [DEVICE-SETUP.md](DEVICE-SETUP.md). Lúc bắt đầu phần 2, package cài đặt đã khớp SDK; kiểm thử thiết bị vẫn cần xác nhận riêng trước khi hoàn tất P0-01.

**Phần 2 — Lưu thiết lập ngày:** backend thêm `PUT /api/v1/trips/{tripId}/days/{date}` trong `TripController` → `TripCrudService` → `TripCrudRepository`, sử dụng cột V14. Lưu cấu hình ngày và thời lượng trong một transaction, kiểm tra owner/trạng thái/version; đổi cấu hình cũng làm cũ timestamp của proposal tối ưu. Mobile dùng `save-trip-day.ts`, hook/API mới và form giữ phiên bản lúc mở; chỉ đóng sheet khi lưu thành công. Contract/checklist: [api-contract-integration.md](api-contract-integration.md#day-settings).

**Phần 3 — Ghim lượt ghé:** migration V17, DTO/entity itinerary và adapter mobile đã lưu `pinned`. `TspLocationRequest` có vị trí/giờ ghim; Held–Karp dùng `fixedPositions`, timeline giữ giờ hoặc báo `TRIP_014`; apply không được di chuyển ghim. Save có token `expectedUpdatedAt` từ snapshot; EntityManager refresh sau flush lấy timestamp thực của PostgreSQL. Các constructor DTO cũ được giữ để tương thích caller. Contract/checklist: [api-contract-integration.md](api-contract-integration.md#pinned-visits).

**Phần 4 — Route/tối ưu theo thiết lập ngày:** V18 thêm tọa độ origin, `TripCoordinate` dùng chung request/response. Client gửi `startCoordinate`; request cũ không có trường này giữ tọa độ khi tên không đổi, đổi tên thì xóa tọa độ cũ. Form dùng API search và các điểm trong ngày; shortcut nơi lưu trú vẫn cần chọn kết quả. `day-route.ts` ghép origin/visits/return, không bỏ qua điểm thiếu tọa độ; query key có phương tiện. Optimizer lấy cấu hình từ `trip_days`, dùng node origin riêng để không trùng ID khi chọn điểm ghé làm nơi xuất phát. `PlanningTravelMode` giữ mô hình 35 km/h cho hai chế độ có động cơ, 4,5 km/h cho đi bộ; đây là ước tính Haversine. Có 24 test unit, 29 test PostgreSQL và 41 test mobile trọng tâm đạt. Contract/checklist: [api-contract-integration.md](api-contract-integration.md#day-routing-and-optimization). Chưa QA thiết bị. Phần kế tiếp là P0-03 theo kế hoạch: luồng tạo/thêm/sửa, lưu/hủy và test API thật; không chuyển sang production hoặc refactor toàn bộ test preview.

Snapshot: **19/10/2026**. Repository mobile: **`E:/travel-mobile-ui`**. Mốc Git quan sát khi bắt đầu bàn giao: **`4b19a3e` — `complete code ui home page`**, working tree sạch trước khi thêm tài liệu này. Đây là thông tin lịch sử, không phải yêu cầu checkout/reset về commit đó.

## 1. Bắt đầu từ đâu

**Planning UI mới nhất:** Planning dùng một `Animated.FlatList`: ListHeader là `TripPlanningMap` (35%, mở 80%), row đầu là day strip sticky (96px, hai dòng, underline 3px, có `+`). `use-planning-map-collapse.ts` tự ẩn bản đồ khi cuộn xuống, ghim Back/tên chuyến/sửa/mở lại trên dải ngày; vuốt nhanh lên hoặc nút mở lại về 35%. Không tách thêm vertical scroll container; giữ viewOffset khi jump stop. Header tên 16px và divider nhẹ; map actions compact 32px/target44, vị trí hiện tại chưa có GPS. Hiện **112 tests**, TS/no-unused và Android export đạt, web đã thử, native gesture chưa xác nhận. Xem mục mới nhất ở đầu `TRIP-DETAIL-DESIGN.md`; các mốc dưới là lịch sử.

**Trip details · lượt UI mới nhất 21/10/2026:** Bản hiện tại **đã bỏ cover và toggle Lịch trình/Bản đồ**. AppBar gọn + day tabs (không counts), tab cuối Chưa xếp lịch. Helper `trip-details-layout.ts` chọn Planning/Live/Recap bằng ngày (inclusive), giữ Cancelled riêng, dùng clock của session mock. Planning/Live: sơ đồ S→1→2 trên khoảng 36% vùng nội dung, FlatList dưới; marker cuộn/highlight stop cùng số. Recap ưu tiên album/ghi chú theo ngày, CTA Xem kỷ niệm + chia sẻ văn bản; không mặc định hiện nút sửa/tối ưu. Header/actions/backlog/recap/timeline states tách component; `use-trip-timeline-scroll.ts` quản lý scroll retry có giới hạn/Reduce Motion/cleanup. Backlog gồm pool + stop chưa có giờ nằm trong days (cần giữ source date), không còn pool sheet/card riêng. `scheduledStops`/`mergeScheduledOrder` giữ reorder chỉ tác động stop có giờ; không làm rơi backlog/pins. Camera, visited, ảnh vẫn dùng chung Home. Hiện **104 tests**, TS và Android/Web exports đạt; QA web ba mode đã thực hiện, native/share/a11y chưa xác nhận. Thông tin MVP 97 tests ngay dưới là mốc lịch sử. Xem phần đầu `TRIP-DETAIL-DESIGN.md` trước đề xuất cũ.

**Trip details · 21/10/2026:** Đã implement MVP frontend; xem `docs/TRIP-DETAIL-DESIGN.md` (kết quả hiện tại nằm đầu tài liệu). Route `/trip/[tripId]` + param `day`; source ở `src/app/(workspace)/trip/[tripId].tsx`, screen/components/schema/mutations trong feature trip. Workspace native stack bọc chung provider và PreviewPanels, nằm trong auth guard; tabs đã chuyển thư mục vào `(workspace)/tabs` nhưng URL `/tabs/...` không đổi. Home/list/create chuyển qua route chung bằng `TripDetailsRedirect`, không còn PlanPanel hoặc modal trip-details riêng. Store có `mutateTrip` + pure reducer `applyTripMutation`; không thêm nguồn trips khác. `createDraft.initialStops` giờ lưu trong `unscheduledStops` (giờ trống), chỉ xếp vào ngày khi người dùng chọn. Chỉnh ngày giải cứu stop về pool, kỷ niệm giữ ngày chụp. Forecast/di chuyển/optimization/map vẫn là dữ liệu/luồng mẫu, không ngụ ý backend hay GPS thật. Hiện 97 tests, TypeScript, Android/Web export đạt; đã thử luồng web chính, cần QA native.

**Trips · 21/10/2026:** Người dùng đã làm UI danh sách/tạo chuyến tại `src/features/trip` và yêu cầu review + ý tưởng chi tiết. Đã sửa các lỗi review: xem trạng thái hiện tại trong `docs/TRIPS-REVIEW.md`; `docs/TRIP-DETAIL-DESIGN.md` có cập nhật triển khai MVP ở đầu tài liệu. List/plan chỉ dùng scoped preview store (không còn sampleTrips riêng/cắt bốn mục); create form dùng RHF + Zod, lưu budget/preferences và copy VI/EN. Picker mount session mới mỗi lần mở và chỉ Apply sau animation đóng; Cancel không commit. Header tạo chuyến có padding trên safe area + spacing.xxl (32px). Mốc trong snapshot cũ nói chưa chọn module tiếp theo không còn áp dụng cho Trips. Hiện có 87 tests đạt, gồm 13 regression tests mới; Android/Web export đạt. Vẫn cần QA native cho keyboard/gesture/safe area, không coi tests harness là kiểm thử trên điện thoại.

**Safe area · 21/10/2026:** Dùng chung `src/components/common/screen-safe-area.tsx` + `src/hooks/use-screen-insets.ts` cho boundary màn hình/modal. Root provider có `initialWindowMetrics`; Android dùng `StatusBar.currentHeight` do hệ điều hành báo (đã trừ `frame.y`) làm mốc tối thiểu, không cộng chồng với inset. Giữ padding nội dung theo theme, không tự hardcode lề notch hay bọc safe area hai lần. Xem hướng dẫn trong `HOME-PREVIEW.md`. Chưa có thiết bị ADB để xác nhận layout thực tế.

**Bổ sung 21/10/2026:** Đã xử lý crash tải Home khi runtime thiếu `ExpoMediaLibraryNext`: các dependency native ảnh được guard/import lúc thao tác trong `services/journal-photo-actions.ts`, có lỗi VI/EN `nativeBuildRequired`. Không chuyển về legacy API, không nâng package. Bản app cũ cần build/cài lại để lưu/chia sẻ đầy đủ; xem phần khắc phục Android trong `HOME-PREVIEW.md`. Cảnh báo route thiếu default export là hệ quả import lỗi, không phải route thiếu export. Tám tests mới trong `tests/journal-photo-actions.test.ts` kiểm tra module thiếu, permission, cleanup và share. Không có thiết bị ADB kết nối tại thời điểm sửa nên chưa xác nhận native runtime.

Đây là tài liệu bàn giao sản phẩm và bản đồ code, **không thay thế `AGENTS.md`**. Đọc `E:/travel-mobile-ui/AGENTS.md` một lần để lấy quy định chính thức; `CLAUDE.md` chỉ trỏ về file đó. Nếu có quy định gần hơn trong thư mục đang sửa thì áp dụng đúng phạm vi. Không cần nạp toàn bộ lịch sử chat hoặc đọc lại cả hai repository.

| Cần biết                                           | Tài liệu / mã nguồn                             |
| -------------------------------------------------- | ----------------------------------------------- |
| Quy định phát triển chính thức                     | `../AGENTS.md`                                  |
| Trạng thái hoàn thành và phần còn lại              | [PROJECT-STATUS.md](PROJECT-STATUS.md)          |
| Luồng Home và giới hạn mock                        | [HOME-PREVIEW.md](HOME-PREVIEW.md)              |
| Kết quả rà soát, bằng chứng kiểm tra, QA còn thiếu | [HOME-REVIEW.md](HOME-REVIEW.md)                |
| Auth email/password và email links                 | [auth-integration.md](auth-integration.md)      |
| Google login, cấu hình và giới hạn                 | [google-auth.md](google-auth.md)                |
| Nguồn/giấy phép ảnh Home                           | [Asset README](../assets/images/home/README.md) |

Nhận yêu cầu tiếp theo rồi đọc đúng route/feature liên quan và component mẫu gần nhất. Không tự xây tab Chuyến đi/Kỷ niệm hoặc nối API chỉ vì chúng nằm trong roadmap. Home đã chốt UI; người dùng chưa chọn module tiếp theo tại thời điểm bàn giao.

## 2. Mục tiêu và các quyết định của người dùng

- Công việc chính là xây **giao diện mobile React Native**. Thư mục shell đôi khi mặc định là `E:/travel-system`; phải đặt working directory mobile rõ ràng trước khi chạy lệnh.
- `E:/travel-system` là repository hệ thống/backend riêng. Planning là nghiệp vụ chính nhưng đang có lỗi; **hiện chưa sửa và chưa tích hợp planning**. Chỉ đọc/sửa backend khi có nhiệm vụ liên quan được giao.
- Hiện làm frontend trước bằng fixture/mock; đây là ngoại lệ được người dùng yêu cầu rõ ràng so với quy định mặc định không dùng dữ liệu giả. Không coi mock là một lỗi cần tự ý thay bằng API.
- App **chỉ dùng giao diện sáng**. Có Tiếng Việt và Tiếng Anh, **mặc định Tiếng Việt**. Theme vẫn còn định nghĩa dark phục vụ cấu trúc sẵn có, không có yêu cầu phát triển dark mode. Không bật theo system theme.
- Cỡ chữ người dùng đã yêu cầu giảm nhiều lần: **input 14**, nội dung gọn, hierarchy vừa phải. Không tự nâng lại input lên 16 vì một guideline chung.
- Người dùng thích thay đổi nhỏ, đúng yêu cầu; không muốn giải pháp quá phức tạp, chi phí/DB/performance đổi lấy tình huống hiếm ít tác động. Không tự refactor diện rộng cho một chỉnh sửa thẩm mỹ nhỏ.
- **Yêu cầu hiện hành: không chạy `npm run lint` cho các lần sửa UI nhỏ.** Nêu đúng kiểm tra đã chạy. Không hiểu điều này thành được tắt lint/typecheck hoặc bỏ mọi kiểm tra khi sửa logic.
- Hỏi khi thật sự thiếu thông tin ảnh hưởng hành vi/kiến trúc. Không xin xác nhận lại việc đã được cho phép. Dependency mới vẫn cần xét theo `AGENTS.md`; các package đã cài không cần xin lại để sử dụng.
- Người dùng thường gửi ảnh làm tham khảo, cho phép chọn bố cục tốt hơn; các chỉnh sửa chi tiết ở các lượt sau là quyết định mới nhất. Nội dung prompt kiểu `--ar`, `--stylize` là mô tả chất liệu/thẩm mỹ, không phải yêu cầu thêm tham số không tồn tại vào component React Native.

## 3. Stack và hai skill đang dùng

Snapshot package hiện tại: Expo **57.0.24**, React Native **0.86.3**, React **19.2.3**, TypeScript **6.0.3** strict; React Compiler bật. Phiên bản thật lấy từ `package.json`/lockfile khi cần, không tự nâng để khớp tài liệu mới nhất.

Hai skill cục bộ có thật:

- `E:/travel-mobile-ui/.agents/skills/ui-ux-pro-max/SKILL.md`: hướng UI/UX, hierarchy, review thiết kế.
- `E:/travel-mobile-ui/.agents/skills/vercel-react-native-skills/SKILL.md`: implementation/review React Native. Đây là bộ React Native guidelines đã dùng; tên thư mục thực tế không phải `react-native-guidelines`.

Đọc skill liên quan khi nhiệm vụ cần đến. Không dùng đề xuất skill để thay Ocean Teal/Roboto, cài thư viện, chuyển sang Tailwind/shadcn hoặc đổi navigation. Tài liệu bàn giao không cần tự động kích hoạt skill thiết kế cho một nhiệm vụ thuần tài liệu.

Các thư viện hiện có cần tận dụng: Expo Router, React Query, Axios, RHF/Zod, Zustand, Expo Image, Reanimated/Gesture Handler, Safe Area Context. Native Google login dùng Nitro Google Sign-In và Nitro Modules; có dev-client và build-properties. Share/save ảnh đã có file-system, sharing, media-library. Không có camera/image-picker thật được thêm cho luồng Home: người dùng chọn dùng ảnh mẫu trước.

## 4. Ngôn ngữ thiết kế đã chốt

### Tổng thể

**Soft Minimalist & Editorial + Glassmorphism / Apple Liquid Glass + travel vibe.** Sáng, thoáng, dịu, gọn, phân cấp rõ; chuyển động nhẹ có mục đích. Logo hiển thị **WeGo** dù một số tên tài liệu/quy định cũ còn ghi Tripzy. Không đổi thương hiệu hiển thị theo tên cũ trong tài liệu.

- Ocean Teal, seed `#21B5C3`, mint/white/blue nhạt và teal đậm cho chữ/điểm nhấn. Giá trị màu cụ thể đọc từ semantic tokens, không chép hex của tài liệu này vào component.
- Kính có viền sáng mảnh, chiều sâu mềm; tránh bóng nặng, trắng bệt, nền kính ám nâu/xám bùn hoặc độ tương phản thấp. Không lạm dụng mảng glow màu ở góc các card.
- Người dùng không thích bo góc quá mức hoặc mọi card đều thành viên thuốc. Card thông thường hiện phần lớn dùng `radius.md`/`lg`; pill dành cho nav, badge, weather pill và các control thích hợp. Giữ ngoại lệ đã chốt, ví dụ invitation card có góc mềm hơn.
- Nội dung ngắn; tránh lặp ngày, nhiệt độ, địa điểm giữa các khối. Không tự thêm lại subtitle/tagline đã bị bỏ.
- Ảnh địa điểm là **ảnh thực tế**, bundle cục bộ với attribution. Không tạo ảnh AI thay ảnh địa điểm. Icon bản đồ glossy của card chuyến tiếp theo là asset riêng đã được duyệt, không phải ảnh du lịch thực tế.

### Typography, spacing và primitive

- `src/theme/tokens.ts`: spacing, radius, layout, motion, elevation, glass, typography.
- `src/theme/colors.ts`: palette và semantic colors; `themes.ts`: theme; `useAppTheme()` lấy theme hiện tại.
- Roboto Regular/Medium/SemiBold/Bold. Root layout import **từng biến thể** từ subpath package; tránh quay lại barrel kéo cả 18 file font vào native bundle.
- Mốc hiện tại: body/input 14, caption 12, heading nhỏ 18–20, heading chuẩn 24; đây là tham chiếu token theo ngữ cảnh, không áp một cỡ duy nhất cho mọi thành phần.
- `AppText`, `AppButton`, `AppInput` là primitive; dùng style/token/variant hiện có. Button có `primary`, `outline`, `hero`, `soft`, **`raised`**, **`gradient`**.
- CTA tạo chuyến/Chỉ đường: teal sáng có highlight và cạnh nổi nhẹ, dùng `raised`. Xem kế hoạch chuyến sắp tới: gradient teal đậm, chữ trắng, label và mũi tên liên kết/căn giữa. Thêm địa điểm: secondary mint, **không có mũi tên**.
- Icon có hệ thống `AppIcon`: Expo Symbols và SVG dự án; nav có outline/solid, nhiều control dùng `variant="light"`. Không thêm icon font khác chỉ để đổi một icon.
- Thân app sáng; viewer ảnh vẫn có backdrop đen theo yêu cầu xem ảnh, không phải dark theme cho toàn app.

### Header dùng chung

`components/home-header.tsx`: logo `assets/images/logo.png` bên trái, nút thông báo kính bên phải. **Không có profile icon và không có icon đổi trạng thái test trên header.**

Ảnh logo có transparent inset trái; component bù theo `logoLeftInsetRatio = 307 / 2172`. Không xóa bù lề này rồi thêm padding ngẫu nhiên khiến chữ WeGo lại lệch. Kích thước hiện lấy token 120×40. Tiêu đề chuyến đang đi gióng với phần chữ nhìn thấy của logo.

### Bottom navigation

`src/components/common/floating-bottom-navigation.tsx` và các file `navigation-*`, `notched-navigation-backdrop*`:

- Floating glass pill; trái: Trang chủ + Chuyến đi; giữa: camera; phải: Kỷ niệm + Cá nhân.
- **Chỉ icon**, không label dưới icon kể cả active. Active đổi màu teal và có chấm nhỏ; không dựng lại vòng pill/circle nền lớn bao icon active.
- Hai nhóm gọn, có khoảng thở hai bên camera. Camera nhô cao và có curved notch ôm phía dưới, glow nhẹ. Không thêm lại camera FAB đè lên nội dung Home.
- Token hiện tại: thanh cao 60, icon 24, camera 56, rise 28, side spacing 24, active dot 4; lề ngang 16 và safe-area, max width 480.
- **`tabBarGroupGap: -5` là chỉnh tay có chủ đích của người dùng.** Layout native clamp negative gap; implementation dùng `Math.max(0, ...)` cho nhóm và tọa độ indicator cùng hệ. Không đổi token sang dương hoặc tính chấm active theo công thức khác khi không được yêu cầu.
- Chiều cao nav được đo/cung cấp lại cho content padding. Đừng thay thành bottom padding cứng hoặc bỏ vùng chạm 44/48 dù icon nhìn nhỏ.

## 5. Bản đồ code và luồng dữ liệu

```text
src/app/                         routes/layout mỏng
  _layout.tsx                    font, providers, auth guards
  (workspace)/_layout.tsx        guarded workspace stack + scoped store + PreviewPanels
  (workspace)/tabs/_layout.tsx   floating tab navigation
  (workspace)/trip/[tripId].tsx  validated details route
src/features/home/
  screens/                       ghép giao diện Home và các tab preview
  components/                    hero, timeline, album, weather, packing, panels
  data/                          fixtures: trips, ongoing, recent memories, weather
  types/home-types.ts            Trip/Memory/HomeScenario...
  types/preview-state.ts         panel union và preview state/actions
  store/trip-preview-store.ts    Zustand vanilla factory, không phụ thuộc React
  providers/                     identity store theo phiên + useTripPreview selector
  hooks/                         motion/focus, capture action, photo gestures/keyboard
  services/                      share/save ảnh native và web
  utils/                         chọn Home, ngày, progress, photo geometry, maps URL
  i18n/                          Home / ongoing / weather / photo viewer copy VI/EN
src/features/trip/
  screens/                       Trips + TripDetails composition
  components/                    overview, timeline row, forms, sheets, diagram, reorder
  schemas/                       create/details form + route validation
  utils/trip-mutations.ts         immutable schedule operations
  data/                          place bank + explicit preview estimates
src/components/ui/               primitive
src/components/common/           glass, navigation, language switcher
src/hooks/                       hook dùng nhiều feature
src/services/api/                Axios client, normalized error, QueryClient
src/store/                       auth và locale xuyên feature
src/i18n/translations.ts         copy chung/auth
src/theme/                       semantic tokens
```

Các mẫu quan trọng:

- `HomeScreen` chọn trạng thái bằng `selectHome(trips, today)`. `TripHero` chọn hero; `OngoingHomeScreen` ghép riêng trạng thái đang đi và vẫn dùng `HomePage`/`HomeHeader` chung.
- `JourneyInvitationCard`: chung cho Người mới và Đã đi; `JournalAlbum`: chung cho Đang đi, Sắp đi, Đã đi. Không copy album sang từng screen. `JourneyCard` là shell kính dùng chung.
- `ItineraryStopList`: phong cách dùng chung lịch trình mẫu/live timeline. `NextStopCard` và `TodayTimeline` ở `ongoing-trip-components.tsx`; file này không còn chứa album.
- `PreviewPanels` render panel từ discriminated union trong store; panel đang đi chuyển sang `OngoingTripPanels`. Không thêm `kind` rời rạc không có caller; panel `weather`/`moment` cũ và `saveMoment` đã bỏ. Note hiện sửa trên memory ảnh.
- Store factory scoped theo provider; selector `useTripPreview` dùng `useShallow`. Local modal/checked state vẫn ở component. Derived values lấy từ dữ liệu gốc; animation frame không đẩy vào React state.
- `useHomeAmbientMotion` bọc `useAmbientMotion`: focus + AppState + Reduced Motion + shared panel. Modal thời tiết dùng hook nền chung để tự chạy animation khi mở. Chưa có visibility manager toàn cục cho mọi local overlay/card ngoài viewport; không tự xây nếu chưa có nhu cầu/profiling.
- File `.web.ts(x)` dành cho browser CSS/DOM, bản native dùng Expo/RN. `GlassBackdrop` dùng Liquid Glass khi API khả dụng; fallback native và backdrop blur trên web. Không đưa DOM/CSS browser vào file native.
- Alias `@/` trỏ `src/`, `@/assets/` trỏ root `assets/`; feature nội bộ dùng relative ngắn theo code lân cận. Viết RN `View`/`Pressable`/StyleSheet và theme, không chuyển dự án sang HTML/Tailwind.
- Khi có API: server state đi qua feature API/query hooks và Axios client chung, không nhét payload query vào preview store. Chỉ thực hiện khi có yêu cầu tích hợp.

## 6. Home bốn trạng thái — hành vi và thiết kế

Thứ tự chọn: **đang diễn ra → chuyến tương lai gần nhất (gồm draft có ngày) → có lịch sử → người mới**. Logic calendar-only ở `select-home.ts`, không dựa giờ UTC làm lệch ngày; draft quá ngày không tính là chuyến đã đi.

### Người mới

- Card Chuyến đi đầu tiên: illustration núi/rừng mờ, icon map/pin có motion nhẹ, mô tả ngắn, CTA Tạo chuyến đi + mũi tên.
- **Chỉnh sửa mới nhất sau đợt audit:** đã bỏ hẳn dòng **CHUYẾN ĐI CỦA BẠN** phía trên hero.
- **VÍ DỤ MINH HỌA** vẫn là label nhỏ nằm **ngoài** card. Tiêu đề Một ngày ở Đà Lạt nhỏ gọn; không có subtitle thành phố ngàn hoa.
- Metadata: `24/10/2026`, không có chữ Ngày đi; `1 ngày | 3 điểm dừng`; weather animation, ba ảnh nhỏ và số thứ tự nối dọc.
- Link Dùng thử lịch trình mẫu này →, padding trên/dưới 10, không padding trái/phải trên link.
- Không có dòng Lịch trình luôn có thể thay đổi theo bạn.
- **Chỉnh sửa mới nhất:** đã bỏ lớp `coolGlow` màu xanh góc trên bên phải card. Weather animation vẫn giữ; không nhầm yêu cầu bỏ mảng màu với xóa weather widget. Nền kính và accent ấm còn lại vẫn giữ.

### Sắp khởi hành

- Ảnh bìa thật Đà Lạt; badge đếm ngược **ngang**, kính trong mờ, icon đồng hồ + copy rõ **Còn 3 ngày**. Không quay lại badge dọc cao, nền nâu/xỉn hoặc chỉ ghi 3 ngày gây hiểu nhầm thời lượng.
- Tên, ngày/thời lượng, chip số điểm dừng; Xem kế hoạch gradient primary. Không có heading CHUYẾN ĐI CỦA BẠN/Xem tất cả phía trên hero.
- `TravelWeatherDashboard`: compact date selector, comfort score, thời tiết/UV, cảnh báo mưa nhẹ, vali và hourly. Chọn ngày cập nhật widget; vali tổng hợp cả chuyến.
- Đã bỏ dòng lặp Đà Lạt + khoảng ngày, bỏ Thuận lợi để khám phá, bỏ mảng màu góc trên bên phải. Dòng nhiệt độ không lặp `16°–24°C` cạnh nhiệt độ hiện tại.
- Rain alert dùng sắc xanh nhẹ; packing surface kính sáng/chữ rõ, không trở lại phối vàng đục + xanh quá gắt. Vali chưa tick món nào có icon hổ phách và rung nhẹ theo nhịp nghỉ; không ép hoàn thành. Tick có feedback/progress, đủ đồ có confetti ngắn, CTA Xong trong sheet. Có margin dưới ngăn cách hourly.
- Cần hoàn thiện: pin SVG + add, không vòng pulse/viền tròn bên ngoài hoặc green shadow; secondary Thêm địa điểm không có mũi tên.
- Dấu ấn của bạn rồi **Kỷ niệm gần đây**, album sáu ảnh như trạng thái Đã đi.

### Đang trong chuyến đi

- Quan trọng vì dùng liên tục ngoài đường: biết trip/ngày, điểm tiếp theo, đã ghé, chụp nhanh và nhật ký.
- Giữ header logo chung. Phần Đà Lạt/live badge/ngày/Chi tiết/weather là dải mở, **không khung card mẹ lớn**; weather pill mỏng ngang tiêu đề. Live badge nhỏ kính, chấm xanh chuyển động nhẹ.
- Chi tiết là text link/icon đơn giản đã tăng nhẹ kích thước, có vùng chạm ẩn >=44; không khôi phục nút hộp nặng.
- Hero điểm tiếp theo có quick info vé/giờ đóng cửa. **Không có Thông tin mẫu** trong card này.
- Hai CTA cùng hàng **60/40**, Chỉ đường `raised` primary, Đã ghé secondary mint/kính không xuống dòng. Không quay về 50/50 hay 65/35.
- Đã ghé cập nhật cùng visited state/timeline, chuyển điểm kế tiếp; prompt chụp khoảng hai giây, camera nằm trong bottom nav.
- Hành trình hôm nay tái dùng phong cách lịch trình mẫu, trục dọc + ảnh; trạng thái ✓/điểm tiếp theo/sắp tới thay số. Không dòng Khám phá/Chụp ảnh dưới mỗi tên; Điểm tiếp theo ngang hàng giờ. Không lặp lại hero lớn trong timeline.
- Weather modal dạng bottom sheet kính pastel/khí quyển, gọn khoảng **68%** chiều cao theo token sau lần tăng nhẹ. Có handle để vuốt/chạm đóng và chạm ngoài, **không heading Thời tiết tại điểm đến hay nút X** trong header modal. Hero icon/nhiệt độ, các cột giờ/icon/nhiệt độ/% mưa, gợi ý hổ phách có chữ **Nên mang dù và áo khoác mỏng**. Nội dung chi tiết chỉ xuất hiện khi mở weather pill.
- Nhật ký hôm nay là album chung, mô tả bên dưới.

### Đã đi, chưa có chuyến mới

- Giữ phong cách card Người mới, đổi ngữ cảnh thành chuyến tiếp theo. Icon glossy bản đồ/navigation đã duyệt, dùng `next-trip-navigation.webp`, PNG gốc chỉ làm source.
- Không heading CHUYẾN ĐI CỦA BẠN, không câu Một điểm đến mới, một câu chuyện mới.
- Dấu ấn của bạn: con số thành achievement badge, watermark bản đồ/la bàn, glass divider, action nhìn lại hành trình. Nhãn tỉnh/thành tránh vỡ từ.
- **Kỷ niệm gần đây** nằm dưới Dấu ấn, có sáu ảnh fixture thật thuộc trip quá khứ; không chỉ reuse ảnh nhưng quên trip/date association.

## 7. Album và xem ảnh toàn màn hình

- Hai ảnh/hàng, gap 4, không radius cho ảnh, không card trắng bao cả album; viền gỗ **2px màu nhạt**, không mat trắng. Không tên địa điểm/giờ dưới thumbnail.
- `JournalAlbum` preview tối đa sáu ảnh. Thumbnail đo tọa độ khi có event, không đo DOM/native trong render. Chưa load hoặc ảnh lỗi không bấm được.
- Viewer giống Photos: ảnh bung từ thumbnail, vuốt ngang, pinch/double tap theo điểm chạm, pan giới hạn/rubber band, kéo xuống ảnh theo tay/backdrop giảm và spring về thumbnail hoặc snap back. Gesture/motion ở UI thread, không React setState mỗi frame.
- Một tap ẩn/hiện chrome; **không có nút Ảnh gốc**. Ảnh hiển thị fit không crop như thumbnail.
- Toolbar theo mẫu photo viewer đã chốt, thay cho các thử nghiệm glass xanh trước đó: trên có back và ngày/giờ sát nhau, thêm margin top; date 14/time 12, không card bo góc bọc ngày/giờ. Dưới: Share riêng, cụm Heart/Download/Delete, Info riêng; nền control **đen mờ**, icon mảnh 22, back 24.
- Save/share lấy file ảnh đầy đủ. Native: Expo File System/Sharing/Media Library; web: Web Share hoặc download. Có busy/error/permission handling, confirm delete. Không coi nút save là chỉ lưu state.
- Delete chỉ xóa memory preview, không ảnh thư viện thiết bị. Favorite chỉ theo lần xem; checklist theo dashboard; store theo phiên, chưa lưu backend.
- Web keyboard: Escape, trái/phải, Space khi vùng ảnh có focus; native dùng system back/accessibility actions.
- **Lỗi từng gặp cần bảo vệ:** `Cannot access 'clampPhoto' before initialization`. Hàm/worklet helper phải được khởi tạo trước nơi Babel Worklets capture; không chỉ dựa vào TS pass. Có `photo-viewer-worklets.test.ts` chạy transform thực tế.
- RN Web có thể gọi lại Modal `onShow` khi callback đổi identity: giữ guard `presented` một lần, không bỏ rồi tạo vòng lặp setState.

## 8. Mock, auth và giới hạn tích hợp

### Preview Home

- `UI_PREVIEW_ENABLED = __DEV__` ở `src/constants/development.ts`. Vào Home thẳng trong development; bỏ session restoration và dùng Profile preview. Không cần backend để làm UI.
- Release vẫn guard auth. Đổi flag thành `false` + reload khi muốn quay lại tích hợp auth; **không tự làm trong nhiệm vụ UI**. Tắt flag không tự chuyển Home mock thành API.
- Default scenario là **returning**, đổi qua nút Đổi trạng thái ở cuối trang, không trên header. Mock today **2026-10-21** và sample trip bắt đầu **2026-10-24**; đếm ngược ba ngày là có chủ đích.
- Fixtures/import ảnh cục bộ. Scenario reset trips/memories/visited; restart provider mất sửa đổi. Store giới hạn trips/memories 20, album giới hạn 6; không thay preview thành feed vô hạn.
- Notification chưa có API. Camera dùng sample ảnh, không xin cài expo-camera/image-picker khi chưa có yêu cầu mới.

### Auth đã có từ giai đoạn trước

Đăng nhập/đăng ký, xác thực email qua link, resend, forgot/reset password, session/refresh/logout/profile và Google login đã có code/tài liệu. Backend ở repository riêng; **đợt chốt Home không audit lại backend**, không chứng nhận auth production-ready.

Yêu cầu quan trọng cần giữ: Google xác thực thành công với tài khoản email/password đủ điều kiện thì vào app **không bắt nhập lại mật khẩu**. Hiện tài liệu triển khai phân biệt Gmail/Workspace có thể auto-link và email ngoài miền đó cần link xác nhận hộp thư lần đầu, vẫn không nhập lại password. Đọc `google-auth.md` và code thật trước khi thay hành vi liên kết; không rút gọn thành auto-link mọi email có `email_verified`.

OAuth IDs/SMTP/domain/native build phụ thuộc cấu hình thật của người dùng. Lịch sử trước đây chưa có IDs; lần bàn giao này không xác minh lại các giá trị private/local và không xuất `.env`. Không giả lập login thành công khi cấu hình thiếu. Google native cần development build, không hứa chạy đầy đủ bằng Expo Go.

RBAC nghiệp vụ chưa hoàn thiện; yêu cầu audit trước đây loại RBAC khỏi phạm vi. Không tự thêm phân quyền hoặc coi mọi actor đã được production audit chỉ vì có JWT/route guards. Các số test/Doctor trong tài liệu auth là mốc lịch sử, không phải kết quả chạy mới.

## 9. Kiểm tra và việc còn lại

Kết quả gần nhất trong đợt rà soát Home trước bàn giao:

- TypeScript `--noEmit --noUnusedLocals --noUnusedParameters`: pass.
- `npm test`: **54/54 pass**, thêm bảy tests store/fixture/packing, cùng các tests chọn Home/date/progress và photo geometry/Worklets.
- Metro export web/static routes và Android/Hermes: pass. Đây không phải native build hay runtime trên điện thoại.
- `git diff --check`: pass. Không chạy lint theo yêu cầu.
- Sau đó chỉ bỏ heading Người mới và green corner glow của card Ví dụ theo yêu cầu; không chạy lại cả suite cho hai chỉnh sửa giao diện này. Bàn giao hiện tại chỉ sửa tài liệu, không chạy lại app/test.

Chưa có xác nhận mới về native gesture, VoiceOver/TalkBack, Dynamic Type/font lớn, contrast trên ảnh thực tế, quyền share/save hoặc FPS/bộ nhớ trong release. Không nói đã test trên browser/điện thoại khi chỉ chạy export. Cần native QA trước phát hành; integration loading/error/retry/persistence cần làm khi nối API thật.

## 10. Cách tiếp tục mà không làm lệch dự án

1. Đọc quy định gốc và snapshot này; kiểm tra `git status`/code hiện tại vì chủ dự án có thể đã sửa sau bàn giao. File hiện tại và yêu cầu mới hơn được ưu tiên hơn snapshot.
2. Với UI mới, lấy header/nav, card, typography, glass và timeline/album hiện có làm mẫu. Chỉ đổi style/behavior được yêu cầu; không khôi phục các thiết kế đã bỏ từ lịch sử.
3. Với chỉnh sửa nhỏ, đọc đúng component/token và sửa tại nguồn. Với sửa logic, dùng tests hành vi liên quan; không mở rộng kiểm tra không có mục đích cụ thể.
4. Không bật backend/auth, thêm dependency, đổi theme hoặc viết lại viewer chỉ để xem UI. Không dựng abstraction cho tương lai giả định; giữ thay đổi dễ review.
5. Cập nhật tiến độ/tài liệu khi đổi hành vi, boundary hoặc hoàn thành module. Báo ngắn phần đổi, kiểm tra thực chạy và giới hạn còn lại.

Ngữ cảnh này nhằm giúp tiếp tục đúng thiết kế/cấu trúc hiện tại. Những thay đổi mới do người dùng yêu cầu luôn có thể thay các quyết định UI trong snapshot.
