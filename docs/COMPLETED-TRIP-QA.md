# Home và chi tiết chuyến hoàn thành · 08/11/2026

## Thiết kế và phạm vi

Đối chiếu commit `fe9473b2b35a92d72b2f9f5fed300ad3bc387f68` (complete ui trips), giữ các quyết định của bản đã duyệt:

- Home Returning giữ thẻ mời tạo chuyến tiếp theo, Dấu ấn của bạn và Kỷ niệm gần đây phía dưới. Bổ sung một thẻ gọn của chuyến hoàn thành đang được dashboard chọn, có ảnh bìa/ảnh local fallback, ngày, số ngày/điểm dừng/kỷ niệm và link mở đúng chi tiết chuyến.
- Chi tiết RECAP dùng cùng map pane kéo mở rộng/thu gọn, AppBar nổi và dải ngày gạch chân như PLANNING/LIVE. Không đưa ảnh cover tĩnh lớn trở lại ở phần đầu.
- Tổng kết chuyến dùng cùng kiểu card kính nhẹ với Home. Kỷ niệm theo ngày và ghi chú nằm trên timeline, tái sử dụng album hai cột/khung ảnh và bộ xem ảnh zoom/lướt hiện có.
- Không có nút thêm điểm, tối ưu, đổi phương tiện, kéo xếp lịch, vuốt gỡ hoặc đánh dấu đã ghé trong timeline RECAP. AppBar thu gọn hiển thị tùy chọn/bản đồ thay vì icon sửa lịch. Chuyến có điểm chưa xếp lịch vẫn xem được; tab này ẩn khi rỗng ở RECAP.
- Nút Kỷ niệm ở đáy mở album cả chuyến; link xem tất cả trong khối kỷ niệm ngày mở sheet đúng ngày đó. Giữ chia sẻ nội dung hành trình bằng share hiện có, không tạo link công khai hoặc tải dữ liệu cá nhân lên dịch vụ khác.
- Font theo token: tiêu đề/thông tin chính 16–18px, nội dung 14px, metadata 12px; màu teal và nền sáng, radius vừa phải. Không đổi bottom navigation.

## Dữ liệu và API

Tái sử dụng API hiện có, không tạo endpoint hoặc schema DB mới:

| API | Dữ liệu sử dụng |
| --- | --- |
| `GET /api/v1/home/dashboard` | RETURNING, selectedTrip, footprint, recentPhotos tối đa 6 ảnh |
| `GET /api/v1/trips/{id}` | RECAP và các tổng số dayCount/stopCount/memoryCount |
| `GET /api/v1/trips/{id}/places` | Các địa điểm, cờ visited thật |
| `GET /api/v1/trips/{id}/itinerary` | Ngày, thứ tự và khung giờ đã lưu |
| `GET /api/v1/trips/{id}/itinerary/days/{date}/route` | Tuyến bản đồ, km/phút của tuyến đang xem; không gắn nhãn là dữ liệu GPS lịch sử |
| `GET /api/v1/journal/memories?tripId={id}&date=YYYY-MM-DD&page=0&size=10` | Ảnh/ghi chú của ngày chọn, phân trang và owner scope |
| `DELETE /api/v1/media?id={id}` | Xóa đúng ảnh từ viewer theo quyền hiện có |

Số kỷ niệm lấy từ API trip, không dùng số ảnh trong preview 6 ảnh làm tổng số. Số điểm dừng là địa điểm đã lưu trong chuyến, không coi là số điểm chắc chắn đã ghé. Dấu ấn giữ định nghĩa hiện có dựa vào địa điểm gắn kỷ niệm. RETURNING chỉ được chọn khi không có chuyến live/planning ưu tiên hơn; cách chọn chuyến gần đây giữ quy tắc backend hiện tại.

Ảnh riêng tư ở album theo chuyến/ngày dùng dữ liệu thật, không tự chèn ảnh mẫu. Chỉ ảnh bìa chuyến thiếu hoặc tải lỗi dùng ảnh được cung cấp trong `assets/images/examples`, ổn định theo Trip ID. Ghi chú chỉ hiển thị một lần dù một memory có nhiều ảnh; memory chỉ có chữ vẫn đọc được. Trạng thái trống/lỗi/loading không thay bằng dữ liệu mock.

