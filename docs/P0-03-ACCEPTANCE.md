# P0-03 — Checklist chạy thử các luồng chính

Cập nhật: **06/11/2026**. Code cho sáu luồng đã được triển khai; các ô bên dưới dành cho QA trên điện thoại, chưa được đánh dấu thay người dùng.

Restart backend để nhận DTO lưu itinerary mới, sau đó reload mobile. Không có migration hoặc dependency/native module mới. Dùng cấu hình thiết bị trong [DEVICE-SETUP.md](DEVICE-SETUP.md). Các test tự động không thay thế kiểm tra camera, quyền, bàn phím, gesture và mở Maps trên điện thoại.

Sửa lỗi QA: layout gốc đã được bọc `GestureHandlerRootView` với `flex: 1`, khắc phục lỗi `GestureDetector` ở màn chi tiết chuyến mở qua route. Wrapper riêng trong các modal vẫn giữ nguyên. Reload toàn app rồi kiểm tra kéo mở/thu bản đồ và reorder timeline; có 5 test root/layout đạt, TypeScript và lint hai file sửa đạt. Chưa xác nhận lại trên điện thoại sau bản sửa này.

## 1. Tạo chuyến

- [ ] Bỏ trống điểm đến/ngày: lỗi chỉ đúng trường cần sửa; tên, ngân sách và các lựa chọn khác vẫn còn.
- [ ] Chọn một chuyến từ hôm nay đến ngày mai; chọn vài điểm ban đầu. Back từ picker giữ nội dung form; tạo thành công mở đúng ID chuyến, điểm ban đầu nằm ở Chờ xếp lịch.
- [ ] Ngắt mạng lúc tạo/thêm điểm: form không tự đóng; bật mạng, thử lại cùng thông tin không tạo chuyến/điểm trùng. Nếu chuyến đã tạo, màn phục hồi chỉ tiếp tục các điểm còn thiếu.

## 2. Tìm/chọn/thêm điểm

- [ ] Tìm → mở chi tiết → Back giữ từ khóa và lựa chọn. Gõ từ khóa mới nhanh: không chọn nhầm kết quả cũ đang chờ debounce.
- [ ] Thêm vào hôm nay, ngày mai hoặc Chờ xếp lịch; điểm đã gán ngày nhưng chưa đặt giờ vẫn xuất hiện trong ngày đó. Pool chỉ gồm điểm chưa gán ngày.
- [ ] Điểm đã lưu không được thêm mới trùng; các điểm đã lưu trong phiên lỗi vẫn có nhãn riêng trong danh sách đang chọn.
- [ ] Tạo hai điểm riêng, bỏ điểm đầu, thêm điểm thứ ba: ID/lựa chọn không bị trùng và không mất điểm còn lại.
- [ ] Lỗi sau khi lưu được vài điểm hoặc sau khi lưu pool nhưng chưa lưu lịch: giữ lựa chọn, thử lại xếp đủ điểm. Không nhân đôi khi mất POST/PUT response.

## 3. Sửa lịch, lưu và hủy

- [ ] Đổi giờ, thời lượng, ghi chú và ghim một lượt ghé; chờ lưu rồi tải lại, dữ liệu vẫn đúng. Chỉ ghim khi đã chọn ngày và giờ.
- [ ] Sửa form rồi Back/Hủy mà chưa lưu: lịch server và thông tin lượt ghé không đổi.
- [ ] Di chuyển điểm sang ngày khác: giữ các trường đã nhập, mở chi tiết vẫn thấy lượt ghé ở ngày mới.
- [ ] Chuyển về pool hoặc bỏ khỏi ngày: lịch và thời lượng/ghi chú được lưu cùng một request. Khi lỗi/xung đột, không có nửa thay đổi được lưu.
- [ ] Reorder các điểm có và chưa có giờ; vị trí ghim không bị kéo đi. Thứ tự đã áp dụng còn đúng sau reload; lượt ghé tiếp theo theo thứ tự server.
- [ ] Mở form, sửa lịch ở phiên khác rồi lưu form cũ: có lỗi phiên bản, form còn nội dung. Đóng/mở lại để lấy dữ liệu mới; không báo thành công hoặc ghi đè ngầm.
- [ ] Xóa điểm trong pool có xác nhận; sau thành công quay lại được ngay cả khi query đã tải danh sách không còn điểm đó.

## 4. Đang đi

