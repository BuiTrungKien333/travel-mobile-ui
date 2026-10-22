# Rà soát danh sách và tạo chuyến đi

Ngày: **21/10/2026**. Phạm vi: `src/features/trip`, liên kết với Home preview store/panels và các tests hiện có. Dùng quy định dự án, `ui-ux-pro-max` và `vercel-react-native-skills`. Báo cáo ban đầu được giữ bên dưới để truy vết. **Các phát hiện đã được sửa trong lượt tiếp theo ngày 21/10/2026**; chưa implement màn chi tiết mới.

## Kết luận

Các màn hình đã có nền tảng UI: chia feature/component, Expo Image, FlatList có key ổn định, primitives/theme, safe area dùng chung, bộ chọn ngày/địa điểm, thao tác tạo draft. Trong bản review ban đầu, dữ liệu form, danh sách và dữ liệu dùng để sửa kế hoạch chưa nhất quán. Các lỗi này hiện đã được xử lý ở mức frontend preview.

Chưa phát hiện P0/P1 trong phạm vi đọc code. Các vấn đề P2 sau ảnh hưởng trực tiếp đến thao tác thông thường, không phụ thuộc backend hay tình huống hiếm.

## Kết quả sửa lỗi · 21/10/2026

| Phát hiện ban đầu | Cách xử lý hiện tại |
| --- | --- |
| P2 · Apply ngày và motion đóng | Mỗi lần mở có một session riêng; dùng `usePickerSheetMotion`, chỉ commit sau animation đóng. Back/backdrop/swipe không commit. Bỏ effect mở phụ thuộc props ngày. |
| P2 · Chọn địa điểm cũ còn sót | Session lấy working copy mới từ parent mỗi lần mở; Cancel bỏ thay đổi; mở lại phản ánh cả thao tác xóa ở form. |
| P2 · Sai địa điểm theo thành phố | Đổi thành phố bỏ các stop cũ kèm thông báo; city chưa có fixture hiển thị empty state. Suggestions trong plan dùng cùng bank, giữ ví dụ Đà Lạt của Home. |
| P2 · Hai nguồn trips, giới hạn bốn mục | List và plan chỉ đọc scoped preview store; bỏ `.slice(0, 4)`, fallback ngoài store và file `sample-trips.ts` không còn dùng. Các scenario Home vẫn giữ riêng. |
| P2 · Bỏ mất budget/preferences | Lưu budget dạng number + VND và preference IDs ổn định; plan hiện lại giá trị. Copy/sort stop array và copy preferences khi tạo. |
| P2 · Form/pickers chưa có EN | Copy VI/EN tập trung, locale cho ngày/tiền/tên địa điểm. Tên người dùng nhập không tự dịch. |
| P3 · Validation/dirty close | RHF + Zod, field errors, focus/picker tương ứng; xác nhận khi đóng form có dữ liệu chưa lưu. Kiểm tra date-only, thứ tự ngày, tối đa 365 ngày, độ dài và budget. |
| P3 · Tokens/a11y/cover | Dùng lại spacing/font/motion tokens; lịch có nhãn ngày đầy đủ/selected/disabled và vùng chạm 44px; input có labels, lỗi có alert; bỏ double assertion outline. Thành phố khác dùng cover rừng trung tính. |

- Sửa thêm luồng tạo thành công: store đã mở plan mới thì form không gọi `closePanel` làm mất panel đó.
- Header tạo chuyến: khoảng đệm nội dung trên **32px cộng safe area thiết bị**, theo yêu cầu tinh chỉnh sau review; không hardcode chiều cao status bar.
- Giữ UI hiện tại, mock/in-memory, auth preview và backend nguyên phạm vi. Đổi scenario hoặc khởi động lại vẫn reset dữ liệu preview; chưa có persistence/API.

### Kiểm chứng sau sửa

- TypeScript strict + no-unused: đạt.
- `npm test`: **87/87 đạt**, gồm 13 regression tests mới cho schema/metadata, store allocations, list thực tế có hơn bốn chuyến, apply/cancel/drag motion và picker selection/calendar labels.
- Export Android/Hermes và Web: đạt. Chỉnh tăng padding header sau export chỉ thay spacing token; chưa xác nhận thị giác trên điện thoại.
- Harness UI thay platform views/hooks/motion để kiểm tra handlers/state; không thay thế kiểm tra gesture/bàn phím/safe area và screen reader trên thiết bị thật.
- Không chạy lint, không thêm dependency, chưa làm màn chi tiết mới hoặc planning backend.

## Phát hiện ban đầu theo mức độ (lịch sử)


### P2 · 1. Áp dụng ngày có thể hủy chính animation đóng sheet

