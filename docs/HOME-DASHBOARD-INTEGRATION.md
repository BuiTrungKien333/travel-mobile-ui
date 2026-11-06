# Home với dữ liệu thật · 07/11/2026

## Chọn đúng một chuyến

Backend chọn trên toàn bộ chuyến của tài khoản, không lấy chuyến từ trang đầu danh sách. Loại chuyến đã xóa hoặc CANCELLED.

| Ưu tiên | Trạng thái Home | Điều kiện / bố cục |
| --- | --- | --- |
| 1 | LIVE — Đang diễn ra | Ngày hiện tại nằm trong khoảng bắt đầu–kết thúc; tái sử dụng OngoingHomeScreen |
| 2 | UPCOMING — Sắp khởi hành | Còn 1–7 ngày; tái sử dụng UpcomingTripCard |
| 3 | PLANNING — Đang lên kế hoạch | Còn hơn 7 ngày hoặc chưa có khoảng ngày hợp lệ; cùng UpcomingTripCard, đổi nhãn/copy |
| 4 | RETURNING — Đã từng đi | Chỉ còn chuyến đã kết thúc; lời mời tạo chuyến tiếp theo + dấu ấn + ảnh gần đây |
| 5 | NEW — Người dùng mới | Không có chuyến hợp lệ; giữ nguyên thiết kế onboarding và lịch trình mẫu có ghi rõ là ví dụ |

Trong **cùng trạng thái**, chọn `created_at DESC, id DESC`: chuyến mới tạo nhất thắng, không phải chuyến vừa sửa hoặc chuyến khởi hành gần nhất. Trạng thái COMPLETED được coi là đã kết thúc theo TripCalendar hiện tại. Giữ mode API Trip PLANNING/LIVE/RECAP/CANCELLED; không thêm enum database UPCOMING.

Ngày được đánh giá một lần bằng Clock backend theo `Asia/Ho_Chi_Minh`, cùng thời điểm cho lựa chọn và chi tiết chuyến. Home tự làm mới vào nửa đêm Việt Nam; có kéo xuống để tải lại và trạng thái loading/error riêng, không biến lỗi mạng thành người dùng mới.

## API

`GET http://localhost:18081/api/v1/home/dashboard`

Header: `Authorization: Bearer <accessToken>`. Không có body. Trả ApiResponse `{success:true,data:{...}}`.

| Field trong data | Nội dung |
| --- | --- |
| state | NEW / PLANNING / UPCOMING / LIVE / RETURNING |
| selectedTrip | TripResponses.Read đã dùng cho GET chi tiết, hoặc null khi NEW |
| dayIndex | Chỉ số ngày LIVE từ 0, ngoài LIVE là null |
| todayStopCount | Số điểm đã được xếp vào lịch hôm nay, không phải số membership Chờ xếp lịch |
| nextStop | Điểm chưa ghé tiếp theo trong itinerary hiện tại, hoặc null; id=TripPlace UUID, placeId=Place UUID, itineraryItemId riêng biệt |
| firstEmptyDay | Ngày đầu tiên chưa có điểm được xếp lịch, tính từ 1, hoặc null |
| footprint | provinces/places đếm Place duy nhất có Memory thật thuộc tài khoản; hasHistory dựa trên chuyến đã kết thúc. Không đếm điểm mới lưu như đã khám phá |
| recentPhotos | Tối đa 6 ảnh media thật, bao gồm Media UUID và Memory UUID riêng biệt; LIVE chỉ lấy ảnh hôm nay của chuyến được chọn, các trạng thái khác lấy ảnh gần đây của tài khoản |
| context | serverTime và evaluatedDate dùng để phân loại/hiển thị |

Query owner-scoped và snapshot read-only; không gọi AI, bản đồ hay dịch vụ thời tiết trong request này. Không thêm migration. API kiểm quyền trên server; frontend kiểm response bằng Zod. Không đưa dữ liệu query vào Zustand preview.

## Hành động và cache

- Tạo/sửa/xóa chuyến làm mới Home; sửa ngày có thể đổi trạng thái hoặc chuyến được chọn.
- Đã ghé dùng PUT TripPlace hiện có và Place UUID; sau server thành công mới hiện lời mời check-in và tải lại điểm tiếp theo. Giới hạn invalidation vào tài khoản/chuyến bị ảnh hưởng.
- Chỉ đường mở chi tiết đúng chuyến/ngày và yêu cầu mở rộng bản đồ hiện có. Đây chưa phải Google Maps/Mapbox navigation thật.
- Camera trung tâm đọc lựa chọn LIVE của Home theo account cache; không lấy chuyến mock. Khi chưa có lựa chọn LIVE, mở luồng chọn chuyến quick capture hiện có.
- Album Home giữ viewer/zoom/share/download hiện có; xóa ảnh dùng Media UUID, không giả Memory.version. Ảnh local chỉ được ghép khi đúng tài khoản và đúng chuyến; không đưa ảnh fixture vào tài khoản thật.

## Giới hạn còn lại

