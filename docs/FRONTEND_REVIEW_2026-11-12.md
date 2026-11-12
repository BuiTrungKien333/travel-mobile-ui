# Frontend mobile: kiến trúc và tinh gọn 12/11/2026

## Kết quả

Rà soát các luồng chính của Expo SDK 57 / React Native 0.86 / React 19.2:
auth, trip, itinerary, maps, weather, camera và memory. Giữ chức năng, giao diện,
API contract, thư viện và cấu hình hiện tại. Diff source/test giảm ròng **332 dòng**
trên 16 file, đã tính cả regression tests mới. Có 4 module cũ được xóa.

Thư mục có sẵn thay đổi chưa commit ở server connection, auth session, native credentials,
cấu hình và test liên quan. Đợt này không chỉnh sửa những file đó.

## Kiến trúc và luồng dữ liệu

Kiến trúc theo feature là hợp lý với ứng dụng hiện tại:

```text
Expo Router route/layout
  → feature screen / UI components
  → query hoặc mutation hook
  → feature API / Zod validation
  → shared Axios client
  → backend REST API
  → DTO adapter → view model → UI
```

Server state thuộc TanStack Query; Zustand giữ UI state và local photo draft.
Route params thuộc Expo Router; form thuộc React Hook Form/Zod. Không có lý do thực tế
để thêm một lớp state hay HTTP client khác cho các thay đổi đã xác định.

1. **Khởi động/auth:** root layout khôi phục server/phiên; session cung cấp access token
   cho Axios. Transport xử lý refresh/retry có kiểm session version; Query keys chia theo
   owner. Profile cung cấp identity cho các query nghiệp vụ. Không can thiệp các file auth
   đang có thay đổi của người dùng.
2. **Dashboard/trips:** screen chọn preview hoặc connected; connected dùng query hooks,
   contract schema và adapter. Trip list dùng infinite query; chi tiết ghép metadata,
   membership và itinerary. `placeId`, `tripPlaceId`, `itineraryItemId` là các identity khác
   nhau, cần được giữ riêng khi đọc và ghi.
3. **Lịch/map:** trip/day query → adapter → timeline/map. Mutation theo ngày gửi revision,
   cập nhật query đã lưu rồi invalidate dữ liệu dẫn xuất. Road optimization trả proposal
   để preview/apply; mở Maps sử dụng helper dẫn đường hiện tại và phương tiện đã chọn.
4. **Camera/local draft:** capture/import → chuẩn hóa ảnh → local file và metadata →
   Zustand/local storage. Ảnh local vẫn đọc được khi backend không khả dụng.
5. **Memory/upload:** query memory/trip → merge ảnh remote với draft đúng owner → album/grid.
   Upload hiện tại dùng `uploadLocalMemory`: create key, server ID, kiểm trạng thái server
   trước retry và kiểm session giữa các bước. Xóa/note dùng mutation hiện tại của feature memories.
6. **Gallery/weather:** ảnh có thumbnail riêng và viewer giữ snapshot khi mở; danh sách
   thư viện dùng FlatList/SectionList. Weather có API/query keys và thời gian stale riêng.

Các điểm đọc code:
[root layout](../src/app/_layout.tsx),
[trip queries](../src/features/trip/api/trip-queries.ts),
[trip adapter](../src/features/trip/api/trip-adapters.ts),
[itinerary mutations](../src/features/trip/api/itinerary-hooks.ts),
[memory hooks](../src/features/memories/hooks/use-memories.ts),
[upload](../src/features/memories/services/upload-photo.ts),
[local storage](../src/features/memories/services/local-memory-storage.ts).

`trip-preview-store` không phải toàn bộ là mã chết: ngoài preview, nó còn giữ ảnh local
và thao tác liên quan. Fixtures/preview mode là chức năng đang được hỗ trợ, được giữ lại.

## Thay đổi có tác dụng rõ ràng

| Trước | Sau |
|---|---|
| Mỗi memory tìm lại trip và `flatMap` toàn bộ stops; mỗi draft quét lại remote memories | Index trip/place theo ID và set memory có ảnh trong từng lần merge; lookup dùng lại |
| Clock formatter được tạo và gọi cho từng media của cùng memory | Hai Intl formatter cố định được tái sử dụng; clock được tính một lần/memory |
| Adapter tìm cùng ngày itinerary hai lần cho mỗi ngày trip | Index ngày một lần; dùng cùng entry cho settings/stops |
| Hook upload cũ trong `home/api/memory-hooks.ts` không có caller từ app | Xóa hook và create/upload/delete transport/schema chỉ phục vụ hook đó; giữ API đọc trang đang dùng cho recap |
| `TripTimeline`, alias màn trips của home và màn integration-unavailable không còn route/caller | Xóa 3 module này; route đang dùng được giữ nguyên |
| 7 query/mutation hook cũ không có caller | Xóa các hook itinerary save/AI cũ, add/delete place cũ, search/forecast cũ; giữ các hook đang dùng |
| Helper `directionsUrl` không còn caller app | Xóa helper/test cũ; giữ `tripDirectionsUrl` và test dẫn đường đang dùng |

