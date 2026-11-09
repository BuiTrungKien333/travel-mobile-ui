# Tối ưu phần hành trình còn lại · 08/11/2026

## Quy tắc đã chốt

- Ngày có thứ tự A–B–C–D, đã ghé A/C: đề xuất luôn bắt đầu A✓–C✓, giữ thứ tự tương đối của nhóm đã ghé trong lịch cũ. Không suy đoán thứ tự check-in thực tế.
- Chỉ B/D tham gia sắp xếp; C là mốc xuất phát. Kết quả có thể ACBD hoặc ACDB tùy thời gian đi đường. Preview không thay đổi lịch trong database.
- Khi Áp dụng: giữ Place ID, item ID, giờ và thời lượng của A/C; cập nhật sequence, sắp xếp phần còn lại và tính lại giờ từ thời điểm kết thúc tham quan tại C. Cờ visited không được tự tạo hoặc thay đổi.
- Modal đánh dấu ✓ các điểm đã ghé, khóa kéo qua nhóm này. Thông số trước/sau chỉ là phần từ C qua các điểm chưa ghé; không cộng lại quãng đường đã đi. Nếu kéo chỉnh tay thứ tự gợi ý, ẩn số tiết kiệm cũ và tính giờ khi áp dụng.
- Nếu có quay về nơi xuất phát, điểm cuối vẫn là nơi xuất phát đã lưu (không phải C). Không lấy GPS hay hỏi quyền định vị trong luồng này.

## Tính toán và giới hạn

Luồng đã ghé dùng một request **Mapbox Matrix** lấy ma trận có hướng cho mốc xuất phát + điểm chưa ghé (+ nơi quay về nếu có), sau đó dùng **Held–Karp có sẵn** để tìm đường nhanh nhất với điểm cuối tự do hoặc đích quay về cố định. Dữ liệu khoảng cách được cộng trên chính thứ tự đã chọn; km có thể tăng trong khi thời gian giảm.

