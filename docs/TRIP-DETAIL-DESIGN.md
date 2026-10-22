# Đề xuất thiết kế · Chi tiết chuyến đi

## Modal sắp xếp, tùy chọn và sửa chuyến đi · 22/10/2026

- Sắp xếp: số thứ tự thay tay nắm, kéo trực tiếp trên số hoặc dùng nút lên/xuống 44px; tên và giờ được phân cấp rõ trên hàng kính mờ viền mint. Giờ hiển thị theo vị trí sẽ lưu, không đi theo địa điểm đang kéo. Có Đặt lại, chỉ bật Áp dụng khi đổi thứ tự; giữ giới hạn điểm ghim và Reduce Motion. Đã thử kéo, nút lên/xuống, Đặt lại, áp dụng và Hoàn tác trên web 390px.
- Menu chỉ có Sửa chuyến đi, Nhật ký chuyến đi, Xóa chuyến đi (chữ/viền đỏ). Alert xóa Có/Không (VI), Yes/No (EN) nằm chính giữa màn hình, dùng `TripDeleteAlert` chung native/web để đồng bộ Liquid Glass: GlassBackdrop sẵn có, kính mint/xanh nhạt, viền bắt sáng và bóng nhẹ; hai nút kính, Có giữ màu đỏ. Focus mặc định nút Không, Escape/Không hủy, chỉ Có mới gọi callback xóa. Không dùng bước xác nhận dạng sheet hay window.confirm. Đã xác nhận alert xuất hiện và hủy trên web 390px; native chưa QA thiết bị thật.
- `TripEditForm` theo bố cục tạo chuyến: điểm đến, bộ chọn khoảng ngày dùng chung, tên chuyến và accordion ngân sách có phân cách/VND, sở thích, nơi lưu trú, ghi chú. RHF/Zod sở hữu dữ liệu; sửa điểm đến giữ địa điểm đã lưu. Lưu metadata và ngày bằng một mutation; điểm của ngày bị bỏ chuyển về Chưa xếp lịch, lỗi ngày không lưu dở dang. Xóa Undo lịch trình cũ sau khi lưu thông tin để tránh khôi phục nhầm khoảng ngày trước chỉnh sửa.
- Riêng modal sửa dùng safe area trên + 32px và giới hạn chiều cao tương ứng; nội dung cuộn bên trong. Đã xác nhận khoảng đệm 32px trên web, lưu tên/ngân sách/ngày và giữ form khi mở bộ chọn ngày. Chưa kiểm tra bàn phím/safe area trên thiết bị thật.
- TypeScript/no-unused và **129/129 tests** đạt; thêm kiểm tra lưu nguyên tử thông tin/ngày, giữ địa điểm, dữ liệu cũ và lịch trình khi chỉ sửa metadata. Không dependency mới, không lint.

## Tìm kiếm và chọn giờ xuất phát · 22/10/2026

- Bỏ outline mặc định trên web và gạch chân mặc định Android của `AppInput`; giữ viền focus teal của app. Thêm trailing action tùy chọn để form xuất phát hiện nút × khi có nội dung; xóa cả nội dung/gợi ý và đưa focus lại ô tìm kiếm.
- Giờ xuất phát dùng `@expo/ui/community/datetime-picker` đã có trong dự án: Android mở đồng hồ hệ thống dạng 24 giờ, iOS dùng bánh cuộn với Hủy/Xong. Hủy không lưu bản chọn tạm. Web dùng hai danh sách giờ/phút, không nhập chuỗi tự do. Lưu HH:mm theo giờ địa phương, không chuyển UTC; không đổi phương tiện hay dữ liệu khác của ngày.
- Đã kiểm tra web 390px: không còn viền dư khi focus, × xóa và đưa focus lại ô tìm kiếm, chọn/lưu 07:05 cập nhật timeline, Hoàn tác khôi phục dữ liệu mẫu. TypeScript/no-unused, **127/127 tests** và Android/Hermes export đạt. Không thêm dependency, không chạy lint; chưa xác nhận bộ chọn native trên thiết bị thật.

## Điểm xuất phát và đóng thông báo · 22/10/2026

