# P1-02 · Điều hướng, form và trạng thái màn hình

Triển khai ngày **06/11/2026**. Phần code đã hoàn tất; **chưa nghiệm thu thao tác/bàn phím trên điện thoại thật**. Không sửa backend, .env, dependency hoặc cấu hình native.

## Điều hướng và ngữ cảnh

- Back ở chi tiết ảnh dùng lịch sử Router để trở về màn gọi ảnh (Home/album), thay vì luôn ép về album. Deep link không có lịch sử có fallback về đúng album của chuyến. Nút mở album vẫn là hành động riêng.
- Thêm điểm trực tiếp từ deep link có fallback về đúng chuyến/ngày. Nhật ký trong chi tiết chuyến mở album chuyến hiện hành; Back giữ màn lịch phía dưới.
- Timeline giữ vị trí cuộn riêng theo ngày/pool trong phiên màn hình. Ghi offset ở cuối drag/momentum; không thay thế handler Reanimated đang điều khiển bản đồ. Ngày mới chưa có vị trí bắt đầu ở đầu danh sách.
- Kết quả tìm kiếm giữ vị trí cuộn khi mở/đóng preview địa điểm. Đổi từ khóa hoặc đổi bộ lọc về các điểm đã chọn bắt đầu lại từ đầu danh sách. Từ khóa, lựa chọn và ngày đích vẫn ở state của picker khi quay về từ chi tiết.
- Dock tiếp tục icon-only, dùng nhãn trợ năng và selected state sẵn có. Không thêm thanh điều hướng mới hoặc reset màn khi bấm lại tab.

## Form, bàn phím và thoát màn

- `useUnsavedExit` xử lý cả Router removal và đóng sheet/form cục bộ: form sạch thoát ngay; còn thay đổi hỏi giữ/bỏ; đang lưu chặn thoát. Dùng cho ghi chú ảnh, sửa tài khoản, thông tin chuyến, thiết lập ngày, sửa lượt ghé và sắp xếp thứ tự trong sheet.
- Sheet hỏi trước khi chạy animation đóng. Swipe muốn đóng nhưng người dùng giữ chỉnh sửa sẽ trả sheet về vị trí mở, không để form bị trượt khỏi màn hình. Callback sau animation vẫn giữ hành vi cũ cho caller không có guard.
- Tạo chuyến, picker, sửa lượt ghé, ghi chú ảnh, auth scaffold và trang Cá nhân dùng KeyboardAvoidingView trên Android/iOS; nội dung form có thể cuộn và chạm nút khi bàn phím mở. Thiết lập ngày dùng sheet đã có keyboard avoidance.
- `AppInput` đọc thông báo lỗi/helper qua accessibility hint. Lỗi vẫn hiện gần trường; React Hook Form giữ quyền sở hữu dữ liệu, không nhân bản form vào store.
- Sửa thông tin chuyến mở phần nâng cao trước khi focus budget/nơi ở/ghi chú; ngày/điểm đến lỗi mở đúng picker. Thiết lập ngày mở đúng dòng thời lượng lỗi và focus input sau khi dòng được render.
- Bổ sung ref thực cho input thời lượng và handle focus cho trường giờ tùy biến, để RHF đưa người dùng đến trường lỗi. Form vẫn giữ version lúc mở theo P0; không reset khi query refetch.

## Loading, lỗi, lưu và xóa

- `QueryFeedback` dùng chung cho Home, danh sách chuyến, chi tiết chuyến/điểm, picker và trạng thái cloud của Kỷ niệm. Có loading, cập nhật, lỗi và retry; retry có trạng thái bận khi request đang chạy ở các query màn chính.
- Home tiếp tục hiển thị chuyến/ảnh đã tải khi refetch lỗi. Danh sách chuyến có pull-to-refresh và báo lỗi cập nhật ngay cả khi đã có thẻ cũ. Chi tiết/picker giữ component và form đang mở khi query nền lỗi, không thay cả màn bằng lỗi trống.
- `requiredQueryState` ưu tiên lỗi của request bắt buộc chưa có dữ liệu hơn một request khác còn pending/paused, để luôn có đường retry. Loading của các màn chi tiết có Back.
- Chi tiết chuyến chỉ hiện “Đã lưu thay đổi” sau khi API thành công; lỗi giữ sheet và dữ liệu nhập, hủy xác nhận ảnh hưởng ngày không nhận là đã lưu.
- Xóa chuyến giữ xác nhận sẵn có, thêm khóa chống nhấn lặp, trạng thái đang xử lý và lỗi có thể thử lại. Chỉ quay lại sau khi mutation/cache cleanup kết thúc. Cờ điều hướng nằm ở screen cha để việc xóa cache chi tiết không làm mất callback quay lại.
- Giữ xác nhận xóa lượt ghé/ảnh và checkpoint xóa P0-04. Không thêm hàng đợi ghi/xóa ngầm.

