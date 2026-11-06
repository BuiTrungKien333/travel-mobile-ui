# P1-01 · Đồng nhất giao diện và phân cấp thông tin

Triển khai ngày **06/11/2026**. Phần code đã hoàn tất; **chưa nghiệm thu giao diện trên điện thoại thật**. Giữ Ocean Teal, Roboto, theme sáng, typography gọn và navigation icon-only. Không thêm dependency, không đổi cấu hình Expo, không sửa backend/.env.

## Quy ước dùng chung

| Thành phần | Quy ước |
| --- | --- |
| Tiêu đề màn | `AppText screenTitle`: Roboto bold 18/26, dùng trên Home, Chuyến đi, Kỷ niệm và Cá nhân |
| Tiêu đề phần/sheet | `sectionTitle`: bold 16/24; thông tin phụ dùng caption 12/16 |
| Tên điểm trong timeline | `cardTitle`: semibold 14/20; không tăng đồng loạt cỡ chữ cũ |
| Nút | `AppButton` cao tối thiểu 48, padding theo token; nội dung dài có thể tăng chiều cao. Hành động chính dùng primary, tác vụ phụ dùng outline hoặc TextAction |
| Thẻ nội dung | Radius xl cho thẻ chuyến, thẻ Home và ảnh; radius md cho phần tử nhỏ. Sheet dùng radius lớn sẵn có |
| Trạng thái | `StatusBadge` dùng semantic color, luôn có chữ, hỗ trợ xuống dòng; thống nhất trên Home/danh sách/chi tiết chuyến và ảnh |
| Điều khiển icon | Dùng icon hiện có, nhãn trợ năng, vùng nhấn 48 cho nút header; giữ icon-only trên navigation |
| Ảnh không có/lỗi | `ContentImage` giữ bố cục và hiện placeholder có nhãn; thẻ chuyến thật không mượn ảnh mẫu của nơi khác |

Ngày được chọn có nền, gạch chân, chữ đậm và accessibility selected. Điểm đang xem có nhãn “Đang xem” và viền; điểm tiếp theo/check-in vẫn giữ trạng thái riêng.

## Home dùng dữ liệu thật

`selectHomeJourney` chọn chuyến theo thứ tự ưu tiên, không sửa trạng thái server:

| Trạng thái | Nội dung và hành động |
| --- | --- |
| Đang đi | Chuyến hiện hành, lịch hôm nay và `HomeLiveJourney` với điểm tiếp theo/chỉ đường/check-in |
| Sắp đi | Chuyến READY khởi hành gần nhất, ngày đi và nút Xem kế hoạch |
| Đang lên kế hoạch | Bản nháp cập nhật gần nhất và nút Tiếp tục lên kế hoạch; không biến bản nháp thành chuyến đang đi chỉ vì đã chọn ngày |
| Đã đi | Chuyến gần nhất và nút mở đúng album kỷ niệm của chuyến đó |
| Chưa có chuyến phù hợp | Lời mời tạo chuyến; mở trực tiếp CreateTripModal dùng chung với tab Chuyến đi |

Chuyến hủy không trở thành chuyến nổi bật và không được cộng vào số chuyến đã đi. Ảnh local/cloud trên Home vẫn mở bằng route kỷ niệm đúng. Hành động tạo chuyến phụ không cạnh tranh màu với hành động chính.

## Ảnh và thông tin địa điểm

