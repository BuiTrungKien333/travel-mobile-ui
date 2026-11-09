# Rà soát và chốt frontend Home

Ngày: **19/10/2026**. Phạm vi: `src/features/home`, routes/layout liên quan, header/navigation, UI dùng chung, theme, asset và tests liên quan. Không sửa backend/planning, không nối API và không thay đổi thiết kế Home đã được duyệt.

## Kết luận

Home có cấu trúc phù hợp để **chốt giai đoạn frontend với mock data và chuyển sang phần UI tiếp theo**. Qua đọc code và các kiểm tra tự động bên dưới, chưa phát hiện lỗi P0/P1 trong phạm vi này. Đã xử lý các vấn đề có ảnh hưởng thực tế và dọn phần thừa. Chưa thể kết luận hiệu năng, trợ năng và gesture đạt yêu cầu trên máy thật chỉ từ typecheck/tests/bundle.

Đã đối chiếu `AGENTS.md` và hai skill cục bộ: **ui-ux-pro-max** và **vercel-react-native-skills** (React Native guidelines). Không thêm dependency, không nâng SDK và không thay kiến trúc ứng dụng.

## Phát hiện theo mức độ và cách xử lý

P2: ảnh hưởng hành vi/trải nghiệm hoặc tài nguyên. P3: cấu trúc, code thừa và tính nhất quán. Các mục sau đã sửa.

| Mức | Vấn đề                                                               | Tác động và thay đổi                                                                                                                                                                                                     |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P2  | Tab Kỷ niệm tự nối thêm bản ghi mẫu ngoài store khi có lịch sử       | Xóa hết ảnh vẫn còn một kỷ niệm không do người dùng tạo. Bỏ bản ghi tự sinh; FlatList dùng đúng `memories`, trả về empty state khi rỗng. Có regression test xóa hết và reset scenario.                                   |
| P2  | Thumbnail lỗi vẫn có thể bấm nếu còn metadata đã load                | Có thể mở viewer từ ảnh không còn khả dụng. Chặn cả vùng chạm, accessibility state và hàm lấy tọa độ khi ảnh lỗi/chưa sẵn sàng.                                                                                          |
| P2  | Vòng lặp trang trí Home chưa dùng lifecycle thống nhất               | Chuẩn hóa hook theo tab focus, AppState, Reduced Motion và panel preview dùng chung; tái sử dụng cho thời tiết mẫu. Đây là giảm công việc nền, chưa phải số đo tiết kiệm pin/FPS.                                        |
| P2  | Viewer web thiếu điều khiển bàn phím tương ứng với gesture           | Bổ sung Escape, trái/phải và Space trên vùng ảnh có focus; ưu tiên đóng info/xác nhận trước, chặn đổi trang khi đang bận. Tách `.web.ts`, native giữ back/accessibility actions sẵn có.                                  |
| P2  | Asset icon bản đồ quá lớn cho kích thước hiển thị                    | Dùng WebP 256px có alpha, **18.782 byte** thay PNG **1.526.861 byte**, giảm khoảng 98,8% dung lượng asset này. Giữ PNG nguồn; không thay hình thiết kế.                                                                  |
| P2  | Import font từ barrel kéo cả bộ Roboto vào native bundle             | Export Android trước khi sửa có 18 file Roboto dù chỉ load 4; sau khi sửa còn đúng 4 file Roboto. Đổi import trực tiếp Regular/Medium/SemiBold/Bold và dùng `useFonts` từ `expo-font`; giữ nguyên font family đang dùng. |
| P3  | Album dùng cho ba trạng thái nằm trong file riêng của chuyến đang đi | Tách `JournalAlbum` và `JourneyCard`; component đang đi chỉ còn hero/timeline. Một luồng xem/xóa ảnh dùng chung cho ba trạng thái.                                                                                       |
| P3  | Provider chứa cả types, fixtures và actions                          | Tách `types/preview-state.ts`, `store/trip-preview-store.ts`, provider chỉ tạo identity store và cung cấp selector. Có thể test store thực tế mà không dựng React/UI.                                                    |
| P3  | Nhánh modal và copy cũ không còn caller                              | Bỏ panel `weather`/`moment`, form và action cũ; giữ modal thời tiết hiện tại và chỉnh ghi chú ảnh. Xóa 48 khóa copy không còn dùng ở cả VI/EN; giữ các khóa truy cập động.                                               |
| P3  | Giá trị spacing và phép tính lặp nhỏ                                 | Đổi margin cứng trong lịch trình mẫu sang token, gom lọc lịch sử chuyến dùng cho thống kê. Bỏ prop `translucent` chưa có caller của khung card.                                                                          |
| P3  | Tài liệu lệch với UI                                                 | Cập nhật vị trí đổi scenario, header thông báo, album, camera mock, checklist, cấu trúc và giới hạn dữ liệu; thay README mặc định và thêm tiến độ dự án.                                                                 |

## Đối chiếu quy định dự án

