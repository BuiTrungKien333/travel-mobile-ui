# Bàn giao ngữ cảnh cho agent tiếp theo

**Tinh chỉnh Auth mới nhất:** logo riêng Auth144×48 qua layout.authLogoWidth/Height, không đổi headerLogo của Home. Nút Đăng nhập/Tạo tài khoản dùng AppButton `labelSize="large"`16/24; link Đăng ký/Đăng nhập ở footer cũng16/24, label/input14 giữ nguyên. Default AppButton ở module khác không đổi. Quy ước này cập nhật ngoại lệ link14/nút14 trong mốc Typography bên dưới.

**Typography Auth 06/11/2026:** dùng thêm AppText `title`24/32 semibold (AuthScaffold/Profile), `subheading`18/26 semibold (section/profile name/SessionGate), `bodyLarge`16/24 (hướng dẫn/feedback/email/giá trị profile). Label/link/secondary/legal14, caption12, input14. Không đổi default `body`14 hoặc legacy `heading`24 bold để tránh lan sang Home/Trip. Không hardcode size/family tại từng screen, các variant dùng token đã có. Footer auth hỗ trợ wrap + touch target44; bỏ vùng trống subtitle/footer không có nội dung trong scaffold. Google web dùng typography của SDK chính thức; khung nút cùng height52/radius10 với login, không can thiệp nội dung iframe. Auth50/50 tests đạt, cần QA trực tiếp Android/iOS font scaling + VI/EN; chưa đổi backend/session policy.

**QA-1 · SessionGate UI 06/11/2026:** đã chỉnh loading/error khôi phục phiên ở `src/features/auth/components/session-gate.tsx`: WeGo, mint backdrop, progress indeterminate dùng `useAmbientMotion`, Retry, safe area/scroll/accessibility/VI–EN. Token layout/motion trong theme; không thêm delay hoặc đổi session storage. 32 tests UI/session/transport + TS/no-unused đạt; browser CUA không khởi tạo được nên chưa visual QA. Người dùng hỏi reload web mất login: code hiện giữ refresh token ở biến memory (cả access cũng memory), reload mất là đúng policy hiện tại; Android SecureStore vẫn restore. Nếu yêu cầu duy trì web qua reload cần thay cơ chế phiên web riêng, chưa tự chuyển token sang localStorage/sessionStorage.

**QA-1 Auth 06/11/2026 — mốc mới nhất:** source reviewed; backend Auth/Security 106/106 tests trên PostgreSQL Testcontainers riêng, mobile Auth 49/49 + TS/no-unused đạt. Đã sửa `SessionManager.logout`: luôn thử revoke token server trong finally dù SecureStore remove lỗi, vẫn propagate STORAGE; bổ sung regression cho cả storage lỗi đơn lẻ và kèm network lỗi. Không sửa backend runtime/dependency/env hoặc giao diện ở QA-1. Dev18081: 6 HTTP negative/method smoke + Google challenge 200; không gọi Google thật, không gửi email hoặc tạo user dev. Một challenge dev đã tạo để kiểm contract cấu hình. SMTP có config, link dev trỏ web8082; chưa xác nhận inbox/native deep link. Không kết luận production-ready hoặc nghiệm thu UI. Xem phần QA-1 cuối `QA-ACCEPTANCE-PLAN.md` cho rủi ro còn lại, API/body và test thủ công. Người dùng không muốn Postman Collection. Bước tiếp: người dùng test Auth, agent xử lý phản hồi; chưa tự sang Home/Trips. Không commit/push.

**QA-0 đã sửa/kiểm chứng 06/11/2026:** xem backend/docs/QA-0-MIGRATION-RECOVERY-2026-11-06.md. Giữ V1–V11 canonical (khớp 90afbb0), thêm V12–V14; demo seed opt-in ngoài location mặc định. Dev travel_db đã migrate, history cũ 13 rows + fingerprint9tables giữ nguyên; backend hiện chạy port18081 (PID19612), Metro8082 sẵn. 403 tests xanh qua full-suite/reruns, health/CORS/401smoke đạt. Có sửa owner predicates count/softdelete memory và duplicate enum. Cloudinary chưa có credential: backend vẫn boot, upload trả503/UPLOAD_006; chưa xác nhận upload thật. Frontend runtime chưa đổi. Chưa commit/push. Bước tiếp theo QA-1A Login, không tự sang Trip/Media hoặc tuyên bố production-ready; mốc phía dưới nói chưa sửa migration là lịch sử.

**QA-0 · đối chiếu DB 06/11/2026:** đã đọc metadata dev `travel-postgres/travel_db` bằng BEGIN READ ONLY/ROLLBACK. 13/13 script/checksum history khớp parent backend `90afbb0`; merge `8fc64b7` thiếu tên lịch sử V4–V8 và trùng V9/V10/V11. Chưa có DDL/data changes. Đã xác định nguồn migration đúng; bước tiếp là giữ nguyên history, chuyển schema/quyền/index mới sang version kế tiếp và tách seed fixtures khỏi migration default, kiểm chứng DB test trước áp dụng dev. Đọc phần mới trong QA-ACCEPTANCE-PLAN.md; mốc trước nói chưa đọc DB là lịch sử.

**Nghiệm thu theo màn hình 06/11/2026:** xem `QA-ACCEPTANCE-PLAN.md`. Người dùng sẽ thao tác UI, agent rà FE/BE/Postgres và sửa theo từng phase; chưa chuyển phase khi lỗi quan trọng chưa xử lý. QA-0 là điểm bắt đầu hiện tại: backend thực tế `8fc64b7` sau merge minhduc, Flyway hiện trùng V9/V10/V11 cùng location dev/test. Chưa sửa/repair/reset hoặc đọc DB history. Cần đối chiếu history + schema trước khi lập migration an toàn; không đổi số file mù. FE/backend env hiện port18081. Đã đọc source Login và các test sources, chưa chạy baseline mới/UI/HTTP+DB. Kết quả 281 mobile tests trước là lịch sử. Không bắt đầu Phase Trip hay thay skin Home/nav trong lượt QA auth.

