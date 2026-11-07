# QA-5 · Sửa lịch trình trong ngày

Cập nhật 07/11/2026. Phạm vi: điểm xuất phát, giờ đi, thời lượng ghé, phương tiện và quay lại điểm xuất phát. Giữ modal và typography hiện có; không triển khai AI.

## Cách dùng và nghiệm thu

1. Mở chi tiết chuyến sắp đi hoặc ngày hôm nay/ngày tới của chuyến đang đi. Bấm icon sửa ở cụm công cụ ngày; khi đã có điểm xuất phát, có thể bấm node **S**.
2. Gõ để tìm địa điểm trong danh mục và các điểm đã lưu của chuyến; hoặc mở danh sách điểm trong ngày. Chọn một điểm sẽ lưu cả tên, địa chỉ và tọa độ đã có. Sửa lại tên bằng cách gõ sẽ bỏ tọa độ cũ để tránh gán sai vị trí.
3. **Vị trí hiện tại** chỉ xin quyền vị trí khi bấm, chỉ dùng foreground, không theo dõi nền. Thử cho phép, từ chối và tắt GPS. Android emulator cần có tọa độ trong Extended Controls → Location. Bản native cũ chưa có module cần build lại; lỗi lấy vị trí không chặn nhập thủ công.
4. Nhà riêng/nơi lưu trú dùng địa chỉ nhập thủ công hoặc thông tin lưu trú đã có. Không bịa vị trí nhà riêng. Địa chỉ chưa có tọa độ vẫn được lưu và có chú thích chưa tính được tuyến từ đó. Mapbox Geocoding bên ngoài không được gọi trong luồng này, theo lựa chọn MVP của người dùng.
5. Chọn giờ bằng picker, sửa thời lượng, bật quay lại nơi bắt đầu, lưu. Tải lại trang và đổi qua lại ngày: cấu hình phải giữ đúng ngày, các ngày khác và ghi chú/ID các điểm giữ nguyên. Bản đồ có ghim **S**, đường đi có chặng xuất phát và quay về; tổng km/phút tính cả hai chặng khi có dữ liệu.
6. Đổi phương tiện bằng pill ngoài modal, kiểm tra lưu rồi mở lại vẫn giữ. Chuyển phương tiện cũng tính lại giờ đến theo cấu hình ngày.
7. Mất mạng/dịch vụ tuyến lỗi: giữ form và hiển thị lỗi. Hai cửa sổ cùng sửa: bản cũ nhận xung đột và yêu cầu tải lại. Chuyến kết thúc/hủy hoặc ngày đã qua trong Live chỉ đọc.
8. Sau khi sửa cấu hình, thử kéo sắp xếp, gỡ/Hoàn tác và sửa một điểm riêng: cấu hình xuất phát phải được giữ. Tối ưu tuyến vòng giữ điểm xuất phát, danh sách gợi ý chỉ chứa các điểm ghé.

## API cho Postman

Base URL dev: `http://localhost:18081`. Dùng `Authorization: Bearer <accessToken>` của chủ chuyến và `Content-Type: application/json`.

Đọc trước:

- `GET /api/v1/trips/{tripId}` → lấy `data.trip.version`.
- `GET /api/v1/trips/{tripId}/itinerary` → lấy `data.updatedAt`, các `placeId` trong ngày và cấu hình `days[].settings`.

Lưu cấu hình ngày và tính lại giờ đến:

`PUT /api/v1/trips/{tripId}/itinerary/days/2026-11-20/schedule`

```json
{
  "expectedTripVersion": 0,
  "expectedUpdatedAt": "<updatedAt từ lần đọc/lưu mới nhất; null nếu chưa có lịch>",
  "settings": {
    "origin": {
      "name": "Nơi lưu trú",
      "address": "Địa chỉ của bạn",
      "latitude": 11.94,
      "longitude": 108.44
    },
    "departureTime": "08:30",
    "returnToStart": true,
    "travelMode": "DRIVE"
  },
  "durations": [
    { "placeId": "<Place UUID thứ nhất của ngày>", "minutes": 60 },
    { "placeId": "<Place UUID thứ hai của ngày>", "minutes": 45 }
  ]
}
```

