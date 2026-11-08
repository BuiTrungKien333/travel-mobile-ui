# Kỷ niệm · Ảnh / Album · 08/11/2026

## Giao diện

- Tab Kỷ niệm mặc định là **Ảnh**. Pill switcher Liquid Glass chuyển giữa Ảnh / Album; trạng thái có nhãn và accessibility state, hiệu ứng fade tôn trọng Reduced Motion.
- Ảnh: `SectionList` ảo hóa từng hàng ba ảnh vuông, khe 1 logical pixel, không bo góc/khung gỗ. Đầu mỗi nhóm có tên chuyến và ngày đi nhỏ gọn. Hàng cuối không kéo giãn ảnh nếu thiếu cột.
- Album: `FlatList` một cột, ảnh bìa ngang, bo góc vừa phải; tên/ngày nằm góc dưới trái trên scrim tối, capsule kính góc trên phải chỉ hiển thị số ảnh thật.
- Giữ Xem sau dưới dạng icon nhỏ cạnh switcher, không xóa dữ liệu ảnh local hoặc đường dẫn hiện có.
- Màn Xem sau dùng hàng thumbnail 88px + ngày/trạng thái và thao tác bên cạnh, không còn ảnh lớn trong card nhiều tầng. Hai nhóm Chưa chọn chuyến/Chờ đồng bộ có số lượng; lưu máy bằng icon, mở album bằng link. Giữ nguyên cơ chế lưu local trước khi upload, retry, progress, chặn bấm lặp và core viewer.
- Mở ảnh từ lưới chính hoặc album tái sử dụng `JournalPhotoThumbnail` → `useJournalPhotoGallery` → `JournalPhotoViewer`. Core pinch, double tap, vuốt ngang, tap toolbar và drag-to-dismiss không bị thay thuật toán.

## Ảnh mẫu

Bộ ảnh mẫu chung của repo nằm tại `assets/images/examples/thumbnails`, không có thư mục tên `samples`. Chuyến không có ảnh nhận sáu ảnh từ bộ này, chọn ổn định theo ID. Chỉ hiển thị sau khi tải dữ liệu thành công; lỗi mạng/đang tải không được hiểu là album trống.

Ảnh mẫu có nhãn riêng trong chế độ Ảnh, không ghi vào Zustand/database, không tự upload, không tăng số ảnh thật và không có nút xóa. Album có ảnh thật không trộn thêm ảnh mẫu. Tài khoản chưa có chuyến vẫn nhận empty state, không dựng chuyến giả.

## Tải ảnh và hiệu năng

- Dùng `expo-image`, cache `memory-disk`, `recyclingKey`, kích thước rõ ràng; không nạp toàn bộ ảnh gốc vào lưới.
- 14 ảnh WebP tối ưu từ ảnh mẫu hiện có, giữ tỉ lệ và orientation, giới hạn cạnh dài 768px. Theo yêu cầu người dùng, bộ nhẹ khoảng 927 KB thay thế bộ cũ 29,1 MB trên toàn ứng dụng (bìa/lưới/viewer mẫu); đã xóa 14 file cũ khỏi thư mục cha. Ảnh mẫu khi zoom giới hạn ở độ phân giải 768px. Ảnh người dùng vẫn dùng thumbnail ở lưới và URL gốc khi xem chi tiết.
- Cloudinary URL upload không có chữ ký/biến đổi sẵn được thêm `f_auto,q_auto,c_limit,w_...,h_...` theo kích thước hiển thị và mật độ pixel. URL signed, URL khác, blob/file và asset local được bảo toàn. Thumbnail lỗi thử lại source gốc trước khi hiện unavailable.
- Lưới chia nhóm một lần bằng Map; memo hóa dữ liệu hàng và component hiển thị. Cửa sổ render giới hạn; tránh clipping để không làm hỏng đo vị trí chuyển cảnh về thumbnail.
- Giữ cơ chế viewer chỉ giải mã ảnh hiện tại và hai ảnh liền kề. Callback mở/đóng gallery ổn định để hạn chế render lại hàng ảnh.
- Trang thư viện chỉ lấy summary chuyến, bỏ request membership của từng chuyến. Các màn chọn nơi lưu ảnh vẫn lấy membership như trước; cache key tách hai biến thể, cùng prefix invalidation hiện có.
- **Giới hạn hiện tại:** API thư viện vẫn đọc hết các trang metadata để có đủ nhóm và số đếm chính xác. Đã ảo hóa UI/tải ảnh, chưa đổi sang API tổng hợp số ảnh và tải metadata tăng dần. Chưa benchmark thư viện hàng nghìn ảnh trên thiết bị thật.

API/DB/auth không đổi; không thêm dependency. Native và web dùng chung safe area, font, khoảng cách và màu semantic. Tham chiếu API ảnh đã đối chiếu với [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/image/).

## Nghiệm thu

1. Mở tab Kỷ niệm: mặc định Ảnh, logo và switcher hiển thị; lưới ba cột, khe mảnh, nhóm đúng chuyến. Kiểm tra màn 320px, Pixel 7 và tablet; tăng font hệ thống.
2. Bấm Album: một cột thẻ, text nằm trên ảnh, badge chỉ là số; mở thẻ vào đúng chuyến. Chuyển lại Ảnh và kéo refresh.
3. Chuyến chưa có ảnh: thấy ảnh local mẫu; tổng ảnh vẫn bằng 0. Mở ảnh mẫu không có Xóa; không phát sinh request ghi/upload.
4. Chuyến có ảnh thật: không trộn mẫu. Mở ảnh, pinch/double tap, vuốt trước/sau, tap ẩn/hiện công cụ, kéo xuống đóng về thumbnail. Thử cả lưới chính và bên trong album.
5. Xóa ảnh thật, xác nhận dữ liệu/các số đếm cập nhật; kiểm tra Xem sau vẫn mở và giữ ảnh local. Chụp từ album vẫn chọn đúng chuyến.
6. Mạng chậm/lỗi: có loading/retry, không thay ảnh thật bằng mẫu vì lỗi tải API. Nếu CDN thumbnail lỗi, thử source gốc. Kiểm tra chuyển EN, Reduced Motion và xoay màn hình.

Đã chạy kiểm thử grid/nhóm ảnh, fallback mẫu, URL thumbnail, không gọi membership ở thư viện, core thumbnail/zoom/worklets và các luồng memory liên quan; TypeScript strict/no-unused. Chưa xác nhận trực quan trên trình duyệt/thiết bị: công cụ CUA không khởi tạo được (`failed to write kernel assets`). Không chạy lint theo yêu cầu của người dùng.

Kết quả: 57 ca liên quan và TypeScript đạt; 14 thumbnail được kiểm tra kích thước/tỉ lệ so với ảnh gốc. Không chạy export toàn bộ hoặc sửa backend trong lượt này.