- [ ] Home và chi tiết chuyến đang diễn ra hiển thị điểm tiếp theo từ server, bao gồm điểm đã gán ngày nhưng chưa có giờ.
- [ ] Đánh dấu đã ghé: nút có trạng thái lưu, bấm nhanh chỉ gửi một thao tác; Home/chi tiết/album phản ánh dữ liệu mới sau tải lại. Bỏ dấu đã ghé đưa điểm trở lại danh sách còn lại.
- [ ] Lỗi mạng không đánh dấu thành công; giữ điểm hiện tại và cho bấm thử lại. Không tự xếp hàng ghi ngầm khi mạng trở lại.
- [ ] Lượt ghé tương lai và chuyến đã hủy không được check-in.
- [ ] “Chỉ đường” mở Maps tới tọa độ điểm đã chọn, dùng phương tiện ngày đó. Đi bộ/xe máy/ô tô được truyền theo Maps URL; Maps quyết định khả năng hỗ trợ tại vị trí đang dùng. Mở Maps lỗi có thông báo và có thể thử lại.

## 5. Chụp/chọn ảnh và Xem sau

- [ ] Từ chối camera vẫn chọn ảnh từ thư viện được. Khi camera lỗi hoặc bản cài thiếu module, có thông báo và đường quay lại.
- [ ] Chọn chuyến/ngày/điểm rồi chụp hoặc import: ảnh xuất hiện đúng album. Chọn “chụp nhanh” khi chưa chọn chuyến thì ảnh nằm ở Xem sau.
- [ ] App giữ bản riêng trước khi đồng bộ. Từ chối quyền ghi thư viện điện thoại: app vẫn giữ ảnh và có thể upload; UI không khẳng định đã lưu vào thư viện khi chưa làm được.
- [ ] Ngắt mạng khi upload: bản riêng còn nguyên, không giả báo đã đồng bộ. Bật mạng và bấm thử lại; không nhân đôi kỷ niệm/ảnh đã upload nhưng mất response.
- [ ] Thoát khi đang ghi/upload bị chặn. Nếu chưa giữ được bản riêng, Back hỏi xác nhận trước khi bỏ ảnh đang chụp.
- [ ] Xem sau → chọn chuyến/ngày/điểm: chặn bấm gán lặp. Ngày/giờ tương lai bị từ chối trước khi đổi ảnh local. Nếu gán xong nhưng upload lỗi, có nút mở album đúng chuyến để thử lại; ảnh local vẫn còn.
- [ ] Đổi điểm đến camera không hợp lệ hoặc dữ liệu chuyến chưa tải: có trạng thái tải/lỗi/chọn lại, không âm thầm chụp vào một chuyến khác.

## 6. Tối ưu

- [ ] Tạo lịch có ít nhất hai điểm; mở tối ưu. Có loading/lỗi/thử lại, thứ tự/giờ hiện tại và đề xuất, số lượt ghé thay đổi, phương tiện/origin và ghi chú tính ước tính.
- [ ] Đóng đề xuất bằng Back/Đóng: lịch cũ còn nguyên, chưa có request áp dụng.
- [ ] Chỉ bấm Áp dụng mới ghi lịch. Bấm nhanh không gửi lặp; đang áp dụng không thể đóng/rời màn hoặc lấy đề xuất khác.
- [ ] Proposal rỗng, thiếu/trùng/khác điểm hoặc đổi ghim không bật nút Áp dụng. Khi xung đột phiên bản, lấy đề xuất mới trước khi áp dụng lại.
- [ ] Lưu thành công cập nhật Home/chi tiết và bản đồ bằng dữ liệu server mới. Lưu lỗi giữ đề xuất và thông báo, không giả báo thành công.

## 7. Phạm vi còn lại

- P0-04 xử lý sâu tài khoản/chủ sở hữu ảnh local, khôi phục metadata lỗi và đồng bộ bền vững; chưa tuyên bố hoàn tất các mục đó trong P0-03.
- Các thao tác nhiều request có thể để lại điểm/ảnh đã lưu local hoặc pool; UI chỉ rõ bước còn thiếu và cách thử lại. Transaction mới chỉ bao phủ itinerary và `poolUpdates` của cùng lần lưu.
- Chưa kiểm thử thiết bị trong phiên triển khai này. Chỉ đánh dấu P0-03 nghiệm thu xong sau khi chạy checklist; người dùng vẫn có thể review/push phần code trước.
