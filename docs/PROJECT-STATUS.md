# Tiến độ Travel Mobile UI

Cập nhật: **19/10/2026**. Phạm vi chốt lần này: frontend Home. Ngày trong fixture Home là **21/10/2026** để tái hiện các trạng thái.

## Hiện trạng

| Hạng mục             | Trạng thái                                                                        | Phần còn lại                                                                                   |
| -------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Nền tảng UI          | Expo SDK 57, TypeScript strict, React Compiler, theme sáng, VI/EN mặc định VI     | Kiểm tra trên các kích thước/thiết bị mục tiêu                                                 |
| Auth                 | Đã có giao diện và code tích hợp; có tài liệu email/password, magic link, Google  | Không rà soát lại backend/auth trong lần chốt Home này; cấu hình môi trường theo tài liệu auth |
| Home · Người mới     | Hoàn thành UI và tương tác mẫu                                                    | API tạo chuyến/lập kế hoạch khi backend sẵn sàng                                               |
| Home · Sắp khởi hành | Hoàn thành UI, forecast/chọn ngày, checklist, nhắc hoàn thiện, album gần đây      | Forecast thật, dữ liệu chuyến, lưu checklist                                                   |
| Home · Đang đi       | Hoàn thành UI, timeline/check-in, thời tiết, nhật ký/ảnh mẫu                      | Dữ liệu thực tế, camera thật, lưu check-in/nhật ký                                             |
| Home · Đã đi         | Hoàn thành UI, dấu ấn và album gần đây                                            | Thống kê/lịch sử/ảnh từ backend                                                                |
| Header / navigation  | Dùng chung logo, nút thông báo, thanh kính và camera giữa                         | API thông báo; nội dung đầy đủ cho các tab ngoài Home                                          |
| Trình xem ảnh        | Có zoom/pan/paging/drag dismiss, toolbar, share/save và xóa preview               | QA gesture, quyền media, trợ năng, hiệu năng trên máy thật                                     |
| Rà soát Home         | Đã dọn cấu trúc, xử lý lỗi thực tế, bổ sung regression tests và cập nhật tài liệu | Lint chưa chạy theo yêu cầu; native QA còn chờ                                                 |

## Thay đổi trong lần rà soát

- Tách album và khung kính dùng chung khỏi các component dành riêng cho chuyến đang đi.
- Tách store preview, types và provider; thêm tests cho bốn scenario, draft, check-in, ảnh/ghi chú và vali.
- Bỏ modal/nhánh copy không còn sử dụng; bỏ bản ghi kỷ niệm tự phát sinh ngoài store.
- Chặn mở thumbnail lỗi; bổ sung điều khiển bàn phím cho viewer web.
- Dùng chung lifecycle motion theo focus/AppState/Reduced Motion và panel preview; không thêm memo/dependency đại trà.
- Bundle icon bản đồ WebP khoảng 19 KB thay PNG khoảng 1,53 MB, giữ PNG nguồn.
- Import đúng bốn font Roboto đang dùng thay vì kéo cả bộ font vào bundle native.

## Điều kiện trước khi tích hợp và phát hành

1. Chốt phần Home ở mức **UI với dữ liệu mẫu**; có thể chuyển sang module UI tiếp theo.
2. Thử trên Android/iOS: màn hình nhỏ, font lớn, safe area/bàn phím, screen reader, gesture ảnh, cấp/từ chối quyền và share/save; đo hiệu năng trên release build.
3. Khi backend sẵn sàng, nối API từng luồng và bổ sung loading/error/retry theo hợp đồng thật. Chức năng planning chưa sửa trong giai đoạn này.
4. Tắt `UI_PREVIEW_ENABLED` khi quay lại tích hợp auth. Sau đó thay dữ liệu Home mock bằng query hooks; hai công việc độc lập.

Đây là mốc hoàn thành frontend preview, chưa phải chứng nhận sẵn sàng production cho toàn bộ ứng dụng.

## Tài liệu

- [Hướng dẫn Home preview](HOME-PREVIEW.md)
- [Báo cáo rà soát Home và bằng chứng kiểm tra](HOME-REVIEW.md)
- [Auth integration](auth-integration.md)
- [Google Sign-In](google-auth.md)