Index giữ **kết quả đầu tiên** như `Array.find`, bao gồm trip/place/day trùng ID/ngày.
Giữ nguyên sort ổn định theo displayOrder, ngày/giờ Việt Nam, thứ tự draft trước ảnh server,
lọc owner, retry draft chưa có ảnh server và việc không làm sống lại backup đã upload/xóa.
Các mảng đầu vào không bị mutate.

Các DTO/schema đọc còn dùng không bị cắt field tùy tiện. Không blanket-memoize component,
không chia lại màn hình chỉ vì dài, không thay navigation/state library và không thêm dependency.

## Kiểm chứng hiệu năng

Microbenchmark Node **v26.13.1**, so sánh source HEAD trước thay đổi với bản mới:
500 remote memory / 1.500 ảnh, 40 trip, mỗi trip 10 ngày × 20 stop, 500 local draft.
Mỗi bản warm-up một lần, lấy trung vị 5 lần. Kết quả JSON của hai bản giống hệt nhau.

| Thời gian ghép dữ liệu | Trước | Sau |
|---|---:|---:|
| Trung vị | 567,56 ms | 24,54 ms |

Phép đo bao gồm index/lookup và tái sử dụng formatter. Đây là chi phí JavaScript cục bộ,
không phải FPS, heap hay hiệu năng release trên Android/iOS. Chưa profile thiết bị thật.

## Kiểm tra cuối

- `npm test`: **429 pass**, 0 fail/cancelled/skipped.
- `npx tsc --noEmit`: **PASS**.
- ESLint trên 9 file production đã sửa còn tồn tại: **PASS**, không warning.
- `git diff --check` cho các file của đợt này: **PASS**.
- `npm run lint` toàn dự án: **FAIL có sẵn — 65 errors, 14 warnings**;
  log trước và sau thay đổi giống hệt nhau. Các lỗi thuộc các file ngoài phạm vi sửa,
  phần lớn là diagnostics React Hooks/Compiler quanh animation, ref và effect.
  Không tắt rule để làm xanh kiểm tra và không sửa hàng loạt các gesture chưa kiểm chứng trên máy thật.

Regression mới kiểm tra first-match, stable media order, input immutability, owner/draft
deduplication và day settings. Test HTTP/retry của luồng upload hiện tại tiếp tục pass.
TypeScript không bao gồm thư mục tests; các test được thực thi bằng Node theo script của dự án.

Không có thay đổi native module/config/dependency nên không chạy Expo Doctor.
Chưa build APK/iOS hay thao tác gallery/camera/map trên thiết bị. Kiểm tra thủ công các
luồng đó trên release build là phần xác nhận còn lại; chưa có bằng chứng cần thêm refactor lớn.

## Đo bundle Android

Đã export production thành công từ checkout hiện tại:

```text
npx expo export --platform android --source-maps --dump-assetmap --max-workers 2 --output-dir .expo/bundle-review/android
```

| Thành phần | Kích thước |
|---|---:|
| Hermes bytecode hiện tại | 5.715.668 bytes / 5,45 MiB |
| 93 file asset được export | 4.918.008 bytes / 4,69 MiB |
| Tổng bytecode + assets, chưa nén | 10,14 MiB |
| APK release có sẵn, build ngày 10/11/2026 | 146,03 MiB |
| Native libraries trong APK cũ | 111,89 MiB |
| Mapbox native, cộng ARM64 và x86_64 trong APK cũ | 51,52 MiB |
| Native libraries x86_64 trong APK cũ | 58,07 MiB |

Không tính sourcemap vào tổng bytecode/assets. APK cũ không đại diện cho mã nguồn sau
refactor; chưa có export trước refactor để tính phần dung lượng tiết kiệm do đợt này.
Source map hiện tại chứa cả hai map SDK native (`@rnmapbox/maps`, `react-native-maps`),
không chứa `mapbox-gl-web`. Đây là sự hiện diện trong JS dependency graph, không phải
số byte riêng của từng SDK hay bằng chứng có thể bỏ một chức năng.

Asset map có ảnh mẫu/preview; chúng còn được import. Có file PNG khoảng 1,5 MB trên đĩa
không nằm trong export, nên tổng dung lượng thư mục assets không phải dung lượng đóng gói.

Hướng giảm dung lượng đáng cân nhắc:

1. APK test cho điện thoại ARM64 có thể build riêng ARM64; script hiện tại build cả ARM64
   và x86_64. Phần x86_64 hiện chiếm khoảng 58 MiB native, nhưng chưa build lại để chốt
   kích thước APK sau thay đổi. Bản cho emulator vẫn cần ABI tương ứng.
2. Phát hành bằng AAB để Play tạo gói theo thiết bị. Kích thước tải từ Play không bằng APK
   hai ABI hiện tại: [Expo: Understanding app size](https://docs.expo.dev/distribution/app-size/).
3. Cấu hình release hiện có mặc định tắt minify/resource shrink. R8 và resource shrinking
   là lựa chọn tối ưu build cần kiểm chứng lại camera/map/Google login trên release:
   [SDK 57 BuildProperties](https://docs.expo.dev/versions/v57.0.0/sdk/build-properties/).

Đợt kiểm tra này chỉ đo và phân tích; không thay build config, dependency hay native code.
