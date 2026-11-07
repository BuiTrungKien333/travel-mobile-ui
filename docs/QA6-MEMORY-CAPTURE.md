# QA-6A — Chụp/chọn ảnh và lưu kỷ niệm

Cập nhật: 07/11/2026. Đây là đợt nghiệm thu lưu ảnh đầu tiên của QA-6, chưa phải xác nhận toàn bộ Camera/Memory sẵn sàng production. Giữ giao diện camera, album và trình xem ảnh hiện có.

## Phần đã nối và sửa

- Camera lưu bản riêng trong ứng dụng trước, rồi tạo metadata và upload vào kỷ niệm thuộc chuyến đã chọn. Từ chối lưu thêm vào thư viện máy vẫn có thể lưu bản riêng và upload. Quick capture chưa chọn chuyến được giữ ở Xem sau, chưa tự upload.
- Frontend gửi `clientRequestId` ổn định, lưu ID server vào nháp trước bước upload. Backend dùng unique key theo tài khoản và fingerprint nội dung: gửi lại cùng yêu cầu trả cùng bản ghi; dùng lại key cho nội dung khác hoặc bản ghi đã xóa trả 409 `MEMORY_004`. Client cũ không gửi key vẫn được hỗ trợ nhưng không có bảo đảm chống trùng bước tạo metadata.
- Upload cùng nội dung vào cùng memory trả cùng media ID. Tên asset Cloudinary ổn định theo memory/nội dung, `overwrite=false`, tránh tạo asset khác khi mất phản hồi. Sau khi provider trả về, DB kiểm tra lại quyền/bản ghi còn tồn tại và chỉ khóa memory trong bước ghi ngắn. Không giữ transaction DB trong lúc upload.
- API công bố giới hạn: 10 MiB/file, 25 triệu pixel, cạnh tối đa 12.000px. Kiểm tra header ảnh thật, MIME và kích thước trước khi gọi provider. Không cho đính kèm URL ảnh tùy ý trong JSON tạo memory. `tripId` và `memoryId` của multipart phải cùng có hoặc cùng thiếu; luồng camera luôn gửi cả hai.
- Response memory có `version`; thêm API sửa ghi chú với kiểm tra phiên bản. Danh sách đọc ID theo trang rồi lấy media của trang đó, tối đa 50 memories, tránh fetch collection cùng pagination trong RAM. Danh sách vẫn gồm metadata chưa upload xong; client chỉ hiển thị ảnh đã có media và nháp của chính tài khoản.
- Ngày/giờ lưu và hiển thị theo `Asia/Ho_Chi_Minh`, không phụ thuộc múi giờ máy. Không lấy TripPlace ID làm Place ID khi thiếu dữ liệu. Nháp thuộc tài khoản khác/không rõ chủ bị ẩn ở thư viện thật; không tự xóa file cũ. Đổi phiên đăng nhập trong lúc lưu/chụp thì dừng trước bước upload tiếp theo.
- Flyway V18 thêm version, create request key/hash, media upload hash/public ID và index. Không reset database dev.

## Cách test giao diện

1. Backend dev chạy cổng **18081**, PostgreSQL hoạt động và Flyway V18 đã áp dụng. Dùng auth thật (`EXPO_PUBLIC_UI_PREVIEW` không bật `true`). Backend cần ba biến `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`; không đặt secret vào `EXPO_PUBLIC_*`. Web cho phép camera ở localhost/HTTPS; Android cần development build có các native module đã cài.
2. Đăng nhập A, mở Camera từ thanh đáy. Nếu chưa có chuyến đang đi, dùng bộ chọn để chọn chuyến/ngày hợp lệ. Chụp một ảnh hoặc chọn một ảnh trong máy, đợi lưu thành công. Kiểm tra số ảnh và mở tab Kỷ niệm/album đúng chuyến. Mở chi tiết chuyến đúng ngày và Home: ảnh xuất hiện ở phần phù hợp với trạng thái/ngày đó; Home đang đi chỉ lấy ảnh hôm nay. Reload vẫn có ảnh, không thêm bản sao.
3. Thử **Quick capture/Xem sau** khi chưa chọn chuyến: ảnh được giữ trong ứng dụng, chưa có trên server. Chọn chuyến/ngày/địa điểm rồi upload; mở lại album kiểm tra đúng liên kết. Với chuyến tương lai, ảnh chuẩn bị được gắn ngày chụp hôm nay, không giả ngày tương lai.
4. Tắt mạng trước khi chụp/chọn. Ảnh còn ở bản riêng/Xem sau và giao diện có lỗi upload; không tự upload lặp khi mạng trở lại. Bật mạng, bấm thử lại **cùng ảnh**. Chỉ có một ảnh và một memory. Thử bấm nhanh nhiều lần, reload rồi thử lại nháp. Không chụp ảnh mới để thay cho thao tác retry.
5. Từ chối quyền thư viện lưu ảnh, sau đó chụp: ứng dụng thông báo chưa lưu bản thư viện nhưng bản riêng vẫn còn, có thể upload. Thử từ chối quyền camera, chọn thư viện thay thế hoặc cấp lại quyền trong Settings. Chụp/đổi camera/flash cần nghiệm thu trên Android thật hoặc emulator có camera; export bundle không thay kiểm thử thiết bị.
6. Đổi múi giờ máy khác Việt Nam, xem lại ảnh: ngày/giờ không đổi. Thử ảnh gần 00:00 giờ Việt Nam. Đăng xuất A, đăng nhập B: không thấy ảnh nháp hoặc album riêng A. Đăng nhập lại A vẫn thấy dữ liệu của A.
7. Mở một ảnh đã upload, sửa ghi chú, tải lại để kiểm tra. Mở ở hai cửa sổ: A sửa trước; B lưu phiên bản cũ phải nhận thông báo tải lại, không ghi đè ghi chú mới.

