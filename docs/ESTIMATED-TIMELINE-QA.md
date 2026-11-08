# Lịch trình dự kiến theo ngày · 07/11/2026

## Luồng đã nối

- Bổ sung sau nghiệm thu: giờ đến đã có ở điểm đầu cũng là mốc xuất phát hợp lệ, không bắt buộc mở modal lưu giờ lần nữa. Backend suy ra settings khi lưu/thêm điểm vào ngày cũ; màn hình tự hoàn thiện và lưu một lần theo revision cho ngày cũ chỉ có giờ điểm đầu khi route sẵn sàng. Không tự ghi ở ngày chỉ đọc; lỗi hiện cùng thao tác tải lại, không retry vòng lặp.

- Người dùng mở icon sửa lịch ngày, chọn giờ xuất phát rồi lưu. Điểm xuất phát không bắt buộc: nếu bỏ trống, giờ được hiểu là giờ bắt đầu tại điểm tham quan đầu tiên. Nơi lưu trú của chuyến không tự trở thành điểm xuất phát thiếu tọa độ.
- Nếu có điểm xuất phát, cộng thời gian chặng đầu từ API Directions. Sau mỗi điểm: giờ rời = giờ đến + thời lượng ghé; giờ đến tiếp theo = giờ rời + thời gian di chuyển. Làm tròn thời gian chặng lên phút để lịch không đánh giá thấp thời gian di chuyển.
- Điểm mới chưa có thời lượng dùng 45 phút. Giữ thời lượng đã lưu; có lựa chọn nhanh 30/45/60 phút và nhập khác.
- Sau khi đã lưu giờ xuất phát, thêm/gỡ/đổi thứ tự/đổi thời lượng trong ngày tính lại lịch ở backend. Lưu ghi chú đơn thuần không gọi Directions. Khi chỉ sửa giờ đến của một điểm, dùng giờ vừa nhập làm mốc và tính tiếp các điểm phía sau.
- Live hôm nay giữ nguyên giờ, thứ tự và thời lượng của các điểm đã ghé. Backend kiểm tra lại dưới khóa chuyến; mobile khóa kéo/xóa và đổi thời lượng các điểm này. Ngày đã qua, chuyến kết thúc/hủy tiếp tục chỉ đọc.
- Route trả thiếu tọa độ/chưa cấu hình/không có tuyến: để trống các giờ chưa tính được. Nếu không có điểm xuất phát, giờ điểm đầu vẫn biết được. UI hiển thị lịch chưa đủ dữ liệu; không sinh km/phút giả. Lỗi provider HTTP/mạng trả lỗi để thử lại, không lưu nửa chừng.
- Tính route bên ngoài transaction. Batch thêm địa điểm và lịch đã tính commit cùng transaction; kiểm tra phiên bản chuyến/lịch sau khi provider trả về. Không có thay đổi schema hoặc xóa dữ liệu cũ.

## API hiện có được tái sử dụng

| API | Vai trò |
| --- | --- |
| `GET /api/v1/trips/{tripId}/itinerary` | Đọc các ngày, settings, arrivalTime, durationMinutes và sequence đã lưu |
| `PUT /api/v1/trips/{tripId}/itinerary/days/{date}/schedule` | Lưu giờ xuất phát, nơi xuất phát, phương tiện, thời lượng và tính timeline |
| `PUT /api/v1/trips/{tripId}/itinerary/days/{date}` | Sửa/gỡ/đổi thứ tự; tự tính lại khi ngày đã có settings |
| `POST /api/v1/trips/{tripId}/places/batch` | Thêm vào ngày và tính lại nguyên tử nếu đã chọn giờ |
| `GET /api/v1/trips/{tripId}/itinerary/days/{date}/route` | Polyline và các chặng cho bản đồ/timeline |

Gửi Bearer access token. Dùng version từ API chi tiết chuyến và updatedAt mới nhất từ GET itinerary; không tự đặt giá trị revision.