- `MemorySyncBadge` phân biệt: chỉ lưu trong ứng dụng, chờ xác nhận đồng bộ, đang đồng bộ, chưa đồng bộ được, đã đồng bộ và chờ xóa. Thành công đã được xác nhận ưu tiên hơn lỗi cũ của mutation. Trạng thái xóa ưu tiên cao nhất.
- Badge xuất hiện trong album, chi tiết ảnh và Xem sau. Upload trong lưới album là thao tác phụ; trạng thái không nhận ảnh private là đã lên server. Không thay logic ownership/checkpoint của P0-04.
- Chi tiết địa điểm giữ tên, địa chỉ, bản đồ và thông tin cần thiết trước; phần giới thiệu mở/thu gọn khi cần. Bỏ các mục tiện ích rỗng lặp lại, giữ nhắc kiểm tra giờ/vé trước khi đến.
- Hồ Xuân Hương và Ga Đà Lạt có giới thiệu ngắn kèm liên kết [Vietnam Tourism — Da Lat](https://vietnam.travel/place-to-go/south-central-coast-central-highlands/dalat/), đối chiếu 06/11/2026. Chỉ khớp tên đầy đủ và tọa độ trong khu vực Đà Lạt; không áp dụng cho địa chỉ người dùng hoặc nơi trùng tên ở thành phố khác. Dữ liệu nằm trong `place-reference.ts`, không thay dữ liệu API.
- Không tự suy ra ảnh, giờ mở cửa, giá vé hoặc lịch tàu từ phần giới thiệu. Các giá trị chưa được xác minh tiếp tục được ghi rõ trên UI.

## Kiểm tra đã chạy

- TypeScript: đạt.
- ESLint các file TS/TSX sửa và mới: **0 lỗi, 0 cảnh báo**.
- `npm run lint` toàn repo: **51 lỗi, 3 cảnh báo cũ**; chưa toàn repo xanh. Không thêm lỗi/cảnh báo ở phạm vi file sửa.
- Nhóm trọng tâm: **17/17 đạt** — Home, CTA tạo chuyến/album, nguồn địa điểm, badge ảnh, chi tiết địa điểm, Xem sau và album camera route.
- Full mobile: **305 test, 299 đạt, 6 lỗi cũ**, không skip/cancel; có fixture response backend thật từ lượt P0-04. Không chạy lại backend vì lượt này không sửa backend/API contract.
- 6 lỗi cũ: `trip-ui-flows.test.ts` (4) và `trip-weather-details.test.ts` (2), thuộc harness preview cũ. Test chi tiết địa điểm được cập nhật theo UI/API hiện hành và đã đạt, thay vì tiếp tục đòi ảnh mẫu/thông báo “chưa đồng bộ Google Maps”.
- Log: `travel-system/backend/target/p101-*.log` (ignored). Test component dùng platform doubles; không thay thế kiểm tra bố cục, cỡ chữ, Maps hoặc thao tác trên điện thoại.

## Nghiệm thu trên điện thoại

- [ ] Reload mobile hiện tại; không cần prebuild/build native cho riêng P1-01. Nếu đang thay key Maps thì thực hiện build theo hướng dẫn cấu hình Maps riêng.
- [ ] Home đúng cả năm trạng thái; kiểm tra tài khoản chỉ có chuyến đã hủy và bản nháp có ngày hôm nay.
- [ ] Tạo chuyến ngay từ Home → form thật → lưu thành công mở đúng chuyến; Cancel không tạo dữ liệu.
- [ ] Home của chuyến đã đi mở đúng album; chuyến đang đi còn chỉ đường/check-in.
- [ ] So sánh Home/Chuyến đi/Kỷ niệm/Cá nhân: tiêu đề, lề, khoảng cách và hành động chính rõ ràng; tab vẫn icon-only.
- [ ] Trên màn nhỏ và cỡ chữ hệ thống lớn, badge không cắt mất trạng thái; thẻ chuyến xuống dòng và nút không bị cắt chữ.
- [ ] Ngày đang chọn và điểm đang xem phân biệt được bằng nhãn/đường viền, kể cả khi không dựa vào màu sắc.
- [ ] Album: ảnh private/upload đang chạy/lỗi/đã đồng bộ/chờ xóa có nhãn đúng; thử lại không mất bản ảnh riêng.
- [ ] Chuyến không có ảnh bìa hoặc URL ảnh lỗi vẫn giữ thẻ đầy đủ, hiện placeholder phù hợp.
- [ ] Tìm Hồ Xuân Hương/Ga Đà Lạt ở Đà Lạt → mở giới thiệu → mở được nguồn. Nơi trùng tên ngoài Đà Lạt và địa chỉ tự đặt không nhận giới thiệu này.
- [ ] Địa điểm chưa có giờ/vé/ảnh vẫn có bố cục rõ ràng; không hiển thị dữ liệu mẫu như dữ liệu đã xác minh.

Dừng để người dùng review/push. Sau khi người dùng yêu cầu tiếp tục, phần tiếp theo là **P1-02 — Điều hướng, form và trạng thái màn hình**. Không tự commit/push hoặc chuyển sang production.