Dùng ngày thật nằm trong chuyến, thay các placeholder trước khi gửi. `durations` phải chứa đúng các địa điểm đang xếp trong ngày, không thừa/thiếu/trùng. Mỗi thời lượng 5–480 phút. `origin: null` cho phép bắt đầu tại điểm ghé đầu tiên; khi đó `returnToStart` phải là `false`. Nhập địa chỉ thủ công có thể để cả hai tọa độ `null`; không chỉ gửi một tọa độ. `departureTime` dùng giờ địa phương Việt Nam, chính xác tới phút. `travelMode`: `DRIVE`, `WALK`, `BICYCLE`.

Response giữ envelope itinerary hiện có, bổ sung `days[].settings`. Lưu origin là snapshot riêng tư của ngày, không tạo địa điểm công khai hoặc thêm một stop giả vào chuyến. `PUT /itinerary/days/{date}` cũ vẫn hoạt động; không gửi `settings` thì giữ cấu hình đã lưu.

- `GET /api/v1/trips/{tripId}/itinerary/days/{date}/route`: mặc định dùng phương tiện đã lưu, có thể truyền `?mode=WALK` để xem tuyến khác. Response `route.legs` chỉ gồm chặng giữa các điểm ghé; `startLeg`/`returnLeg` là hai chặng riêng, tổng và polyline bao gồm toàn tuyến.
- `POST /api/v1/trips/{tripId}/itinerary/days/{date}/route/optimize`: tính cả origin, tùy chọn quay về và giới hạn số waypoint của Mapbox. Không thay lịch cho đến khi người dùng áp dụng.

## Dữ liệu và giới hạn

- Flyway **V17** thêm `itinerary_day_settings`, unique theo itinerary/ngày, ràng buộc cặp tọa độ và tùy chọn quay về. Không sửa migration cũ.
- Kiểm quyền chủ chuyến, phạm vi ngày và chế độ chỉ đọc trước khi gọi provider. Provider I/O nằm ngoài transaction; lúc lưu kiểm lại phiên bản chuyến/lịch dưới khóa trip. Cấu hình và thời lượng được lưu trong một transaction.
- Cần `MAPBOX_ACCESS_TOKEN` ở backend để tính tuyến thật. Nếu chưa cấu hình, thiếu tọa độ, quá giới hạn waypoint hoặc không có tuyến, vẫn lưu cấu hình; các giờ đến không tính được để `null`. Không suy tốc độ giả hay ghi đè bằng thời gian mẫu. Lỗi HTTP/network từ provider làm lần lưu thất bại và giữ form.
- Khi không có origin, giờ xuất phát là giờ đến điểm ghé đầu tiên. Khi có origin, cộng thời gian chặng đầu; mỗi điểm sau cộng thời lượng ghé và thời gian di chuyển, làm tròn lên tới phút. Lịch có giờ đến vượt sang ngày khác bị từ chối để người dùng chia sang ngày kế tiếp.
- Chỉ đường và giờ đến là ước tính tuyến đường, không phải giao thông trực tiếp hoặc điều hướng từng ngã rẽ. Ghim địa điểm và AI chưa thuộc bước này.

## Chạy lại ứng dụng

Backend khởi động lại để Flyway áp dụng V17. Web chỉ cần reload server Metro nếu đang chạy.

Android development build cần nhận module đã được người dùng duyệt:

```powershell
cd E:\travel-mobile-ui
npx expo prebuild --platform android
npx expo run:android
```

iOS build mới trên macOS/EAS. Không cần quyền vị trí nền.

Kiểm tra tự động: 42 ca backend và 56 ca mobile liên quan đạt; TypeScript strict/no-unused, export web/Android và diff-check đạt. Expo Doctor 20/21, còn lệch phiên bản vá của 13 package có sẵn; không nâng cấp ngoài phạm vi. Token backend đã được người dùng cấu hình và server 18081 khởi động lại; gọi Directions thật với hai tọa độ mẫu trả HTTP 200 cho driving/walking, có metrics, leg và polyline. Trạng thái runtime được ghi trong [PROJECT-STATUS.md](PROJECT-STATUS.md). Nghiệm thu chuyến thật qua UI và GPS/gesture trên thiết bị vẫn cần người dùng thực hiện; export bundle không thay cho kiểm thử quyền native. Nếu đang mở UI từ trước khi thêm token, reload trang web hoặc kéo làm mới lịch ngày để bỏ kết quả chưa cấu hình đang được cache.
