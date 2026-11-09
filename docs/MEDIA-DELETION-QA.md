# QA-6 — Xóa ảnh từ giao diện đến Cloudinary

Cập nhật: 08/11/2026. Giữ core viewer zoom/vuốt và luồng ảnh Xem sau trên thiết bị.

## Hành vi

- Xóa ảnh đã đồng bộ: xác nhận → khóa thao tác và hiện loading → backend xác nhận Cloudinary → xóa bản ghi media → đóng viewer, làm mới album/Home/số đếm. Lỗi thì giữ viewer và thông báo ngay trong khung xác nhận để thử lại.
- Xóa ảnh Xem sau: chỉ xóa bản cục bộ trong app, không gọi Cloudinary. Bản đã xuất vào thư viện điện thoại vẫn giữ nguyên. Ảnh mẫu không có thao tác xóa.
- Xóa ảnh cuối của kỷ niệm không có ghi chú: ẩn kỷ niệm rỗng. Kỷ niệm có ghi chú vẫn được giữ.
- Khi ghép thư viện, bản sao local đã đồng bộ không được coi là nháp thay thế cho ảnh đã xóa ở server. Nháp chưa đồng bộ vẫn được giữ; không tự xóa file chỉ vì API không trả về ảnh.
- Xóa toàn kỷ niệm/chuyến đi: ẩn khỏi ứng dụng ngay theo API hiện có; dọn các file của kỷ niệm đã ẩn bằng tác vụ nền.

## API để test bằng Postman

Authorization: Bearer Token của chủ ảnh. Endpoint không có body:

```http
DELETE http://localhost:18081/api/v1/media?id=MEDIA_UUID
```

| Kết quả | Ý nghĩa |
| --- | --- |
| 204 | File đã được Cloudinary xác nhận xóa/không tồn tại, bản ghi media đã xóa. Gửi lại cùng ID bằng cùng chủ ảnh vẫn 204. |
| 401 | Thiếu hoặc hết hạn đăng nhập. |
| 404 `MEDIA_001` | Không tồn tại hoặc không thuộc tài khoản. Không gọi Cloudinary. |
| 503 `MEDIA_002` | Cloudinary lỗi hoặc chưa xác nhận kết quả. Yêu cầu đã lưu để thử lại; chưa xóa bản ghi media. |
| 503 `UPLOAD_006` | Máy chủ chưa cấu hình dịch vụ ảnh. |
| 409 `MEDIA_003` | Ảnh Cloudinary cũ thiếu public_id; cần quản trị viên phục hồi đúng danh tính asset, không đoán từ URL. |

Nếu thử upload lại đúng nội dung vào cùng memory đã có yêu cầu xóa, API upload trả 409 `MEDIA_004` khi memory còn hoạt động; memory đã ẩn trả 404. Muốn tạo kỷ niệm mới, tạo memory mới. Quy tắc này chặn request upload cũ đến muộn làm ảnh sống lại.

## Nghiệm thu trên giao diện

1. Chụp/upload một ảnh thử vào chuyến của bạn. Mở ảnh từ Kỷ niệm → Xóa → Hủy: không thay đổi ảnh hoặc số đếm.
2. Xóa → xác nhận. Trong lúc chờ không gửi trùng, không đóng viewer trước kết quả. Sau thành công, refresh/reload: ảnh biến mất ở album, Home và chi tiết chuyến. Kiểm tra asset trong Cloudinary Console bằng tài khoản của bạn.
3. Thử khi mất mạng: ảnh vẫn mở, thông báo lỗi và nút thử lại. Nếu máy chủ đã nhận và hoàn tất nhưng client mất phản hồi, gửi lại vẫn thành công.
4. Xóa ảnh cuối của memory không có note: không còn kỷ niệm rỗng. Với memory có note: ghi chú vẫn hiện trong dữ liệu API.
5. Dùng token tài khoản B xóa ID của A: 404, ảnh của A không thay đổi. Gửi cùng ID đã xóa hai lần với A: đều 204.
6. Xóa toàn memory hoặc chuyến thử, chờ lượt dọn nền và kiểm tra Cloudinary. Không dùng ảnh quan trọng để nghiệm thu vì đây là xóa file thật.
7. Xóa một ảnh Xem sau chưa đồng bộ: không tạo request API, ảnh local biến mất sau reload; bản đã lưu ra thư viện máy vẫn còn.
8. Kiểm tra VI/EN, Android và web; pinch, double-tap, vuốt ảnh và kéo đóng vẫn hoạt động bình thường trước/sau khi hủy xác nhận.

## Cơ chế và giới hạn

- Migration V19 thêm `media_deletions`: giữ danh tính asset, chủ sở hữu, fingerprint nội dung và trạng thái hoàn tất, hỗ trợ gửi lại sau mất phản hồi/restart. Không lưu dữ liệu nhị phân ảnh trong bảng này.
- Cloudinary I/O nằm ngoài transaction DB. Reserve/finalize dùng transaction ngắn; khóa cùng memory với bước upload finalize. Nếu cloud đã xóa nhưng DB lỗi, giữ receipt và thử lại, chấp nhận kết quả `not found`.
- Tác vụ nền chạy mỗi 60 giây, tối đa 10 yêu cầu/lượt; lỗi được lùi từ 60 giây tới tối đa 1 giờ. Tải lớn sẽ cần điều chỉnh throughput và giám sát hàng chờ; không bảo đảm mọi file đã soft-delete được dọn trong đúng 60 giây.
- Upload đang chạy mà memory/chuyến bị ẩn, hoặc ảnh tương ứng đã bị xóa: không gắn ảnh trở lại; tạo/mở lại yêu cầu dọn asset. Nếu tiến trình chết ngay sau provider upload nhưng trước khi ghi nhận phản hồi vào DB, vẫn cần đối soát asset mồ côi; chưa có quy trình inventory reconciliation.
- Yêu cầu Cloudinary có `invalidate=true`. Cache CDN được vô hiệu hóa bất đồng bộ; bản cache trình duyệt hoặc bản người dùng đã tải xuống không thể thu hồi bằng API này. Xem [Destroy API](https://cloudinary.com/documentation/image_upload_api_reference#destroy_by_public_id) và [CDN invalidation](https://cloudinary.com/documentation/invalidate_cached_media_assets_on_the_cdn).
- Chưa thay đổi public delivery thành private/signed delivery. Đây vẫn là hạng mục cần chốt trước production nếu album phải riêng tư.
- Backend test dùng PostgreSQL Testcontainers và Cloudinary mock; cần nghiệm thu Cloudinary thật theo checklist trên, không coi mock là bằng chứng file thật đã xóa.

Kiểm tra tự động: 71 ca backend và 38 ca mobile đạt; TypeScript strict/no-unused đạt. Backend dev đã áp dụng V19 tại cổng 18081, health UP. Không chạy lint theo yêu cầu.
