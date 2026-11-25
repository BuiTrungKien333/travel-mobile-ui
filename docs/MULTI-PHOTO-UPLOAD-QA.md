# QA-6 — Chọn và đồng bộ nhiều ảnh

Cập nhật: 08/11/2026.

## Mobile

- Camera → icon thư viện: chọn từ 1 đến 10 ảnh. Nếu trình duyệt trả quá 10 ảnh, báo chọn lại; không âm thầm cắt bỏ ảnh.
- Màn hình tiến độ dùng nền tối của Camera, hiển thị chuyến nhận ảnh, thumbnail, trạng thái từng ảnh, tổng đã giữ/đã đồng bộ. Chuẩn bị ảnh theo thứ tự, giữ tỉ lệ gốc và thu cạnh dài về tối đa 1600px nếu có image manipulator.
- Lưu các bản cục bộ có thể xử lý được trước khi bắt đầu mạng. Không xuất ảnh đã chọn ngược vào thư viện điện thoại, tránh tạo bản trùng với ảnh gốc.
- Có chuyến: gọi API upload đơn hiện có, tối đa 2 ảnh đồng thời. Mỗi ảnh là một memory riêng, giữ ngày/địa điểm người dùng đang chọn; không tự lấy ngày EXIF. Không gom cả nhóm thành một memory để giữ độc lập ghi chú/ngày/ID của các ảnh local.
- Chưa chọn chuyến: chỉ lưu Xem sau, không tạo memory hoặc gửi file lên máy chủ. Khi đưa vào chuyến mới đồng bộ như luồng hiện có.
- Có thể thử lại từng ảnh hoặc tất cả ảnh lỗi. Retry lấy metadata mới nhất đã lưu cục bộ, giữ clientRequestId/serverId, không upload lại ảnh thành công. Chưa đồng bộ vẫn xuất hiện trong Xem sau → Đang chờ đồng bộ sau khi đóng/mở ứng dụng.
- Tiến độ % là phần byte đã gửi, trạng thái Đã đồng bộ chỉ xuất hiện sau khi đọc lại memory có media. Xử lý cuối ở máy chủ có thể giữ 100% một lúc trước khi hoàn tất.
- Đóng hoặc điều hướng bị khóa khi đang chạy. Đây là upload foreground; không cam kết chạy tiếp khi app bị hệ điều hành dừng. Bản local đã lưu giữ để thử lại. Ảnh chưa lưu được hiện lỗi, không tính vào tổng đã giữ.
- Đổi phiên đăng nhập ngăn ảnh còn chờ gửi sang tài khoản khác. Làm mới Home/album/chuyến một lượt khi kết thúc mỗi đợt, không refetch toàn bộ sau từng ảnh.

## API Postman: upload nhiều ảnh vào cùng một memory

Authorization → Bearer Token của chủ chuyến/kỷ niệm:

```http
POST http://localhost:18081/api/v1/media/uploads?tripId=TRIP_UUID&memoryId=MEMORY_UUID
```

Body → form-data: thêm nhiều hàng key `files`, kiểu **File**, mỗi hàng chọn một ảnh. Để Postman tự đặt Content-Type/boundary. tripId và memoryId bắt buộc. Tối đa 10 file, 10 MiB/file; server có phần dư multipart trong giới hạn request 101 MiB.

Response HTTP **200** khi nhóm đã được xử lý, kể cả chỉ thành công một phần. `index` tính từ 0 theo thứ tự file gửi; `media` có giá trị khi thành công, `errorCode`/`errorStatus` có giá trị khi thất bại:

```json
{
  "data": {
    "succeeded": 1,
    "failed": 1,
    "items": [
      { "index": 0, "media": { "mediaId": "MEDIA_UUID", "url": "https://..." } },
      { "index": 1, "errorCode": "UPLOAD_003", "errorStatus": 400 }
    ]
  }
}
```

Ví dụ đã rút gọn: media thật còn có metadata; serializer có thể bỏ trường null. Không dùng HTTP 200 để kết luận tất cả ảnh thành công. Nếu có lỗi, những ảnh đã lưu vẫn được giữ; thử lại cùng file/cùng memory không tạo asset hoặc media trùng.

- 400 trước xử lý: thiếu tham số/file hoặc quá 10 file. 401: chưa đăng nhập. 403/404: không có quyền hoặc memory không tồn tại. Các trường hợp này không gọi Cloudinary.
- Lỗi từng ảnh gồm file sai định dạng/kích thước, dịch vụ ảnh chưa cấu hình, provider thất bại, hoặc ghi DB lỗi. Nhóm trả mã lỗi riêng; không trả stacktrace/credential.
- API batch xử lý tuần tự để giới hạn bộ nhớ và không tạo nhiều luồng gọi cloud trong một request. Mobile dùng API đơn theo từng ảnh để có tiến độ/retry riêng và tối đa 2 ảnh đang gửi; cả hai dùng chung service xác thực, policy ảnh và chống trùng ở backend.
- API batch không còn nhận upload thiếu memory/trip vào misc. API upload đơn legacy cho chức năng khác vẫn giữ. Kiểm tra lại client bên ngoài nếu từng sử dụng hợp đồng batch cũ (201 + array).

## Checklist nghiệm thu

1. Chọn 3–10 ảnh ở Camera của một chuyến hợp lệ. Xác nhận đủ thumbnail, đúng tên chuyến, tổng số tăng đúng sau khi xong và reload.
2. Chọn ảnh dọc và ngang: không bị cắt thành vuông trong file đã lưu; thumbnail vẫn crop cho bố cục. Xem lại bằng core zoom/vuốt hiện có.
3. Offline trước khi chọn: các ảnh xử lý/lưu được vẫn giữ, mỗi ảnh báo chưa đồng bộ. Bật mạng → thử lại; không tạo memory trùng.
4. Ngắt mạng giữa đợt: ảnh đã xong không bị gửi lại, ảnh lỗi có retry. Tắt/mở app rồi vào Xem sau → Đang chờ đồng bộ để tiếp tục.
5. Chụp nhanh chưa chọn chuyến → chọn nhiều ảnh: chỉ xuất hiện trong Xem sau, không có request create/upload. Đưa từng ảnh vào chuyến sau vẫn hoạt động.
6. Thử hơn 10 ảnh trên web; thiếu dung lượng lưu local; đổi tài khoản giữa đợt. Không báo ảnh chưa lưu là thành công, không upload dưới tài khoản mới.
7. Postman gửi JPEG thật + file giả đuôi jpg + JPEG khác: trả 2 thành công/1 lỗi, file sau ảnh lỗi vẫn xử lý. Gửi lại: media/asset không tăng trùng. Đọc GET `/api/v1/journal/memories/detail?memoryId=MEMORY_UUID` để đối chiếu.
8. Token tài khoản khác, thiếu token/thiếu memoryId và 11 file: bị từ chối. Xóa từng media trong memory nhiều ảnh vẫn giữ các ảnh còn lại.

Test tự động dùng PostgreSQL thật/Testcontainers và Cloudinary giả lập; cần nghiệm thu quyền thư viện, bộ nhớ, app lifecycle và provider thật trên Android/iOS/web. Không có dependency mới. Tham chiếu API picker: [Expo SDK 57 ImagePicker](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/).

Đã đạt 29 ca backend, 63 ca mobile liên quan và TypeScript strict/no-unused. Backend dev đã khởi động lại tại 18081, health UP. Không chạy lint theo yêu cầu.