Xóa ảnh làm mới album ngày/toàn bộ album, Home, chi tiết và danh sách chuyến để tổng số không cũ. Kéo làm mới chi tiết làm mới khối kỷ niệm đang chọn; phân trang tự lùi trang hợp lệ nếu nội dung cuối trang không còn. Metadata tổng số không thể hiện số ảnh cloud upload đang chờ ở máy.

## Nghiệm thu

1. Dùng tài khoản có chuyến đã kết thúc hoặc COMPLETED và không có chuyến được ưu tiên trước nó: Home hiển thị Returning, mời tạo chuyến mới, thẻ chuyến cũ, dấu ấn và ảnh gần đây.
2. Bấm Nhìn lại chuyến đi: mở đúng Trip ID, kiểm tra ảnh fallback khi cover thiếu. Số ngày/điểm/kỷ niệm phải khớp GET trip.
3. Đổi Ngày 1/Ngày 2: bản đồ/timeline và kỷ niệm/ghi chú đổi theo ngày; kiểm tra ảnh quanh 00:00 theo múi giờ Việt Nam không lọt ngày khác.
4. Chạm ảnh: mở bộ xem toàn màn hình hiện có. Xóa một ảnh, quay về: album và tổng số được làm mới. Nếu chỉ có ghi chú hoặc không có dữ liệu thì giao diện phải rõ ràng.
5. Nút Kỷ niệm dưới đáy mở album cả chuyến; link trong khối ngày chỉ mở ngày chọn. Chia sẻ dùng trình chia sẻ của hệ điều hành với tên/ngày/lịch trình, không tự xuất bản URL.
6. Xác nhận không có AI/Sắp xếp/Sửa ngày/Thêm địa điểm/check-in/gesture gỡ trong lịch hoàn thành. Các thao tác sửa dữ liệu lịch qua API vẫn bị backend từ chối. Không ảnh hưởng màn hình LIVE/PLANNING.
7. Giả lập lỗi API hoặc mạng: retry hoạt động, không hiển thị ảnh của tài khoản/chuyến khác. Kiểm tra thêm Android safe area, font scale và thao tác map kéo/zoom.

## Kiểm tra tự động

- 49 ca backend liên quan đạt (40 Home/dashboard/lịch và 9 Memory capture), PostgreSQL Testcontainers/Flyway, provider ngoài được mock tại biên. Bổ sung workflow COMPLETED: RETURNING/counts thật, soft delete, owner isolation, khoảng ngày [00:00,00:00 hôm sau), phân trang ảnh+ghi chú và bảo vệ lịch đã kết thúc.
- 30 ca mobile liên quan đạt: Home Returning mở đúng chuyến, tổng số API, fallback bìa; RECAP không có hành động sửa lịch; album theo ngày, giờ Việt Nam, pagination/retry/loading và cache sau xóa ảnh.
- Đã rà lại API backend hiện có; không cần thay đổi production backend hoặc migration. Chưa nghiệm thu bằng thao tác UI thực tế trên web/Android trong lượt này.

- TypeScript strict/no-unused và diff check đạt. Lệnh export web+Android đã bundle Android (2.454 modules), nhưng dựng trang tĩnh web chạy kéo dài và tăng bộ nhớ; đã dừng riêng tiến trình export kiểm tra, không đổi cấu hình hoặc dừng Metro của người dùng. Chưa khẳng định export web hoặc kiểm tra hiển thị native đã đạt.

- Tinh chỉnh typography sau review: Home Returning/chủ đề tổng kết 18px, tiêu đề khối và tên chuyến trong card Home 16px, nội dung và hai CTA đáy 14px, metadata 12px. Chữ số tổng kết dùng tabular-nums 18px để dễ so sánh; số Dấu ấn giữ 20px. Giữ font scaling và vùng chạm hiện có. TypeScript và 10 kiểm tra liên quan đạt.
