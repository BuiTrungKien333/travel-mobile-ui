# Phase 2 — Danh mục điểm đến

Cập nhật: **03/11/2026**. Đã nối picker điểm đến trong form tạo/sửa với danh mục Province nội bộ. Không gọi Google Places, không thay đổi map/timeline hoặc planning/AI. Backend `integration/team-sync` vẫn chưa merge.

## API và dữ liệu

`GET /api/v1/destinations?q=lam&page=0&size=20` cần Bearer access token như các API Trip.

- `q`: bỏ khoảng trắng hai đầu, tối đa 120 ký tự. Tìm chứa theo tên không phân biệt hoa/thường/dấu tiếng Việt, hoặc mã. `%`, `_`, `\` được xem là ký tự thường, không phải wildcard SQL.
- `page`: từ 0; `size`: 1–100, mặc định 20. Thứ tự ổn định `code,id`; page vượt cuối trả content rỗng và giữ metadata.
- Response: envelope `success/data` hiện có. `data` gồm `content: [{id,code,name}]`, `page`, `size`, `totalElements`, `totalPages`, `context: {serverTime,evaluatedDate}`; ngày context theo Asia/Ho_Chi_Minh. Input sai trả lỗi validation chung; không lộ entity.
- Hai query count/page có cùng snapshot transaction read-only. Chỉ đọc projection cần thiết; không load entity graph hoặc gọi provider ngoài. Không thêm extension hoặc migration.

**Province không phải địa điểm du lịch/city/địa chỉ.** Chọn một dòng danh mục thì mobile gửi `destination: {name,provinceId: selected.id}`. Chọn dòng tự nhập hoặc submit bàn phím thì gửi tên đã trim + `provinceId:null`. Không đoán ID tỉnh từ tên thành phố.

**Main migrations hiện chỉ tạo bảng Province, không seed danh mục.** Comment “63 tỉnh/thành” trong V1 không chứng minh đã nạp dữ liệu. Seed Đà Nẵng trong `db/rag-demo` là demo opt-in, không phải nguồn master data production. DB mới có thể trả danh mục rỗng. Task này không tự thêm/thay danh mục hành chính hoặc mã chưa được xác minh; trước production cần import nguồn chính thức được dự án duyệt. Người dùng vẫn tạo chuyến đi bằng tên tự nhập khi catalog rỗng.

## Mobile

- Shared Axios + Zod tại boundary; React Query infinite pagination, cache theo account/search, debounce 400 ms, hủy request theo lifecycle và cache 5 phút. Không copy catalog vào Zustand.
- FlatList tải từng trang; trạng thái loading/empty/error/retry và Xem thêm có VI/EN. Trong lúc debounce không cho chọn kết quả của truy vấn cũ; tên tự nhập luôn khả dụng.
- RHF giữ cả tên và ID. Adapter detail giữ ID để mở form sửa không làm mất liên kết. PATCH chỉ gửi destination khi tên hoặc ID thay đổi, bao gồm trường hợp chỉ đổi ID/clear ID; sửa ghi chú không thay destination.
- `EXPO_PUBLIC_UI_PREVIEW=true` vẫn dùng gợi ý mẫu cục bộ, catalog query bị tắt. Không cần dependency/build native mới.

## Nghiệm thu local

1. Khởi động backend dev/DB theo setup hiện có. Mobile dùng API mode (mặc định), đúng API URL, đăng nhập tài khoản thật.
2. Tạo chuyến → chọn điểm đến. Nếu DB có Province: thử tên không dấu hoặc mã, chọn dòng danh mục, tạo chuyến rồi mở lại Sửa; lựa chọn phải còn được đánh dấu đúng ID.
3. Gõ tên riêng như `Đà Lạt`, chọn dòng tự nhập (có chú thích không liên kết tỉnh/thành) hoặc submit bàn phím. Tạo/lưu và tải lại; tên giữ nguyên, ID null. Thử cả khi tên tự nhập trùng tên danh mục.
4. Mở Sửa, chỉ đổi ghi chú; ID phải giữ nguyên. Đổi sang Province khác hoặc tên tự nhập rồi lưu; detail/list tải lại phải đồng nhất.
5. Với DB rỗng: phải hiện thông báo danh mục trống và vẫn nhập tên được. Ngắt mạng: thấy error/retry; không mất tên đang nhập. Với catalog đủ lớn: Xem thêm nối trang, không chọn nhầm kết quả cũ khi gõ nhanh.
6. Chuyển preview opt-in: vẫn có gợi ý mẫu, không gọi API danh mục.

## Kiểm tra đã chạy

- **357 backend tests đạt**, gồm 7 integration tests catalog qua PostgreSQL 17 Testcontainers, Flyway và login/JWT/security thật; kiểm tra pagination/search/literal escaping/validation/auth/empty và create→edit round-trip ID.
- **215 mobile tests đạt**, gồm transport/schema/query và hành vi picker/form thực với các platform/hook doubles; TypeScript strict/no-unused đạt. Export web và Android/Hermes đạt.
- Không lint theo yêu cầu. Chưa chạy HTTP e2e từ UI đến backend đang phục vụ, QA trực quan/thiết bị/screen reader hoặc đo latency production. Các điều kiện production Phase 1 và master data vẫn mở; 7/7 operations Trip CRUD đã có code không đồng nghĩa MVP đã nghiệm thu.