**Merge memory-v2 06/11/2026:** đọc [báo cáo resolve](MERGE-MEMORY-V2-2026-11-06.md). Feature memories mới đã nối qua workspace/camera/nav/profile; giữ nguyên Home và toàn bộ Trip/API target. Source có day settings/pins/P0-03 khác contract nên chưa nhập các flow đó; không dùng báo cáo tiến độ workspace khác để tự đánh dấu phase hoàn thành. Native config vẫn app.config.js/Maps opt-in, package không nâng. API store không fixture, preview vẫn opt-in; camera 58dp/viền 2dp/outer offset 8dp. Memory payload lấy Place.id, không dùng TripPlace.id. Keys mới kế thừa prefix hiện tại để invalidation liên thông. Chưa QA native/backend e2e, backend không merge và chưa push.

**Bottom nav refinement 06/11/2026:** `tabBarOuterTabOffset=8` chỉ dịch Home/Cá nhân ra ngoài, clamp theo không gian; tăng thêm 4dp để giãn nhẹ khoảng cách nội bộ hai nhóm. Active dot tiếp tục theo `geometry.tabLeft`. Camera có `tabBarCameraSize=58`, `tabBarCameraRingWidth=2`, lõi 54dp absolute; SVG gradient `userSpaceOnUse`, không GlassBackdrop riêng. Ambient motion chỉ chạy halo, không thay đường kính nút; press scale vẫn giữ. 6 navigation tests và TS/no-unused đạt ở lượt chuẩn hóa; cần đối chiếu ảnh Android sau reload, không coi harness là visual QA thiết bị.

**Bottom nav 05/11/2026:** dùng `floating-navigation-layout.ts` làm hệ tọa độ duy nhất từ frame onLayout. Camera nằm trong frame đã tính cả phần nhô lên, không đặt theo 50% viewport hoặc ngoài vùng hit test của parent. Hai nhóm/active dot chung geometry; target >=44dp, safe bottom một lần. `NavigationBarSurface` dùng chung SVG face (RGB + alpha riêng, không SVG filter); shadow bằng View, web thêm CSS blur. Android giữ translucent fallback. Không quay lại gap âm; token hiện 0. Native screenshot tool bị timeout, cần kiểm tra trực quan lại trên máy ảo khi có ảnh/capture hoạt động.

**Home follow-up 05/11/2026:** route Home API dùng `ConnectedHomeScreen`; query thành công `totalElements=0` hiển thị `NewUserHomeScreen`, cùng component với Home preview. Không đổi sang UI_PREVIEW để sửa lỗi giao diện. Card tạo chuyến mở form thật, mẫu chỉ mở sandbox `sample`; không ghi fixture Trip vào account. Loading/error không coi là người mới; Home đã có chuyến còn fallback list thật, dashboard tổng hợp chưa nối. Giữ các skin/card cũ khi tiếp tục tích hợp.

**Mốc mới nhất 03/11/2026 — Phase 3 đặc tả:** đọc `PHASE-3-PLACES-CONTRACT.md` và `api/places-discovery.openapi.json` trước khi code Places. 9 operations **planned**, chưa có runtime. Backend mới có Place model/repository; client mobile `/places/search` chưa có endpoint tương ứng. Bắt đầu 3A INTERNAL read, source/owner/idempotency và owner-aware tham chiếu trước custom; public planning lookup phải không enrich USER metadata. Google resolve là preview `id:null` + Google reference, không persist content; materialization Google/retention cần chốt trước Phase 4. Không merge backend đồng đội, sửa planning/AI hoặc bật fixture thành dữ liệu thật. Lượt này chỉ docs/schema checks; không gán số test Phase 2 cho Phase 3.

**Mốc mới nhất 03/11/2026 — Phase 2:** PATCH/date-preview/DELETE Trip và GET destinations đã nối UI tạo/sửa/xóa/chọn Province; **7/7 operations**, 357 backend/215 mobile tests, TS và export web/Android đạt. Xem `DESTINATIONS-INTEGRATION.md`, `PHASE-2-TRIP-MUTATIONS.md`, contract v1.1.0 và status trước snapshot cũ. Main migrations không seed Province: catalog có thể rỗng, tên tự nhập dùng provinceId=null; chưa import master data chính thức. V11 dùng `itinerary_items.removed_at`; lịch active phải loại archive, giữ TripPlace làm pool và note/time cũ. Backend `integration/team-sync` vẫn chưa merge; Places/Itinerary/Maps/Media, QA thiết bị/HTTP e2e và điều kiện production Phase 1 còn mở.

**Cập nhật ưu tiên 03/11/2026:** `minhduc` đã merge mobile tại `bea85bf`; backend `integration/team-sync` chưa merge. Sau merge đã bổ sung UI Cá nhân mở rộng, nút đổi email sau đăng ký, logo WeGo và các chỉnh sửa auth UX. Auth/API thật mặc định cả development; preview chỉ bật khi `EXPO_PUBLIC_UI_PREVIEW=true`, release luôn auth. Không khôi phục bypass mặc định từ snapshot lịch sử bên dưới. Xem `PROJECT-STATUS.md`, `auth-integration.md` và `MERGE-MINHDUC-2026-11-02.md` để phân biệt module đã nối với service chỉ mới nhập.

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