## API để test bằng Postman

Base URL: `http://localhost:18081`. Mọi API dưới đây cần **Authorization → Bearer Token** của tài khoản đã đăng nhập. Không cần tạo Postman Collection.

### 1. Giới hạn upload

`GET http://localhost:18081/api/v1/media/limits`

`data` trả `{ "maxFileBytes": 10485760, "maxPixels": 25000000, "maxDimension": 12000 }`.

### 2. Tạo metadata kỷ niệm

`POST http://localhost:18081/api/v1/journal/memories`

Body → raw → JSON:

```json
{
  "clientRequestId": "a21bf7e3-032a-4833-92d3-c520fb5606b4",
  "tripId": "THAY_BANG_UUID_CHUYEN_CUA_BAN",
  "placeId": "THAY_BANG_PLACE_UUID_THUOC_CHUYEN",
  "note": "Buổi sáng ở Đà Lạt",
  "experiencedAt": "2026-11-07T03:00:00Z"
}
```

Bỏ `placeId` nếu chưa chọn địa điểm. Place UUID là ID địa điểm, không phải ID item timeline/TripPlace. Chọn thời điểm đã qua; `03:00Z` là 10:00 Việt Nam. Response 201, `data.id` dùng làm memoryId, `data.version` ban đầu là 0, `media` chưa có ảnh. Gửi lại nguyên body vẫn 201 với cùng ID. Giữ key nhưng sửa note phải trả 409 `MEMORY_004`; ảnh/kỷ niệm mới dùng UUID mới.

### 3. Upload ảnh vào memory

`POST http://localhost:18081/api/v1/media/upload?tripId=TRIP_UUID&memoryId=MEMORY_UUID`

Body → form-data: key **file**, loại **File**, chọn JPEG/PNG/GIF/WebP thật. Để Postman tự tạo Content-Type multipart và boundary, không đặt `application/json`. Response 201 có `data.mediaId` và `data.url`. Gửi lại cùng file vào cùng memory phải trả cùng mediaId. Cùng ảnh ở memory khác là một kỷ niệm khác.

Thử file giả đổi đuôi `.jpg` hoặc MIME không khớp: 400 `UPLOAD_003`. Cạnh/pixel quá lớn: 400 `UPLOAD_008`. File quá 10 MiB bị chặn ở servlet hoặc policy upload. Provider chưa cấu hình: 503 `UPLOAD_006`; provider upload thất bại: 500 `UPLOAD_004`, nháp vẫn giữ để thử lại. Không gửi file người dùng riêng tư khi test log/chia sẻ màn hình.

### 4. Đọc lại

- `GET http://localhost:18081/api/v1/journal/memories/detail?memoryId=MEMORY_UUID`
- `GET http://localhost:18081/api/v1/journal/memories?page=0&size=20&sort=experiencedAt,desc`
- `GET http://localhost:18081/api/v1/journal/memories?tripId=TRIP_UUID&date=2026-11-07&page=0&size=20`

Lọc ngày theo Việt Nam, chỉ dữ liệu tài khoản hiện tại. Dùng token B đọc/upload/sửa memory A phải bị từ chối. Token thiếu/hết hạn trả 401.

### 5. Sửa ghi chú

`PATCH http://localhost:18081/api/v1/journal/memories/MEMORY_UUID`

```json
{ "version": 0, "note": "Một khoảnh khắc đáng nhớ" }
```

Dùng `version` mới nhất lấy từ detail. Response 200 có ghi chú/version hiện tại. Gửi phiên bản cũ sau khi đã sửa phải trả 409 `MEMORY_003`.

## Còn lại của QA-6

- Cần nghiệm thu UI/camera/quyền/mất mạng trên thiết bị; web/Android bundle chỉ xác minh build.
- Chưa triển khai private/signed delivery: URL Cloudinary hiện vẫn là URL công khai cho người có link. Không coi kiểm tra quyền API là quyền truy cập file/CDN. Cần chốt trước production nếu album phải riêng tư.
- API xóa hiện xóa/ẩn bản ghi trong ứng dụng, chưa có quy trình bảo đảm dọn asset Cloudinary và bản cache CDN; cần xử lý và nghiệm thu ở đợt xóa ảnh. Asset có thể tồn tại nếu chuyến bị xóa giữa lúc provider upload và DB finalize.
- Chưa làm upload nền/offline queue. Upload nhiều file có thể thành công một phần; retry cùng nội dung chống trùng phần đã lưu, không phải giao dịch nguyên tử với provider.
- Thư viện frontend hiện tải hết các trang và membership của các chuyến để chọn album/địa điểm; cần phân trang/lazy-load trước nghiệm thu thư viện lớn. Không thay bằng cache/client-state chứa bản sao server.

Cloudinary xác nhận `overwrite=false` trả asset đã tồn tại thay vì ghi đè: [Upload API reference](https://cloudinary.com/documentation/image_upload_api_reference). Cơ chế này kết hợp unique key DB, không thay cho giao dịch phân tán hoặc quy trình xóa riêng tư.
