# P0-04 · Ảnh, ghi chú và tài khoản nhất quán

Ngày triển khai: **06/11/2026**. Phạm vi: hoàn thiện toàn bộ phần code P0-04 theo kế hoạch đồ án. **Code đã triển khai; checklist điện thoại dưới đây chưa được nghiệm thu.** Không coi test dùng platform double là đã chụp/chọn ảnh trên thiết bị thật.

## Hành vi đã triển khai

- Mỗi ảnh mới có chủ sở hữu là user ID của phiên đăng nhập đã được chấp nhận. Store được tạo lại theo user và session generation; cả đăng nhập lại cùng tài khoản cũng vô hiệu hóa action của phiên cũ. Response đến muộn không được cập nhật cache/store của phiên mới.
- Ảnh legacy thiếu user ID được giữ nguyên nhưng không tự nhận vào tài khoản hiện hành. UI thông báo; người dùng có thể chọn lại ảnh thuộc mình từ thư viện. Không hiển thị ảnh của tài khoản khác.
- Ảnh được chép vào vùng riêng trước khi upload. Checkpoint request ID → server ID/version → media ID/version được lưu để mở lại và retry. Không bắt buộc cấp quyền ghi thư viện để upload, không tự retry nền.
- Backend khóa memory khi upload có key. Hai request cùng capture UUID và nội dung trả cùng media ID, chỉ một hàng DB/một lần gọi Cloudinary. Cùng key nhưng đổi nội dung trả 409; owner/trip không khớp bị từ chối. Caller cũ không gửi key vẫn tương thích.
- Ghi chú dùng version lúc bắt đầu sửa. Không âm thầm lấy version mới rồi ghi đè. Editor local mở trước lúc đồng bộ phải mở lại sau khi ảnh chuyển sang server. Phân biệt lỗi cloud và lỗi ghi checkpoint local sau khi cloud đã lưu.
- Xóa có xác nhận và checkpoint `deletePending`. Mất mạng giữ bản riêng và cho thử lại; chỉ bỏ bản riêng sau khi server xác nhận. Retry ảnh đã xóa không tạo lại ảnh. Bản sao trong thư viện điện thoại vẫn còn. Ảnh chưa gán chuyến cũng có đường xóa trong Xem sau.
- Upload/sửa/xóa/export/gán chuyến dùng khóa thao tác cùng ảnh. Sau khi đã gửi create chưa rõ kết quả, không cho đổi đích ảnh làm sai request gốc.
- Metadata native/web được đọc riêng từng record; một record lỗi không làm trống album. Không xóa record hỏng. Lỗi đọc cả kho có nút thử lại riêng; ảnh cloud vẫn xem được.
- Khi chưa tải được chuyến, ảnh riêng có album chỉ đọc từ metadata đã lưu. Không dùng album này để tạo/gán ảnh vào một chuyến giả. Cloud list tải thành công xác nhận ảnh đã xóa thì không làm sống lại backup đã upload.
- Ảnh cloud có bản riêng phù hợp sẽ dùng file riêng để hiển thị, vẫn giữ ghi chú/version mới từ server; mất mạng không buộc tải lại URL cloud để xem ảnh đã chụp trên máy này.
- Từ chối camera vẫn chọn gallery được. Từ chối gallery có giải thích và nút Cài đặt, vẫn dùng camera được. Từ chối lưu vào thư viện không làm thất bại bản riêng/upload.

## Kiểm tra tự động đã chạy

- Backend: **21/21 đạt**, gồm 6 `MemoryMobileIntegrationTest` trên PostgreSQL 18 thật, 7 `MemoryServiceTest`, 8 `MediaServiceTest`. Cloudinary/email được mock. Bao gồm upload đồng thời/replay, đổi payload, ownership, tạo lặp, ghi chú có version và đọc lại dữ liệu.
- Mobile: **299 test; 292 đạt, 7 lỗi cũ, không skip/cancel**. Đã dùng response fixture xuất từ integration test backend hiện hành qua `BACKEND_CONTRACT_FIXTURE`.
- Sau bổ sung ưu tiên file ảnh riêng khi có cloud cache, chạy lại nhóm consistency + memory HTTP: **19/19 đạt**.
- 8 test mới trong `memory-account-consistency.test.ts` đều đạt: metadata native/web hỏng, editor cũ, cập nhật version, xóa lỗi/retry, session cũ, response muộn, khóa thao tác, cloud delete/offline album. Thêm hồi quy store ownership/reopen/delete và gallery denial/camera fallback; cập nhật test fixture cho contract ngày/chức năng xóa.
- TypeScript đạt. ESLint toàn bộ file TS/TSX thay đổi và mới: **0 lỗi, 0 cảnh báo**. Backend compile đạt.
- 7 lỗi full suite còn lại thuộc harness cũ: `place-details.test.ts` (1), `trip-ui-flows.test.ts` (4), `trip-weather-details.test.ts` (2). Đây là các lỗi đã tồn tại trước P0-04; không tuyên bố toàn suite xanh.
- Log/report nằm trong `travel-system/backend/target/p004-*.log` và `target/surefire-reports` (ignored). PostgreSQL test trên cổng 55439 đã dừng, cụm test tạm đã xóa. Không dùng database/.env của người dùng.