## Kiểm chứng

- TypeScript: đạt.
- Nhóm trọng tâm: **25/25 đạt**; gồm thoát form bẩn/đang lưu, Back/deep-link fallback, ưu tiên lỗi query, offset theo ngày, xác nhận trước animation, Home giữ cache và các hồi quy sửa/xóa/chuyển ngày/thêm điểm.
- Full mobile: **312 test, 306 đạt, 6 lỗi cũ**, không skip/cancel; dùng fixture response backend thật từ P0-04. Các lỗi cũ nằm ở `trip-ui-flows.test.ts` (4) và `trip-weather-details.test.ts` (2).
- `npm run lint` toàn repo còn **51 lỗi, 3 cảnh báo cũ**. Lint phạm vi file sửa/mới còn **1 lỗi cũ `react-hooks/refs` trong `use-picker-sheet-motion.ts` và 1 cảnh báo default import DateTimePicker cũ**; không có lỗi/cảnh báo mới. Đã kiểm tra source HEAD của hook qua ESLint stdin để xác nhận lỗi refs tồn tại trước thay đổi; không thêm rule disable để che lỗi.
- Log: `travel-system/backend/target/p102-*.log` (ignored), gồm `p102-lint-hook-baseline.log`. Test platform doubles không thay thế kiểm tra gesture, bàn phím hoặc vị trí cuộn thực trên điện thoại.

## Checklist điện thoại

- [ ] Từ Home mở ảnh → Back về Home; từ album mở ảnh → Back về album đúng vị trí. Link trực tiếp ảnh vẫn có đường về đúng album.
- [ ] Chọn ngày 2, cuộn timeline, mở điểm rồi Back: giữ ngày/vị trí. Chuyển ngày 1 rồi quay ngày 2: khôi phục vị trí riêng, bản đồ không bị kẹt.
- [ ] Tìm địa điểm, cuộn kết quả, mở chi tiết rồi quay lại: còn từ khóa/lựa chọn/ngày đích/vị trí cuộn. Đổi từ khóa không giữ offset cuối của kết quả cũ.
- [ ] Form thông tin chuyến/ngày/lượt ghé/reorder có thay đổi: thử X, backdrop, swipe và Back. Chọn tiếp tục chỉnh sửa vẫn nhìn thấy form và giữ giá trị; chọn bỏ không ghi API.
- [ ] Ghi chú ảnh và tài khoản có thay đổi: Back/thoát hỏi giữ/bỏ; đang lưu không rời màn hoặc gửi lặp. Lưu lỗi giữ dữ liệu nhập.
- [ ] Android mở bàn phím ở các input cuối form: có thể cuộn tới trường/nút lưu; không bị bàn phím che. Kiểm tra thêm iOS nếu có thiết bị.
- [ ] Gửi form sai: lỗi gần trường, tự mở phần nâng cao/dòng thời lượng và focus đúng input/picker; không đóng form.
- [ ] Tải xong Home/Trips/chi tiết/picker rồi ngắt mạng và refetch: nội dung cũ và form còn nguyên, có retry rõ ràng. Một query lỗi trong nhóm không bị spinner của query khác che mất.
- [ ] Lưu thay đổi chuyến thành công có phản hồi; lỗi/xung đột hoặc hủy thay đổi ngày không báo đã lưu.
- [ ] Xóa chuyến: Cancel giữ nguyên; xác nhận/nhấn nhanh nhiều lần chỉ xử lý một lượt. Thành công quay lại đúng màn dù cache chi tiết đã bị xóa; thất bại có lỗi để thử lại.
- [ ] Tab vẫn icon-only, tab chọn rõ ràng; TalkBack đọc đúng tên tab, trạng thái chọn và nhãn các nút.

Dừng để review/push. Phần tiếp theo khi người dùng yêu cầu là **P1-03 — Chuyển động, gesture và hiệu năng cảm nhận**; ưu tiên sửa lỗi QA thực tế trước.
