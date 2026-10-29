# Tìm và thêm địa điểm · 27/10/2026

## Sửa lịch trình trong ngày · 29/10/2026

- `TripDayScheduleForm` thay `TripStartPointForm`, mở từ nút/nốt điểm xuất phát hiện tại, tiêu đề Sửa lịch trình trong ngày. Ô tìm tên/địa chỉ dùng cùng `searchPlaces` (VI/EN, không dấu, địa chỉ), catalogue mẫu và địa chỉ mẫu; cho phép nhập địa chỉ bất kỳ. Dropdown riêng chứa đúng các địa điểm trong ngày để chọn nhanh. Chưa geocode/Google Maps/GPS.
- Các hàng thời lượng hiển thị tên + số phút, chỉ mở một hàng tại một thời điểm; chọn 30/60/90 phút hoặc Khác (5–480), có tổng thời lượng phản hồi trực tiếp. Mọi thay đổi giữ trong RHF đến khi lưu.
- `tripDayScheduleSchema` tái sử dụng kiểm tra xuất phát/quay lại; mutation `day` nhận mảng `durations` tùy chọn và kiểm tra ID trùng, ID đã bị gỡ, số phút nguyên/hợp lệ trước khi cập nhật. Một lần lưu giữ nguyên transport, giờ đến, thứ tự, ghi chú và ghim; không tính lại giờ đến từ thời gian di chuyển mẫu. Không tạo nhiều mutation rời cho từng điểm.
- TypeScript/no-unused và 164 tests đạt (có kiểm tra lưu nguyên tử, bảo toàn dữ liệu và dữ liệu duration không hợp lệ). Không dependency, không lint; chưa kiểm tra UI/gesture trên thiết bị thật.

## Chi tiết địa điểm từ timeline · 28/10/2026

- Tinh chỉnh 29/10: Chia sẻ dùng icon kính nhỏ ngay dưới nút zoom − trên bản đồ (tên/địa chỉ/link Maps theo tọa độ; không chia sẻ ghi chú riêng). Nút gỡ có viền đỏ, bo 6px, padding 8px ngang/4px dọc, vẫn giữ vùng chạm 44px. Modal sửa giảm gap 16→8px, ô nhập/chọn giờ 44px, label nhỏ, bỏ mục ghim; giá trị ghim hiện có được giữ khi lưu, switch ghim vẫn ở card lịch trình.

- Bố cục cập nhật: dưới địa chỉ có phân loại và trạng thái mở cửa mẫu; sau thông tin là chip Tiện ích & Lưu ý. Card “Lịch trình của bạn” gom chuyến/ngày, khoảng giờ (có xử lý qua nửa đêm), thời lượng, ghi chú và switch ghim. Nút Sửa mở `TripDetailsSheet` riêng; lưu đóng modal và cập nhật card tại chỗ, không rời màn hình. Đổi ngày cập nhật route sang ngày đích; bỏ địa điểm vẫn có xác nhận và quay lại timeline.
- Giới thiệu và dải ảnh nằm sau card lịch trình. Nội dung địa điểm/tiện ích/trạng thái là fixture VI/EN cho các điểm mẫu ở Đà Lạt. Dải ảnh ghi rõ gồm địa điểm và khu vực xung quanh, dùng asset thật sẵn có; địa chỉ riêng/điểm chưa có dữ liệu không nhận thông tin du lịch hoặc ảnh thực tế của nơi khác.

- Chạm điểm trên timeline/pool mở Stack route `/trip/place-details?tripId=…&stopId=…&day=…` (bỏ `day` cho pool), xác thực params bằng Zod. Thay sheet địa điểm cũ bằng màn riêng, dùng chung `PlaceDetailsContent`, bản đồ kéo 35%/80%, tên, địa chỉ và ảnh.
- Trạng thái Chưa ghé/Đã ghé đọc trực tiếp store theo chuyến/ngày/địa điểm. Footer 60/40: Chỉ đường mở rộng bản đồ nội bộ; Đã ghé bật/tắt check-in dùng chung Home/timeline. Chỉ cho check-in ngày hôm nay/trước đó; điểm trong pool hoặc tương lai có hướng dẫn và nút khóa. Điểm thiếu tọa độ không hiển thị bản đồ giả.
- Form dùng RHF/Zod: chọn giờ qua bộ chọn đã dùng ở điểm xuất phát, thời lượng 5–480 phút, ghi chú tối đa 500 ký tự, ghim thứ tự. Nhấn Lưu cập nhật cùng mutation và đóng modal sửa. Bỏ khỏi ngày cần xác nhận, chuyển về pool; bỏ trong pool gỡ khỏi pool. Chuyến đã hủy chỉ xem.
- Có 4 bài kiểm tra luồng với store thật (lưu, check-in hai chiều, mở bản đồ, xác nhận bỏ điểm, trạng thái tương lai/đường dẫn hỏng). Không dependency hoặc backend mới.

## Tìm địa chỉ cụ thể · 28/10/2026

