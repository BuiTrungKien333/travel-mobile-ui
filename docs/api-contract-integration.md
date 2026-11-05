# API contract integration

The backend controller's imported DTO is authoritative. `TripController` uses `com.travel.trip.dto.*`; the older `dto.request.CreateTripRequest` and `dto.response.TripResponse` are not its HTTP contract.

## Trips

- List: `GET /api/v1/trips?page=0&size=100`, read `data.content` and continue through `data.totalPages`.
- Create: send a stable `clientRequestId`, `title`, `destination: { name, provinceId? }`, dates, optional `budget: { amount, currency: "VND" }` and preferences. Create/detail/update return `data.trip` plus `data.context`.
- Update: `PATCH /api/v1/trips/{id}` with the version the user viewed. Omitted fields remain unchanged; `null` clears budget/accommodation/notes.
- Date changes: call `POST /api/v1/trips/{id}/date-change-preview`. Ask before sending `acknowledgeDateImpact: true`. The backend moves removed-day stops to the pool atomically; the mobile must not overwrite that result with an old itinerary.
- Delete: `DELETE /api/v1/trips/{id}?version=...`. A version conflict reloads data and requires the user to review it before trying again.
- Destination suggestions come from `GET /api/v1/destinations?q=...`; custom destination names remain supported.

## Day settings

`PUT /api/v1/trips/{tripId}/days/{date}` saves a day's settings and any changed visit durations in one database transaction. The date is ISO `YYYY-MM-DD` and must be an existing day inside the trip. Restart the updated backend before running this mobile version. The columns already exist in migration V14; this change adds no migration or native dependency.

```json
{
  "version": 3,
  "startLocation": "Khách sạn",
  "startTime": "07:45",
  "returnToStart": true,
  "transport": "MOTORCYCLE",
  "durations": []
}
```

- Send all four settings. `startLocation` is a trimmed name/address, at most 200 characters, or `null`; `startTime` is local `HH:mm` or `null`. Return-to-start requires a nonblank starting point. Transport is `CAR`, `MOTORCYCLE`, or `WALK`.
- Changed durations use `{ "stopId": "internal-place-uuid", "durationMinutes": 90 }`; the ID is the itinerary's `placeId`, not its item ID. Each duration is 5–480 minutes. When sending durations, also send `expectedItineraryUpdatedAt` from the itinerary loaded when the editor opened. The mobile omits unchanged durations.
- The response is `data.trip` plus `data.context`. Each `days[]` entry now includes `startLocation`, `startTime`, `returnToStart`, and `transport`, including days with no stops. Real changes increment the trip version; an identical save is a no-op.
- Durations preserve arrival times, order, notes, and other days. A failed write rolls back the settings and durations together. A settings change also invalidates optimization proposals based on the old itinerary timestamp.
- A stale trip version or itinerary snapshot returns `409/TRIP_010`; the mobile refreshes queries but preserves the draft. Close/reopen the editor to use the refreshed data. A cancelled trip is read-only (`409/TRIP_013`); another owner's or deleted trip returns 404.
- This part persists the origin label. Origin coordinates/GPS and applying these settings to routing/optimization are still pending. Pins are implemented separately below.

### Kiểm tra phần 2 trên app

1. Restart backend, mở một chuyến có ít nhất hai ngày.
2. Ở một ngày chưa có điểm ghé, lưu nơi xuất phát, giờ đi và quay về. Thoát chuyến rồi mở lại để kiểm tra dữ liệu.
3. Đổi riêng phương tiện; mở lại và kiểm tra nơi xuất phát/giờ/quay về cùng thiết lập ngày khác vẫn giữ nguyên.
4. Ở ngày có điểm ghé, đổi thiết lập và thời lượng rồi lưu. Kiểm tra giờ đến/thứ tự/ghi chú không bị thay đổi ngoài ý muốn.
5. Sửa nhưng đóng sheet trước khi lưu: dữ liệu server giữ nguyên. Khi đang lưu, nút lưu và thao tác đóng bị chặn.
6. Ngắt kết nối rồi lưu: thông báo lỗi hiện trong sheet, nội dung nhập còn nguyên để thử lại.
7. Nếu có hai phiên mở cùng chuyến, sửa ở phiên thứ nhất rồi lưu bản cũ ở phiên thứ hai: phải báo xung đột, không ghi đè. Đóng/mở editor ở phiên thứ hai trước khi lưu lại.

## Pinned visits

Restart the backend with Flyway enabled to apply `V17__itinerary_pins.sql`, then reload the mobile app. This part changes JavaScript/API/DB behavior and adds no native dependency.