- `TripStartPointForm` thay DaySettingsForm cũ: tìm/nhập địa chỉ, 3 lựa chọn nhanh Vị trí hiện tại / Nhà riêng / Nơi lưu trú, giờ HH:mm và thanh quay lại nơi xuất phát. Các lựa chọn/CTA bo 6px; không còn chọn phương tiện trong form. Nơi lưu trú lấy từ trip; Nhà riêng đưa focus vào ô nhập địa chỉ; GPS chưa kết nối nên hiện phản hồi và cho nhập tay. Tìm trong place bank mẫu, vẫn chấp nhận địa chỉ nhập tự do.
- Schema điểm xuất phát bỏ transport; mutation ngày giữ nguyên phương tiện hiện có. Quay lại cuối ngày yêu cầu có điểm xuất phát. `AppInput` thêm leadingIcon tùy chọn, không đổi các ô khác.
- Thông báo Hoàn tác vuốt trái/phải để đóng (vuốt ngắn tự hồi), có nút × với vùng chạm 44px. Đóng không hoàn tác thay đổi. Chuyển ngày/tab Chưa xếp lịch chủ động sẽ ẩn thông báo; chuyển do mutation vẫn giữ cơ hội Hoàn tác. Đã thử lưu form, GPS preview, tìm/chọn điểm mẫu, vuốt đóng và nút × trên web 390px. TypeScript/no-unused và **125/125 tests** đạt; chưa QA thiết bị thật, không lint/dependency mới.

## Timeline và tóm tắt Planning · 22/10/2026

- Điều chỉnh mới nhất: bỏ chevron phải và toàn bộ nền/icon thời lượng/vé. Ảnh cạnh tên/giờ, dòng phụ 12px màu xám ngay dưới tên: `45 phút · Miễn phí`; nội dung dài vẫn xuống dòng.
- Vuốt trái thẻ hiện nút thùng rác (không tự xóa khi vuốt). Chạm sẽ gỡ stop khỏi lịch và chuyển vào Chưa xếp lịch theo reducer hiện có, có Hoàn tác. Cử chỉ không kích hoạt nhầm mở chi tiết khi thả.
- Nhấn giữ 300ms rồi kéo dọc để đổi thứ tự trong Planning/chỉnh sửa lịch sử. Row dùng chiều cao đo thực tế; các row lân cận nhường vị trí, giữ điểm ghim làm ranh giới. Drop qua `mergeScheduledOrder` + mutation reorder, giữ khung giờ và các stop thiếu giờ. FlatList vẫn virtualize; khóa cuộn trong lúc kéo, tạm tắt clipping; thêm accessibility actions gỡ/chuyển lên/chuyển xuống. Chưa có tự cuộn khi giữ sát mép danh sách.
- Đã xác nhận vuốt/gỡ/Hoàn tác và giao diện gọn trên web 390px; Android/Hermes export đạt. Chưa xác nhận nhấn giữ kéo trên thiết bị thật.
- Planning bỏ lối tắt thời tiết tại tóm tắt, chuyển link Sắp xếp kèm icon sang phía phải. Live vẫn giữ lối tắt thời tiết.
- Số thứ tự nền teal đậm/chữ sáng, viền teal nhẹ và bóng mềm. Thiếu giá vé thì giữ thông tin giờ đóng cửa nếu có. Không đổi dữ liệu hay luồng mở chi tiết/check-in.
- Ô dự báo thu nhẹ về padding ngang 8px, rộng tối thiểu 72px; vẫn vuốt ngang khi không đủ chỗ.

## Modal thời tiết dùng chung với Home · 22/10/2026

- `TravelWeatherDetails` dùng chung bố cục kính mờ, icon động, các cột theo giờ và thẻ gợi ý. `OngoingWeatherDetails` giữ dữ liệu quan trắc/cảm giác như; `TripForecastDetails` hiển thị ngày dự báo, dải nhiệt/UV và gợi ý chuẩn bị dựa trên ngày đang chọn, không giả dữ liệu hiện tại.
- Modal chi tiết dùng WeatherAtmosphere như Home, cao 68% màn hình, thanh gạt chạm/vuốt đóng, không header/X riêng. ScrollView giữ nội dung có thể cuộn khi chữ lớn. Các sheet form giữ bố cục cũ.
- Ô theo giờ có padding ngang/dọc 12px, rộng tối thiểu 80px; dải giờ vuốt ngang trên màn hình hẹp để giữ khoảng thở. Link Sắp xếp có icon đổi thứ tự 16px bên phải. Đã xem modal dự báo ở web 390px trước lượt đổi kích thước ô; TypeScript/no-unused và **120/120 tests** đạt cho lượt dùng chung modal, gồm phân biệt dự báo/live, gợi ý mưa/nắng và trạng thái thiếu dữ liệu. Chưa QA thiết bị thật; không lint hoặc dependency mới.

## Điều chỉnh thêm địa điểm · 22/10/2026

