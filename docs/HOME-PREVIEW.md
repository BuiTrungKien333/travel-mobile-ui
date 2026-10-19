# Home frontend preview

Cập nhật: **19/10/2026**. Home đã có giao diện cho bốn trạng thái, dùng dữ liệu cục bộ để phát triển UI trước khi nối API.

## Xem giao diện

1. Chạy `npm run web`, hoặc dùng development build trên điện thoại.
2. Trong development, ứng dụng vào Home trực tiếp mà không cần backend.
3. Chọn **Đổi trạng thái / Change scenario** ở cuối Home. Mặc định là **Đã đi, chưa có chuyến mới**.
4. Đổi ngôn ngữ tại tab Cá nhân. Mặc định Tiếng Việt; chỉ dùng giao diện sáng.

Header dùng chung gồm logo WeGo và nút thông báo dạng kính. Nút thông báo mở trạng thái chưa có thông báo; không còn nút đổi scenario trên header. Bottom navigation gồm bốn tab và nút camera giữa thanh.

Ngày mô phỏng cố định là **21/10/2026**, không phải ngày thực tế của thiết bị. Các scenario giữ nguyên khi ngày hệ thống thay đổi để dễ kiểm tra đếm ngược và lịch trình.

## Bốn trạng thái

Home chọn theo thứ tự trong `utils/select-home.ts`:

| Ưu tiên | Trạng thái                | Nội dung chính                                                                                                             |
| ------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1       | Đang trong chuyến đi      | Thông tin chuyến/ngày hiện tại, live badge, thời tiết tại điểm đến, điểm tiếp theo, timeline, Nhật ký hôm nay              |
| 2       | Sắp khởi hành             | Chuyến tương lai gần nhất, gồm chuyến nháp có ngày đi; ảnh bìa/đếm ngược, dự báo theo ngày, vali chuyến đi, Cần hoàn thiện |
| 3       | Đã đi, chưa có chuyến mới | Lời mời tạo chuyến tiếp theo, Dấu ấn của bạn, Kỷ niệm gần đây                                                              |
| 4       | Người dùng mới            | Lời mời tạo chuyến đầu tiên và lịch trình Đà Lạt mẫu ba điểm dừng                                                          |

Chuyến nháp đã quá ngày không được tính là chuyến đi đã thực hiện. Dấu ấn chỉ hiện khi có lịch sử. Sắp khởi hành và Đã đi dùng chung album Kỷ niệm gần đây, mỗi preview tối đa sáu ảnh; Đang đi có sáu ảnh mẫu trong Nhật ký hôm nay.

## Các tương tác đã có

- Tạo chuyến nháp có ngày đi, xem kế hoạch từng ngày và thêm địa điểm mẫu chưa có trong ngày đó.
- Đánh dấu đã ghé/bỏ đánh dấu; điểm tiếp theo và timeline cập nhật từ cùng dữ liệu. Sau khi đánh dấu có lời mời chụp ảnh ngắn.
- Nút camera mở luồng chọn/chụp **ảnh mẫu**; chưa truy cập camera hay thư viện thiết bị.
- Xem nhật ký, chỉnh ghi chú của ảnh. Xóa ảnh preview có xác nhận; tab Kỷ niệm phản ánh cùng dữ liệu và có empty state khi xóa hết.
- Dự báo có bộ chọn ngày; chỉ số thuận lợi và khung giờ cập nhật theo ngày. Nếu chưa có forecast cho chuyến thì hiện empty state. Gợi ý vali tổng hợp **cả chuyến**, không đặt lại theo ngày đang chọn.
- Tick checklist, tiến độ chuyển động, ghi nhận hoàn tất và nút Xong. Checklist là state cục bộ của dashboard, không lưu qua lần unmount/khởi động lại.
- Modal thời tiết khi đang đi có thanh gạt, kéo từ vùng thanh gạt để đóng, chạm thanh gạt hoặc chạm ngoài cũng đóng được.
- Album hai ảnh mỗi hàng; chạm thumbnail mở ảnh toàn màn hình. Có pinch, double tap, vuốt ngang, kéo xuống đóng, ẩn/hiện thanh công cụ và thông tin ảnh.
- Trên web: Escape quay lại/đóng panel của trình xem ảnh; phím trái/phải đổi ảnh khi không có thao tác đang chặn; Space trên vùng ảnh có focus ẩn/hiện công cụ.
- Chia sẻ/lưu dùng file ảnh đầy đủ, không xuất phần crop/zoom hiện tại. Native dùng share sheet và thư viện ảnh; web dùng Web Share nếu trình duyệt hỗ trợ và tải file xuống. Có trạng thái bận, ảnh lỗi/thử lại, thiếu quyền và lỗi thao tác.

