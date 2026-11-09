# Merge mobile `minhduc` · 02/11/2026

Bắt đầu 02/11, hoàn tất kiểm tra và ghi nhận tiến độ 03/11/2026.

## Phạm vi và Git

- Repository: `E:\travel-mobile-ui`, nhánh nhận `feat/ui/memory`.
- Nhánh nhận trước merge: `43741328b26e860eb403f0935e4b325d94d5ee7f`.
- Nhánh nguồn đã fetch: `origin/minhduc`, commit `5453edd9915444f130865ead55305eb0ae713551`.
- Git merge hai parent; không squash và không push. Không có textual conflict ban đầu, nhưng có xung đột về contract, config và hành vi UI cần xử lý thủ công.
- Công việc Trip API đang sửa trước merge đã được bảo toàn và đưa lại vào kết quả: contract/OpenAPI, create/list/detail, query hooks, docs và tests. Không mất thay đổi chưa commit của người dùng.
- Backup nhánh nhận: `refs/codex-backup/pre-minhduc-20261102`. Backup working tree: stash `45a2e939c2f3fd4ba9cb80034729da601412a1a7`; vẫn giữ stash, không tự xóa.
- **Backend tạm hoãn:** merge `integration/team-sync` đã được hủy khi người dùng đổi phạm vi. `E:\travel-system` giữ nhánh `fix/rag-ai-v2`, HEAD `00b797d`, working tree sạch. Không có backend merge commit hay migration trong lần này.

## Quyết định hợp nhất

### Ưu tiên UI và contract hiện tại

Các rewrite Home, Profile, Register, Camera, Memories, picker, date picker, timeline, detail, recap, edit và optimization từ nhánh nguồn chưa được dùng để thay UI hiện tại. Một số rewrite giản lược layout/tương tác đã chốt hoặc gọi API legacy chưa có trên backend hiện tại. Mã nguồn của đồng đội vẫn được lưu trong lịch sử parent của merge.

Giữ theme sáng, Ocean Teal/Roboto, Liquid Glass, VI/EN mặc định VI, safe area, camera thật và album/viewer/gesture hiện tại. Preview vẫn hoạt động không cần backend. API mode chỉ mở các chức năng đã nối thật; không gửi fixture ID và không báo lưu thành công cho module chưa tích hợp.

Giữ contract Trip hiện tại: `destination` có cấu trúc, budget có currency, list có pagination/context, detail có metadata/ngày/readiness và create request key. Không dùng lại DTO legacy `READY`, destination string, budget number hoặc list không phân trang của nhánh nguồn. Draft AI vẫn ngoài MVP.

### Service và data mapping

- Một bộ `tripQueryKeys`, bao gồm owner trong list/detail/places/itinerary. `trip-hooks.ts` dùng lại hooks canonical; Place CRUD tách `trip-place-api.ts` thay vì tạo một Trip API cạnh tranh.
- Các query riêng tư chờ profile/account; bỏ non-null assertions và retry vô điều kiện ở các query mới. Mutation itinerary/place làm mới namespace Trip để counts/detail không cũ.
- Phân biệt `placeId`, `tripPlaceId`, `itineraryItemId`. Khi lưu itinerary, gửi `placeId` thật; thiếu ID hoặc quá giới hạn thì báo lỗi, không cắt bớt lịch âm thầm. Legacy full replacement bỏ các ngày rỗng khỏi payload.
- Parse response bằng Zod, validate input Place/Itinerary ở API boundary, encode ID trong URL. Route response kiểm tra chi phí không âm; polyline decoder giới hạn độ dài/số điểm và bỏ geometry hỏng.
- Calendar dùng `Asia/Ho_Chi_Minh` tại ranh giới nửa đêm, không đổi fixture preview 21/10/2026.
- Upload ảnh phân biệt Blob trên web và file descriptor trên native. Retry cùng request trong cùng hook tái dùng memory đã được xác nhận tạo và bỏ qua upload đã được xác nhận thành công; không tự retry mutation toàn bộ.

### Maps và Expo config