- Phản hồi cập nhật dùng `TripUndoNotice`: snackbar kính mờ có lề ngang, check nhỏ, nội dung 12px và Hoàn tác dạng text với vùng chạm 44px. Có hiệu ứng xuất hiện nhẹ, tôn trọng Reduce Motion và thông báo trợ năng polite. Đã thử cập nhật/Hoàn tác trên web 390px; TypeScript/no-unused đạt.
- Sắp xếp thủ công là link 12px cạnh số điểm dừng, vùng chạm 44px. Phương tiện là pill nhỏ, mở bộ chọn nhanh Ô tô / Xe máy / Đi bộ, lưu qua mutation ngày hiện có và giữ giờ/nơi xuất phát. Các thời gian di chuyển theo phương tiện vẫn là fixture UI.
- Cuối timeline mỗi ngày có nút dấu `+` lớn trong viền tròn kính mờ 48px, nhãn **Thêm địa điểm** 12px bên dưới; dùng GlassBackdrop chung, chỉ hiện khi được chỉnh sửa và mở picker cho đúng ngày đang chọn.
- Bỏ Thêm địa điểm khỏi thanh CTA cố định. Planning chỉ giữ Tối ưu lộ trình khi đủ hai điểm có giờ; nếu không thì ẩn thanh, phần cuộn tự chừa safe area dưới. Tab Chưa xếp lịch vẫn có nút thêm riêng.
- Tối ưu lộ trình dùng thanh kéo trái → phải: kéo đạt 88% rồi thả sẽ mở panel tối ưu hiện có, kéo ngắn/hủy thì spring về đầu. Chuyển động chạy bằng Reanimated/Gesture Handler, tôn trọng Reduce Motion; trình đọc màn hình dùng nút thường, web hỗ trợ Enter/Space. Không tự áp dụng thay đổi lịch trình.
- Đã sửa lỗi web luôn hiện nút thường: `AccessibilityInfo.isScreenReaderEnabled()` của RN Web luôn trả true; chỉ dùng kiểm tra này cho native, web giữ thanh trượt với keyboard/ARIA.
- TypeScript/no-unused và **117/117 tests** đạt, gồm hồi quy screen reader web/native và đổi phương tiện không mất cấu hình ngày. Đã xác nhận hình ảnh thanh trượt, link Sắp xếp và đổi phương tiện trên web 390px. Chưa xác nhận vuốt trên thiết bị thật. Không lint hoặc dependency mới.

Ngày: **21/10/2026**. Trạng thái: **đã triển khai MVP frontend bằng dữ liệu mẫu**. Giữ light-only, VI/EN, Soft Minimalist & Editorial / Liquid Glass của WeGo. Dùng mock để hoàn thiện UI trước, không sửa thuật toán/backend planning trong giai đoạn này.

## Planning · thu bản đồ khi cuộn (mới nhất)

- Planning dùng một Animated.FlatList cho sơ đồ, dải ngày sticky và timeline. Cuộn xuống qua ngưỡng 48px sẽ cuộn ẩn sơ đồ; thanh ghim có Back, tên chuyến (16px), sửa thông tin và mở lại bản đồ, đường ngăn nhẹ trên dải ngày. Hai action bên phải dùng nền kính 32px, vùng chạm 44px.
- Vuốt nhanh ngược lên (hoặc về đầu/nút mở lại) trở về sơ đồ mức 35%, kể cả trước đó đã mở 80%. Hook `use-planning-map-collapse.ts` xử lý trên UI thread, chỉ gửi thay đổi trạng thái sang React; có guard chống cuộn tự động kích hoạt đóng/mở lại. Tôn trọng Reduce Motion. Stop navigation có viewOffset tránh bị thanh ghim che.
- Hai icon góc phải dưới sơ đồ là vị trí hiện tại và mở rộng; vị trí thiết bị vẫn có phản hồi giới hạn preview, chưa lấy GPS. Thanh gạt 48×6px màu nhạt và lệch xuống 4px.
- TS/no-unused và **112/112 tests** đạt; export Android/Hermes đạt. Đã thử cuộn xuống/lên, mở lại từ mức 80% về ~35% và nút sửa trên web; chưa QA vuốt/hiệu năng trên thiết bị thật. Không lint, không dependency mới.

## Điều chỉnh Planning trước đó · 21/10/2026

