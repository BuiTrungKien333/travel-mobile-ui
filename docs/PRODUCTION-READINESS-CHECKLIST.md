# Checklist Chuẩn Bị Release Production — Travel Mobile UI (Tripzy / WeGo)

Tài liệu này tổng hợp toàn bộ các hạng mục kỹ thuật, tối ưu hiệu năng, bảo mật và vận hành cần thực hiện theo từng giai đoạn (Phase) để đưa ứng dụng React Native (Expo SDK 57, RN 0.86, React 19.2) từ bản nội bộ/V1 lên môi trường **Production thực tế (App Store & Google Play)**.

## Phạm vi và kết luận rà soát · 08/11/2026

**Mục tiêu hiện tại là V1 báo cáo: APK Android cài trực tiếp, backend laptop cùng Wi-Fi và web dự phòng.** Checklist Store phía dưới là lộ trình tiếp theo, không phải toàn bộ điều kiện chặn V1. Thông báo/push và AI tạo lịch trình ngoài MVP; chưa triển khai thêm trong đợt này.

- Người dùng đã xác nhận chạy được trên điện thoại thật. Đây là xác nhận cài/mở app, chưa thay thế nghiệm thu toàn luồng với email, Google và Cloudinary thật.
- Giữ nguyên dependency theo lựa chọn người dùng. Expo Doctor gần nhất đạt 20/21, còn 13 package lệch patch khuyến nghị; chưa nâng hàng loạt khi APK hiện tại đã chạy được.
- Kiểm tra nền trước lượt này: mobile 395/395, backend 518/518; sau sửa link auth native có 18 ca liên quan và TypeScript đạt. Đây là kết quả của các lần chạy được ghi trong [V1-RELEASE-PLAN.md](V1-RELEASE-PLAN.md), không phải tuyên bố mọi mục bên dưới đã được kiểm thử.
- Đã thêm ErrorBoundary dùng chung cho root/Auth/Workspace: thông báo VI/EN, nút Thử lại, safe area và theme riêng để vẫn render khi provider của root lỗi; không đưa exception/stack trace lên giao diện.
- APK đã bàn giao có trước thay đổi ErrorBoundary này. Cần build lại để đưa thay đổi mới vào APK; không coi APK cũ đã chứa code mới.
- Kiểm tra sau thay đổi: **399/399 test mobile đạt**, TypeScript strict/no-unused đạt, export web thành công ở `.expo/v1-readiness-web`. Không chạy lint, không đổi package; chưa build lại APK hay thay bản web `.expo/v1-web-final` đang serve. Backend không thay code trong lượt này, không gọi kết quả 518 ca trước đó là lần chạy mới.

| Ưu tiên | Việc cần làm | Quyết định cho V1 |
| --- | --- | --- |
| P1 | Nghiệm thu đăng nhập, đổi tài khoản, CRUD chuyến, lịch ngày, upload/retry/xóa ảnh trên điện thoại | Cần làm trước báo cáo; dùng dữ liệu thử |
| P1 | Mất mạng khi khôi phục phiên/upload, từ chối quyền camera/GPS, khởi động lại app | Kiểm tra dữ liệu không mất và có đường thử lại |
| P2 | Vali lưu bền theo tài khoản/chuyến | Đã chốt lưu local; hiện component vẫn dùng `useState`, chưa được đánh dấu hoàn tất |
| P2 | Web reload cần đăng nhập lại | Hành vi hiện tại do refresh token chỉ ở bộ nhớ tab; Android dùng SecureStore. Muốn web giữ phiên cần thiết kế riêng, không tự chuyển token sang localStorage |
| Sau V1 | Đồng bộ patch SDK, gỡ provider bản đồ cũ, OTA/crash reporting, domain HTTPS, signing/Store | Làm theo đợt riêng, có kiểm thử và build lại |

Các giới hạn cần biết: ảnh Cloudinary hiện dùng URL công khai; quyền API không đồng nghĩa ảnh có signed/private delivery. Thư viện vẫn tải toàn bộ metadata theo các trang; chưa tối ưu quy mô lớn. Upload nhiều ảnh chạy foreground, tối đa 2 ảnh đồng thời; không phải hàng đợi nền. Xem sau lưu file bền trên máy, cần giữ các file chưa đồng bộ khi dọn cache.