[Mapbox Optimization v1](https://docs.mapbox.com/api/navigation/optimization-v1/) không hỗ trợ tuyến một chiều cố định điểm đầu và tự do điểm cuối. [Mapbox Matrix](https://docs.mapbox.com/api/navigation/matrix/) cung cấp duration/distance có hướng, tính phí theo số phần tử ma trận. Ứng dụng giới hạn tối đa 12 tọa độ cho mỗi lần tối ưu phần còn lại (tối đa 144 phần tử), chỉ gọi khi người dùng bấm nút; không gọi lặp theo render. Không có dependency mới.

Nhóm đã ghé không tính vào giới hạn 12 trừ điểm cuối làm mốc; ngày có tối đa 100 điểm như API lịch hiện có. Nếu hết điểm chưa ghé, nút bị khóa. Nếu còn một điểm, chỉ có thể gom nhóm và tính tuyến tới điểm đó; không có hoán vị để rút ngắn. Với ngày chưa ghé điểm nào, giữ luồng Mapbox Optimization hiện có (4–12 điểm tính cả nơi xuất phát).

Không lấy đường chim bay thay cho dữ liệu đường bộ. Thiếu tọa độ của mốc/phần còn lại, provider lỗi hoặc không có đường hợp lệ: không cho áp dụng một kết quả giả. Giờ của phần còn lại cần có mốc giờ đã lưu; nếu mốc chưa có giờ, không tự bịa giờ đến.

## API

Giữ endpoint:

`POST /api/v1/trips/{tripId}/itinerary/days/{date}/route/optimize?mode=DRIVE`

Bearer token, không cần body. Với ngày đã ghé một phần, `data` gồm:

```json
{
  "order": ["<A UUID>", "<C UUID>", "<D UUID>", "<B UUID>"],
  "originalOrder": ["<A UUID>", "<B UUID>", "<C UUID>", "<D UUID>"],
  "visitedOrder": ["<A UUID>", "<C UUID>"],
  "distanceMeters": 2000,
  "durationSeconds": 1200,
  "originalDistanceMeters": 18000,
  "originalDurationSeconds": 7200
}
```

Các số ở trên là fixture kiểm thử, không phải dữ liệu provider cố định. UUID là Place UUID, không phải TripPlace/ItineraryItem UUID.

Áp dụng qua `PUT /api/v1/trips/{tripId}/itinerary/days/{date}`. Giữ body phiên bản + stops hiện có và bổ sung:

```json
{
  "expectedTripVersion": 0,
  "expectedUpdatedAt": "<revision itinerary mới nhất>",
  "expectedVisitedPlaceIds": ["<A UUID>", "<C UUID>"],
  "stops": [
    { "placeId": "<A UUID>", "sequence": 0, "arrivalTime": "<giờ A đã lưu>", "durationMinutes": 45, "note": null },
    { "placeId": "<C UUID>", "sequence": 1, "arrivalTime": "<giờ C đã lưu>", "durationMinutes": 45, "note": null },
    { "placeId": "<D UUID>", "sequence": 2, "arrivalTime": "<giờ D hiện có hoặc null>", "durationMinutes": 45, "note": null },
    { "placeId": "<B UUID>", "sequence": 3, "arrivalTime": "<giờ B hiện có hoặc null>", "durationMinutes": 45, "note": null }
  ]
}
```

UUID, giờ ISO local, thời lượng và ghi chú trong body cần thay bằng dữ liệu snapshot thật (không ghi đè thời lượng/ghi chú đang có bằng 45/null trong ví dụ).

`expectedVisitedPlaceIds` là field tùy chọn để tương thích client cũ. Mobile gửi cả mảng rỗng khi áp dụng đề xuất chưa ghé điểm nào để phát hiện check-in mới phát sinh. Khi gửi: server yêu cầu đủ đúng các điểm hiện tại, prefix đã ghé đúng thứ tự và danh sách đã ghé chưa thay đổi. Không được bỏ/thêm điểm trong cùng thao tác. Trip/lịch đổi revision hoặc người dùng check-in/bỏ đánh dấu ở cửa sổ khác trả lỗi xung đột, không ghi đè. Không có flag này thì API sửa thường vẫn không được dịch chuyển vị trí các điểm đã ghé trong hôm nay.

Provider I/O chạy ngoài transaction. Khi ghi, khóa chuyến và kiểm lại revision/trạng thái đã ghé. Không đổi schema hoặc dữ liệu thật để dựng demo.

## Nghiệm thu trên web/Android

1. Mở một ngày đang diễn ra còn chỉnh sửa được, có A–B–C–D. Đánh dấu A và C đã ghé.
2. Nút Tối ưu phải khả dụng nếu C và B/D có tọa độ hợp lệ. Mở modal: nhóm A/C có ✓, không kéo vượt qua prefix; B/D có thể đổi chỗ.
3. Kiểm tra số km/phút chỉ tính C → phần còn lại. Xem cả tuyến có quay về nơi xuất phát nếu đã bật tùy chọn này.
4. Áp dụng: timeline thành ACBD hoặc ACDB. A/C giữ nguyên giờ và thời lượng; điểm tiếp theo là điểm chưa ghé đầu tiên. Bản đồ và Home làm mới theo thứ tự lưu.
5. Tải lại ứng dụng và mở lại ngày: thứ tự không mất. Ngày khác và ảnh/ghi chú vẫn giữ nguyên.
6. Hai cửa sổ: mở đề xuất ở cửa sổ 1, đánh dấu hoặc bỏ đánh dấu một điểm ở cửa sổ 2. Áp dụng đề xuất cũ phải báo xung đột và cho tải lại.
7. Lỗi provider hoặc dữ liệu đường không đủ: không hiện số tiết kiệm giả. Ngày đã qua/chuyến kết thúc/hủy vẫn chỉ đọc.

## Kiểm tra đã thực hiện

- Đạt 89 kiểm tra backend liên quan (39 Home/lịch ngày, 17 Trip integration, 13 Trip mutation, 12 Held–Karp, 8 Mapbox Directions/Matrix), 41 kiểm tra mobile và TypeScript strict/no-unused. Không chạy lint theo yêu cầu hiện có. Backend dev 18081 đã khởi động lại, health UP.

- Backend: Held–Karp/ma trận có hướng, điểm cuối tự do/cố định, input lỗi/unreachable; HTTP parser Matrix; PostgreSQL Testcontainers/Flyway cho ACBD → ACDB, giữ giờ/ID/thời lượng A/C, dữ liệu ngày khác, đọc lại và điểm tiếp theo Home, quay về nơi xuất phát, thay đổi visited đồng thời và payload sửa prefix trái phép.
- Mobile: API contract và metadata nhóm đã ghé, giữ thời gian theo địa điểm, khóa kéo prefix trong modal, không áp dụng thứ tự vượt prefix; luồng mở/tính/áp dụng ngay cả khi không có full route lịch sử.
- Provider thật: một request Matrix 2 tọa độ công khai tại Đà Nẵng (4 phần tử), code `Ok`; A → B trả 1.320,2 m / 289,3 giây. Không lưu hoặc in token. Đây là kiểm tra kết nối provider, chưa thay thế nghiệm thu cả chuyến qua UI/thiết bị.
- Chờ người dùng nghiệm thu thao tác Android/web theo checklist trên.