- Vùng sơ đồ ở đầu màn chiếm khoảng 35% chiều cao; kéo thanh gạt xuống hoặc chạm để mở lên khoảng 80%. Có giới hạn theo vùng hiển thị thực tế để giữ dải ngày và safe area. Resize dùng Reanimated/Gesture Handler, hỗ trợ Reduce Motion; gesture nằm ở thanh gạt, không chiếm thao tác cuộn ngang của sơ đồ.
- Planning chỉ giữ Back và menu trên cùng, padding trên safe area + 32px. Bỏ tên chuyến, khoảng ngày và trạng thái tại header; thanh gạt không có chữ/mũi tên hướng dẫn, vẫn có accessible label và vùng chạm 44px.
- Dải ngày chuyển xuống dưới sơ đồ: mỗi mục hai dòng `Ngày 1` / `T7, 24/10`, không bo góc, rộng 96px theo font scale; gạch active teal 3px. Các trạng thái Live/Recap giữ dải ngày cũ.
- Nút `+` cuối dải thêm ngày kế tiếp, chọn ngày mới và có Undo; dùng reducer đổi ngày hiện có, giữ lịch cũ, giới hạn 365 ngày. Thiếu khoảng ngày hợp lệ thì mở picker ngày. Timeline không đổi.
- TypeScript/no-unused và **108/108 tests** đạt; web đã thử mở/thu gọn bằng nút, thêm ngày và Undo. Chưa xác nhận kéo trên thiết bị thật; không thêm dependency hoặc chạy lint.

## Bố cục ba mode trước lượt Planning trên · 21/10/2026

- Bỏ cover/hero ảnh và toggle Lịch trình/Bản đồ. AppBar giữ Back, tên chuyến, ngày + số ngày, badge trạng thái và menu. Header/day strip cố định, dùng safe area chung.
- `getTripDetailsMode` xác định mode bằng khoảng ngày: trước ngày bắt đầu = Planning, từ ngày đầu đến hết ngày cuối = Live, sau ngày cuối = Recap. Cancelled được giữ riêng; thiếu ngày hợp lệ không tự chuyển Live. Model hiện chỉ có ngày, chưa có giờ/timezone chuyến; đồng hồ preview vẫn là **21/10/2026**. Không tự đổi clock mock thành thời gian hệ thống.
- Planning: sơ đồ trên (~36% vùng nội dung còn lại, tối đa 240px), FlatList timeline bên dưới; CTA Tối ưu khi có ít nhất hai điểm có giờ, nếu chưa thì Thêm địa điểm. Đây vẫn là preview thứ tự mẫu, không phải AI/backend.
- Live: giữ sơ đồ + timeline, ưu tiên điểm tiếp theo và nút Chỉ đường trực tiếp; camera mẫu ở đáy. Thêm/sửa qua menu, không đặt bộ nút sắp xếp lên màn chính. Check-in dùng chung visited store với Home.
- Recap: ưu tiên album và ghi chú theo ngày; CTA Xem kỷ niệm + chia sẻ bản tóm tắt văn bản qua share sheet hệ điều hành. Không tạo public link hay quyền cộng tác. Lịch trình cũ nằm sau album; bật chỉnh sửa lịch sử qua menu.
- Dải ngày cuộn ngang chỉ có số ngày/ngày tháng; tab cuối `Chưa xếp lịch (N)`. Backlog gộp pool và các stop đã gán ngày nhưng còn thiếu giờ, giữ source date/key riêng để sửa đúng mục. Ngày thường chỉ hiện các stop có giờ hợp lệ; không còn pool card rời giữa timeline. Backlog là lựa chọn trong màn, param `day` vẫn lưu ngày.
- Sơ đồ S → 1 → 2… là sơ đồ kết nối, không phải địa lý/GPS; nhiều điểm cuộn ngang, không chồng touch targets. Chạm số cuộn FlatList tới stop và highlight cùng số; retry có giới hạn cho hàng chưa đo, tôn trọng Reduce Motion, hủy timer khi đổi ngày/unmount.
- Timeline có S/nơi lưu trú/giờ xuất phát, trục nét đứt, chặng phút/km mẫu, số điểm khớp sơ đồ, khung giờ đến–kết thúc (ghi hôm sau khi qua nửa đêm), ảnh, thời lượng, thông tin vé/đóng cửa nếu có. Chặng chưa có dữ liệu không tự bịa khoảng cách.
- Reorder/preview chỉ làm việc với stop có giờ; `mergeScheduledOrder` ghép lại vào ngày đầy đủ trước reducer, giữ vị trí backlog và điểm ghim. Form, Undo, picker và native sheet host tiếp tục dùng chung.

### Kiểm tra lượt điều chỉnh

- **104/104 tests**: thêm 7 kiểm tra cho biên mode, lịch thiếu ngày, backlog có source, xếp lịch, reorder trộn stop chưa có giờ, qua nửa đêm và actual action bar theo mode. TypeScript strict/no-unused đạt.
- Android/Hermes và Web export đạt. Đã kiểm tra web: marker cuộn/highlight, tab backlog/empty, thêm và xếp ngày/giờ, Live check-in cập nhật next stop/camera mẫu, Recap album theo ngày và CTA. Chưa gửi nội dung qua share sheet trong QA.
- Chưa QA thiết bị thật cho safe area, pinch/drag, native share, bàn phím và screen reader. Không lint, không dependency mới, không sửa backend.