## Chuẩn bị chạy

1. Restart backend để Flyway áp dụng `V19__idempotent_capture_uploads.sql`. Giữ các migration V17/V18 và code P0-03/poolUpdates hiện có.
2. Reload mobile. Không thêm dependency/native module; thay đổi này không cần chạy prebuild/build native mới. Thiết bị vẫn cần kết nối đúng URL backend theo DEVICE-SETUP.
3. Chuẩn bị tài khoản A/B, một chuyến hôm nay và một chuyến đã đi; xác nhận Cloudinary backend đang cấu hình và hoạt động để kiểm tra ảnh thật.

## Checklist trên điện thoại

- [ ] A chụp ảnh nhanh chưa gán chuyến → Xem sau; đóng hẳn/mở lại vẫn có ảnh và không báo đã upload.
- [ ] Chọn ảnh gallery → gán đúng chuyến/ngày/địa điểm → mở album và kiểm tra thông tin. Ngày tương lai không được upload kỷ niệm.
- [ ] Chụp trong chuyến → kiểm tra bản riêng, thư viện nếu cho phép và trạng thái đồng bộ. Tải lại/mở lại app không tăng số ảnh.
- [ ] Tắt mạng trước upload → ảnh còn riêng; bật mạng rồi nhấn thử lại → một ảnh cloud. Thử ngắt mạng sau khi server đã nhận → retry vẫn chỉ có một ảnh.
- [ ] A có ảnh riêng/chờ upload → logout → B không thấy ảnh A. B chụp ảnh → logout/login A: ảnh A còn, ảnh B không xuất hiện. Thử đổi tài khoản khi request còn đang chạy.
- [ ] Ảnh cũ thiếu owner không được tự nhận vào A/B; có thông báo dễ hiểu. Không mất file gốc.
- [ ] Sửa ghi chú ảnh chưa upload → đóng/mở lại còn đúng. Sửa ghi chú đã upload → reload server/mở lại còn đúng, đúng ảnh/chuyến/ngày.
- [ ] Mở editor rồi đồng bộ/thay đổi cùng ảnh ở nơi khác → lưu bản cũ báo xung đột/yêu cầu mở lại, không ghi đè âm thầm. Cancel không ghi.
- [ ] Xóa ảnh cloud → xác nhận → quay về album, reload/mở lại không xuất hiện. Ảnh trong thư viện điện thoại vẫn còn.
- [ ] Xóa lúc mạng lỗi → bản riêng có trạng thái chờ xóa/nút retry; retry sau khi có mạng xóa đúng ảnh. Xóa ảnh nhanh chưa gán trong Xem sau cũng hoạt động.
- [ ] Từ chối quyền camera → chọn gallery vẫn dùng được. Từ chối gallery → có giải thích/Cài đặt và camera vẫn dùng được. Từ chối chép thư viện → bản riêng/upload vẫn hoạt động, thông báo không nhận đã lưu thư viện.
- [ ] Với kho test có một metadata hỏng: các ảnh tốt vẫn xem được, có cảnh báo; file lỗi không tự bị xóa.
- [ ] Mở lại khi server không kết nối được: ảnh riêng xem được qua album chỉ đọc; có retry cloud, không cho dùng shell này để capture/gán. Khi server trở lại hiển thị dữ liệu chuyến thật.

Sau review/push và QA, xử lý lỗi thực tế trước; nếu người dùng yêu cầu tiếp tục kế hoạch thì chuyển sang **P1-01**. Không tự commit/push hoặc triển khai production.