Yêu thích chỉ tồn tại trong lần mở trình xem ảnh. Xóa chỉ thay đổi preview, không xóa ảnh trong thư viện máy. Share/save cần thử trên thiết bị và xử lý quyền thực tế; web không thay thế kiểm tra native.

## Dữ liệu và ranh giới tích hợp

| Vị trí trong `src/features/home`                                | Trách nhiệm                                                                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `data/`                                                         | Trips, thời tiết, ảnh mẫu và ngày mô phỏng; không gọi API                                                                 |
| `types/home-types.ts`, `types/preview-state.ts`                 | Kiểu dữ liệu và panel/action preview                                                                                      |
| `store/trip-preview-store.ts`                                   | Factory Zustand vanilla: scenario, chuyến nháp, điểm đã ghé, ghi chú/ảnh; giới hạn tối đa 20 trips/memories trong preview |
| `providers/trip-preview-provider.tsx`                           | Tạo store theo phiên và selector `useShallow`; không chứa UI/business actions                                             |
| `utils/`                                                        | Chọn trạng thái, ngày, tiến độ lịch trình, tọa độ/giới hạn zoom, liên kết bản đồ                                          |
| `screens/`                                                      | Ghép các khối UI cho Home và các tab preview                                                                              |
| `components/journal-album.tsx`                                  | Album dùng chung cho Đang đi, Sắp đi và Đã đi                                                                             |
| `components/journey-card.tsx`, `components/home-primitives.tsx` | Khung/thành phần dùng chung                                                                                               |
| `components/ongoing-trip-components.tsx`                        | Hero điểm tiếp theo và timeline đang đi                                                                                   |
| `hooks/use-home-ambient-motion.ts`                              | Motion trang Home theo focus, AppState, Reduced Motion và trạng thái panel preview                                        |
| `hooks/use-photo-viewer-*`                                      | Gesture/motion và bàn phím theo platform                                                                                  |
| `services/journal-photo-actions.ts`, `.web.ts`                  | Chia sẻ/lưu ảnh theo platform                                                                                             |
| `i18n/`                                                         | Copy Tiếng Việt/Tiếng Anh cho Home, thời tiết và ảnh                                                                      |

Fixtures và các thay đổi trong store chỉ tồn tại trong phiên. Đổi scenario khôi phục trips/memories/visited của scenario đó; đóng phiên provider hoặc khởi động lại cũng mất các thay đổi. Không gọi planning/weather/memory API hoặc lưu dữ liệu lên backend. Trước khi nối dữ liệu thật, chuyển server state vào query hooks của feature; giữ UI state cục bộ/scoped.

Ảnh minh họa được bundle cục bộ, nguồn và giấy phép trong `assets/images/home/README.md`. Icon bản đồ dùng bản WebP 256px có alpha; PNG gốc giữ làm source.

## Quy ước triển khai

- Home dùng ScrollView với số khối hữu hạn; album preview tối đa sáu ảnh, viewer dựng tối đa ba trang ảnh. Tab Trips/Memories dùng FlatList và ID ổn định.
- Safe area phía trên/hai bên và khoảng trống đáy theo chiều cao bottom navigation. Form có xử lý bàn phím, validation và lỗi.
- UI dùng semantic tokens, Roboto và thành phần chung; giữ phong cách kính/teal đã chốt. Android/web có chất liệu kính fallback, không cam kết hiệu ứng khúc xạ giống iOS.
- Gesture ảnh chạy bằng Reanimated/Gesture Handler. Motion trang trí dừng khi app background, tab mất focus hoặc panel preview dùng chung mở; tôn trọng Reduced Motion. Chưa đo FPS trên thiết bị.
- Label/trạng thái trợ năng cho các thao tác chính; icon-only tab vẫn có tên cho screen reader. Cần kiểm tra VoiceOver/TalkBack và font phóng lớn trên máy thật.

## Kết nối lại auth

`src/constants/development.ts` đang dùng `UI_PREVIEW_ENABLED = __DEV__`. Khi bật, session restoration được bỏ qua và tab Cá nhân dùng preview, không thay đổi credential hiện có. Bản release vẫn qua xác thực thật.

Đổi cờ thành `false` và reload khi muốn thử lại auth. Việc này không tự nối Home với API: Home vẫn dùng các fixture cho đến khi triển khai query/API riêng.

Chi tiết kiểm tra và giới hạn: [HOME-REVIEW.md](HOME-REVIEW.md). Tiến độ: [PROJECT-STATUS.md](PROJECT-STATUS.md).
