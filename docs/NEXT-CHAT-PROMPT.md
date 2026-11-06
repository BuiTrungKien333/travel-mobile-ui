# Gợi ý mở đầu phiên tiếp theo

Hãy đọc `AGENTS.md` nếu chưa có trong ngữ cảnh, rồi xem phần mới nhất trong:
- `docs/AGENT-HANDOFF.md`
- `docs/PROJECT-STATUS.md`
- `docs/MOBILE-MVP-IMPLEMENTATION-PLAN.md`
- `docs/P0-03-ACCEPTANCE.md`
- `docs/P0-04-ACCEPTANCE.md`

Đây là đồ án môn Phát triển ứng dụng di động của sinh viên năm cuối. Ưu tiên app chạy đúng, thao tác rõ ràng, UI/UX mượt và đẹp; giữ Ocean Teal, Roboto, theme sáng, cỡ chữ gọn và navigation icon-only đã chốt. Không tự nâng dependency hoặc triển khai hạ tầng production.

Workspace hiện hành:
- Mobile: `D:\MobileTravel\travel-mobile-ui`
- Backend: `D:\MobileTravel\travel-system\backend`

Mobile dùng API thật, camera thật và dữ liệu ảnh local/server; các snapshot preview cũ không mô tả đầy đủ ứng dụng hiện tại.

Ngày 06/11/2026, người dùng cho phép làm toàn bộ P0-03 trong một lượt. Code sáu luồng đã triển khai; chưa QA điện thoại. Đọc checklist P0-03 trước khi tuyên bố nghiệm thu hoàn tất. Backend cần restart để nhận `poolUpdates` của request save itinerary, sau đó reload mobile; phần này không có migration/dependency/native module mới.

P0-04 đã được triển khai trọn phần code trong lượt tiếp theo ngày 06/11/2026 theo yêu cầu riêng của người dùng. Backend có migration V19 chống trùng upload, cần restart để áp dụng. Xem mốc phần 8 trong handoff/status và checklist P0-04; QA điện thoại chưa hoàn tất.

Nếu người dùng yêu cầu code tiếp, bám kế hoạch và lỗi QA thực tế; giai đoạn kế tiếp là P1-01 (đồng nhất giao diện/phân cấp thông tin), không tự chuyển sang production. Mặc định làm một phần có thể review rồi dừng; không tự commit/push.

Không tự commit/push. Giữ thay đổi của người dùng, không đọc/ghi đè bí mật trong .env. Báo đúng kiểm tra đã chạy; test với platform/HTTP double không thay thế QA thiết bị.
