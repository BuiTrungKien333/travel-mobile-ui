# Phase 2 — API sửa/xóa chuyến đi và kết nối UI

Ngày: **03/11/2026**. Scope đã thực hiện theo yêu cầu: PATCH metadata/date range, date impact preview, DELETE và mobile UI. Không merge backend đồng đội, không nối AI/planning hoặc Places/Maps/Media trong đợt này. Các điều kiện nghiệm thu Phase 1 vẫn được theo dõi riêng.

## API hoạt động

Các endpoint có prefix `/api/v1` và dùng auth/error envelope hiện có.

| API | Input | Output |
| --- | --- | --- |
| `PATCH /trips/{id}` | `version`, các field metadata muốn sửa; dates phải đi cặp; `acknowledgeDateImpact` khi cần | 200 `{success:true,data:{trip,context}}` |
| `POST /trips/{id}/date-change-preview` | `version,startDate,endDate` | 200 `{success:true,data:{baseVersion,startDate,endDate,dayCount,removedDates,addedDates,movedToPoolCount,requiresAcknowledgement}}` |
| `DELETE /trips/{id}?version=N` | UUID trong path, version nguyên không âm trong query | 204, không body |

PATCH không nhận status, owner, timeZone, clientRequestId hay field lạ. Có thể xóa budget/accommodation/notes bằng null; omitted giữ nguyên. JSON version dạng string/fraction không được ép kiểu thành số nguyên. Validation/date range/preferences/budget cùng quy tắc contract; chỉnh ngày quá khứ được phép. CANCELLED chỉ xem/xóa.

- Check ownership trước khi tiết lộ conflict. Owner khác/unknown/deleted read trả 404; version cũ trả 409 `TRIP_002`; cần xác nhận đổi ngày trả 409 `TRIP_003`; CANCELLED edit trả `TRIP_006`.
- Mutation khóa dòng Trip trong transaction và tăng version đúng một lần khi thật sự đổi. No-op không tăng version/updatedAt. Preview dùng snapshot chỉ đọc, không ghi token/job và không giữ lock để chờ UI.
- PATCH kiểm tra lại impact khi commit, không dùng kết quả preview làm quyền ghi. Các mutation Places/Itinerary sau này cũng phải khóa/bump cùng root Trip.
- DELETE cùng owner trên bản đã xóa trả 204, nhưng cấu trúc version vẫn phải hợp lệ. Không có restore API. Soft-delete Trip và mọi Memory liên quan cùng transaction; giữ media metadata/file reference và Place dùng chung. Không gọi Cloudinary hoặc provider.

## Quyết định dữ liệu khi đổi ngày

Giữ các `trip_days` trùng calendar date, gồm ID và cấu hình; ngày mới nhận default. Không tự dịch lịch sang ngày mới hoặc tự khôi phục lịch khi thêm lại ngày cũ.

**V11 `retain_removed_trip_schedule`:** thêm `itinerary_items.removed_at`. Appointment ra ngoài range được đánh dấu inactive, giữ nguyên note/start/end time/sequence và các metadata cũ. Readiness chỉ đếm lịch active (`removed_at IS NULL`). Không xóa vĩnh viễn hoặc copy đè ghi chú của TripPlace.

TripPlace là canonical membership/pool; estimated_duration/notes/visited hiện hữu không bị ghi đè. Legacy appointment thiếu membership được thêm TripPlace trước khi gỡ lịch để không mất địa điểm. Một place còn lịch active ở ngày giữ lại không bị tính là chuyển về pool. Backend chưa có cột pin; không suy diễn dữ liệu pin từ fixture UI.

Đây là giữ dữ liệu phục vụ migration/recovery lịch trình sau này, không phải UI xem archive mới. Phase Itinerary phải lọc archive và chốt cách phục hồi metadata appointment khi người dùng xếp lại lịch. Memory/experiencedAt/media không đổi khi đổi ngày.

**Không sửa V1–V10.** Chỉ chạy V11 trong PostgreSQL Testcontainers ở lượt triển khai. Khi người dùng restart backend thật, Flyway sẽ áp migration mới; review/backup DB có dữ liệu cần giữ trước đó.

## Mobile