## Kết quả triển khai ban đầu (trước lượt điều chỉnh trên)

- Route duy nhất `/trip/[tripId]`, param `day` lưu ngày đang xem. Validate ID/ngày và có màn không tìm thấy, back về danh sách khi mở trực tiếp.
- Đặt tabs và native stack chi tiết dưới `src/app/(workspace)`, cùng `TripPreviewProvider` nằm trong auth guard. Các URL `/tabs/...` giữ nguyên; không tạo store mới khi mở chi tiết.
- Home Xem kế hoạch/Chi tiết, card danh sách và tạo chuyến đều mở cùng route qua `TripDetailsRedirect`. Bỏ PlanPanel/modal chi tiết cũ; giữ modal nhật ký/camera/thời tiết dùng chung.
- Hero ảnh gọn, date strip sticky/virtualized, lịch trình và sơ đồ, từng chặng có phút/km mẫu hoặc Chưa tính lộ trình. Chặng nơi lưu trú/điểm xuất phát chưa có dữ liệu không được giả thành tổng lộ trình đầy đủ.
- Thêm địa điểm vào ngày đang xem hoặc pool; chỉnh giờ/thời gian ghé/ghi chú, chuyển ngày, gỡ khỏi ngày về pool, ghim, kéo hoặc dùng mũi tên để sắp xếp và commit một lần. Hoàn tác thay đổi lịch; không tự thay giờ khi nhập một điểm mới.
- Chọn địa điểm trong form tạo chuyến hiện lưu vào `unscheduledStops` với giờ trống, thay cho tự xếp ngày 1. Counts trên danh sách/Home bao gồm các điểm này.
- Thông tin/ngân sách/sở thích/lưu trú/ghi chú và điểm xuất phát/phương tiện dùng RHF + Zod. Đổi ngày giữ dữ liệu của ngày trùng, chuyển các điểm thuộc ngày bị bỏ về pool; không đổi ngày chụp kỷ niệm.
- Đánh dấu đã ghé dùng chung store với Home; camera và album dùng luồng ảnh mẫu hiện có. Lịch đã hoàn thành mở ở chế độ xem; bật chỉnh sửa lịch sử từ menu khi cần.
- Native sheet giữ host ổn định khi chuyển nội dung; picker con đợi host `onShow`. Nội dung sheet mới reset vị trí cuộn, không thay native Modal cho mỗi form.
- Xóa có xác nhận trong app; chỉ xóa trip/memories/visited của chuyến tương ứng trong phiên mẫu. Chỉ đường mở Google Maps theo thao tác người dùng, có loading/error/retry.

### Phạm vi mẫu và giới hạn

- Sơ đồ là **sơ đồ kết nối**, không phải bản đồ địa lý/GPS. Tối ưu là **thứ tự mẫu** để thử preview/apply/undo và ghim, chưa có thuật toán hoặc cam kết tiết kiệm thời gian.
- Forecast mẫu chỉ ghép đúng Đà Lạt và ngày được hỗ trợ; thời tiết hiện tại chỉ dùng đúng snapshot chuyến đang đi. Ngày/địa điểm khác có empty state.
- Chưa làm backend planning, persistence, camera thật, offline, booking hoặc chia sẻ quyền cộng tác. Nhân bản/thay ảnh cá nhân là giai đoạn sau; dùng lại assets có sẵn.
- Dữ liệu mới chỉ tồn tại trong phiên. Reload/đổi scenario có thể đưa deep link đến trạng thái không tìm thấy; đây không phải API 404.

### Xem thử

Vào **Chuyến đi → chọn một card** hoặc **Home → Xem kế hoạch**. Mặc định preview đang ở Đã đi, nên chuyến cũ chỉ xem; để thử chỉnh lịch, đổi preview sang **Sắp khởi hành** hoặc tạo chuyến mới. Trong chi tiết có thể chọn từng ngày, Thêm địa điểm, menu chỉnh thông tin/đổi ngày/xóa.

### Kiểm tra