- `components/date-range-sheet.tsx:141`: effect mở/khởi tạo sheet phụ thuộc cả `startDate` và `endDate`; khi visible nó đặt `isClosing=false` và chạy animation mở.
- `components/date-range-sheet.tsx:223`: Áp dụng gọi `onApply` trước `handleAnimatedClose`.
- Parent `components/create-trip-modal.tsx:148` cập nhật hai props ngày ngay trong `onApply`. Sau render mới, effect có thể ghi đè animation đóng; callback nhận `finished=false` và không gọi `onClose`.
- Kết quả có thể phải bấm Áp dụng thêm lần nữa, hoặc sheet mở lại dù ngày đã cập nhật. Đây là kết luận từ luồng effect/callback, chưa tái hiện trên thiết bị.
- Hướng sửa: tách lifecycle mở sheet khỏi props đang commit, hoặc commit kết quả và đóng theo một luồng rõ ràng. Khi đổi ngày đang mở, không khởi động lại animation mở chỉ vì parent nhận giá trị mới. Test cả apply, cancel, đóng bằng back/drag.

### P2 · 2. Lựa chọn địa điểm cục bộ không đồng bộ khi mở lại

- `components/place-picker-sheet.tsx:173`: `useState(initialSelected)` chỉ lấy giá trị khởi tạo.
- Effect mở ở dòng 192 chỉ chạy motion, không reset selection từ giá trị đã được parent chấp nhận.
- Chọn thêm rồi đóng mà không Áp dụng: lần mở tiếp theo vẫn có lựa chọn chưa commit. Xóa một địa điểm ở form cha rồi mở sheet: checkbox vẫn có thể giữ lựa chọn cũ; áp dụng lại sẽ đưa điểm đã xóa trở về.
- Hướng sửa: mỗi lần mở tạo một working selection từ `initialSelected`; chỉ commit khi Áp dụng, Cancel bỏ thay đổi của phiên sheet đó. Không sync liên tục khiến parent render làm mất thao tác đang chọn.

### P2 · 3. Đổi điểm đến không xử lý các địa điểm đã chọn

- `components/create-trip-modal.tsx:141` chỉ đổi destination/title, giữ nguyên `selectedStops`.
- `components/place-picker-sheet.tsx:154` fallback sang ngân hàng Đà Lạt khi không có destination tương ứng. Ví dụ chọn Huế/Sapa vẫn có thể thêm địa điểm Đà Lạt.
- Người dùng có thể tạo chuyến Đà Nẵng chứa các điểm Đà Lạt mà không được báo.
- Hướng sửa: khi thực sự đổi điểm đến, giải quyết lựa chọn cũ bằng lời nhắc ngắn hoặc reset có phản hồi. Chưa có fixture thì hiển thị empty state đúng ngữ cảnh, không giả có dữ liệu của thành phố khác. Nếu sau này hỗ trợ nhiều thành phố, phải thể hiện rõ mô hình đó.

### P2 · 4. Danh sách cắt mất chuyến và dùng hai nguồn dữ liệu khác nhau

- `screens/trips-screen.tsx:29`: chỉ lấy store entries có ID bắt đầu `draft-`, ghép thêm `sampleTrips` rồi `.slice(0, 4)`.
- Tạo năm draft được chấp nhận nhưng danh sách chỉ còn bốn draft; draft thứ năm bị ẩn. Các chuyến gốc trong Home store cũng không phải nguồn của danh sách này. Không thể đạt empty state thật vì luôn có sampleTrips.
- `features/home/components/preview-panels.tsx:70` phải fallback tìm chuyến mẫu ngoài store để mở plan, nhưng `store/trip-preview-store.ts` chỉ mutate trips trong store. Nút thêm điểm của sample trip vì vậy không sửa được dữ liệu.
- Đã thực thi store thật: `sample-dalat` không có trong store; gọi `addStop` không thay đổi ngày trống. Tạo năm draft rồi áp dụng biểu thức danh sách hiện tại cho kết quả chỉ bốn draft, ẩn `draft-5`.
- Hướng sửa: seed fixtures một lần vào cùng nguồn state đọc/ghi; danh sách render nguồn đó và filter/sort rõ ràng. Bỏ cắt bốn phần tử hoặc có pagination/load more thật. Không sửa bằng thêm một fallback write path khác cho sampleTrips.

### P2 · 5. Ngân sách và sở thích biến mất sau tạo

- `components/create-trip-modal.tsx:106` có state và UI cho budget/tags nhưng payload `createDraft` ở dòng 192 chỉ chứa destination, dates, title và stops.
- `types/preview-state.ts` và `Trip` chưa có trường nhận các giá trị đó. Ngay trong phiên preview, thao tác thành công không giữ dữ liệu vừa nhập; không phải chỉ thiếu API/persistence qua lần khởi động lại.
- Hướng sửa: nếu giữ hai input, thêm chúng vào schema/type/store và luồng đọc lại; budget lưu dưới dạng số/currency, định dạng chỉ ở UI. Hoặc tạm ẩn trường chưa hoạt động. Đừng hiển thị trường chỉnh được rồi âm thầm bỏ dữ liệu.

