# QA-5C — Chuyến đang diễn ra và địa điểm chưa xếp lịch

Cập nhật 07/11/2026. Phạm vi: Home LIVE, chi tiết LIVE, ảnh mẫu và khôi phục tab Chưa xếp lịch sau khi đổi ngày chuyến. Không tích hợp AI hoặc thay thuật toán tối ưu hiện có.

## Giao diện và dữ liệu

- Đối chiếu bản UI tại `fe9473b2` và các component preview đang giữ thiết kế đã chốt: Home giữ header logo, badge LIVE, thời tiết dạng pill, card điểm tiếp theo và Nhật ký hôm nay; không thêm lại Hành trình hôm nay. Chi tiết giữ bản đồ kéo 35%/80%, dải ngày, timeline và cặp Chỉ đường/Đã ghé có khoảng an toàn phía dưới; không đưa lại hero điểm đến lặp phía trên timeline.
- Home LIVE bổ sung ảnh bìa gọn dưới header. Ưu tiên `coverImageUrl` từ backend; thiếu hoặc ảnh lỗi thì lấy ảnh local ổn định theo Trip ID. Backend trước đây luôn trả null dù có `trips.cover_image`, nay trả đúng giá trị ở detail/list/Home. Không ghi fallback vào DB. Thư mục ảnh người dùng hiện có là `assets/images/examples` (chưa có thư mục samples); dùng lại 14 ảnh có sẵn, không sinh ảnh.
- Thumbnail điểm tiếp theo không còn phụ thuộc ID mock. ID thật lấy ảnh mẫu ổn định theo Place ID; metadata, tên, giờ và địa chỉ vẫn từ API, không bịa giờ mở cửa/giá vé/tuyến đường.
- Timeline thật có checkbox tại node, tick xanh lá và viền active cho điểm tiếp theo. Chỉ mở thao tác đã ghé cho ngày hôm nay hoặc trước đó trong LIVE; chặn thao tác lặp khi đang ghi. Gửi Place UUID, không nhầm TripPlace UUID hoặc itinerary item UUID. API vẫn dùng trạng thái visited cấp **địa điểm trong chuyến**, chưa phải nhật ký từng lần ghé nếu cùng địa điểm xuất hiện nhiều ngày. Lượt này giữ quy tắc đó; không bổ sung schema per-visit.
- Home đánh dấu đã ghé làm mới dashboard/list/detail/membership/itinerary liên quan. Prompt chụp ảnh truyền đúng membership vừa ghé vào Camera; không tự gắn ảnh vào điểm tiếp theo hoặc điểm đầu tiên. Nhật ký LIVE mở album chuyến hiện tại; Dấu ấn/nhật ký tổng ở các trạng thái khác vẫn mở thư viện chung.
- Chỉ đường mở rộng Mapbox giống thao tác kéo xuống và focus điểm tiếp theo. Đây là xem tuyến đường, chưa phải navigation turn-by-turn hoặc theo dõi GPS liên tục. Thiếu tọa độ/dữ liệu không cho chạy thao tác chỉ đường sai.
- Chi tiết tự lên lịch refetch qua nửa đêm Việt Nam từ context server để trạng thái/ngày mặc định không bị giữ mãi khi màn hình mở lâu. Home dùng cùng hàm tính mốc ngày, không polling liên tục.

## Chưa xếp lịch

Tab **Chưa xếp lịch (N)** được đưa lại cuối dải ngày ở giao diện thật và preview. Dùng underline teal như các ngày, không thêm card bo góc riêng. Có thể chọn khi N=0 để thấy trạng thái trống; N cập nhật từ membership chưa có trong lịch hiện tại.

Đổi khoảng ngày giữ các ngày còn trong phạm vi, chuyển lần ghé ngoài phạm vi khỏi lịch đang hoạt động, vẫn giữ địa điểm trong chuyến. Backend đã có cơ chế này và xác nhận ảnh hưởng trước khi lưu. Tab mới cho thấy lại các địa điểm bị đưa ra ngoài lịch; chạm một điểm để chọn ngày còn được phép sửa, giờ và thời lượng rồi lưu qua API lịch ngày có phiên bản. Không thêm lại membership hoặc xóa metadata địa điểm.

## Checklist giao diện

