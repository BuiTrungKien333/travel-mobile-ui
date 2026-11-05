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
- The original day-settings part persisted the origin label; part 4 below now stores coordinates and uses the settings for routing/optimization. Foreground GPS is still in P1-04. Pins are implemented separately below.

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
- The solver minimizes distance subject to fixed positions. Appointment feasibility is checked afterward; this is not a full search over all routes that meet time windows. Part 4 below also supplies saved origin/transport/departure/return settings.

### Kiểm tra phần 3 trên app

1. Chọn một điểm ghé, gán ngày và giờ đến; ghim trên thẻ lượt ghé hoặc trong form rồi lưu.
2. Thoát/mở lại chuyến: điểm vẫn có nhãn ghim và đúng giờ. Thử ghim khi chưa có ngày/giờ: control bị khóa và có hướng dẫn.
3. Sắp xếp lại các điểm: điểm ghim giữ vị trí và giờ. Bỏ ghim rồi sắp xếp lại để kiểm tra có thể di chuyển.
4. Tối ưu một ngày có vài điểm, giữ một điểm ghim giữa lịch với giờ đủ rộng. Xem nhãn ghim trong preview; đóng preview giữ lịch cũ, bấm Áp dụng giữ điểm/giờ ghim và ghi chú.
5. Thử giờ ghim không thể đến kịp: phải báo lỗi để chỉnh giờ/bỏ ghim; lịch đang lưu không bị thay đổi.
6. Ngắt mạng khi lưu hoặc thử lưu bản cũ từ hai phiên: hiện lỗi, giữ nội dung form và không ghi đè lịch mới. Ghim/bỏ ghim liên tiếp không được báo xung đột nhầm.

## Day routing and optimization

Part 4 implements the remaining settings-to-route/optimizer work in P0-02. Restart the backend with Flyway enabled to apply `V18__trip_day_origin_coordinates.sql`, then reload mobile. No native dependency/configuration changes are required.

The existing day update body now accepts:

```json
{
  "version": 3,
  "startLocation": "Khách sạn",
  "startCoordinate": { "latitude": 11.94, "longitude": 108.44 },
  "startTime": "07:45",
  "returnToStart": true,
  "transport": "MOTORCYCLE",
  "durations": []
}
```

- `startCoordinate` is returned in each trip day as an object or null. Both latitude/longitude are required together, with ranges −90…90 and −180…180. A coordinate needs a nonblank origin label. Zero coordinates are valid.
- Current mobile sends coordinates explicitly, including null when clearing the origin. An older request that omits coordinates preserves them if the normalized label is unchanged; changing the label clears the old point. Legacy label-only records remain readable, but optimizing a day with an unresolved origin returns `409/TRIP_015` instead of guessing a location.
- The form searches places through the backend and supports choosing a visit from that day. Editing the label clears its previous point; saving nonblank text requires choosing a located result. Current-location GPS remains deferred to P1-04. Accommodation text is a search shortcut, not an implicit routing origin.
- Route points are origin → visits in saved order → origin when return-to-start is enabled. Missing coordinates leave the complete route unknown. Consecutive identical points do not create artificial travel legs. Origin, return legs, selected-day totals, and inter-visit legs use the selected mode; cache keys include mode, and disabled routes do not render old cached polylines.
- Route API modes map `car → DRIVE`, `motorcycle → TWO_WHEELER`, `walk → WALK`; the existing provider adapter maps these to Geoapify `drive`, `motorcycle`, and `walk`. See [Geoapify routing modes](https://apidocs.geoapify.com/docs/routing/). The existing route API limit is 25 coordinates per request; the app does not drop visits to manufacture a shorter request.
- Optimizer input comes from persisted day settings. An explicit start time takes priority; when absent, the existing first-arrival/08:00 fallback is retained. A distinct origin node avoids colliding with a visit ID when a day visit is selected as the origin. Round-trip distance/time includes the return leg, while the saved visit list contains only actual visits.
- Held–Karp still minimizes Haversine distance; transport changes time estimates, not the distance cost matrix. The timing assumptions are 35 km/h for driving/motorcycle (retaining the existing motorized model) and 4.5 km/h for walking. These are model assumptions, not road/traffic observations. The map's road route and the optimizer's estimate can differ; preview labels this distinction. Pin position/time checks remain active.

### Kiểm tra phần 4 trên app

1. Mở thiết lập ngày, tìm điểm xuất phát, chọn đúng kết quả/địa chỉ, đặt giờ đi và lưu. Mở lại chuyến để kiểm tra điểm đã chọn còn nguyên.
2. Đổi riêng ô tô/xe máy/đi bộ. Kiểm tra nơi xuất phát, giờ và quay về vẫn giữ; route/thời gian trên bản đồ cập nhật theo phương tiện.
3. Bật/tắt quay về điểm đầu: kiểm tra polyline, tổng quãng đường và chặng quay về ở cuối lịch. Thử chọn một điểm ghé làm nơi xuất phát, tránh chặng 0 giả hoặc nhân đôi lượt ghé.
4. Sửa chữ của nơi xuất phát rồi lưu khi chưa chọn kết quả: phải có lỗi ở trường đó. Dữ liệu cũ chỉ có tên cần được chọn lại trước khi tối ưu.
5. Tối ưu với giờ đi cụ thể và một điểm ghim có giờ đủ rộng. Preview phải thể hiện phương tiện/giờ/điểm đầu/quay về; đóng giữ lịch cũ, Áp dụng giữ đủ lượt ghé và ghim.
6. Đổi sang đi bộ hoặc đặt giờ đi quá muộn so với điểm ghim: nếu không kịp phải báo xung đột, không tự dời giờ ghim.
7. Thử lỗi search/route: có phản hồi lỗi, vẫn có thể chọn điểm trong ngày có tọa độ. Không dùng đường cũ trong cache khi route hiện tại thiếu dữ liệu hoặc bị tắt.

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
node --experimental-strip-types --test tests/backend-live-contract.test.ts tests/trip-api-contract.test.ts tests/trip-day-settings.test.ts tests/itinerary-pins.test.ts tests/day-route.test.ts tests/memory-api.test.ts tests/supporting-api-contract.test.ts
```

The real-response schema test is explicitly skipped when `BACKEND_CONTRACT_FIXTURE` is absent. The other tests run without a backend. HTTP mock tests alone do not establish compatibility with backend DTOs.