- Chỉ giữ một `app.config.js`; không để `app.config.ts` mới ghi đè plugin OAuth, development client và scene lifecycle.
- Nhập `react-native-maps` **1.27.2**, đúng bản Expo SDK 57 đề xuất. Không nâng các package khác.
- Mặc định `EXPO_PUBLIC_NATIVE_MAP_ENABLED=false`. Giữ renderer sơ đồ hiện có trên web và preview; native SDK chỉ được require khi bật ở chế độ API.
- Khi bật flag, config yêu cầu Android Maps key; key SDK là public, cần giới hạn theo package/SHA-1/API. Không đặt service secret vào `EXPO_PUBLIC_*`.
- Renderer dùng animateToRegion thay vì remount MapView mỗi lần đổi điểm; tôn trọng reduced motion.
- Chưa có native build/QA cho Maps, SDK web hoặc permission GPS thật. Không đổi `.env.local` hay Metro đang chạy của người dùng.

## Phần chưa sẵn sàng để coi là tích hợp production

1. **Places/Itinerary/Memory/Route:** mới nhập service/hooks/schema; chưa gọi từ UI chính vì backend đối ứng chưa merge và contract chưa hoàn tất. POST/list/detail Trip đã nối từ công việc trước đó là ngoại lệ đã được ghi rõ.
2. **Provider bản đồ:** native renderer là Google Maps; service route đồng đội nhắm backend Geoapify. Chưa kích hoạt và không thay quyết định dùng Google Maps/Places/Routes của roadmap. Cần thống nhất trước phase Maps thật.
3. **Memory + media:** create/upload hai bước chưa có giao dịch hoặc idempotency end-to-end. Timeout sau khi server đã ghi có thể còn bản ghi một phần hoặc upload trùng; ref retry chỉ tránh lặp kết quả đã được client xác nhận trong cùng phiên. Cần contract retry/cleanup và ảnh riêng tư trước khi nối camera.
4. **Lịch trình:** chưa đối chiếu đầy đủ origin, departure, phương tiện, round-trip, pins, version, semantics ghé thăm và giới hạn 90 ngày legacy với Trip contract tối đa 365 ngày. Không mở mutation từ UI trước khi chốt.
5. **Weather, Home, Profile:** client/schema nhập vào không đồng nghĩa dashboard, thống kê, profile mới hoặc checklist đã có dữ liệu thật. Không làm thay đổi giao diện bằng endpoint demo.

## Kiểm tra

| Kiểm tra | Kết quả |
| --- | --- |
| TypeScript strict + noUnusedLocals/noUnusedParameters | Đạt |
| `npm test` | 177/177 đạt, gồm 6 merge regression tests mới |
| Expo export web, API mode | Đạt |
| Expo export Android/Hermes, API mode | Đạt |
| `git diff --check` | Đạt |
| Expo Doctor | 20/21; 9 patch mismatch đã có trước merge |
| Lint | Không chạy theo yêu cầu hiện tại |
| Thiết bị/native Maps/Google OAuth/camera và backend e2e lần merge | Chưa chạy; export không thay nghiệm thu thiết bị |

Các test mới kiểm tra config plugin không bị mất, phân biệt ba loại ID, cache theo owner, runtime route schema/polyline, ranh giới ngày Việt Nam và partial upload retry. Suite hiện có tiếp tục bảo vệ preview UI/gesture/form/album.

Expo Doctor cảnh báo `@expo/ui`, `expo`, `expo-constants`, `expo-dev-client`, `expo-glass-effect`, `expo-linking`, `expo-router`, `expo-sharing`, `expo-splash-screen` lệch patch đề xuất. Không tắt check hoặc tự nâng ngoài phạm vi. Không có cảnh báo compatibility mới cho Maps.

## Bước tiếp theo

**Follow-up 03/11 theo yêu cầu người dùng:** đã bổ sung lại Profile mở rộng và nút đổi email của Register, auth thật mặc định development, logo WeGo; sửa token/layout/loading/điều hướng recovery và logout feedback trước khi nhận. Các quyết định không nhận Profile/Register ở mục merge bên trên là mốc lịch sử của commit `bea85bf`. UI/Places/Itinerary/Memory/Maps và backend không thay phạm vi. Chi tiết kiểm tra trong `auth-integration.md` và `PROJECT-STATUS.md`.

Review kết quả mobile trên preview hiện tại; sau đó tiếp tục Trip PATCH/delete theo contract đã chốt. Backend `integration/team-sync` chỉ merge khi người dùng yêu cầu lại, sau khi xử lý controller/DTO/error code/migration và media/provider. Không cần bật toàn bộ service vừa nhập để thử UI.