- Home và chi tiết chuyến dùng `GET /api/v1/trips/{tripId}/weather` (Bearer token, tham số `date=YYYY-MM-DD` tùy chọn, không có body). API kiểm quyền, lấy tọa độ của điểm theo lịch, điểm đã lưu hoặc catalog đã duyệt theo tỉnh. Dự báo theo ngày/giờ và lời khuyên hành lý dùng dữ liệu Open-Meteo. Một lần tải dự báo nhiều ngày dùng cùng khu vực được ghi trong modal. Khoảng hỗ trợ gồm hôm nay và 14 ngày tiếp theo theo giờ Việt Nam. Nếu nhà cung cấp lỗi, UI hiển thị thử lại. Ngày quá xa/quá khứ hoặc thiếu vị trí có thông báo riêng. UV và điểm thuận lợi chỉ có trong preview vì API chưa cung cấp.
- QA-5 lịch trình từng ngày chưa hoàn tất. Địa điểm thêm ở QA-4 còn Chờ xếp lịch sẽ không tự trở thành điểm đến hôm nay. Nếu chưa có lịch, LIVE hiển thị lời mời lập lịch thay vì điểm mẫu.
- QA-6 Camera/Memory chưa nghiệm thu. Album MemoryV2 hiện yêu cầu `version`/PATCH note trong khi MemoryResponse/controller backend hiện chưa cung cấp; cần xử lý khi làm QA-6. Projection ảnh Home không phụ thuộc contract thiếu này; không coi việc mở được Home là đã nghiệm thu toàn bộ màn Kỷ niệm/upload.
- Cover chuyến chưa có ảnh dùng ảnh WebP có sẵn trong `assets/images/examples`, chọn ổn định theo Trip ID qua helper `getTripCoverImage`; ảnh bìa thật được ưu tiên, không sinh ảnh hoặc lưu fallback vào DB. Đây không phải ảnh từ provider của địa điểm.
- Chưa xác nhận visual QA trên web/Android/iOS trong lượt này; không thay dependency, cấu hình native hoặc bottom navigation.

## Batch kiểm tra UI

Dùng ngày hiện tại backend là T, tải lại Home sau mỗi thay đổi. Có thể lấy `context.evaluatedDate` từ API; không phụ thuộc ngày fixture 21/10/2026.

1. Tài khoản chưa có chuyến: đúng onboarding đã thiết kế, không xuất hiện card Đà Lạt mock như chuyến thật.
2. Chỉ có chuyến T+8 trở đi: cùng thiết kế card chuẩn bị, nhãn **Đang lên kế hoạch**. Sửa thành T+7: nhãn **Sắp khởi hành**.
3. Tạo hai chuyến cùng nhóm: chỉ một card, chuyến tạo sau được chọn. Sửa ghi chú chuyến cũ không được làm nó thắng chuyến mới.
4. Có cả LIVE và tương lai: LIVE được ưu tiên. Có UPCOMING và PLANNING: UPCOMING được ưu tiên. Xóa chuyến đang hiển thị: Home chuyển sang lựa chọn hợp lệ tiếp theo.
5. Chỉ còn chuyến quá khứ: thiết kế Đã từng đi, dấu ấn/ảnh thật hoặc trạng thái rỗng; không tự tạo 6 ảnh mẫu.
6. Mất mạng/API lỗi: báo lỗi và thử lại; không đổi thành onboarding. Đăng xuất/đổi tài khoản: không lẫn chuyến, ảnh, thống kê.
7. Khi có itinerary hôm nay: Đã ghé cập nhật server, tải lại vẫn giữ, điểm tiếp theo tiến lên. Camera/chỉ đường mở đúng chuyến. Nếu chưa có itinerary, kiểm thử thao tác này sau QA-5.

## Bằng chứng

- Backend toàn bộ **433/433** tests, Testcontainers PostgreSQL riêng; bao gồm 9 Home integration tests cho quyền sở hữu, chọn toàn danh sách, cùng trạng thái, ngày Việt Nam, điểm tiếp theo, ngày trống và ảnh/thống kê.
- Mobile toàn bộ **304/304** tests; TypeScript `--noEmit --noUnusedLocals --noUnusedParameters` và hai repo diff-check đạt. Không chạy lint theo yêu cầu.
- Dev backend 18081 đã nạp API: health 200, Home anonymous 401, CORS frontend 8082 đạt, OpenAPI có route mới. Counts dev trước/sau: 3 trips, 8 places, 3 memberships, 0 memories, 0 itinerary items; không seed hoặc thay dữ liệu để ép Home.
- Logs local: backend `.git/qa-preflight/home-full-tests.log`, `.git/qa-preflight/home-dev-backend.log`; mobile `.expo/home-final-full-tests.log`, `.expo/home-final-types.log`.

Trạng thái: triển khai và automated checks hoàn tất; chờ người dùng kiểm tra batch UI. QA-4 catalog đã được người dùng test xong; QA-5/QA-6 vẫn riêng, chưa gán hoàn tất.
