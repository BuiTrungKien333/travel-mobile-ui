# Tiến độ Travel Mobile UI

> Định hướng ngày 05/11/2026: đồ án môn học của sinh viên năm cuối, ưu tiên app chạy ổn, logic đúng, luồng rõ ràng và UI/UX mượt, đẹp. Xem [Kế hoạch hoàn thiện đồ án](MOBILE-MVP-IMPLEMENTATION-PLAN.md); production là giai đoạn sau. Các mốc preview tháng 10 bên dưới là lịch sử, không mô tả đầy đủ trạng thái API hiện tại.

## Phần 5 · Tạo chuyến và thử lại địa điểm còn thiếu · 05/11/2026

- P0-03 bắt đầu ở luồng tạo chuyến. Tách gọi API sang `create-trip-with-places.ts` và mutation hook; kiểm tra dữ liệu địa điểm trước khi tạo, giữ `clientRequestId` khi thử lại cùng thông tin.
- Nếu chuyến đã tạo nhưng thêm điểm lỗi, form chuyển sang màn phục hồi với tiến độ và tên các điểm còn thiếu; không tự đóng. Retry đọc `GET /trips/{id}/places` trước rồi chỉ thêm điểm chưa có. Đối chiếu provider ID hoặc tên/tọa độ cho điểm riêng, kể cả POST đã lưu nhưng mất response. Các điểm ban đầu ở Chưa xếp lịch.
- Chặn submit liên tiếp từ trước validation; nút Back và đóng form không làm mất phiên đang lưu. Có lựa chọn mở chuyến để thêm sau, kèm xác nhận rõ phần chưa lưu. Cache Home/Trips/chi tiết được làm mới cả khi chỉ lưu được một phần.
- 12 test mới cho API và form/hook đạt; cùng 7 test tạo chuyến hiện có là 19 test trọng tâm đạt. TypeScript và ESLint file sửa đạt. Full suite: **251 test, 232 đạt, 19 lỗi cũ**, tên các lỗi giống phần 4; lint toàn repo vẫn 51 lỗi/3 cảnh báo cũ. Test mới thay platform/HTTP bằng double, không phải kiểm thử thiết bị hay phiên backend đang chạy.
- Chưa đổi backend, schema DB hoặc dependency. Xem [checklist phần 5](api-contract-integration.md#trip-creation-recovery). Dừng để review/push; tiếp theo là luồng tìm/chọn/thêm điểm vào chuyến đã có, sau đó sửa lịch/lưu/hủy theo P0-03.

## Phần 4 · Route và tối ưu dùng thiết lập ngày · 05/11/2026

- V18 thêm tọa độ điểm xuất phát theo ngày; form tìm địa điểm qua API, chọn kết quả hoặc điểm có tọa độ trong ngày rồi lưu. Sửa chữ sẽ bỏ tọa độ cũ; nơi lưu trú là shortcut tìm kiếm, không tự được coi là vị trí xuất phát.
- Polyline, tổng quãng đường và chặng giữa các điểm dùng phương tiện đã chọn; cache phân biệt phương tiện. Có chặng từ điểm xuất phát và chặng quay về. Thiếu tọa độ không được bỏ qua địa điểm để vẽ một lộ trình khác; route bị tắt không vẽ lại polyline cũ từ cache.
- Optimizer đọc origin/giờ đi/phương tiện/quay về đã lưu, giữ ghim khi đi từ một điểm xuất phát riêng. Haversine vẫn là mô hình tối ưu quãng đường và ước tính thời gian; UI giải thích tính ước tính của đề xuất.
- Backend: 24 test unit và 29 test PostgreSQL đạt. Mobile: 41 test trọng tâm đạt, gồm response thật, route/cache theo phương tiện và không vẽ đường cũ. Chưa QA phần này trên điện thoại; restart backend để chạy V18, reload mobile và thử [checklist phần 4](api-contract-integration.md#day-routing-and-optimization).
- TypeScript và ESLint các file sửa đạt. Bộ test mobile đầy đủ có 239 test: 220 đạt, 19 lỗi cũ, không skip khi dùng fixture thật; danh sách lỗi không đổi so với phần 3. Lint toàn dự án còn 51 lỗi, 3 cảnh báo cũ.
- Không thêm dependency hoặc đổi cấu hình native. Phần tiếp theo theo kế hoạch là P0-03: hoàn thiện luồng tạo/thêm/sửa chuyến, lưu/hủy, phản hồi thao tác và các test của luồng API thật. Dừng để review/push trước khi tiếp tục.

## Phần 3 · Ghim điểm và giờ ghé · 05/11/2026

- Migration V17 thêm `itinerary_items.pinned`, mặc định false; lượt ghim bắt buộc có giờ đến. Ghim thuộc lượt ghé trong một ngày, không thuộc Place dùng chung.
- Mobile bật switch ghim trên thẻ lượt ghé và trong form; lưu/tải lại đầy đủ, chặn ghim khi chưa chọn ngày/giờ. Form giữ snapshot khi mở, chặn lưu lặp và đóng sheet lúc lưu; lỗi vẫn hiện trong sheet. Preview tối ưu có nhãn điểm ghim.
- Held–Karp nhận vị trí ghim và chỉ xét các đường đi giữ vị trí đó. Timeline giữ giờ hẹn, đợi nếu đến sớm, trả `409/TRIP_014` nếu kết quả đến muộn. Apply kiểm tra lại vị trí/giờ và giữ cờ ghim/ghi chú.
- Lưu lịch gửi `expectedUpdatedAt`; backend trả timestamp đã đọc lại từ PostgreSQL để tránh xung đột nhầm do nano/microsecond. Đổi ngày chuyến cũng làm cũ token của lịch đã mở.
- 21 test unit thuật toán/timeline/service và 26 test PostgreSQL đạt. Mobile: 34 test trọng tâm đạt, gồm contract bằng response thật. Chưa QA phần này trên điện thoại; checklist tại [API contract](api-contract-integration.md#pinned-visits).
- TypeScript và ESLint các file sửa đạt. Bộ test mobile đầy đủ có 232 test: 213 đạt, 19 lỗi, không skip khi dùng fixture thật; đối chiếu log cho thấy danh sách lỗi không đổi so với phần 2. Lint toàn dự án còn 51 lỗi, 3 cảnh báo cũ.
- Phần kế tiếp: tọa độ điểm xuất phát và dùng phương tiện/giờ đi/quay về trong route/optimizer. Dừng để người dùng review/push trước khi tiếp tục.

## Phần 2 · Lưu thiết lập ngày · 05/11/2026

- Backend bổ sung `PUT /api/v1/trips/{tripId}/days/{date}`; detail/create/update trả đủ thiết lập trong `days`. Dùng cột của migration V14, không thêm migration.
- Lưu điểm xuất phát dạng tên/địa chỉ, giờ đi, phương tiện, quay về và thời lượng điểm ghé trong một giao dịch. Giữ nguyên giờ đến, thứ tự, ghi chú và ngày khác; đổi khoảng ngày giữ thiết lập của ngày còn lại.
- Mobile đọc lại thiết lập, lưu cả ngày rỗng và đổi riêng phương tiện; đang lưu có phản hồi, chặn bấm lặp/đóng sheet, lỗi hiện trong sheet và giữ nội dung. Khi xung đột cần đóng/mở lại editor để lấy bản mới.
- TypeScript và ESLint các file sửa đạt; 29 test mobile về API/lịch trình đạt, gồm 7 test mới và kiểm tra response thật từ PostgreSQL. Backend: 28 test CRUD/mutation PostgreSQL, 1 test xuất contract và 4 test controller tối ưu đều đạt.
- Toàn bộ test mobile hiện có 227 test: 207 đạt, 19 lỗi ở các test preview/contract cũ, 1 skip khi chưa cung cấp fixture backend; test fixture đã chạy riêng và đạt. Lint toàn dự án còn 51 lỗi, 3 cảnh báo cũ; không coi bộ test tổng thể đã xanh.
- Package đang cài khớp bản Expo SDK đề xuất ở lượt kiểm tra này; không đổi dependency. Chưa xác nhận thao tác trên thiết bị. Restart backend trước khi thử mobile; checklist tại [API contract](api-contract-integration.md#day-settings).
- Phần tiếp theo của P0-02: lưu ghim, nối origin/phương tiện/giờ/quay về vào route và optimizer. Dừng để review/push trước khi làm tiếp.

## Phần 1 · Hợp nhất cấu hình Expo · 05/11/2026

- Dùng một `app.config.ts`, ghép Maps, Google, dev-client và scene support; giữ cấu hình camera/media từ `app.json`.
- Test cấu hình kiểm tra đường nạp thực tế của Expo thay vì gọi file `.js` không được sử dụng.
- Kiểm tra phần này: 5/5 test cấu hình đạt; TypeScript source, kiểm tra strict riêng config/test và ESLint hai file đã sửa đạt. Lint toàn dự án vẫn có 51 lỗi, 3 cảnh báo đã tồn tại trong source.
- Hướng dẫn build và checklist thiết bị: [DEVICE-SETUP.md](DEVICE-SETUP.md).
- Expo Doctor: 20/21; còn 9 package lệch phiên bản SDK đề xuất. Chưa xác nhận build/QA trên thiết bị; đây là bước hoàn thành phần code cấu hình của P0-01.
- Dừng sau phần này để người dùng review/push; đồng bộ dependency và thử native sẽ làm ở phần tiếp theo khi tiếp tục.

Cập nhật: **27/10/2026**. Phạm vi: frontend Home, danh sách/tạo/chi tiết chuyến đi và tìm chọn địa điểm. Ngày trong fixture Home vẫn là **21/10/2026** để tái hiện các trạng thái.

## Tìm và thêm địa điểm · 27/10/2026

- Cập nhật chi tiết địa điểm: khung bản đồ kéo giãn dùng chung với trip details, thông tin/ảnh/địa chỉ/giờ/giá bên dưới, nút chọn cố định. Header không có tiêu đề chữ, nút map compact 32px với vùng chạm 44px. TypeScript, 153 tests và export Android/Hermes đạt; thông tin vẫn là fixture.

- Chi tiết mở màn Stack riêng `/trip/add-places`, thay picker modal và bước hỏi thêm vào ngày/pool. Giao diện dùng chung ở bước tạo chuyến, giữ dữ liệu form khi quay lại.
- Tìm tên VI/EN, không dấu và địa chỉ; xem ghim/phóng tới vị trí, xác nhận, chọn nhiều điểm, chọn ngày/chờ xếp, lọc đã chọn, đặt ghim riêng có tên. Draft chỉ được lưu khi bấm thêm. Địa chỉ và tọa độ được giữ trong store.
- Bản đồ và dữ liệu tìm kiếm là preview cục bộ, có nhãn ngay trong UI; chưa kết nối Google Maps, API Places hoặc GPS. Không thêm dependency. Xem [PLACE-SEARCH.md](PLACE-SEARCH.md).
- TypeScript/no-unused, toàn bộ 149 tests và export Android/Hermes đạt. Công cụ trình duyệt lỗi môi trường nên chưa QA trực quan hoặc trên điện thoại; không chạy lint theo yêu cầu.

## Tìm địa chỉ cụ thể · 28/10/2026

- 29/10: hoàn thiện màn camera riêng từ nút giữa navigation: khung vuông, flash, zoom kỹ thuật số 1×/2×/3×, chọn ảnh hệ thống, camera trước/sau, xem trước/xác nhận, counter ảnh chuyến và lối tắt. Ba module Expo camera/image-picker/image-manipulator mới; cần development build mới. Ảnh vẫn thuộc phiên preview, chưa backend/persistence. Có native-module guard cho build cũ. Xem [CAMERA.md](CAMERA.md).

- 29/10: modal Điểm xuất phát đổi thành Sửa lịch trình trong ngày. Tìm tên/địa chỉ mẫu không dấu, nhập địa chỉ riêng hoặc chọn nhanh từ các điểm trong ngày. Có danh sách thời lượng 30/60/90 phút/Khác (5–480), tổng thời gian trực tiếp. Lưu origin + thời lượng bằng một mutation nguyên tử, giữ giờ đến/thứ tự/phương tiện. TypeScript và 164 tests đạt; chưa QA trên điện thoại.

- Chi tiết điểm trên timeline: thêm phân loại/trạng thái mẫu, chip tiện ích/lưu ý, card lịch ghé thăm có switch ghim và nút Sửa mở modal riêng. Lưu giữ người dùng tại màn chi tiết, card tự cập nhật. Bổ sung giới thiệu và dải ảnh địa điểm/khu vực từ asset có sẵn; chưa có API thông tin/mở cửa.

- Chi tiết địa điểm từ timeline chuyển sang route Stack riêng, dùng lại giao diện/bản đồ của thêm địa điểm. Có form giờ/thời lượng/ghi chú/ghim, lưu về timeline, bỏ điểm có xác nhận; trạng thái Đã ghé đồng bộ store, footer Chỉ đường mở rộng bản đồ + Đã ghé. Chuyến hủy chỉ xem, check-in tương lai/pool tạm khóa. Xem [PLACE-SEARCH.md](PLACE-SEARCH.md).

- Thêm kết quả địa chỉ với màn “Vị trí đã chọn”: địa chỉ, tên riêng bắt buộc, thông tin chưa có dữ liệu. Dùng lại bản đồ kéo mở rộng, lấy vùng riêng cho địa chỉ. Có fixture Quang Trung/Gò Vấp để thử tìm kiếm; chưa kết nối Google Maps. Xem [PLACE-SEARCH.md](PLACE-SEARCH.md).

## Chi tiết chuyến đi · 21/10/2026

- Planning mới nhất: sơ đồ 35%/80%, dải ngày gọn 96px và thêm ngày bằng `+`; cuộn xuống ghim Back/tên/sửa/mở bản đồ trên dải ngày, vuốt nhanh ngược lên hoặc bấm mở lại trả về 35%. Dùng chung một Animated.FlatList; **112 tests**, TS/no-unused, Android/Hermes export đạt; đã thử web, native gesture chưa QA.

- Hoàn thành MVP frontend và điều chỉnh ba mode theo ngày: Planning / Live / Recap. AppBar gọn không cover; date strip + tab Chưa xếp lịch; sơ đồ ~36% phía trên và FlatList timeline phía dưới. Chạm số cuộn/highlight đúng stop. Recap ưu tiên album, Live ưu tiên chỉ đường/camera.
- Quản lý lịch: pool chưa xếp, thêm/sửa/chuyển ngày/gỡ, ghim, drag + mũi tên sắp xếp, preview thứ tự mẫu, áp dụng và hoàn tác. Chỉnh thông tin/ngày/lưu trú/ngân sách/sở thích/ghi chú và xóa có xác nhận; check-in/ảnh dùng chung dữ liệu Home.
- Route group `(workspace)` giữ một session store cho tabs và details trong auth guard; URL tabs không đổi. Địa điểm chọn khi tạo chuyến chuyển vào pool, không tự gán ngày 1/giờ giả.
- Backlog bao gồm pool và stop thiếu giờ trong ngày; reorder chỉ xử lý stop có giờ rồi ghép lại, giữ pins/giờ/backlog. Timeline có số khớp sơ đồ và khung giờ tham quan; share Recap là bản tóm tắt văn bản, không phải link công khai.
- TypeScript và **104/104 tests** đạt; export Android/Hermes + Web đạt. Đã kiểm tra luồng marker/backlog/xếp lịch, Live check-in/camera mẫu và Recap album trên web; native gesture/keyboard/a11y/share/performance chưa QA. Không lint, không dependency mới.
- Bản đồ, tối ưu và thời tiết vẫn thuộc preview; chưa nối backend, chưa có lưu qua reload hoặc camera thật. Xem [thiết kế và kết quả triển khai](TRIP-DETAIL-DESIGN.md).

## Rà soát Trips và đề xuất màn chi tiết · 21/10/2026

- Người dùng đã hoàn thiện UI danh sách/tạo chuyến trong `src/features/trip`; đã review code và chạy TypeScript + 74 tests hiện có, đều đạt.
- Đã sửa các phát hiện trong lượt tiếp theo: picker dùng session riêng và commit sau đóng; đổi thành phố bỏ địa điểm cũ; list/plan dùng một scoped store, không cắt bốn mục; ngân sách/sở thích được lưu và đọc lại; form RHF + Zod và copy VI/EN. Chi tiết trong [TRIPS-REVIEW.md](TRIPS-REVIEW.md).
- Bổ sung 13 regression tests, toàn bộ suite **87/87 đạt**, TypeScript và export Android/Hermes + Web đạt. Chưa QA trên điện thoại. Không chạy lint hay thêm dependency.
- Header tạo chuyến tăng khoảng đệm trên thành **safe area + 32px** theo yêu cầu; vẫn giữ khoảng đệm bên dưới và bố cục form.
- Đã đề xuất màn chi tiết lấy timeline từng ngày làm trung tâm, bản đồ là cách xem thứ hai, địa điểm chưa xếp và tối ưu có preview/undo: [TRIP-DETAIL-DESIGN.md](TRIP-DETAIL-DESIGN.md). Đề xuất này đã được hiện thực ở mức MVP frontend trong lượt tiếp theo; chưa sửa planning backend.

## Safe area dùng chung · 21/10/2026

- Khởi tạo provider với số đo cửa sổ ban đầu; chuyển screen frames và top-inset consumers sang `ScreenSafeArea`/`useScreenInsets` dùng chung.
- Lề trên dựa safe area và status bar hệ điều hành trên Android, không gán một chiều cao chung cho mọi điện thoại hoặc cộng đôi status bar/inset. Giữ khoảng đệm nội dung theo theme.
- Bao phủ Home, Trips, Memories, Profile, auth, camera mẫu và các toolbar/panel toàn màn hình. Bỏ mốc top 20px trong modal tạo chuyến, dùng inset + spacing theme.
- Thêm 7 tests cho inset bằng 0, notch, tránh lề đôi, provider đã dịch xuống và iOS/web. Toàn bộ suite **74/74 đạt**, TypeScript và export Android/Hermes đạt; không chạy lint. Cần kiểm tra layout thực tế trên Android/iOS vì ADB chưa có thiết bị.

## Khắc phục native photo module · 21/10/2026

- Home không còn import eager `expo-media-library`/`expo-sharing`/`expo-file-system`; chỉ kiểm tra/tải khi dùng chức năng ảnh. Runtime thiếu module nhận lỗi có nội dung VI/EN, không crash Home hoặc giả báo thành công.
- Giữ API SDK 57, không downgrade sang legacy và không nâng dependency. Hướng dẫn build/cài lại ở [HOME-PREVIEW.md](HOME-PREVIEW.md).
- Thêm 8 regression tests cho lỗi module thiếu và hành vi save/share/permission. Toàn bộ suite hiện tại **67/67 đạt**, TypeScript và export Android/Hermes đạt. Không chạy lint. Chưa thử native trên điện thoại vì ADB chưa có thiết bị kết nối.

## Hiện trạng

| Hạng mục             | Trạng thái                                                                        | Phần còn lại                                                                                   |
| -------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Nền tảng UI          | Expo SDK 57, TypeScript strict, React Compiler, theme sáng, VI/EN mặc định VI     | Kiểm tra trên các kích thước/thiết bị mục tiêu                                                 |
| Auth                 | Đã có giao diện và code tích hợp; có tài liệu email/password, magic link, Google  | Không rà soát lại backend/auth trong lần chốt Home này; cấu hình môi trường theo tài liệu auth |
| Home · Người mới     | Hoàn thành UI và tương tác mẫu                                                    | API tạo chuyến/lập kế hoạch khi backend sẵn sàng                                               |
| Home · Sắp khởi hành | Hoàn thành UI, forecast/chọn ngày, checklist, nhắc hoàn thiện, album gần đây      | Forecast thật, dữ liệu chuyến, lưu checklist                                                   |
| Home · Đang đi       | Hoàn thành UI, timeline/check-in, thời tiết, nhật ký/ảnh mẫu                      | Dữ liệu thực tế, camera thật, lưu check-in/nhật ký                                             |
| Home · Đã đi         | Hoàn thành UI, dấu ấn và album gần đây                                            | Thống kê/lịch sử/ảnh từ backend                                                                |
| Header / navigation  | Dùng chung logo, nút thông báo, thanh kính và camera giữa                         | API thông báo; nội dung đầy đủ cho các tab ngoài Home                                          |
| Trình xem ảnh        | Có zoom/pan/paging/drag dismiss, toolbar, share/save và xóa preview               | QA gesture, quyền media, trợ năng, hiệu năng trên máy thật                                     |
| Rà soát Home         | Đã dọn cấu trúc, xử lý lỗi thực tế, bổ sung regression tests và cập nhật tài liệu | Lint chưa chạy theo yêu cầu; native QA còn chờ                                                 |

## Thay đổi trong lần rà soát

- Tách album và khung kính dùng chung khỏi các component dành riêng cho chuyến đang đi.
- Tách store preview, types và provider; thêm tests cho bốn scenario, draft, check-in, ảnh/ghi chú và vali.
- Bỏ modal/nhánh copy không còn sử dụng; bỏ bản ghi kỷ niệm tự phát sinh ngoài store.
- Chặn mở thumbnail lỗi; bổ sung điều khiển bàn phím cho viewer web.
- Dùng chung lifecycle motion theo focus/AppState/Reduced Motion và panel preview; không thêm memo/dependency đại trà.
- Bundle icon bản đồ WebP khoảng 19 KB thay PNG khoảng 1,53 MB, giữ PNG nguồn.
- Import đúng bốn font Roboto đang dùng thay vì kéo cả bộ font vào bundle native.

## Chốt UI sau rà soát và bàn giao

- Người mới: bỏ heading **CHUYẾN ĐI CỦA BẠN**; bỏ mảng glow xanh góc trên phải card **VÍ DỤ MINH HỌA**, giữ weather widget.
- Home hiện được chốt frontend bốn trạng thái; chưa có yêu cầu xây module tiếp theo.
- Đã xuất [ngữ cảnh bàn giao](AGENT-HANDOFF.md) và [lời nhắn mở chat mới](NEXT-CHAT-PROMPT.md), gồm quyết định UI, vị trí code, ranh giới mock/auth và giới hạn kiểm tra. Lần bàn giao chỉ sửa tài liệu, không chạy lại tests/bundle.

## Điều kiện trước khi tích hợp và phát hành

1. Chốt phần Home ở mức **UI với dữ liệu mẫu**; có thể chuyển sang module UI tiếp theo.
2. Thử trên Android/iOS: màn hình nhỏ, font lớn, safe area/bàn phím, screen reader, gesture ảnh, cấp/từ chối quyền và share/save; đo hiệu năng trên release build.
3. Khi backend sẵn sàng, nối API từng luồng và bổ sung loading/error/retry theo hợp đồng thật. Chức năng planning chưa sửa trong giai đoạn này.
4. Tắt `UI_PREVIEW_ENABLED` khi quay lại tích hợp auth. Sau đó thay dữ liệu Home mock bằng query hooks; hai công việc độc lập.

Đây là mốc hoàn thành frontend preview, chưa phải chứng nhận sẵn sàng production cho toàn bộ ứng dụng.

## Tài liệu

- [Hướng dẫn Home preview](HOME-PREVIEW.md)
- [Báo cáo rà soát Home và bằng chứng kiểm tra](HOME-REVIEW.md)
- [Auth integration](auth-integration.md)
- [Google Sign-In](google-auth.md)
