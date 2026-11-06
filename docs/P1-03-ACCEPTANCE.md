# P1-03 · Chuyển động, gesture và hiệu năng cảm nhận

Triển khai ngày **06/11/2026**. **Phần code hoàn tất, phần đo/QA điện thoại chưa thực hiện.** ADB đã chạy được nhưng danh sách thiết bị trống. Người dùng chọn: **“Chưa tiện, hoàn thiện code và checklist đo trước”**. Không ghi FPS/jank thực tế khi chưa đo.

## Chuyển động và vòng đời đóng màn

- Root/auth/workspace Stack nhận lựa chọn giảm chuyển động của hệ thống. Đổi cài đặt trong phiên cập nhật React state qua listener có cleanup; route camera cũng bỏ hiệu ứng slide khi giảm chuyển động được bật.
- Sheet dùng animation Reanimated theo token hiện có. Bỏ lớp fade của native Modal trên các sheet vốn đã tự animate backdrop/panel để chỉ còn một nguồn điều khiển chuyển động.
- `useDismissLifecycle` dùng chung cho sheet/viewer: một yêu cầu đóng có một serial; Apply chỉ chạy sau khi đóng thành công, tối đa một lần. Callback muộn sau unmount hoặc từ animation cũ bị bỏ qua.
- Animation đóng bị hủy sẽ bỏ callback Apply đang chờ và phục hồi trạng thái mở; người dùng có thể thử đóng lại. Callback cũ không được hoàn tất một lần đóng mới.
- Sheet đang bận vô hiệu hóa pan và đường đóng bằng code. Giữ guard hỏi bỏ dữ liệu chưa lưu trước animation từ P1-02. Pan sheet/map/reorder dùng một ngón để không tranh gesture nhiều ngón của nội dung.
- Viewer dùng SharedValue `get/set`, tránh phép gán `.value` không phù hợp với quy tắc React Compiler. Visual spring/timing tiếp tục dùng `ReduceMotion.System`; các gate chống tap nhầm vẫn là thời gian xử lý input.

## Gesture và layout

- Reorder có snapshot ngày/thứ tự/điểm ghim. Đổi ngày, thay đổi thứ tự/ghim từ query hoặc unmount hủy lượt kéo cũ; drop đến muộn không ghi API. Một lượt thả không commit hai lần.
- Trạng thái kéo không khóa cuộn của ngày mới. Reset xóa active/offset và chỉ số từ/đến; teardown chặn callback của màn đã đóng.
- Giữ phân công hiện có: handle map để resize, timeline để cuộn, giữ rồi kéo để reorder, swipe ngang để mở tác vụ. Không thay handler cuộn Reanimated bằng handler JS mỗi frame.
- Viewer giữ snapshot danh sách trong phiên mở để query refetch không làm đổi index giữa lúc pinch/pan. Overlay thông tin/xác nhận/thao tác khóa gesture ảnh; Back vẫn đóng overlay hoặc viewer theo luồng sẵn có.
- Pinch rồi pan không bị hiểu là kéo đóng. Paging bị hủy trả ảnh về vị trí hiện tại. Đóng từ ảnh đang zoom hoặc swipe xuống vẫn đi qua vòng đời hoàn tất một lần.

## Phạm vi tối ưu có kiểm chứng

1. Timeline chỉ ghi lại slot sang UI thread nếu ID/ghim/chiều cao thay đổi. Test với **30 điểm và 50 lần render mảng mới nhưng cùng nội dung**: **0 lần ghi slot thừa** sau lần khởi tạo; chiều cao đo được vẫn giữ lại sau render.
2. Viewer chỉ duyệt/render cửa sổ ảnh hiện tại và tối đa hai ảnh lân cận; giữ absolute page index cho carousel. Khi mở chỉ đo thumbnail trong cửa sổ này, các trang khác đo khi chuyển tới. Viewer nhật ký hiện chỉ nhận tối đa **6 ảnh preview**; không tuyên bố đây từng là nút thắt cho album hàng trăm ảnh.
3. Bỏ hai state update đồng bộ từ effect của viewer: lỗi ảnh được suy ra để hiện công cụ, spinner gắn khóa ảnh/lần retry và chỉ bật qua timer. Hình ảnh tiếp tục có khung kích thước cố định và cache hiện có.
4. Cố định identity worklet nhả resize lock của map theo dependency thực, tránh effect expand giữ callback cũ hoặc chạy lại vì function đổi identity.

Đây là số đếm hành vi trong kiểm thử có platform doubles, **không phải đo FPS, thời gian frame hoặc hiệu năng release trên điện thoại**. Không thêm thư viện, build native, backend API hoặc dữ liệu demo giả vào tài khoản.

## Kiểm chứng tự động