- TypeScript strict/no-unused: đạt. Suite **97/97**, thêm 10 tests cho route, pool/chuyển ngày, undo, đổi khoảng ngày, pins/reorder, estimates, forecast matching, form validation và delete isolation.
- Đã thao tác web: mở từ Home/list, tạo chuyến và chuyển vào chi tiết, thêm điểm vào ngày trống, pool/picker/Cancel, chuyển ngày/Hoàn tác, sắp xếp bằng mũi tên, preview/apply thứ tự gợi ý, sơ đồ, forecast và không tìm thấy sau reload phiên.
- Dev server có lần tải bundle đầu khoảng 39 giây; sau khi tải xong các luồng web hoạt động. Đã dừng phiên Metro kiểm tra riêng, giữ server đang dùng.
- Export Android/Hermes và Web đạt; chưa thử keyboard, drag, screen reader và hiệu năng trên thiết bị Android/iOS thật. Không chạy lint, không thêm dependency.

## Đề xuất gốc và hướng phát triển tiếp

## 1. Mục tiêu và hierarchy

Người dùng mở màn hình này để biết **chuyến đi ra sao, ngày đang xem đi đâu, di chuyển thế nào và cần làm gì tiếp theo**. Timeline theo ngày là nội dung chính. Thông tin phụ mở dần bằng sheet hoặc menu, không làm một dashboard dài với mọi tính năng cùng nổi bật.

```text
← Chi tiết chuyến đi                            ⋯

[Ảnh bìa vừa phải / tùy chọn thu gọn]
Khám phá xứ sở ngàn hoa
Đà Lạt · 24–27/10 · 4 ngày              Sắp khởi hành

[Ngày 1 · 24/10] [Ngày 2 · 25/10] [Ngày 3 ...] →
4 điểm · 8,6 km · 45 phút di chuyển
[Lịch trình | Bản đồ]                  Ô tô ▾
[Weather pill / một gợi ý theo ngữ cảnh nếu có]

08:30  Rời nơi lưu trú
       │ 15 phút · 3,2 km · Ô tô
08:45  Hồ Xuân Hương                         ⋯
       Tham quan 45 phút · đến 09:30
       │ 10 phút · 1,5 km
09:40  Quảng trường Lâm Viên                 ⋯
       Tham quan 40 phút · Miễn phí
       ...

[Chưa xếp lịch · 3 địa điểm]                 →

                 [+ Thêm địa điểm]
```

Các số trong sơ đồ chỉ minh họa bố cục. Khi dùng fixture phải phân biệt dữ liệu ước tính, không ngụ ý Google Maps/live GPS đã được kết nối.

## 2. Header và thông tin chuyến

- Native stack screen toàn màn hình với back, tiêu đề ngắn và overflow menu. Mở cùng một route bằng tripId từ card danh sách hoặc Xem kế hoạch ở Home; không xây một modal chi tiết khác cho mỗi entry.
- Không lặp header logo lớn + hero lớn + tên chuyến nhiều lần. Có thể tái dùng ngôn ngữ control của header chung với variant back/title/menu.
- Hero ảnh thực tế cao khoảng 120–150 theo token, tên custom, điểm đến, ngày/thời lượng, status nhỏ. Khi cuộn, thu gọn còn header tên chuyến; không thêm motion nặng chỉ để trang trí.
- Menu: Sửa thông tin, thay ảnh, nhân bản chuyến (giai đoạn sau), xóa. Xóa dùng màu danger trong menu và confirm, không đặt cạnh nút thêm điểm chính.
- Bấm phần thông tin mở sheet để xem/sửa nơi lưu trú, ngân sách, sở thích/ghi chú. Không cần một card to riêng cho từng field.

## 3. Chọn ngày và hai cách xem cùng dữ liệu

- Horizontal date selector có Ngày 1 + ngày/tháng + trạng thái đang chọn; có dấu nhỏ cho ngày trống/cần hoàn thiện nhưng không chỉ dùng màu.
- Mặc định mở hôm nay nếu đang diễn ra, ngày đầu nếu chưa đi; khi quay lại giữ ngày/vị trí cuộn đang xem nếu còn phù hợp.
- Selector có thể sticky sau header. Không thêm một danh sách dọc lặp lại toàn bộ các ngày.
- `Lịch trình | Bản đồ` là hai representation của cùng ngày. Bản đồ chỉ tải khi người dùng mở; không dựng hai cây nội dung nặng đồng thời. Giai đoạn mock có thể là preview có nhãn phù hợp; chưa cần cài maps SDK.
- Tổng quan ngày gọn: số điểm, tổng quãng đường, tổng thời gian di chuyển; đổi phương tiện tại một control nhỏ. Tách thời gian tham quan khỏi thời gian di chuyển.

## 4. Timeline là trung tâm

Tái sử dụng ngôn ngữ timeline/ảnh của Home, không lặp hero ĐIỂM ĐẾN TIẾP THEO thành card lớn cho từng nơi.

