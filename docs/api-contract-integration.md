# API contract integration

The backend controller's imported DTO is authoritative. `TripController` uses `com.travel.trip.dto.*`; the older `dto.request.CreateTripRequest` and `dto.response.TripResponse` are not its HTTP contract.

## Trips

- List: `GET /api/v1/trips?page=0&size=100`, read `data.content` and continue through `data.totalPages`.
- Create: send a stable `clientRequestId`, `title`, `destination: { name, provinceId? }`, dates, optional `budget: { amount, currency: "VND" }` and preferences. Create/detail/update return `data.trip` plus `data.context`.
- Update: `PATCH /api/v1/trips/{id}` with the version the user viewed. Omitted fields remain unchanged; `null` clears budget/accommodation/notes.
- Date changes: call `POST /api/v1/trips/{id}/date-change-preview`. Ask before sending `acknowledgeDateImpact: true`. The backend moves removed-day stops to the pool atomically; the mobile must not overwrite that result with an old itinerary.
- Delete: `DELETE /api/v1/trips/{id}?version=...`. A version conflict reloads data and requires the user to review it before trying again.
- Destination suggestions come from `GET /api/v1/destinations?q=...`; custom destination names remain supported.

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
.\mvnw.cmd "-Dtest=MemoryMobileIntegrationTest,TripCrudIntegrationTest,MemoryServiceTest,MediaServiceTest" test
```

`MemoryMobileIntegrationTest` exercises real controllers/services/PostgreSQL, mocks only outbound Cloudinary/email, and exports actual response bodies to `target/mobile-api-contract.json`. From `travel-mobile-ui`:

```powershell
$env:BACKEND_CONTRACT_FIXTURE = (Resolve-Path '..\travel-system\backend\target\mobile-api-contract.json').Path
node --experimental-strip-types --test tests/backend-live-contract.test.ts tests/trip-api-contract.test.ts tests/memory-api.test.ts tests/supporting-api-contract.test.ts
```

The real-response schema test is explicitly skipped when `BACKEND_CONTRACT_FIXTURE` is absent. The other tests run without a backend. HTTP mock tests alone do not establish compatibility with backend DTOs.