| Tiêu chí                | Kết quả đọc code                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Component structure     | Screen ghép UI; album/khung card/header dùng chung; forecast, packing, photo toolbar, gesture và dịch vụ ảnh có trách nhiệm riêng. Không chia nhỏ mọi đoạn JSX chỉ để giảm số dòng.                                                                                                                                |
| State / re-render       | Store theo phiên provider, selector `useShallow`; state modal/checklist/ảnh cục bộ. Không đẩy state thay đổi theo frame vào React. Giữ React Compiler, không thêm memo/useCallback đại trà.                                                                                                                        |
| Lists                   | Home có số khối hữu hạn nên dùng ScrollView; album preview tối đa 6 ảnh, viewer tối đa 3 trang đang dựng. Trips/Memories dùng FlatList với ID ổn định; store giới hạn preview 20 entries.                                                                                                                          |
| Safe area / keyboard    | SafeAreaView và insets; khoảng trống đáy theo bottom nav; form/modal có KeyboardAvoidingView, xử lý bàn phím và RHF/Zod. Cần kiểm chứng bằng bàn phím thật và xoay màn hình.                                                                                                                                       |
| Accessibility           | Nút/icon có label, trạng thái selected/checked/busy/disabled; progress và phản hồi dùng live region phù hợp; modal có escape/close; tôn trọng Reduced Motion. Giữ touch target theo tokens; visual text nhỏ không đồng nghĩa vùng chạm nhỏ.                                                                        |
| Theme / i18n            | Chỉ light theo yêu cầu. Màu, spacing, typography lấy từ theme; copy VI/EN tách riêng, VI mặc định. Không thêm dark theme.                                                                                                                                                                                          |
| Loading / empty / error | Có ảnh lỗi/thử lại, loading/busy và lỗi share/save/thiếu quyền; thiếu forecast, chưa có ảnh/điểm dừng/thông báo có empty state. Loading/error API chưa phát sinh trong mock, cần bổ sung khi nối API thật.                                                                                                         |
| Motion                  | Reanimated/Gesture Handler cho gesture và transform/opacity; animation có cleanup/Reduced Motion. Local photo viewer/checklist không thuộc `panel` dùng chung: chưa có cơ chế visibility toàn cục cho mọi overlay hoặc card cuộn khỏi màn hình. Không thêm hệ thống đó khi chưa có profiling chứng minh cần thiết. |
| Expo SDK 57             | Typecheck và Metro export web/Android kiểm tra được module resolution, transform Worklets và bundle Hermes. Không tương đương native compile hay kiểm tra đầy đủ runtime iOS/Android. Không chạy Expo Doctor vì không đổi dependency/config/SDK.                                                                   |

## Kiểm tra đã thực hiện

- `npx tsc --noEmit --noUnusedLocals --noUnusedParameters`: đạt.
- `npm test`: **54/54 đạt**, không skip; baseline trước đợt này là 47 tests.
- Thêm 7 tests cho store/dữ liệu Home: bốn scenario và liên kết ảnh với chuyến/ngày, draft qua ranh giới tháng, thêm điểm không trùng/không mutate fixture, check-in idempotent/undo/điểm kế tiếp, giới hạn ảnh, xóa/reset/cách ly store, gợi ý vali cho cả chuyến.
- Giữ tests hình học viewer: fit, pan bounds, rubber band, double tap, paging; test chạy transform Babel Worklets thực tế để bảo vệ lỗi khởi tạo `clampPhoto` từng gặp.
- `npx expo export --platform web --output-dir .expo/home-review-web`: đạt, gồm static render routes.
- `npx expo export --platform android --output-dir .expo/home-review-android`: đạt, xuất Hermes bundle.
- `git diff --check`: đạt.
- Đã xem asset WebP sau khi tối ưu, xác nhận giữ alpha và hình thiết kế. Không coi đây là kiểm tra giao diện trên máy thật.

Không chạy lint theo yêu cầu hiện tại của chủ dự án. Không chạy kiểm tra UI trực tiếp trên browser, simulator hoặc điện thoại trong đợt này; không có số đo FPS/bộ nhớ/độ tương phản theo pixel.

## Cần xác nhận trên máy thật trước khi phát hành

1. Android và iOS: pinch/double tap/pan, vuốt ngang, kéo xuống và ảnh trở về đúng thumbnail, xoay màn hình, Reduced Motion.
2. Màn hình nhỏ/font lớn, TalkBack/VoiceOver: thứ tự focus, đọc nhãn/trạng thái, thoát modal, vùng chạm, tương phản trên ảnh/kính thực tế và bottom navigation không đè nội dung.
3. Share/save: cấp và từ chối quyền, Android/iOS version mục tiêu, ứng dụng nhận file, file gốc đủ kích thước. Android export chưa xác nhận quyền/native API chạy được trên thiết bị.
4. Profile release build: cuộn/zoom và thời gian mở ảnh, bộ nhớ sau nhiều lần mở/đóng; quyết định tối ưu tiếp từ số đo.
5. Khi nối API: loading/retry, lỗi mạng, dữ liệu rỗng/thiếu và lưu bền checklist/check-in/nhật ký; camera thật, thông báo và forecast thật còn ngoài phạm vi.

Các giới hạn mock là chủ đích giai đoạn UI. Checklist chỉ theo vòng đời dashboard; yêu thích chỉ theo lần xem; trips/memories/visited theo store phiên. Không mô tả những thao tác này là đã đồng bộ backend hoặc production-ready.

## Tài liệu liên quan

- [Home preview và ranh giới tích hợp](HOME-PREVIEW.md)
- [Tiến độ dự án](PROJECT-STATUS.md)
- [Nguồn ảnh và asset](../assets/images/home/README.md)