**Một điểm dừng:** giờ đến hoặc khoảng ghé, tên, thumbnail nhỏ, thời gian dự kiến ở lại và tối đa một quick-info hữu ích (giờ đóng cửa/vé/đặt chỗ). Hành động ít nổi bật trong ⋯: đổi giờ, thời gian tham quan, chuyển ngày, gỡ khỏi lịch. Bấm tên mở sheet chi tiết địa điểm.

**Đoạn nối giữa hai điểm:** phương tiện + phút di chuyển + km, trình bày nhỏ dọc trục. Đây là dữ liệu của chặng, không gắn nhầm vào địa điểm. Chưa có dữ liệu thì nói Chưa tính lộ trình, không dùng 0 phút/0 km gây hiểu nhầm.

**Điểm xuất phát:** chọn nơi lưu trú hoặc một địa điểm, giờ bắt đầu; chọn quay lại nơi lưu trú cuối ngày nếu cần. Không tự yêu cầu GPS khi chỉ muốn lập kế hoạch.

**Sửa thứ tự:** dùng chế độ Sắp xếp với handle kéo; có Chuyển lên/xuống trong menu làm phương án thay thế cho drag. Xong thì commit một lần; gỡ nhầm có Hoàn tác. Đổi thứ tự có thể làm dữ liệu chặng cũ không còn đúng, cần đánh dấu đang tính/chưa cập nhật.

## 5. Danh sách địa điểm chưa xếp lịch

Không dựng một danh sách thứ hai giống hệt timeline. Dùng **Chưa xếp lịch** cho các nơi đã lưu nhưng chưa chọn ngày/giờ.

- Nút Thêm địa điểm mở picker có tìm kiếm + gợi ý quanh destination; chọn Thêm vào ngày đang xem hoặc Lưu để xếp sau.
- Nếu form tạo chuyến chỉ hỏi muốn đi những đâu, nên đưa các lựa chọn vào danh sách này thay vì âm thầm xếp tất cả vào ngày 1 với giờ giả.
- Từ pool có thể thêm vào ngày cụ thể, chuyển giữa các ngày; giữ count rõ ràng để địa điểm không bị “mất” khi chưa lên timeline.
- Tránh chọn cùng điểm trùng lặp ngoài ý muốn; không chặn cứng trường hợp người dùng chủ động muốn ghé lại.

## 6. Thời tiết và gợi ý theo ngữ cảnh

- Một pill theo **ngày đang chọn**, bấm mở weather sheet dùng lại phong cách hiện có. Không bê cả dashboard thời tiết Home vào đây.
- Khi đang đi, phân biệt điều kiện hiện tại với dự báo; hiển thị thời điểm cập nhật trong phần chi tiết. Ngoài hạn dự báo của nguồn dữ liệu thì dùng empty state, không trình bày dự báo xa như dữ liệu chắc chắn.
- Chỉ đưa một gợi ý ưu tiên gần timeline: sắp mưa khi có điểm ngoài trời; nơi tham quan sắp đóng; chặng quá xa; các giờ đang chồng nhau. Bấm gợi ý mới mở lựa chọn xử lý.
- Copy có ích: “Có thể mưa buổi chiều. Bạn có muốn đổi Bảo tàng sang 14:00?” — luôn cho người dùng xem trước thay đổi, không tự sửa lịch vì thời tiết.
- Tùy chọn nhịp chuyến đi Thư thả/Vừa phải/Năng động có thể giúp gợi ý thời gian nghỉ, nhưng chưa cần biến thành một hệ thống điểm phức tạp.

## 7. Tối ưu lịch trình — rõ tác động và có thể quay lại

- Đặt action Tối ưu trong tổng quan ngày hoặc menu, secondary so với Thêm địa điểm. Hữu ích khi có đủ điểm có thể sắp lại; ngày rỗng không cần CTA tối ưu.
- Phân biệt **Tối ưu di chuyển** (thứ tự/chặng) với **Gợi ý trải nghiệm** (thời tiết, sở thích, thời gian tham quan). Không gọi mọi gợi ý là thuật toán tối ưu hoàn chỉnh.
- Preview trước/sau: thứ tự mới, thời gian di chuyển dự kiến, điểm thay đổi và lý do. Người dùng chọn Áp dụng / Giữ lịch hiện tại; có Hoàn tác.
- Cho ghim điểm hoặc giờ bắt buộc, ví dụ vé bảo tàng 14:00; không tự xê dịch những ràng buộc đã xác nhận. Giờ mở cửa và thời gian ghé cũng cần xét ở cấp sản phẩm, không chỉ khoảng cách giữa các tọa độ.
- Chưa có API thì dựng state UI/mock cho luồng preview, không sửa planning backend. Không tự thêm dịch vụ AI hoặc thực hiện network/DB mỗi lần kéo một điểm.
- Khi tích hợp thật: chỉ tính khi người dùng yêu cầu hoặc lịch thay đổi đã chốt; cache theo ngày/thứ tự/phương tiện, tránh fetch lại khi đơn thuần ẩn/hiện sheet. Chọn nhà cung cấp sau, không mặc định commit chi phí Google.