### P2 · 6. Luồng tạo/pickers chưa hỗ trợ ngôn ngữ EN của app

- `CreateTripModal` không dùng `useTripCopy`/i18n; tiêu đề, placeholder, lỗi, preferences và CTA là chuỗi VI trực tiếp.
- Các picker cũng có copy và weekday/month label cứng; PlacePicker render `item.name.vi`, `item.kind.vi` bất kể locale.
- Bật EN chỉ đổi một phần danh sách, khi tạo chuyến lại chuyển về VI. Đây là vi phạm yêu cầu sản phẩm hiện tại.
- Hướng sửa: tập trung copy tạo chuyến/pickers trong feature i18n, dùng locale cho dữ liệu và định dạng ngày/tiền. Tên chuyến do người dùng đặt không tự dịch.

### P3 · 7. Form/validation chưa theo quy ước chung

- Form dùng nhiều state và validation thủ công, chưa dùng RHF + Zod như dự án; format/date helper và bank dữ liệu nằm trong file UI lớn.
- Cần field errors cụ thể, scroll/focus về trường sai, validation date-only/range hợp lý và giới hạn độ dài. Khi đóng form đã nhập dữ liệu, nên xác nhận bỏ thay đổi hoặc giữ draft, không cần hỏi nếu chưa nhập gì.
- Không đề nghị chia file chỉ vì có khoảng 1.300 dòng. Nên tách schema/form logic, copy, dữ liệu mẫu và các khối có trách nhiệm rõ; tránh abstraction cho tương lai chưa cần.

### P3 · 8. Tokens và trợ năng chưa đồng đều

- Có raw spacing/font/animation distances lặp trong StyleSheet, cùng `as unknown as TextStyle` ở các input web. Nhiều giá trị đang đúng thị giác nhưng chưa nằm trong token, nên chỉnh một lần khó đồng bộ.
- Calendar cell ở `date-range-sheet.tsx:426` chưa có role/nhãn ngày đầy đủ/selected state cho screen reader; vùng cao 40 nhỏ hơn target 44 của dự án. Hiển thị số ngày đơn lẻ chưa đủ ngữ cảnh cho tháng/năm.
- Inputs tên/budget/search cần label trợ năng liên kết; phần lỗi cần announcement phù hợp. Không tắt font scaling hoặc thu nhỏ toàn UI để tránh wrap.
- Một số cover mẫu cho Đà Nẵng/Hội An/Nha Trang là ảnh địa danh Đà Lạt (`utils/trip-images.ts`). Giai đoạn mock có thể dùng placeholder trung tính, nhưng không nên làm người dùng hiểu sai địa điểm.
- Giữ FlatList, Expo Image và state slices hiện có. Không có bằng chứng cần thay thư viện list hoặc blanket memoization cho bốn card.

## Kiểm tra và giới hạn tại lượt review ban đầu

- TypeScript `npx tsc --noEmit --noUnusedLocals --noUnusedParameters`: đạt.
- `npm test`: **74/74 đạt**. Tests hiện có kiểm tra formatters/store/logic thuần; chưa bao phủ apply/cancel của pickers, form budget/tags hay cách TripsScreen lấy/cắt dữ liệu.
- Thực thi kiểm tra store cho sample ID và năm draft như mô tả ở mục 4. Script kiểm tra tạm nằm trong `.expo/`, không phải app code/test mới.
- Không chạy lint theo yêu cầu hiện hành. Không build lại vì chỉ review/tạo tài liệu.
- Chưa thao tác UI trực tiếp trên Android/iOS: keyboard với modal xếp chồng, safe area, Dynamic Type, focus, screen reader, tốc độ gesture và animation cần xác nhận trên thiết bị.

## Thứ tự xử lý đề nghị ban đầu (1–4 đã thực hiện)

1. Sửa lifecycle apply/cancel của hai picker và nhất quán destination/selected places.
2. Dùng một nguồn trips cho list/plan/mutations, bỏ giới hạn hiển thị bốn chuyến.
3. Quyết định giữ/lưu budget/preferences, hoàn thiện form validation và VI/EN.
4. Chuẩn hóa token/a11y ở các control chạm nhiều; giữ bố cục đã chốt.
5. Sau đó nối entry từ list/Home vào màn chi tiết mới để tránh duy trì nhiều luồng chỉnh kế hoạch.

Đề xuất màn chi tiết: [TRIP-DETAIL-DESIGN.md](TRIP-DETAIL-DESIGN.md).
