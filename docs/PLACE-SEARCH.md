# Tìm và thêm địa điểm · 27/10/2026

- Tinh chỉnh mới nhất: dropdown điểm đến/ngày dưới header có safe area +32px; ô tìm kiếm và gợi ý sát gọn, không có nút vị trí hiện tại. Item nền trắng, không shadow, cách nhau 12px. Khi chọn có viền teal đậm hơn và ô tick xanh ngọc. Ẩn các điểm đã có ở bất kỳ ngày nào hoặc trong pool của chuyến đi khỏi cả gợi ý và kết quả tìm kiếm.

- Route `/trip/add-places?tripId=…&day=…` là màn hình Stack riêng, xác thực params ở route. Không có `day` thì mặc định lưu vào Chờ xếp lịch. Chi tiết chuyến đi mở trực tiếp màn này; không còn modal lựa chọn thêm vào ngày/chờ xếp lịch ở giữa.
- `PlacePickerScreen` giữ draft lựa chọn cục bộ. Dùng chung với bước tạo chuyến đi bằng cách thay nội dung màn tạo, giữ nguyên dữ liệu React Hook Form của màn tạo. Không mở thêm native modal cho picker.
- Tìm tên VI/EN, tên không dấu, từ khóa địa chỉ; tên khớp hoàn toàn được ưu tiên. Bấm kết quả để xem vị trí, bấm cộng để chọn nhanh nhiều điểm. Có bộ lọc điểm đã chọn và thanh chọn ngày/chờ xếp lịch. Chỉ ghi store/form khi bấm thêm; quay lại không ghi thay đổi.
- `PlaceSearchMap` là renderer xem trước, dùng tọa độ mẫu gần đúng và nền sơ đồ, không phải Google Maps hay bản đồ GPS. Có ghim, hiệu ứng đưa điểm đã tìm vào giữa/phóng to, nút zoom và kéo bản đồ để đặt ghim riêng. Có nhãn giải thích ngay trên bản đồ. Chưa xin quyền GPS hoặc gọi API bản đồ.
- `getPlaceSearchPreview` cung cấp catalogue mẫu cho Đà Lạt, Đà Nẵng, Hội An, Nha Trang. Nơi khác hiển thị rỗng, không tạo địa điểm hoặc vị trí giả. Khi tích hợp, thay nguồn tìm kiếm/geocoding và renderer bản đồ; selection và confirm không phụ thuộc provider.
- `TripStop` bổ sung address và location tùy chọn. Địa điểm riêng kiểm tra tên bằng RHF/Zod. Mutation thêm điểm giữ địa chỉ/tọa độ, loại trùng ở đích, để trống giờ để xếp sau theo luồng sẵn có.
- Giao diện sáng, teal, VI mặc định/EN, token dự án; safe area ở biên màn hình và footer, xử lý bàn phím iOS, virtualized results, vùng chạm >=44px, Reanimated tôn trọng Reduce Motion. Không thêm dependency.