## 8. Bổ sung có giá trị nhưng không làm màn hình quá tải

| Ý tưởng                                | Cách thể hiện                                                 | Ưu tiên |
| -------------------------------------- | ------------------------------------------------------------- | ------- |
| Giờ mở cửa/vé/booking                  | Quick-info tại đúng điểm, mở sheet để xem đầy đủ              | Cao     |
| Điểm xuất phát và phương tiện          | Dòng đầu timeline + selector phương tiện                      | Cao     |
| Địa điểm chưa xếp                      | Thanh count → sheet/pool                                      | Cao     |
| Cảnh báo giờ trùng/chặng thiếu dữ liệu | Inline hint tại điểm/chặng liên quan                          | Cao     |
| Ghi chú/vé đặt chỗ                     | Sheet của địa điểm, không card lớn toàn màn hình              | Sau MVP |
| Xem offline lịch gần nhất              | Trạng thái cập nhật/offline rõ; không giả có weather live     | Sau MVP |
| Chia sẻ hành trình                     | Menu, quyền chỉ xem/chỉnh cần thiết kế với backend sau        | Sau MVP |
| Ngân sách dự kiến                      | Một tóm tắt phụ/sheet, không phát triển kế toán chi tiêu ngay | Sau MVP |
| Sao chép chuyến/ngày                   | Menu tiện ích sau khi edit cơ bản ổn định                     | Sau MVP |

## 9. Theo trạng thái chuyến

- **Draft:** ưu tiên thêm điểm/chọn ngày; các thiếu sót là nhắc nhẹ, không block xem kế hoạch.
- **Sắp đi:** ưu tiên sắp xếp, thời tiết và chuẩn bị; primary là thêm/chỉnh lịch.
- **Đang đi:** mặc định ngày hiện tại, đánh dấu đã ghé, chỉ đường và camera của nav. Dùng chung visited/memories với Home, không tạo trạng thái check-in thứ hai.
- **Đã đi:** ưu tiên xem lại lịch/ảnh/kỷ niệm; các thao tác sửa lịch sử qua menu, tránh vô tình sửa khi chỉ muốn xem album.

## 10. Cách triển khai vừa đủ khi được yêu cầu

1. Sửa các lỗi đọc/ghi và apply/cancel trong [TRIPS-REVIEW.md](TRIPS-REVIEW.md) trước.
2. Dùng route Expo Router có tripId, validate param và xử lý không tìm thấy; đặt trong auth guard hiện có. List/Home cùng trỏ đến route này.
3. `features/trip/screens/trip-details-screen.tsx` ghép các khối; component/hook/type đặc thù ở feature trip. Reuse primitives, glass, photo viewer và timeline phù hợp; không copy cả screen Home.
4. UI state ngày đang chọn/view mode/sheet là local hoặc route state khi cần deep link; trips/visited/memories dùng cùng nguồn state. Không thêm store chỉ để giữ bản sao trip được chọn.
5. Mở rộng kiểu dữ liệu tối thiểu để phân biệt điểm, thời gian ở lại và chặng di chuyển; model hiện tại chỉ có `TripStop.time/name/kind`, chưa đủ dữ liệu để hiển thị khoảng cách/phút thực tế. Chưa cần thiết kế toàn bộ schema backend.
6. MVP: header gọn, chọn ngày, timeline, add/edit/move/remove, pool chưa xếp và weather sheet. Sau đó mới map preview, optimization preview, offline/booking/share.

## Tham khảo

- [React: Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure) — tránh dữ liệu trùng và state lệch nhau.
- [React Native 0.86: Accessibility](https://reactnative.dev/docs/0.86/accessibility) — label, role và trạng thái control; vẫn cần kiểm tra VoiceOver/TalkBack.
- [Google Routes: Optimize waypoint order](https://developers.google.com/maps/documentation/routes/opt-way) — dịch vụ có thể tối ưu thứ tự theo thời gian/khoảng cách, không đồng nghĩa đã giải quyết toàn bộ ràng buộc du lịch. Nếu sau này chọn dùng, cần kiểm tra điều kiện và chi phí tại thời điểm tích hợp.