- TypeScript: đạt.
- ESLint toàn bộ TS/TSX sửa/mới: **0 lỗi, 0 cảnh báo**.
- Nhóm trọng tâm: **25/25 đạt** — vòng đời đóng/hủy/unmount, giảm chuyển động, stale reorder, slot transfers, pinch/pan/paging/Back, map resize, gesture root và worklet geometry.
- Full mobile: **323 test, 317 đạt, 6 lỗi cũ**, không skip/cancel; dùng fixture response backend thật từ P0-04.
- 6 lỗi test cũ: `trip-ui-flows.test.ts` (4), `trip-weather-details.test.ts` (2).
- `npm run lint` toàn repo còn **6 lỗi cũ, 2 cảnh báo cũ**, giảm từ 51 lỗi/3 cảnh báo trước lượt này. Các file thay đổi đã sạch; không disable rule.
- Log: `travel-system/backend/target/p103-*.log` (ignored). Không chạy test backend vì không sửa backend/contract/schema.

## Checklist điện thoại

- [ ] Mở/đóng sheet điểm đến, ngày và chỉnh sửa khoảng 10 lượt: nút, backdrop, Back, kéo xuống đều không đóng/Apply lặp.
- [ ] Form bẩn → kéo đóng → chọn tiếp tục chỉnh sửa: sheet còn mở. Sheet đang lưu không kéo/đóng được.
- [ ] Đang đóng sheet/viewer thì xoay máy hoặc chuyển nền/foreground: trở lại vẫn đóng/mở được, không áp dụng lựa chọn cũ.
- [ ] Cuộn nhanh timeline 20–30 điểm, sau đó kéo map: không kẹt cuộn/resize lock; nút mở map về đúng snap point.
- [ ] Giữ kéo reorder; thử vuốt ngang, điểm ghim và chuyển ngày. Không mở nhầm chi tiết sau nhả tay, không di chuyển qua ghim, không gửi drop của ngày cũ.
- [ ] Viewer: pinch → pan → thả; swipe ngang → ngắt; swipe xuống; Back khi đang zoom. Không mất backdrop, ảnh không méo hoặc kẹt ở giữa transition.
- [ ] Mở thông tin/xác nhận xóa hoặc share/save: gesture ảnh không hoạt động xuyên overlay; Back quay về đúng tầng.
- [ ] Bật giảm chuyển động trong cài đặt thiết bị rồi quay lại app: chuyển màn/camera/sheet không còn chuyển động lớn, chức năng vẫn đầy đủ. Tắt lại cũng hoạt động.
- [ ] Tạo vài chuyến, một ngày 30 điểm và album khoảng 100 ảnh thật; cuộn album không đổi kích thước ảnh hoặc tải đồng loạt cả album. Viewer preview nhật ký vẫn giới hạn 6 ảnh.

## Cách đo khi có thiết bị

Kiểm tra nhanh ở development build bằng **Perf Monitor** trong Dev Menu; ghi rõ đây là số đo development. Nếu cần kết luận hiệu năng bản trình diễn, đo thêm bản release phù hợp trên cùng máy. React Native lưu ý debug tooling ảnh hưởng kết quả và khuyến nghị kiểm tra hiệu năng ở release. [React Native performance](https://reactnative.dev/docs/performance), [Perf Monitor](https://reactnative.dev/docs/debugging).

Không chạy build mới trong lượt này. Sau khi đã có bản cài và một điện thoại được ADB nhận, mở PowerShell:

```powershell
$adbPath = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$appPackage = 'com.travel.mobile'
& $adbPath devices -l
& $adbPath shell dumpsys gfxinfo $appPackage reset
```

Mở app, chạy riêng từng luồng khoảng 30 giây: timeline/map/reorder; sheet mở/đóng; album/viewer. Đo ba lượt với cùng dữ liệu, cache/mạng và cài đặt chuyển động. Sau mỗi lượt, lưu kết quả, ví dụ:

```powershell
& $adbPath shell dumpsys gfxinfo $appPackage framestats |
  Out-File -LiteralPath (Join-Path $env:TEMP 'wego-p103-frames.txt') -Encoding utf8
& $adbPath shell dumpsys meminfo $appPackage |
  Out-File -LiteralPath (Join-Path $env:TEMP 'wego-p103-memory.txt') -Encoding utf8
```

Đổi tên file cho từng luồng/lượt để không ghi đè kết quả. Nếu package bản cài khác `com.travel.mobile`, thay biến tương ứng; nếu có nhiều thiết bị, chọn serial bằng tùy chọn `-s`. Android hỗ trợ `gfxinfo ... framestats`, nhưng định dạng/chi tiết phụ thuộc phiên bản hệ điều hành. Kết hợp với quan sát và Perf Monitor; không gọi số thống kê Android này là FPS của JS. [Android dumpsys](https://developer.android.com/tools/dumpsys).

| Luồng | Máy/Android/build | Dữ liệu | Lượt 1/2/3 | Điểm khựng/khóa thao tác | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| Sheet | Chưa ghi | 10 lần mở/đóng | Chưa đo | Chưa quan sát trên máy thật | Chờ thiết bị |
| Timeline/map/reorder | Chưa ghi | 30 điểm, có ghim | Chưa đo | Chưa quan sát trên máy thật | Chờ thiết bị |
| Album/viewer | Chưa ghi | 100 ảnh grid, tối đa 6 ảnh viewer preview | Chưa đo | Chưa quan sát trên máy thật | Chờ thiết bị |

Sau review/push, xử lý lỗi đo/QA thực tế nếu có; phần kế tiếp khi người dùng yêu cầu là **P1-04 — Những tính năng làm rõ giá trị app du lịch**.