- API mode: mở chi tiết chuyến thật → `…` → **Sửa chuyến đi** hoặc **Xóa chuyến đi**. Preview giữ cách dùng cũ, không gọi API.
- Tái sử dụng TripEditForm/TripDetailsSheet/TripDeleteAlert và semantic theme/VI/EN. Không thiết kế lại Home hoặc timeline.
- Form RHF gửi chỉ các field dirty; rỗng nullable thành null. Giữ provinceId khi tên destination không đổi; đổi tên từ picker text bỏ provinceId cũ để tránh gắn sai tỉnh.
- Preview tác động nếu đổi ngày; cần chuyển điểm về pool thì mở xác nhận. Hủy giữ form, không ghi. Xác nhận gửi cùng version và payload đã xem.
- Pending khóa save/inputs/dismiss/swipe; error giữ form để thử lại. Conflict không tự thay version; người dùng chọn rõ **Bỏ chỉnh sửa, tải bản mới** để review lại. Với DELETE, conflict yêu cầu tải/review trước một lần xác nhận xóa mới.
- Thành công dùng DTO server trả về để cập nhật detail và invalidate list, itinerary, places theo owner; xóa loại detail và làm mới list/memory liên quan. Kiểm tra session version cả trước cache publication để kết quả cũ không ghi lại cache sau logout.
- API mode vẫn chỉ hiển thị metadata/day descriptors; map/timeline thật, journal upload, thời tiết và Home tổng hợp chờ các phase riêng. Menu Nhật ký dẫn đến trạng thái chưa kết nối hiện có.

## Kiểm tra

- Backend: **350 tests đạt**, gồm **13 integration tests mutation mới**, PostgreSQL 17 + Flyway V11 + auth/security thật. Kiểm tra null/omission/no-op, version/ownership, CANCELLED, dates/pool/legacy recovery, concurrent edit, idempotent delete và rollback khi lỗi ghi days hoặc Memory.
- Mobile: **208 tests đạt**; schema/transport/payload, xác nhận ngày, giữ form/409, retry delete, reload-before-delete, cache owner/session, pending dismiss và chọn ngày quá khứ. TypeScript strict/no-unused đạt.
- Export web và Android/Hermes đạt; kiểm tra contract/API/UI mutation lần cuối thêm 16 tests đạt. Không lint theo yêu cầu, không dependency/native config mới nên không chạy lại Expo Doctor.
- Chưa QA tương tác browser/Android, native modal/gesture/screen reader hay HTTP e2e UI → backend thật; không đo latency production.

## Cách nghiệm thu local

1. Review V11, chuẩn bị DB dev đã backup nếu cần; khởi động backend dev theo setup hiện có. Chọn đúng API URL của web/emulator/điện thoại.
2. Mobile mặc định auth thật; bảo đảm không bật `EXPO_PUBLIC_UI_PREVIEW=true`. Đăng nhập, tạo chuyến hoặc mở chuyến của tài khoản hiện tại.
3. `…` → Sửa: đổi tên/ghi chú/ngân sách, lưu; quay về list/Home, refresh và mở lại để kiểm tra. Bỏ ngân sách/ghi chú rồi lưu để kiểm tra null.
4. Thử hai cửa sổ cùng mở Sửa. Lưu ở A rồi lưu ở B: B phải giữ form và báo conflict, không ghi đè tự động.
5. Đổi ngày: chuyến mới chưa có schedule không cần confirm pool; backend test đã seed legacy appointments để kiểm tra case có điểm, vì UI/API xếp lịch thật chưa nối.
6. Xóa có xác nhận: thành công về list, reload không hiện chuyến. Tài khoản khác không thể đọc/sửa/xóa UUID đó. Thử mất mạng để thấy pending/error và retry, không báo xóa thành công giả.

## Chưa hoàn tất toàn bộ Phase 2

**Bổ sung cùng ngày:** GET `/destinations` và picker tạo/sửa đã triển khai, nâng lên **7/7 operations**. Mốc mới: 357 backend/215 mobile tests, TypeScript và web/Android export đạt. Xem [danh mục điểm đến](DESTINATIONS-INTEGRATION.md). Main migrations không seed Province; import danh mục chính thức và QA môi trường thực còn mở. Không đánh dấu MVP/production complete chỉ từ tests/export.