1. Mở một chuyến có startDate ≤ hôm nay Việt Nam ≤ endDate và chưa COMPLETED/CANCELLED. Home hiện LIVE đúng chuyến/ngày. Ảnh bìa có sẵn được ưu tiên, thiếu dùng local và không đổi khi reload. Header logo, thời tiết và nhật ký giữ thiết kế chung.
2. Trên Home, bấm Chỉ đường: mở chi tiết đúng chuyến/ngày, bản đồ mở rộng, điểm tiếp theo được focus. Kéo thu/mở lại bản đồ, cuộn timeline, kiểm tra dải ngày và thanh dưới không dính system bar.
3. Tick node hoặc bấm Đã ghé ở đáy. Chờ API hoàn tất: điểm được tick xanh, điểm chưa ghé kế tiếp sáng lên. Quay về Home thấy điểm tiếp theo đồng nhất; reload vẫn giữ. Thử bỏ tick tại node, bấm nhanh nhiều lần và mất mạng; lỗi không được báo thành công. Ngày tương lai trong LIVE không có thao tác đã ghé.
4. Tại Home đánh dấu điểm tiếp theo rồi bấm prompt chụp ảnh. Camera chọn đúng điểm vừa ghé. Chụp/lưu ảnh và mở Nhật ký để kiểm tra album chuyến; không chuyển sang một chuyến khác.
5. Sửa chuyến, thu ngắn/dịch ngày để một ngày đang có điểm bị ra ngoài khoảng mới. Xác nhận ảnh hưởng. Mở Chưa xếp lịch: thấy các điểm được giữ, số lượng đúng và metadata không mất. Chọn một điểm, xếp vào ngày hợp lệ rồi lưu. Điểm chuyển sang ngày đó, số đếm giảm; reload kiểm tra.
6. Thử Chưa xếp lịch trống, ngày chưa có điểm, hết điểm chưa ghé, chuyến kết thúc/hủy và API lỗi. Giữ trạng thái trống/đọc hợp lý, không chèn dữ liệu mock vào API thật. Thử hai cửa sổ sửa lịch bằng phiên bản cũ: server yêu cầu tải lại.
7. Thử Android với font scaling và màn hình nhỏ: nút Chỉ đường/Đã ghé không vỡ chữ hoặc dính mép dưới. Vuốt/kéo timeline, map expansion và ảnh thực tế cần nghiệm thu trực tiếp; bundle Android không thay kiểm thử thiết bị.

## API/Postman

Base URL dev `http://localhost:18081`, Authorization Bearer Token cho mọi API dưới đây. Không tạo collection mới.

- `GET /api/v1/home/dashboard`: state LIVE, dayIndex, selectedTrip, nextStop, recentPhotos và context server.
- `GET /api/v1/trips/TRIP_UUID`: days, mode, version, coverImageUrl, readiness.unscheduledCount.
- `GET /api/v1/trips/TRIP_UUID/places`: toàn bộ membership giữ trong chuyến, gồm các điểm chưa xếp lịch.
- `GET /api/v1/trips/TRIP_UUID/itinerary`: lịch hiện tại theo ngày; so membership với lịch để xác định backlog.
- `PUT /api/v1/trips/TRIP_UUID/places/PLACE_UUID`, JSON `{ "visited": true }`; bỏ đánh dấu dùng false. Token không phải chủ chuyến bị từ chối; chuyến hủy không được ghi.
- `GET /api/v1/trips/TRIP_UUID/itinerary/days/YYYY-MM-DD/route`: tuyến đường, km/phút khi provider sẵn sàng; không dùng khoảng cách mẫu.
- `PUT /api/v1/trips/TRIP_UUID/itinerary/days/YYYY-MM-DD`: xếp lại ngày, gồm `expectedTripVersion`, `expectedUpdatedAt` từ GET mới nhất và toàn bộ stops của ngày. Xem body/giới hạn ở [lịch ngày](DAY-SCHEDULE-INTEGRATION.md); giữ nguyên các điểm khác trong ngày khi thêm một điểm từ backlog.
- Sửa ngày: `PATCH /api/v1/trips/TRIP_UUID` với version/startDate/endDate và `acknowledgeDateImpact: true` sau khi xem preview ảnh hưởng. Xem [Trip CRUD](TRIP-API-INTEGRATION.md). Không reset DB để đưa ảnh/địa điểm sang ngày khác.

## Kiểm tra thực hiện

- Backend: 65 ca Home/Trip CRUD/mutations/places integration đạt, dùng PostgreSQL Testcontainers và Flyway. Có ca mới cover ở Home/detail/list, visit/unvisit cập nhật nextStop và từ chối ghi chuyến người khác/hủy. Ca đổi ngày giữ metadata và đưa điểm ra pool đã có trong bộ regression.
- Mobile: 66 ca liên quan đạt; có ca mới màn LIVE thật, focus/mở map, node visit gửi Place UUID, backlog mở được sheet và lưu lại đúng ngày/phiên bản, camera nhận đúng điểm vừa ghé, ảnh fallback và refresh ngày server. TypeScript strict/no-unused và export web/Android đạt.
- Chưa nghiệm thu thao tác Android/iOS thực tế trong lượt này. Không tuyên bố toàn bộ Live Trip production-ready; GPS/turn-by-turn, visited theo từng lần ghé và các giới hạn Memory/cloud trước đây vẫn giữ phạm vi riêng.
