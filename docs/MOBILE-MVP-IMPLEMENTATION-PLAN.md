# Kế hoạch hoàn thiện WeGo Mobile cho đồ án môn học

Cập nhật định hướng: **05/11/2026**, theo yêu cầu của người dùng.

- Bối cảnh: dự án môn Phát triển ứng dụng di động của sinh viên năm cuối.
- Ưu tiên: **app chạy ổn → logic và dữ liệu đúng → luồng thao tác rõ ràng → UI/UX mượt, đẹp → trình diễn và giải thích được**.
- Phạm vi hiện tại: app du lịch cá nhân tại Việt Nam, ưu tiên thiết bị Android đang dùng để học và trình diễn. iOS thực hiện theo yêu cầu môn học và thiết bị có sẵn.
- Giữ thiết kế WeGo đã chốt: Ocean Teal, Roboto, giao diện sáng, thành phần dùng chung và phong cách glass nhẹ. UI/UX được hoàn thiện xuyên suốt từng luồng.
- Các hạng mục vận hành production chuyển sang giai đoạn phát triển sau đồ án.

### Tiến độ triển khai từng phần

- **Phần 1 — Hợp nhất cấu hình Expo:** đã sửa code, dùng duy nhất `app.config.ts` cho Maps, Google, dev-client và scene support; giữ quyền camera/media trong `app.json`. Có test kiểm tra config Expo thực sự nạp và [hướng dẫn chạy thiết bị](DEVICE-SETUP.md).
- Khi kết thúc phần 1, Expo Doctor báo 9 package lệch bản SDK đề xuất. Lúc bắt đầu phần 2, kiểm tra lại package đang cài với `expo/bundledNativeModules.json` không còn lệch phiên bản; không thay dependency trong phần 2.
- **Phần 2 — Lưu thiết lập ngày (P0-02):** mobile gọi API lưu điểm xuất phát, giờ đi, phương tiện, quay về và thời lượng điểm ghé trong một giao dịch; tải lại dữ liệu từ server, chặn lưu lặp và giữ form khi lỗi. Xem contract và checklist trong [api-contract-integration.md](api-contract-integration.md#day-settings).
- **Phần 3 — Ghim điểm và giờ ghé (P0-02):** lưu `pinned` cho từng lượt ghé, bật ghim/bỏ ghim trong mobile, giữ vị trí khi reorder và ràng buộc vị trí trong Held–Karp. Timeline giữ giờ ghim; báo lỗi nếu kết quả không đến kịp. Backend kiểm tra lại ghim trước khi áp dụng đề xuất. Cần restart backend để chạy migration V17; xem [contract/checklist ghim](api-contract-integration.md#pinned-visits).
- **Phần 4 — Điểm xuất phát và phương tiện trong route/tối ưu (P0-02):** tìm/chọn điểm xuất phát thật, lưu tọa độ qua V18; route và cache dùng đúng phương tiện, có chặng đi từ/quay về điểm đầu. Optimizer đọc thiết lập ngày đã lưu và giữ ràng buộc ghim. Xem [contract/checklist phần 4](api-contract-integration.md#day-routing-and-optimization). Chưa đánh dấu P0-02 hoàn tất trước khi thử trên thiết bị.
- **Phần 5 — Tạo chuyến và phục hồi khi thêm điểm lỗi (P0-03):** giữ chuyến đã tạo và danh sách điểm còn thiếu ngay trong form; thử lại bằng cách đọc danh sách server trước khi thêm tiếp, tránh trùng khi mất response. Chặn bấm lặp/thoát lúc đang lưu; rời màn phục hồi có giải thích dữ liệu nào đã lưu. Có test form → mutation hook → API, xem [checklist phần 5](api-contract-integration.md#trip-creation-recovery). Chưa QA trên điện thoại. Phần tiếp theo: tìm/chọn/thêm điểm vào chuyến đã có và xếp ngày; chưa đánh dấu toàn bộ P0-03 hoàn tất.
- **Phần 6 — Tìm/chọn/thêm điểm vào chuyến đã có (P0-03):** giữ lựa chọn qua xem chi tiết, tìm kiếm và refetch; phân biệt điểm đã chọn/đã lưu. Thêm vào Chờ xếp lịch hoặc đọc lịch mới và nối vào ngày đã chọn, giữ giờ/ghim/ghi chú hiện có. Retry đối chiếu pool và lịch đã lưu, không thêm trùng khi mất POST/PUT response; xung đột không giả báo thành công. Có test API, picker và điều hướng sau lưu, xem [checklist phần 6](api-contract-integration.md#existing-trip-place-selection). Chưa QA thiết bị. Tiếp theo là đổi giờ/di chuyển ngày/reorder, lưu/hủy trong P0-03; các luồng Đang đi, chụp ảnh và tối ưu vẫn cần rà tiếp.
- P0-01 còn việc dựng/cài app và thử trên thiết bị với key/OAuth phù hợp; kiểm tra config chưa thay thế kiểm thử thiết bị.
- Theo yêu cầu người dùng: xong mỗi phần thì dừng để review và push GitHub, sau đó mới triển khai phần tiếp theo.
- **Phần 7 — Hoàn thiện code các luồng còn lại của P0-03 (06/11/2026):** người dùng cho phép làm toàn P0-03 trong một lượt. Đã nối sửa lịch/chuyển ngày/reorder/ghim/lưu–hủy, transaction trả điểm về pool, Home/chi tiết Đang đi và chỉ đường thật, lưu ảnh riêng–thư viện–upload/Xem sau, so sánh/áp dụng tối ưu. Điểm có ngày nhưng chưa có giờ vẫn nằm trong ngày đã chọn. Xem [checklist nghiệm thu P0-03](P0-03-ACCEPTANCE.md). **Code đã triển khai đủ sáu luồng; chưa đánh dấu nghiệm thu thiết bị hoàn tất.** Phần tiếp theo là QA theo checklist và P0-04 khi người dùng yêu cầu, không tiếp tục production tự động.

## 1. Kết quả cần đạt khi nộp và trình diễn

Người dùng có thể đi hết hành trình:

**Đăng nhập → tạo chuyến → tìm/thêm địa điểm → xếp lịch → xem bản đồ/thời tiết → tối ưu → đánh dấu đã ghé/chụp ảnh → xem lại kỷ niệm.**

Mỗi bước cần có nội dung dễ hiểu, hành động tiếp theo rõ ràng và dữ liệu được lưu đúng. Đóng/mở lại app vẫn thấy dữ liệu đã lưu. Người trình diễn có thể giải thích chức năng, luồng dữ liệu và phần thuật toán/AI đang sử dụng.

Backend chạy local cùng Wi-Fi với điện thoại hoặc trên môi trường demo đơn giản đều phù hợp. Cần chọn cấu hình phù hợp bản build: development có thể dùng HTTP local; resolver hiện tại yêu cầu HTTPS cho release. Hạ tầng production không phải điều kiện nghiệm thu môn học.

Tài khoản mẫu và dữ liệu demo có kiểm soát được dùng để minh họa các trạng thái. Các thao tác tạo, sửa, xóa, check-in và lưu ảnh trong luồng chính vẫn đi qua logic/API tương ứng; dữ liệu chưa có được thể hiện trung thực.

## 2. Hiện trạng và bằng chứng đã có

Mốc nguồn lúc rà soát: mobile `080fe5a` trên `minhduc`; backend `e854397` trên `feature/merge-test`.

| Phần                 | Đã có                                                          | Cần hoàn thiện cho đồ án                                                       |
| -------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Tài khoản            | Email/password, Google, refresh/logout, hồ sơ, email links     | Cấu hình native; xử lý lỗi dễ hiểu; thử trên thiết bị trình diễn               |
| Chuyến đi/lịch trình | CRUD, địa điểm, xếp lịch, thay đổi ngày, tối ưu                | Lưu đủ thiết lập ngày/ghim/phương tiện; dữ liệu nhất quán giữa các màn         |
| Bản đồ/thời tiết     | Map native, search, route, forecast và current weather         | Key và quyền hoạt động; phương tiện đúng; vị trí hiện tại và chỉ đường dễ dùng |
| Kỷ niệm              | Camera, chọn ảnh, lưu local, upload/retry, ghi chú, album      | Luồng chọn nơi lưu rõ ràng; trạng thái lưu/upload đúng; dữ liệu theo tài khoản |
| UI/UX                | Có theme, component, điều hướng, sheet, timeline và viewer ảnh | Kiểm tra từng luồng trên điện thoại; thống nhất trạng thái và sửa giật/khựng   |
| Kiểm thử             | Có unit/API contract và integration PostgreSQL                 | Ưu tiên các test bảo vệ luồng đang dùng; cập nhật test preview lỗi thời        |

Mốc kiểm tra ở lượt rà soát trước khi đổi định hướng: TypeScript đạt; mobile **217 test: 199 đạt, 17 lỗi, 1 skip**; ESLint `src` có **51 lỗi, 3 cảnh báo**. Test contract backend thật skip khi không đặt `BACKEND_CONTRACT_FIXTURE`; xem [hướng dẫn API](api-contract-integration.md).

Các con số là bằng chứng kỹ thuật cần xử lý, không phải thước đo duy nhất của chất lượng đồ án. Phân loại lỗi test/lint, sửa các lỗi ảnh hưởng tính đúng hoặc trải nghiệm và cập nhật test theo luồng hiện tại. Kiểm thử thao tác trên điện thoại được thực hiện song song, không chờ dọn toàn bộ mã preview cũ mới bắt đầu.

## 3. P0 — App chạy ổn, thao tác được và lưu đúng dữ liệu

### P0-01. Cấu hình chạy trên thiết bị

**Vấn đề lúc rà soát:** Expo chọn `app.config.ts`, còn Google/dev-client nằm trong `app.config.js`. Phần 1 đã hợp nhất hai cấu hình vào [app.config.ts](../app.config.ts). Key/OAuth và khả năng chạy trên thiết bị cần được xác nhận theo môi trường thực tế.

- Hợp nhất dynamic config, giữ đủ cấu hình cần cho Maps, Google, camera và media.
- Chọn đúng API URL cho emulator/điện thoại; viết hướng dẫn khởi động backend và app ngắn gọn, làm lại được.
- Dựng lại development build và thử đăng nhập, bản đồ, chụp/chọn ảnh trên thiết bị demo.
- Giữ các kiểm tra cấu hình cần thiết; chỉ thiết lập các nền tảng thực sự nằm trong phạm vi môn học.

**Hoàn thành khi:** mở app không crash, vào được các màn chính, điện thoại gọi API và sử dụng module native được. Một thành viên khác có thể làm theo hướng dẫn để chạy dự án.

### P0-02. Lịch trình phải lưu đầy đủ và đúng logic

**Vấn đề lúc rà soát:** nhánh thay đổi ngày trong [trip-details-screen.tsx](../src/features/trip/screens/trip-details-screen.tsx) chỉ save khi có thay đổi thời lượng. Phần 2 đã lưu/đọc thiết lập ngày và thời lượng; phần 3 lưu ghim và bảo vệ khi tối ưu; phần 4 đã nối tọa độ điểm xuất phát, phương tiện, giờ đi và quay về vào route/optimizer. Còn kiểm chứng checklist lưu/tải lại, bản đồ và tối ưu trên thiết bị để nghiệm thu P0-02.

- Chốt contract và lưu/đọc đủ nơi xuất phát, giờ đi, phương tiện, quay về điểm đầu và ghim.
- Kiểm tra ngày của lịch nằm trong chuyến, giờ/thời lượng hợp lệ, chuyến hủy được xử lý nhất quán.
- Đổi ngày giữ các địa điểm theo quy tắc rõ ràng; cho biết những điểm nào chuyển về Chưa xếp lịch.
- Dùng dữ liệu mới của chuyến cho optimizer; tôn trọng origin, phương tiện và điểm ghim.
- Giữ kiểm tra version đang có, chặn bấm lưu lặp và báo rõ khi dữ liệu đã thay đổi.

**Hoàn thành khi:** sửa từng trường → chuyển màn/đóng mở app → dữ liệu vẫn đúng. Danh sách, chi tiết, bản đồ và album cùng phản ánh một chuyến. Bấm Hủy giữ nguyên dữ liệu đã lưu.

### P0-03. Hoàn thiện luồng chính và phản hồi thao tác

| Luồng         | Điều cần làm rõ                                                   | Tiêu chí hoàn thành                                                                   |
| ------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Tạo chuyến    | Thông tin bắt buộc, chọn ngày, thêm địa điểm, nơi đến sau khi tạo | Tạo xong mở đúng chuyến; lỗi nhập liệu ở đúng trường; không mất nội dung khi quay lại |
| Thêm địa điểm | Tìm → xem → chọn → xếp ngày hoặc để Chưa xếp lịch                 | Phân biệt đã chọn/đã thêm; giữ lựa chọn khi quay lại; tránh thêm trùng                |
| Sửa lịch      | Đổi giờ, di chuyển ngày, reorder, ghim, lưu/hủy                   | Người dùng hiểu điều gì đã thay đổi; lưu có phản hồi; lỗi không giả báo thành công    |
| Đang đi       | Xem điểm tiếp theo, chỉ đường, đánh dấu đã ghé                    | Dữ liệu và trạng thái được cập nhật ở mọi màn có liên quan                            |
| Chụp ảnh      | Chụp/chọn ảnh → chọn chuyến/ngày/địa điểm hoặc Lưu sau            | Phân biệt ảnh đã lưu trên máy, đang upload và đã đồng bộ; không mất ảnh khi API lỗi   |
| Tối ưu        | Xem kết quả và sự thay đổi trước khi áp dụng                      | Bấm Áp dụng mới đổi lịch; có thể đóng đề xuất mà giữ lịch cũ                          |

Mọi thao tác quan trọng có trạng thái đang xử lý, thành công hoặc lỗi kèm cách thử lại. Nút đang lưu không nhận thêm lần bấm; sheet/back có hành vi dễ dự đoán.

**Trạng thái 06/11/2026:** đã triển khai code cho sáu hàng trên. Các test API/schema/component được chạy với platform/HTTP double và PostgreSQL cho phần persistence; xem [checklist kiểm tra thực tế](P0-03-ACCEPTANCE.md). Chưa có xác nhận QA điện thoại, nên không đồng nhất “đã triển khai code” với “đã nghiệm thu xong trên thiết bị”.

### P0-04. Ảnh, ghi chú và tài khoản nhất quán

**06/11/2026 — Đã triển khai toàn bộ phần code P0-04 theo yêu cầu làm trong một lượt.** Store ảnh gắn tài khoản và phiên đăng nhập; giữ ảnh riêng, checkpoint upload/xóa, ghi chú có version; upload backend có khóa chống trùng bằng `clientRequestId` và migration V19. Metadata lỗi được bỏ qua riêng từng record, không xóa bản gốc. Xem [P0-04-ACCEPTANCE.md](P0-04-ACCEPTANCE.md) để kiểm tra trên điện thoại; **chưa đánh dấu nghiệm thu thiết bị hoàn tất**. Dừng để người dùng review/push trước khi chuyển sang P1.

- Kiểm tra/gắn chủ sở hữu cho ảnh local; đăng xuất/đăng nhập tài khoản khác không lẫn album hoặc thao tác đang chờ.
- Giữ bản sao ảnh trước khi upload; lỗi mạng hoặc mất response không làm tạo ảnh trùng.
- Chốt hành vi khi từ chối quyền camera/gallery; giải thích thao tác nào vẫn sử dụng được.
- Đọc metadata theo từng record để một file lỗi không làm hỏng toàn bộ album.
- Kiểm thử tạo/sửa/xóa ảnh và ghi chú, đóng/mở app và tải lại từ server.

**Hoàn thành khi:** ảnh/ghi chú còn đúng sau khi mở lại, đúng tài khoản và đúng chuyến/ngày; thông báo trên UI phản ánh đúng trạng thái thực.

## 4. P1 — UI/UX mượt, đẹp và dễ sử dụng

Đây là phần trọng tâm của đồ án, thực hiện cùng P0 theo từng luồng. Sau khi các luồng đã chạy đúng sẽ có một lượt hoàn thiện giao diện tổng thể.

### P1-01. Đồng nhất giao diện và phân cấp thông tin

**06/11/2026 — Đã triển khai phần code P1-01.** Chuẩn hóa tiêu đề/nút/badge/thẻ, Home theo dữ liệu thật và từng trạng thái chuyến, dấu hiệu ngày/điểm đang chọn, nhãn đồng bộ ảnh và placeholder thiếu ảnh. Hai điểm Đà Lạt có giới thiệu kèm nguồn chính thức; giờ/vé chưa xác minh vẫn ghi rõ. Xem [P1-01-ACCEPTANCE.md](P1-01-ACCEPTANCE.md). **Chưa nghiệm thu giao diện trên điện thoại**; dừng review/push trước P1-02.

- Giữ Ocean Teal, Roboto, theme sáng và component có sẵn. Giữ kích thước chữ gọn đã chốt; kiểm tra khả năng đọc thay vì tự tăng đồng loạt.
- Căn lề, spacing, radius, icon, header, button và sheet nhất quán giữa các màn.
- Mỗi màn có hành động chính dễ nhận biết; thông tin phụ mở khi cần.
- Phân biệt trực quan ngày đang chọn, điểm đang xem, trạng thái chuyến và ảnh đang đồng bộ.
- Home thể hiện phù hợp các trạng thái chưa có chuyến, sắp đi, đang đi và đã đi bằng dữ liệu thực.
- Với nơi chưa có ảnh/giờ mở cửa/giá, dùng trạng thái thiếu dữ liệu có chủ đích và bố cục đầy đủ; bổ sung dữ liệu có nguồn cho các điểm trình diễn quan trọng.

### P1-02. Điều hướng, form và trạng thái màn hình

**06/11/2026 — Đã triển khai phần code P1-02.** Back giữ nơi gọi/ngày/vị trí cuộn, form có guard dữ liệu chưa lưu và bàn phím/focus lỗi, query lỗi nền giữ nội dung, xóa chuyến chặn lặp và quay lại sau khi hoàn tất. Xem [P1-02-ACCEPTANCE.md](P1-02-ACCEPTANCE.md). **Chưa nghiệm thu điện thoại**; dừng review/push trước P1-03.

- Back quay đúng nơi vừa đến, giữ ngày đã chọn, vị trí cuộn, từ khóa và lựa chọn còn đang nhập.
- Tab đang chọn rõ ràng; giữ thiết kế navigation icon-only đã chốt, bổ sung nhãn trợ năng cho nút.
- Bàn phím không che input/nút lưu; form có label, thông báo lỗi gần trường và tự đưa người dùng tới trường cần sửa.
- Loading/empty/error/success có thiết kế thống nhất; đang tải lại không làm cả trang trắng hoặc nhảy bố cục.
- Các thao tác xóa có xác nhận phù hợp; người dùng thoát sheet/form được và hiểu dữ liệu nào đã lưu.

### P1-03. Chuyển động, gesture và hiệu năng cảm nhận

- Hoàn thiện chuyển màn, mở/đóng sheet, phản hồi nhấn và chuyển trạng thái theo motion token hiện có.
- Cuộn timeline không xung đột với kéo bản đồ/reorder; pinch/pan/swipe viewer không làm kẹt nút Back hoặc backdrop.
- Ưu tiên animation dùng Reanimated/Gesture Handler đã cài; giữ chuyển động có mục đích, hỗ trợ giảm chuyển động.
- Đo và sửa chỗ giật trên thiết bị demo; giảm render thừa, giữ kích thước ảnh ổn định và tải ảnh hợp lý.
- Chỉ tối ưu phần có vấn đề quan sát được, với tập dữ liệu vừa đủ chứng minh luồng: một vài chuyến, nhiều điểm trong ngày và album có nhiều ảnh.

### P1-04. Những tính năng làm rõ giá trị app du lịch

- Vị trí hiện tại và tìm gần tôi ở mức foreground; từ chối quyền vẫn tìm bằng tên/địa chỉ được.
- Chỉ đường tới đúng tọa độ; route phản ánh phương tiện đã chọn thay vì luôn DRIVE.
- Thời tiết đúng ngày/điểm đến, thông báo dễ hiểu khi không có forecast hoặc dịch vụ lỗi.
- Thể hiện tối ưu lịch trình: thứ tự trước/sau, quãng đường/thời gian, điểm ghim và bước người dùng xác nhận. Giải thích được vai trò Held–Karp và AI nếu đây là phần báo cáo.
- Hoàn thiện Recap/album để kết thúc hành trình: xem lại đã ghé đâu, ảnh và ghi chú tương ứng.

## 5. P2 — Làm khi phần cốt lõi đã hoàn thiện hoặc còn thời gian

- AI/RAG tạo lịch nháp từ nhu cầu, giải thích đề xuất và fallback; lựa chọn phạm vi theo mục tiêu báo cáo. Nếu AI là yêu cầu bắt buộc của môn, đưa luồng demo tối thiểu vào P1-04.
- Nhắc lịch, checklist chuẩn bị, thống kê, chi phí thực tế và chia sẻ chuyến.
- Offline mở rộng: xem lịch đã tải và hàng đợi đồng bộ tự phục hồi. Ở mốc đồ án, ưu tiên giữ ảnh/nội dung đang nhập và phản hồi mất mạng rõ ràng.
- Mở rộng dữ liệu POI, hỗ trợ thêm thiết bị/nền tảng và tối ưu thư viện rất lớn.
- Dọn sâu mã preview/test cũ sau khi đã xác định caller và có test thay thế cho hành vi cần giữ.

## 6. Production — Giai đoạn phát triển sau đồ án

Các hạng mục sau được ghi nhận để phát triển tiếp, **không là điều kiện chặn hoàn thiện đồ án hiện tại**:

- Hệ thống staging/production đầy đủ, Docker/deploy tự động, CI/CD nâng cao và phát hành store.
- Rate limit/quota cho traffic công khai, quản lý chi phí provider và chống lạm dụng ở quy mô lớn.
- Quy trình tách/dọn dữ liệu demo trước public, backup/restore, giám sát, cảnh báo và vận hành.
- Chính sách vòng đời tài khoản/dữ liệu hoàn chỉnh và mở rộng hạ tầng.

Trong quá trình làm đồ án vẫn giữ validation đầu vào, quyền sở hữu dữ liệu, token đúng chỗ, API hoạt động đúng và bảo vệ dữ liệu đã lưu. Tài khoản/dữ liệu demo được quản lý để phục vụ học tập và trình diễn.

## 7. Các đợt triển khai đề xuất

| Đợt | Trọng tâm                                                                   | Đầu ra kiểm chứng được                                                                   |
| --- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | Chạy ổn trên thiết bị; sửa config và lỗi cản trở thao tác                   | App mở được, đăng nhập và sử dụng map/camera/API trên máy demo; có hướng dẫn chạy lại    |
| 2   | Hoàn thiện tạo chuyến, địa điểm và lịch trình; sửa UX ngay trong từng luồng | Tạo/sửa/lưu/hủy đúng; mở lại còn dữ liệu; màn hình và phản hồi thao tác rõ ràng          |
| 3   | Hoàn thiện đang đi, ảnh/ghi chú và xem lại                                  | Check-in → chụp/chọn ảnh → lưu → album/Recap hoạt động liên tục, đúng dữ liệu            |
| 4   | Hoàn thiện bản đồ, thời tiết và tối ưu; rà UI/UX tổng thể                   | Demo giá trị du lịch rõ ràng; UI đồng nhất; sửa gesture/scroll/keyboard và các chỗ giật  |
| 5   | Chạy thử như buổi bảo vệ, sửa lỗi cuối và chuẩn bị báo cáo                  | Có bản cài hoặc development build ổn định, dữ liệu demo, kịch bản và bằng chứng kiểm thử |

Mỗi đợt hoàn thiện cả logic, trạng thái lỗi và giao diện của luồng liên quan. Thời gian triển khai được điều chỉnh theo hạn nộp môn học và kết quả đợt 1; không lấy kế hoạch production cũ làm khối lượng bắt buộc.

**Batch đầu tiên:** hợp nhất Expo config → chạy thử một hành trình trên điện thoại → sửa lưu thiết lập ngày/ghim/phương tiện → làm rõ loading/lưu thành công/lỗi và Back của luồng tạo–sửa chuyến. Phân loại test/lint liên quan ngay khi sửa, giữ TypeScript và các test logic trọng tâm đạt.

## 8. Checklist hoàn thành đồ án

- [ ] App chạy ổn trên thiết bị dùng trình diễn; setup được lặp lại theo hướng dẫn.
- [ ] Tài khoản/đăng nhập và các tính năng hiển thị trên app hoạt động đúng hoặc có trạng thái giải thích rõ ràng.
- [ ] Tạo một chuyến, thêm nhiều địa điểm, xếp ngày/giờ, đổi phương tiện/origin/ghim, lưu và mở lại giữ đúng dữ liệu.
- [ ] Hủy chỉnh sửa giữ dữ liệu cũ; bấm lưu liên tục không tạo bản ghi trùng.
- [ ] Back/sheet/tab, từ khóa, ngày đang chọn và dữ liệu form không làm người dùng mất phương hướng.
- [ ] Bản đồ, chỉ đường và thời tiết đúng với điểm/ngày/phương tiện đã chọn.
- [ ] Tối ưu có xem trước và áp dụng; giải thích được đầu vào, đầu ra và giới hạn của thuật toán/AI.
- [ ] Check-in, chụp/chọn ảnh, upload, sửa ghi chú và xem album/Recap liên kết đúng với chuyến.
- [ ] Thử lỗi mạng, từ chối quyền, đóng/mở app và đổi tài khoản; giữ được dữ liệu đã lưu.
- [ ] Giao diện thống nhất, dễ đọc, nút dễ chạm; cuộn/animation/gesture không có lỗi rõ rệt trên máy demo.
- [ ] Các lỗi ảnh hưởng luồng đã sửa; TypeScript và test trọng tâm đạt; giới hạn còn lại được ghi nhận trung thực.
- [ ] Có dữ liệu minh họa các trạng thái, kịch bản demo khoảng 5–10 phút và tài liệu giải thích thiết kế/luồng dữ liệu.

## 9. Tài liệu và nguồn đối chiếu

- [Contract API và hướng dẫn kiểm tra](api-contract-integration.md).
- [Thiết kế/luồng Home đã chốt](HOME-PREVIEW.md), [bàn giao ngữ cảnh](AGENT-HANDOFF.md).
- [Cấu hình Expo dùng chung](../app.config.ts), [hướng dẫn chạy trên thiết bị](DEVICE-SETUP.md).
- [Luồng lưu lịch trình](../src/features/trip/screens/trip-details-screen.tsx), [adapter dữ liệu](../src/features/trip/api/trip-adapters.ts).
- [Luồng camera](../src/features/camera/components/native-trip-camera.tsx), [ghép dữ liệu kỷ niệm](../src/features/memories/utils/server-memories.ts).
- Hướng dẫn UI/UX đã tham khảo: [ui-ux-pro-max](../.agents/skills/ui-ux-pro-max/SKILL.md). Các quyết định thiết kế của người dùng và WeGo được ưu tiên.

Phần 1–4 đã có thay đổi code như mục tiến độ ở đầu tài liệu; các checklist chưa đánh dấu vẫn cần kiểm chứng trước khi nghiệm thu. Sau khi review phần 4, triển khai P0-03 theo luồng tạo chuyến → thêm địa điểm → sửa/lưu/hủy; cập nhật test theo API thật ngay trong từng luồng.