---

## Phase 1: Chuẩn Hóa Codebase, Kiến Trúc & Bảo Mật (Code & Security Audit)

Mục tiêu: Đảm bảo ứng dụng ổn định về mặt logic, tuân thủ chặt chẽ kiến trúc phân tầng, không rò rỉ dữ liệu nhạy cảm.

- [ ] **1.1. Kiểm tra tĩnh & Độ phủ kiểm thử (Static Analysis & Tests)**
  - [ ] Lint là kiểm tra cho đợt chuẩn hóa sau; **không chạy `npm run lint` trong lượt này theo yêu cầu người dùng**. Không coi mọi cảnh báo là lỗi chặn V1 khi chưa đánh giá tác động.
  - [ ] Chạy `npx tsc --noEmit` đạt 0 lỗi kiểu dữ liệu (TypeScript strict mode).
  - [ ] Chạy `npm test` đảm bảo 100% test cases vượt qua.
  - [ ] Khi thay dependency/native config, chạy `npx expo-doctor`; ghi rõ check nào còn thiếu. Mốc gần nhất 20/21; đồng bộ patch SDK 57 ở đợt riêng, không tắt kiểm tra để báo đạt.

- [ ] **1.2. Bảo mật Phiên đăng nhập & Dữ liệu cục bộ (Auth & Storage Security)**
  - [x] Trên mobile, refresh token lưu bền trong `expo-secure-store`; access token chỉ ở bộ nhớ runtime, không ghi vào storage/log. Web giữ refresh token trong bộ nhớ tab ([auth-session.ts](../src/features/auth/services/auth-session.ts), [session-manager.ts](../src/features/auth/services/session-manager.ts)). Không yêu cầu lưu access token xuống SecureStore khi không cần.
  - [ ] Kiểm tra cơ chế chống race-condition khi Refresh Token (nhiều request cùng bị `401` chỉ gọi API refresh 1 lần duy nhất).
  - [ ] Kiểm thử logout/hết phiên: xóa token và cache server, chặn request cũ cập nhật phiên mới, ẩn dữ liệu riêng của A khi vào B. `authSession.onClear` đã gọi `queryClient.clear()`. Chỉ reset state gắn với tài khoản; không reset tùy chọn ngôn ngữ hay xóa ảnh Xem sau chưa đồng bộ. Ảnh local phải được lọc đúng owner.
  - [ ] Vali cần lưu bền theo `userId + tripId` bằng storage local; hiện [weather-packing-checklist.tsx](../src/features/home/components/weather-packing-checklist.tsx) vẫn chỉ có state trong component. Không thêm API/DB cho dữ liệu này.

- [ ] **1.3. Bảo mật Mạng & Biến môi trường (Network & Env Security)**
  - [ ] Kiểm tra `EXPO_PUBLIC_LAN_DEMO=false` và `EXPO_PUBLIC_UI_PREVIEW=false` trên profile `production` ([eas.json](../eas.json)).
  - [x] [app.config.js](../app.config.js) đặt `usesCleartextTraffic=false` khi không bật cờ LAN; profile production ép LAN false. Demo LAN chủ động bật HTTP. Cờ Android là cấu hình toàn app, giới hạn API HTTP vào private IPv4 nằm ở [api-url.ts](../src/services/api/api-url.ts); không diễn giải là toàn bộ tài nguyên/WebView được kiểm soát bởi bộ lọc API này.
  - [ ] Rà soát toàn bộ biến `EXPO_PUBLIC_*`: chỉ chứa khóa công khai (API Base URL, Mapbox public token, Google OAuth Client ID). Tuyệt đối không chứa secret key hay private token.
  - [ ] Loại bỏ hoặc ẩn toàn bộ `console.log` / `console.debug` có nguy cơ in ra token, email, tọa độ GPS hoặc lịch trình cá nhân khi `__DEV__ === false`.

---

## Phase 2: Tối Ưu Khởi Động, UX & Xử Lý Lỗi (Startup, UX & Resilience)

Mục tiêu: Trải nghiệm người dùng mượt mà từ lúc chạm vào icon app, không gặp màn hình trắng hoặc văng ứng dụng đột ngột.