- `GET/PUT /api/v1/trips/{tripId}/itinerary` now reads/saves `days[].stops[].pinned`. A pin belongs to a visit on a planned day; an arrival time is required. Clearing its day/time in the editor also clears the pin.
- Mobile sends `expectedUpdatedAt` from the itinerary snapshot it viewed. A stale snapshot returns `409/TRIP_008`; closing/reopening the editor gets the refreshed schedule. The backend keeps this token optional for older clients. Omitted `pinned` preserves the flag for the same existing day/place; explicit false unpins it.
- Save and apply return the timestamp read back from PostgreSQL after flushing, so a second save uses the same timestamp precision as the database. Changing trip dates invalidates old itinerary snapshots as well.
- Optimization passes each pin's sequence/time to the planner. Held–Karp restricts transitions to preserve pinned positions; the timeline waits until a pinned appointment if it arrives early. If the selected route reaches an appointment late, it returns `409/TRIP_014`; no itinerary is applied. Mobile explains how to adjust the time or unpin.
- Apply validates pins against the current saved itinerary, rejects moved positions/times, and preserves flags and notes. Closing a proposal keeps the saved schedule unchanged. Manual editing of the visit can intentionally change its appointment or unpin it.
- The solver minimizes distance subject to fixed positions. Appointment feasibility is checked afterward; this is not a full search over all routes that meet time windows. Saved origin/transport/departure/return settings are not yet wired into this optimizer.

### Kiểm tra phần 3 trên app

1. Chọn một điểm ghé, gán ngày và giờ đến; ghim trên thẻ lượt ghé hoặc trong form rồi lưu.
2. Thoát/mở lại chuyến: điểm vẫn có nhãn ghim và đúng giờ. Thử ghim khi chưa có ngày/giờ: control bị khóa và có hướng dẫn.
3. Sắp xếp lại các điểm: điểm ghim giữ vị trí và giờ. Bỏ ghim rồi sắp xếp lại để kiểm tra có thể di chuyển.
4. Tối ưu một ngày có vài điểm, giữ một điểm ghim giữa lịch với giờ đủ rộng. Xem nhãn ghim trong preview; đóng preview giữ lịch cũ, bấm Áp dụng giữ điểm/giờ ghim và ghi chú.
5. Thử giờ ghim không thể đến kịp: phải báo lỗi để chỉnh giờ/bỏ ghim; lịch đang lưu không bị thay đổi.
6. Ngắt mạng khi lưu hoặc thử lưu bản cũ từ hai phiên: hiện lỗi, giữ nội dung form và không ghi đè lịch mới. Ghim/bỏ ghim liên tiếp không được báo xung đột nhầm.

## Memories and media

- Detail: `GET /api/v1/journal/memories/detail?memoryId=...`.
- Note update: `PATCH /api/v1/journal/memories/{id}` with `{ version, note }`.
- `GET /api/v1/media/limits` publishes the upload byte limit. Pixel/dimension limits are client image-preparation limits.
- Upload: multipart field `file`, with **both** `tripId` and `memoryId` query parameters. Quick captures without a trip stay on the device until assigned to a trip.
- Memory creation accepts an optional `clientRequestId` for backward compatibility. Mobile always supplies it and preserves it across retries. Same owner/key/payload returns the existing memory; different payload returns `MEMORY_004`. A stale note version returns `MEMORY_003`.
- Before retrying an upload, read memory detail. A lost upload response must not cause the same photo to be uploaded again.
- Migration `V16__memory_request_identity_and_version.sql` adds the request identity and version fields. Restart the backend with Flyway enabled before using the updated mobile.

## Profile and weather

Profile editing uses `PUT /api/v1/users/me` and updates the profile query cache. The current-day weather control calls `/api/v1/public/weather/current`; forecast remains available for the selected date. Auth, trip places, routes, and itinerary optimization continue through their existing endpoints.

## Verification

From `travel-system/backend`, with Docker available (or the existing external test-database configuration):

```powershell
.\mvnw.cmd "-Dtest=MemoryMobileIntegrationTest,TripCrudIntegrationTest,TripMutationIntegrationTest,ItineraryPinsIntegrationTest,MemoryServiceTest,MediaServiceTest" test
```

`MemoryMobileIntegrationTest` exercises real controllers/services/PostgreSQL, mocks only outbound Cloudinary/email, and exports actual response bodies to `target/mobile-api-contract.json`. From `travel-mobile-ui`:

```powershell
$env:BACKEND_CONTRACT_FIXTURE = (Resolve-Path '..\travel-system\backend\target\mobile-api-contract.json').Path
node --experimental-strip-types --test tests/backend-live-contract.test.ts tests/trip-api-contract.test.ts tests/trip-day-settings.test.ts tests/itinerary-pins.test.ts tests/memory-api.test.ts tests/supporting-api-contract.test.ts
```

The real-response schema test is explicitly skipped when `BACKEND_CONTRACT_FIXTURE` is absent. The other tests run without a backend. HTTP mock tests alone do not establish compatibility with backend DTOs.
