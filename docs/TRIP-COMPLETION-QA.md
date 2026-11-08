# Kết thúc chuyến đi · 08/11/2026

## Quy tắc

- Qua hết ngày kết thúc theo `Asia/Ho_Chi_Minh`, backend vẫn tự trả mode `RECAP` như trước. Không cần job đổi trạng thái trong DB.
- Trong chuyến đang diễn ra (`LIVE`), người dùng có thể chọn **Chi tiết chuyến đi → ⋯ → Kết thúc chuyến đi**, kể cả chưa ghé hết các điểm.
- Khi toàn bộ địa điểm của chuyến đều đã ghé (bao gồm các ngày khác và Chờ xếp lịch), chi tiết hiển thị lời nhắc nhẹ. Không nhắc khi danh sách rỗng/chưa tải đủ; không tự kết thúc, không bật modal ép xác nhận.
- Sau khi người dùng xác nhận, lưu `status=COMPLETED`, trả `mode=RECAP`; giữ ngày dự kiến, địa điểm, thời lượng, check-in và kỷ niệm. Hành động không tự đánh dấu các điểm còn lại là đã ghé.
- Dùng luồng xác nhận hiện có, hai ngôn ngữ VI/EN, có trạng thái chờ/lỗi/thử lại. Xung đột phiên bản yêu cầu tải lại và xác nhận lần nữa.
- Chi tiết cập nhật ngay từ response, làm mới Home/danh sách/lịch ngày/địa điểm liên quan. Home có thể ưu tiên chuyến LIVE khác theo quy tắc chọn chuyến hiện tại.

## API để test

Khởi động lại backend sau khi cập nhật code. Dùng base URL backend đang chạy, ví dụ `http://localhost:18081` (thay cổng nếu cấu hình khác).

`POST /api/v1/trips/{tripId}/complete`

Headers: `Authorization: Bearer <accessToken>`, `Content-Type: application/json`.

```json
{ "version": 3 }
```

Lấy `version` từ `GET /api/v1/trips/{tripId}`. Response 200 có cấu trúc `ApiResponse<TripRead>` như API chi tiết; `data.trip.status=COMPLETED`, `data.trip.mode=RECAP`, version tăng 1. Gửi lại yêu cầu đã hoàn thành không tăng version nữa.

- 400: thiếu/null/âm/số thập phân/chuỗi version hoặc field lạ.
- 401: chưa đăng nhập.
- 404 `TRIP_001`: không tồn tại, đã xóa hoặc thuộc người khác.
- 409 `TRIP_002`: phiên bản cũ; `TRIP_006`: chưa khởi hành/đã hủy/đã qua ngày kết thúc.
- Không thêm migration hoặc dependency. OpenAPI cập nhật tại `docs/api/trip-crud.openapi.json`.

## Nghiệm thu UI

1. Mở chuyến đang diễn ra, vào menu, chọn kết thúc rồi **Tiếp tục hành trình**: không đổi trạng thái.
2. Ghé hết điểm của hôm nay nhưng còn điểm ngày khác/chưa xếp lịch: không hiện lời nhắc hoàn thành toàn chuyến.
3. Ghé hết tất cả điểm: hiện lời nhắc; vẫn thêm điểm/chụp ảnh/tiếp tục hành trình bình thường trước khi xác nhận.
4. Xác nhận kết thúc: chi tiết sang tổng kết, Home/danh sách cập nhật; ngày và kỷ niệm giữ nguyên, điểm chưa ghé không bị sửa.
5. Chỉnh sửa chuyến trên thiết bị khác rồi xác nhận với dữ liệu cũ: hiện xung đột, tải lại, xác nhận lần nữa. Thử mất mạng và bấm nhanh nhiều lần.
6. Chuyến sắp đi/đã hoàn thành/đã hủy: không có nút kết thúc. Kiểm tra Android/web và ngôn ngữ EN.

Kiểm tra tự động: `tests/trip-completion.test.ts`, `tests/trip-mutations.test.ts`, `tests/connected-live-trip.test.ts`; backend `TripCompletionIntegrationTest`, `TripCalendarTest`, `TripMutationIntegrationTest`. Nghiệm thu UI thật chờ người dùng thực hiện.

Kết quả: 21 ca backend với PostgreSQL Testcontainers, 26 ca mobile liên quan và TypeScript đều đạt. Không chạy lint theo yêu cầu; chưa chạy nghiệm thu thao tác trên thiết bị thật.