- [ ] **2.1. Tối ưu luồng Khởi động & Splash Screen ([src/app/_layout.tsx](../src/app/_layout.tsx))**
  - [ ] Đo cold start trên APK release trước khi thay splash. SDK 57 hỗ trợ tự ẩn splash; không bắt buộc thêm điều khiển thủ công nếu không có lỗi quan sát được.
  - [x] Root đợi `useFonts` tải xong hoặc báo lỗi trước khi render navigator. Trong lúc khôi phục phiên, [index.tsx](../src/app/index.tsx) hiển thị `SessionGate`; lỗi mạng có Thử lại. Trạng thái thật là `restoring` / `restore-error`, không phải `bootstrapping`.
  - [ ] Nếu phát hiện nháy trắng và cần điều khiển thủ công: gọi `preventAutoHideAsync()` ở cấp module, chỉ ẩn sau khi root đã sẵn sàng. **Không giữ native splash chờ API refresh**: mạng lỗi phải vào SessionGate, tránh splash treo vô hạn. Tham khảo [Expo SplashScreen SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/).

- [ ] **2.2. Error Boundary & Khôi phục lỗi Runtime**
  - [x] Root và nhóm `(auth)`, `(workspace)` export `ErrorBoundary` dùng chung [route-error-screen.tsx](../src/components/common/route-error-screen.tsx). Theo [Expo Router](https://docs.expo.dev/router/error-handling/), boundary xử lý lỗi render trong cây route; không thay xử lý lỗi async/event, API hay native crash.
  - [ ] Đảm bảo mọi màn hình gọi API đều hiển thị đủ 4 trạng thái: **Loading (Skeleton/Spinner)**, **Empty (Trạng thái trống rõ nghĩa)**, **Error (Thông báo tiếng Việt thân thiện + nút Thử lại)**, và **Success**.
  - [ ] Mọi nút bấm gửi biểu mẫu (Mutation) đều khóa (`disabled` / `loading`) khi đang gửi để chống double-submit.

- [ ] **2.3. Khả năng chống chịu mất mạng (Offline / Flaky Network)**
  - [ ] Kiểm thử mất mạng → Thử lại và quay lại app: native đã nối `focusManager` với `AppState`. `onlineManager` native chưa nối listener mạng; nếu cần tự tải ngay lúc kết nối lại khi app vẫn foreground, đánh giá thêm ở đợt riêng. Sự kiện có mạng không bảo đảm backend laptop đang hoạt động; không tự retry mutation tạo chuyến/upload thiếu idempotency.
  - [ ] Kiểm tra timeout hợp lý trên Axios client và thông báo rõ ràng khi mất kết nối Internet hoặc upload ảnh thất bại giữa chừng.

- [ ] **2.4. Giao diện, Bàn phím, Safe Area & Đa kích thước màn hình**
  - [x] Đã chốt **light only**: `app.json.userInterfaceStyle=light`, root dùng `lightTheme`; Camera/trình xem ảnh nền tối là ngữ cảnh riêng. Không mở automatic/dark trong V1.
  - [ ] Kiểm tra toàn bộ form nhập liệu (Auth, Tạo chuyến đi, Thêm địa điểm, Ghi chú kỷ niệm) với bàn phím ảo trên cả iOS và Android (không bị bàn phím che nút Submit).
  - [ ] Kiểm tra hiển thị tiếng Việt có dấu và khi người dùng bật **Font Scaling (Cỡ chữ lớn)** trên hệ điều hành.
  - [ ] Kiểm tra vùng chạm tối thiểu 44pt trên iOS, ưu tiên 48dp trên Android; icon nhỏ có thể mở rộng hit area nếu không chồng vùng chạm lân cận. Kiểm tra `accessibilityLabel` / `accessibilityRole`.

---

## Phase 3: Tối Ưu Hiệu Năng, Bản Đồ & Bộ Nhớ (Performance & Memory)

Mục tiêu: Cuộn/zoom mượt trên thiết bị mục tiêu, kiểm soát RAM khi dùng bản đồ/ảnh. Không cam kết 120 FPS hoặc không OOM khi chưa đo trên máy thật; OOM của Node/Metro trên laptop khác OOM runtime của app Android.

- [ ] **3.1. Tối ưu Hình ảnh & Camera (Media Pipeline)**
  - [ ] Nén và giới hạn kích thước ảnh hợp lý bằng `expo-image-manipulator` trước khi upload lên Cloudinary/Backend để tiết kiệm băng thông 4G và giảm lỗi timeout.
  - [ ] Chỉ dọn file tạm khi không còn được dùng. **Không xóa bản local bền của Xem sau hoặc ảnh chờ retry**, kể cả khi logout. Ảnh chọn được lưu local trước khi upload; dọn bản sao đã đồng bộ cần chính sách riêng, tránh mất dữ liệu do phản hồi mạng bị thất lạc.
  - [ ] Sử dụng `expo-image` với `contentFit`, kích thước tường minh và `recyclingKey` trong các danh sách ảnh/album dài.

- [ ] **3.2. Tối ưu Bản đồ & Định vị (`@rnmapbox/maps` / `react-native-maps`)**
  - [x] Đã chọn Mapbox cho bản đồ chuyến đi. **Chưa gỡ `react-native-maps`**: [live-place-search-map.native.tsx](../src/features/trip/components/live-place-search-map.native.tsx) vẫn là nhánh tùy chọn sau cờ native map, chưa phải dependency hoàn toàn không dùng. Muốn loại cần chuyển luồng đó và build/QA riêng.
  - [ ] Kiểm tra lifecycle/focus của từng map, không để map không nhìn thấy tiếp tục render/cập nhật vị trí tốn tài nguyên. Không áp quy tắc cứng chỉ được tồn tại một MapView nếu chưa đo và kiểm tra luồng back.
  - [ ] Chỉ yêu cầu quyền GPS (`WhenInUse`) đúng thời điểm người dùng thực hiện tính năng cần vị trí, kèm giải thích rõ ràng khi quyền bị từ chối.

- [ ] **3.3. Tối ưu Danh sách & Render (React 19 + React Compiler)**
  - [ ] Kiểm tra các danh sách lịch trình nhiều ngày, tìm kiếm địa điểm và thư viện kỷ niệm: sử dụng danh sách ảo hóa (`FlatList`) với `keyExtractor` ổn định (không dùng index cho danh sách có thể sắp xếp lại).
  - [ ] Đảm bảo các selector của Zustand chỉ lấy đúng slice dữ liệu cần thiết, tránh re-render toàn màn hình.
  - [ ] Đo đạc hiệu năng thực tế trên bản **Release build** (đã tắt `__DEV__`).

---

## Phase 4: Cấu Hình Native, Deep Link & Đóng Gói Store (Native Config & Packaging)

Mục tiêu: Hoàn thiện cấu hình [app.json](../app.json), [app.config.js](../app.config.js) và [eas.json](../eas.json) đạt chuẩn xét duyệt của Apple App Store và Google Play Store.

- [ ] **4.1. Chuẩn hóa Thương hiệu & Metadata ([app.json](../app.json))**
  - [ ] Cập nhật `name`, `slug`, `version`, `ios.buildNumber`, `android.versionCode`.
  - [ ] Đồng bộ tên thương hiệu nhất quán (WeGo / Tripzy) trong tất cả chuỗi giải thích quyền (`cameraPermission`, `photosPermission`, `savePhotosPermission`, `locationWhenInUsePermission`, `NSLocationWhenInUseUsageDescription` — hiện đang trộn cả tiếng Anh và tiếng Việt).
  - [ ] Cập nhật App Icon, Adaptive Icon (Android) và màu nền Splash Screen khớp với bộ nhận diện thương hiệu (`#21B5C3`).
  - [ ] Kiểm tra APK release chạy độc lập không cần Metro và profile production không bật `developmentClient`. Sự hiện diện của config plugin `expo-dev-client` **không đủ để kết luận release app chứa launcher dev hoặc có lỗi scheme**; chỉ điều chỉnh khi có bằng chứng từ artifact/native config, không gỡ plugin theo suy đoán.

- [ ] **4.2. Cấu hình Universal Links (iOS) & App Links (Android)**
  - [ ] Cấu hình `ios.associatedDomains` (`applinks:yourdomain.com`) và file `apple-app-site-association` trên server.
  - [ ] Cấu hình `android.intentFilters` (`autoVerify: true`) và file `assetlinks.json` trên server để các đường dẫn xác thực email (`verify-email`), đặt lại mật khẩu (`reset-password`), và liên kết Google (`google-link`) mở thẳng vào ứng dụng.

- [ ] **4.3. Chứng chỉ Ký số (Code Signing) & OAuth Production**
  - [ ] Tạo Production Upload Keystore cho Android (thay thế debug keystore đang dùng cho bản demo nội bộ) và Apple Distribution Certificate / Provisioning Profile cho iOS.
  - [ ] Đăng ký SHA-1 / SHA-256 của Production Keystore lên Google Cloud Console cho `react-native-nitro-google-signin`.
  - [ ] Khi phát hành Google Play, xác nhận artifact AAB/signing đúng profile production. V1 nội bộ giữ APK. Không coi việc thiếu khai báo tường minh `buildType: "app-bundle"` là lỗi nếu công cụ đã tạo đúng AAB mặc định.

---

## Phase 5: Giám Sát Production, OTA & Kiểm Thử Nghiệm Thu Cuối (Observability & Release QA)

Mục tiêu: Kiểm soát chất lượng bản build cuối cùng trên thiết bị vật lý và sẵn sàng phản ứng nhanh sau khi phát hành.

- [ ] **5.1. Giám sát lỗi & Cập nhật từ xa (Crash Reporting & OTA)**
  - [ ] Tích hợp công cụ giám sát lỗi runtime/native crash (ví dụ: Sentry cho Expo) kèm tự động tải lên Source Maps khi build release.
  - [ ] Sau V1 mới đánh giá `expo-updates`, runtime compatibility, rollout và rollback. OTA chỉ cập nhật phần tương thích runtime; thay native module/config vẫn cần build mới. Không coi OTA là điều kiện bắt buộc hoặc hứa mọi bản vá được áp dụng tức thời.

- [ ] **5.2. Kiểm thử Nghiệm thu toàn luồng trên bản Release (End-to-End Smoke Test)**
  - [x] Người dùng xác nhận cài/chạy được trên điện thoại thật. Tiếp tục ghi kết quả từng luồng bên dưới; xác nhận này chưa bao gồm toàn bộ E2E/provider thật.
  - [ ] Kiểm thử luồng Xác thực: Đăng ký → Xác thực Email qua link → Đăng nhập Email → Quên mật khẩu → Đăng nhập Google.
  - [ ] Kiểm thử luồng Chuyến đi: Tạo chuyến đi → Tìm kiếm & thêm địa điểm (Mapbox) → Sắp xếp lịch trình theo ngày → Tối ưu lộ trình → Đánh dấu đã ghé thăm.
  - [ ] Kiểm thử luồng Kỷ niệm: chụp → chọn lô tối đa 10 ảnh (tối đa **2 upload đồng thời**, không phải 10) → lỗi một ảnh/retry → album/zoom → xóa → hoàn thành/recap. App dùng upload từng file có idempotency; backend cũng có endpoint batch trả kết quả từng file. Kiểm tra đóng/mở lại app vẫn xem được ảnh chưa đồng bộ trong Xem sau; không hứa upload nền.
  - [ ] Kiểm thử A → logout → B: không **hiển thị/truy cập** cache hoặc ảnh local của A. File riêng của A có thể vẫn lưu trên máy để A đăng nhập lại xem/retry; không xóa chúng chỉ để vượt bài test cách ly tài khoản.

- [ ] **5.3. Hồ sơ Pháp lý & Store Listing**
  - [ ] Chuẩn bị đường dẫn **Chính sách quyền riêng tư (Privacy Policy URL)** công khai (bắt buộc vì ứng dụng có dùng Camera, Thư viện ảnh, Vị trí GPS và Tài khoản người dùng).
  - [ ] Đảm bảo ứng dụng có chức năng **Yêu cầu xóa tài khoản (Account Deletion)** ngay trong màn hình Hồ sơ/Cài đặt (yêu cầu bắt buộc của cả Apple App Store và Google Play đối với ứng dụng cho phép tạo tài khoản).
  - [ ] Chuẩn bị tài khoản thử nghiệm (Demo Account) kèm hướng dẫn cho đội ngũ xét duyệt của Apple/Google.