Ví dụ body của API schedule (thay hai Place UUID bằng địa điểm thuộc ngày đang chọn):

```json
{
  "expectedTripVersion": 0,
  "expectedUpdatedAt": "<updatedAt từ GET itinerary, hoặc null nếu chưa có>",
  "settings": {
    "origin": null,
    "departureTime": "08:00",
    "returnToStart": false,
    "travelMode": "DRIVE"
  },
  "durations": [
    { "placeId": "<Place UUID 1>", "minutes": 45 },
    { "placeId": "<Place UUID 2>", "minutes": 60 }
  ]
}
```

`durations` phải chứa đúng các điểm của ngày. Arrival time là giờ địa phương của lịch ngày, không tự chuyển qua UTC trong mobile. Lịch vượt ngày ở điểm đến tiếp theo bị từ chối để người dùng chỉnh giờ/thời lượng, không âm thầm bỏ điểm.

## Nghiệm thu bằng UI

1. Mở chuyến sắp đi, chọn Ngày 1 và thêm 2–3 điểm có tọa độ. Mở icon sửa lịch, để trống điểm xuất phát, chọn 08:00, giữ 45 phút mặc định rồi lưu. Điểm đầu bắt đầu 08:00, các điểm sau dùng thời gian route thật.
2. Đổi một thời lượng thành 60 phút. Các điểm sau thay đổi tương ứng; ngày khác giữ nguyên.
3. Đổi thứ tự rồi thêm một điểm mới. Thứ tự và giờ được cập nhật; điểm mới có 45 phút nếu chưa có thời lượng riêng. Tải lại ứng dụng: dữ liệu không mất.
4. Chọn một nơi xuất phát có tọa độ, lưu lại: giờ đến điểm đầu phải cộng cả chặng xuất phát. Chỉ nhập tên nơi xuất phát không có tọa độ thì cần dữ liệu route trước khi tính đầy đủ.
5. Với chuyến live, đánh dấu điểm đầu đã ghé rồi sửa thời lượng điểm chưa ghé/thêm điểm. Giờ và thời lượng điểm đã ghé không thay đổi.
6. Sửa ghi chú và thử Hoàn tác sau đổi thứ tự/gỡ điểm; không ghi đè lịch nếu revision đã đổi từ cửa sổ khác.
7. Kiểm tra web và Android: dải ngày, font scale, sheet/keyboard/safe area. Chưa nghiệm thu bằng thao tác trên thiết bị trong lượt triển khai này.

## Kiểm tra tự động

- Bổ sung nghiệm thu mốc điểm đầu: 52 ca backend (35 Home/lịch ngày và 17 Trip integration), 33 ca mobile liên quan và TypeScript strict/no-unused đạt. Có ca khôi phục ngày cũ chỉ có giờ điểm đầu, chờ route sẵn sàng và chống gọi lặp khi render lại.

- Đã đạt: 71 kiểm tra backend liên quan (33 Home/dashboard/lịch ngày, 17 Trip integration, 13 Trip mutation, 8 Trip CRUD); 50 kiểm tra mobile liên quan và TypeScript strict/no-unused. Không chạy lint theo yêu cầu của người dùng. Các ca dùng provider giả lập tại biên để kiểm chứng thuật toán và DB, chưa thay thế nghiệm thu route thật qua UI.

- Integration trên PostgreSQL Testcontainers/Flyway: lập giờ từ chặng thật giả lập ở biên provider, mặc định 45 phút, thời lượng 60 phút, thêm/sửa/gỡ/đổi thứ tự, giữ ngày khác và item ID, giữ điểm đã ghé, đọc lại DB, thiếu route, revision đổi trong lúc chờ provider và rollback batch, lịch vượt ngày.
- Mobile: schema bắt buộc giờ hợp lệ, cho bỏ trống điểm xuất phát, ánh xạ Place UUID và thời lượng, chuyển cờ bảo toàn điểm đã ghé, cache và các luồng kéo/vuốt/đánh dấu.
