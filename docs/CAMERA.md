# Camera chuyến đi · 29/10/2026

## Giao diện và điều hướng

- Camera layout follows the Locket reference: black background; square viewfinder with 10px side insets and 44px continuous corners; capsule header with trip icon and default avatar. Shutter: 88px, teal 2px ring, white 72px core. Flash/zoom use a 40% black surface and retain 44px touch targets. Memories use a compact amber counter, label and chevron. Dark navigation island highlights Home with a circular surface. Camera logic, permissions, zoom, image selection and saving remain unchanged.

- `/trip/camera?tripId=…&day=YYYY-MM-DD&stopId=…` là Stack screen trong `(workspace)`, dùng chung store Home. Route xác thực bằng Zod; thiếu/chuyến hủy/ngày không thuộc chuyến hiển thị trạng thái quay lại.
- Nút camera giữa bottom navigation vẫn chọn chuyến đang diễn ra và ngữ cảnh điểm ghé như trước. Panel camera hiện có được chuyển vào screen mới qua `CaptureScreenRedirect`; nhật ký/check-in cũng dùng luồng này. Khi chưa có chuyến đang diễn ra, navigation giữ thông báo hướng dẫn chọn chuyến đi.
- Nút quay lại, tên chuyến, khung vuông, flash trái, zoom phải, chọn ảnh–shutter teal–đổi camera, số ảnh thật của chuyến, và các lối tắt Chi tiết chuyến đi/Trang chủ/Kỷ niệm. Nền tối là bề mặt chụp ảnh riêng, dùng token photo/camera, không bật dark theme toàn app.
- Safe area dùng insets hệ thống; nội dung cuộn được trên màn thấp hoặc khi tăng cỡ chữ. Vùng chạm 44–48px, shutter có phản hồi spring, zoom chạy UI thread và tôn trọng Reduce Motion.

## Chụp, chọn và lưu ảnh

- `expo-camera ~57.0.6`, `expo-image-picker ~57.0.20`, `expo-image-manipulator ~57.0.21`, cài bằng `expo install`. Camera chỉ xin quyền khi người dùng chọn Cho phép; vẫn dùng được bộ chọn ảnh hệ thống nếu không cấp quyền camera.
- Zoom 1×/2×/3× là **zoom kỹ thuật số**: preview scale, ảnh crop theo đúng khung vuông và hệ số, không giả định mức zoom tối đa của phần cứng. ImageManipulator xử lý nền, không chạy vòng lặp pixel/base64 trong JavaScript.
- Ảnh chụp/chọn được xem trước. Quay lại để chụp lại; dấu tích xác nhận lưu vào nhật ký. Chọn ảnh dùng system picker, không yêu cầu quyền đọc toàn bộ thư viện hoặc microphone. Ảnh được crop vuông, nén JPEG quality 0.85, tối đa 1600px, không giữ EXIF.
- `saveCapturedMoment` giữ URI, ngày theo ngữ cảnh chuyến, giờ lưu và địa điểm nếu có. Không tự đánh dấu đã ghé. Số kỷ niệm đếm ảnh thực tế trong store, không gán cứng 66. Có khóa tránh thao tác chụp/chọn/lưu trùng khi đang xử lý.
- Camera unmount khi mất focus, app ra nền hoặc nhật ký đang mở; quyền được đọc lại khi app trở về foreground (kể cả sau khi mở Settings).

## Trạng thái tích hợp

- Đây vẫn là **phiên frontend preview**: metadata nằm trong Zustand, ảnh xử lý nằm trong cache SDK, chưa upload backend hoặc tự lưu vào Photos. Không bảo đảm tồn tại sau khi khởi động lại app/OS dọn cache. Giữ giới hạn preview hiện có 20 kỷ niệm toàn phiên; khi đầy hiển thị lỗi và cho mở nhật ký để gỡ ảnh cũ.
- Bản development build cũ thiếu native module hiển thị hướng dẫn cài lại trước khi import camera, tránh lỗi missing native module toàn app.
- Sau khi thêm module/config plugin, tạo lại development build Android bằng `npx expo run:android` (hoặc build iOS/EAS tương ứng). Metro reload đơn thuần không thêm native module.
- Android/Hermes và Web static export, TypeScript/no-unused và 164 bài kiểm tra hiện có đạt. Ba bài mới kiểm tra crop/zoom, lưu ảnh đúng chuyến và giới hạn phiên, không tự check-in, guard cho native build cũ và điều hướng về đúng màn. Chưa kiểm tra camera/flash/lens trên thiết bị thật.
- Expo Doctor: 20/21 mục đạt; mục phiên bản ghi nhận 9 patch mismatch có sẵn trong SDK 57 (`expo`, `@expo/ui`, constants/dev-client/glass-effect/linking/router/sharing/splash-screen). Không nâng các gói ngoài phạm vi. Không chạy lint theo yêu cầu người dùng.

Tài liệu API SDK 57: [Camera](https://docs.expo.dev/versions/v57.0.0/sdk/camera/), [ImagePicker](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/), [ImageManipulator](https://docs.expo.dev/versions/v57.0.0/sdk/imagemanipulator/).