- Kết quả `locationType: address` mở cùng khung bản đồ nhưng dùng tiêu đề “Vị trí đã chọn” 18px, địa chỉ ngay bên dưới, ô Tên địa điểm bắt buộc (trim, tối đa 120 ký tự). Dùng ảnh đồ họa bản đồ mặc định bên phải, không gán ảnh thực tế/giờ mở cửa/giá vé/thời lượng tham quan giả; thông tin địa điểm hiện chưa có dữ liệu.
- Tick địa chỉ cũng mở bước đặt tên, không thêm thẳng điểm chưa có tên. Xác nhận giữ nguyên ID, địa chỉ và tọa độ, thay tên do người dùng nhập; bản đồ dùng vùng của địa chỉ được chọn, kể cả ngoài thành phố của chuyến đi.
- Fixture tìm kiếm riêng có `100/25 Quang Trung, Gò Vấp, TP. Hồ Chí Minh`, chỉ xuất hiện khi tìm kiếm. Đây là dữ liệu/tọa độ gần đúng để thử UI, chưa geocode hoặc truy vấn Google Maps và không tự tạo kết quả cho địa chỉ bất kỳ.

## Chi tiết địa điểm

- Chạm kết quả mở `PlaceDetailsContent`, thay phần kiểm tra vị trí cũ. Bản đồ nằm trên, dùng chung khung kéo 35%/80% và hiệu ứng spring với chi tiết chuyến đi; không có tiêu đề chữ ở header, chỉ nút quay lại. Các nút bản đồ dùng bề mặt compact 32px, vùng chạm 44px.
- Phía dưới có tên/ảnh, địa chỉ, giờ mở cửa, giá vé và thời gian tham quan; nội dung cuộn riêng, nút chọn vẫn cố định. Địa điểm thiếu dữ liệu không dùng ảnh/giờ/giá vé của nơi khác. Thông tin giờ/giá là fixture được ghi rõ trong UI.
- Khung `TripPlanningMap` nhận `mapContent` để tái sử dụng cơ chế kéo với renderer tìm địa điểm. `PlaceSearchMap` dùng shared values cho kích thước/ghim để không render lại React theo từng frame khi kéo giãn.
- Kiểm chứng: TypeScript/no-unused, 153 tests và export Android/Hermes đạt. Chưa kiểm tra gesture hoặc thị giác trên thiết bị thật; không lint, không dependency mới.

- Tinh chỉnh mới nhất: dropdown điểm đến/ngày dưới header có safe area +32px; ô tìm kiếm và gợi ý sát gọn, không có nút vị trí hiện tại. Item nền trắng, không shadow, cách nhau 12px. Khi chọn có viền teal đậm hơn và ô tick xanh ngọc. Ẩn các điểm đã có ở bất kỳ ngày nào hoặc trong pool của chuyến đi khỏi cả gợi ý và kết quả tìm kiếm.

- Route `/trip/add-places?tripId=…&day=…` là màn hình Stack riêng, xác thực params ở route. Không có `day` thì mặc định lưu vào Chờ xếp lịch. Chi tiết chuyến đi mở trực tiếp màn này; không còn modal lựa chọn thêm vào ngày/chờ xếp lịch ở giữa.
- `PlacePickerScreen` giữ draft lựa chọn cục bộ. Dùng chung với bước tạo chuyến đi bằng cách thay nội dung màn tạo, giữ nguyên dữ liệu React Hook Form của màn tạo. Không mở thêm native modal cho picker.
- Tìm tên VI/EN, tên không dấu, từ khóa địa chỉ; tên khớp hoàn toàn được ưu tiên. Bấm kết quả để xem vị trí, bấm cộng để chọn nhanh nhiều điểm. Có bộ lọc điểm đã chọn và thanh chọn ngày/chờ xếp lịch. Chỉ ghi store/form khi bấm thêm; quay lại không ghi thay đổi.
- `PlaceSearchMap` là renderer xem trước, dùng tọa độ mẫu gần đúng và nền sơ đồ, không phải Google Maps hay bản đồ GPS. Có ghim, hiệu ứng đưa điểm đã tìm vào giữa/phóng to, nút zoom và kéo bản đồ để đặt ghim riêng. Có nhãn giải thích ngay trên bản đồ. Chưa xin quyền GPS hoặc gọi API bản đồ.
- `getPlaceSearchPreview` cung cấp catalogue mẫu cho Đà Lạt, Đà Nẵng, Hội An, Nha Trang. Nơi khác hiển thị rỗng, không tạo địa điểm hoặc vị trí giả. Khi tích hợp, thay nguồn tìm kiếm/geocoding và renderer bản đồ; selection và confirm không phụ thuộc provider.
- `TripStop` bổ sung address và location tùy chọn. Địa điểm riêng kiểm tra tên bằng RHF/Zod. Mutation thêm điểm giữ địa chỉ/tọa độ, loại trùng ở đích, để trống giờ để xếp sau theo luồng sẵn có.
- Giao diện sáng, teal, VI mặc định/EN, token dự án; safe area ở biên màn hình và footer, xử lý bàn phím iOS, virtualized results, vùng chạm >=44px, Reanimated tôn trọng Reduce Motion. Không thêm dependency.
