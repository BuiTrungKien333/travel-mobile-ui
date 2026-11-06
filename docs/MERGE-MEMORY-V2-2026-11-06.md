# Merge feat/ui/memory-v2 · 06/11/2026

## Nhánh và quyết định resolve

- Target: `connect/backend/home`, trước merge `e923534`.
- Source: `origin/feat/ui/memory-v2`, `127e0b3` (đã fetch trước merge).
- Backup local: `codex/ui-before-pull-2026-11-06`.
- Git phát hiện 39 file conflict. Giữ implementation hiện tại làm nền rồi nối chức năng Kỷ niệm vào các contract đó; không chọn toàn bộ một phía cho bản cuối.
- Merge chỉ ở mobile. Không merge, sửa backend hoặc chạy migration; không push GitHub trong lượt này.

## Đã nhận và nối

- Feature `memories`: lịch sử album theo chuyến, album/chi tiết ảnh, sửa ghi chú, chia sẻ, ảnh lưu để gắn vào chuyến sau; routes nằm trong workspace được bảo vệ bởi auth.
- Camera: quick capture, quyền truy cập/camera unavailable, local persistence, bản sao vào thư viện, upload có tiến độ và retry sau lỗi một phần. Ảnh local vẫn giữ khi upload lỗi, không tự xếp hàng upload offline.
- Nút camera ở navigation API mở `/memories/quick-capture`; chế độ preview vẫn mở camera panel cũ. Không tự chuyển draft/fixture thành chuyến trên server để gắn ảnh.
- `FloatingNavigation` dùng lại chính frame/geometry/surface của nav hiện hành cho quick capture, giữ camera 58dp, viền 2dp, offset ngoài 8dp, dot alignment và safe area. Không nhập lại bản flex/negative gap cũ.
- Camera chỉ đếm ảnh của chuyến đang chọn; nút chi tiết mở đúng chuyến/ngày.
- Profile editor RHF/Zod dùng PUT profile và giữ session guard/logout/UI hiện hành.
- Root GestureHandlerRootView; resolver API dev đổi loopback sang Android emulator/LAN, vẫn dùng cùng Axios/session/locale và giữ API resolver cũ cho tương thích.

## Sửa lỗi tương thích khi gộp

- Memory trip loader đọc Trip list phân trang qua `tripApi.list(page, signal)`, dùng `tripPlacesApi` và adapter hiện có. Không đổi list cache thành array hoặc bỏ owner khỏi query key.
- Giữ khác biệt `TripPlace.id` / `Place.id`: UI chọn mục chuyến đi, payload memory lấy `stop.placeId`; ảnh server tìm tên theo Place ID. Assign ảnh local cũng lưu Place ID đúng.
- Cache mới có key riêng nhưng kế thừa prefix Trip/journal hiện tại, nên tạo/sửa/xóa chuyến và upload ảnh invalidation vẫn cập nhật album. Không cho hai response shape dùng chung một key.
- Provider giữ store API không có fixtures rồi mới tải ảnh local; preview không bị chuyển thành API hoặc treo loading do profile/query disabled.
- Sửa/xóa ảnh kiểm tra session sau HTTP trước khi ghi cache/local state; local ảnh khác chủ không được sửa bằng tài khoản hiện tại.

## Giữ bản hiện tại / không nhận thay thế

- Toàn bộ `src/features/trip`: UI và canonical Trip CRUD/Places/Itinerary/Maps client hiện hành được giữ. Source chứa bản Trip schema/hooks/screens khác với contract tách riêng và pagination/ownership hiện tại; không ghép bản đó thay vào hoặc tuyên bố P0-03 đã hoàn tất. Các bổ sung day settings/pins/recovery/optimization của source chưa được tích hợp vào các flow Trip trên target và cần đối chiếu trong phase riêng nếu tiếp tục.
- Home bốn trạng thái, header logo/thông báo, `ConnectedHomeScreen` và trạng thái tài khoản mới giữ nguyên. Home API có chuyến vẫn fallback list như trước, chưa nối dashboard tổng hợp.
- Auth thật mặc định development; preview chỉ opt-in bằng env và không có trên release. Không nhập hardcode preview=false của source làm mất chế độ UI preview.
- Giữ `app.config.js` duy nhất và native Maps opt-in; không phục hồi `app.config.ts`, không nhập đợt nâng Expo/package. Vì vậy không có yêu cầu rebuild native chỉ do merge này.
- Không nhận `.idea`, Gradle log, route `(tabs)/create` dư hoặc các báo cáo tiến độ P0 của workspace khác. `FRONTEND-BACKEND-INTEGRATION-PLAN.md` và `PROJECT-STATUS.md` vẫn là nguồn tiến độ của target.

## Kiểm tra và giới hạn

- **281/281 mobile tests đạt**, gồm 3 test tương thích merge và regression đếm ảnh/điều hướng theo chuyến; toàn bộ test cũ của target vẫn giữ.
- TypeScript strict/no-unused đạt; kiểm tra marker conflict và whitespace trước commit.
- Metro tại cổng 8082 trả HTTP 200 cho bundle web và Android. Đây là kiểm tra bundling development, không phải release export hay xác nhận trực quan thiết bị.
- Không chạy lint theo yêu cầu hiện hành; không đổi package/native config nên không cần Expo Doctor.
- Memory HTTP tests dùng contract fixture cục bộ; không gọi backend thật, không xác nhận media storage/SMTP/Google hay quyền camera trên điện thoại. Cần QA thiết bị và backend e2e trước nghiệm thu Phase 6/9.
- Memory library hiện tải các trang ảnh và các lựa chọn chuyến/địa điểm để ghép album; pagination UI và lazy load địa điểm theo chuyến còn là việc hiệu năng cần làm khi có dữ liệu lớn. Không coi merge là hoàn thành toàn bộ roadmap.
