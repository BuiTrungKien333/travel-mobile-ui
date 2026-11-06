// Contract fixture derived from travel-system's MemoryController, MediaController and DTOs.
/* global pm */
const http = require("node:http");
const { Buffer } = require("node:buffer");
const userId = "10000000-0000-0000-0000-000000000001";
const memoryId = "20000000-0000-0000-0000-000000000001";
const mediaId = "30000000-0000-0000-0000-000000000001";
const tripId = "40000000-0000-0000-0000-000000000001";
const placeId = "50000000-0000-0000-0000-000000000001";
const trip = {
  id: tripId, title: "A real trip", destination: { name: "Đà Lạt", provinceId: null },
  startDate: "2026-01-01", endDate: "2026-01-02", status: "COMPLETED", mode: "RECAP", coverImageUrl: null,
  timeZone: "Asia/Ho_Chi_Minh", preferences: [], budget: null, accommodation: null, notes: null,
  readiness: { hasDates: true, hasPlaces: true, unscheduledCount: 1 }, dayCount: 2, stopCount: 1, memoryCount: 0, version: 0,
  days: [1, 2].map((day) => ({ id: `70000000-0000-0000-0000-00000000000${day}`, date: `2026-01-0${day}`, dayNumber: day,
    startLocation: null, startCoordinate: null, startTime: null, returnToStart: false, transport: "CAR" })),
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
};
const context = { serverTime: "2026-01-01T00:00:00Z", evaluatedDate: "2026-01-01" };
const stateKey = "memory-backend.state";
const fresh = () => ({ mode: "ok", memory: null, creates: 0, uploads: 0, keys: [], multipart: false });
const success = (data) => ({ success: true, data });
function send(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const state = await pm.state.get(stateKey) || fresh();
    if (url.pathname === "/__control" && req.method === "POST") {
      const next = url.searchParams.has("reset") ? fresh() : state;
      next.mode = url.searchParams.get("mode") || "ok";
      await pm.state.set(stateKey, next);
      return send(res, 200, next);
    }
    if (url.pathname === "/__state") return send(res, 200, state);
    if (req.headers.authorization !== "Bearer contract-test") return send(res, 401, { code: "AUTH_001" });
    let body = req.body;
    if (body === undefined) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks);
    }
    const json = () => Buffer.isBuffer(body) || typeof body === "string" ? JSON.parse(body.toString()) : body;
    const path = url.pathname;
    if (path === "/api/v1/media/limits") return send(res, 200, success({ maxFileBytes: 10485760 }));
    if (path === "/api/v1/trips" && req.method === "GET") return send(res, 200, success({
      content: [trip], page: 0, size: 100, totalElements: 1, totalPages: 1, context,
    }));
    if (path === `/api/v1/trips/${tripId}` && req.method === "GET") return send(res, 200, success({ trip, context }));
    if (path === "/api/v1/trips" && req.method === "POST") {
      const input = json();
      if (!input.clientRequestId || typeof input.title !== "string" || typeof input.destination?.name !== "string" || !input.startDate || !input.endDate ||
        (input.budget !== undefined && (typeof input.budget.amount !== "number" || input.budget.currency !== "VND"))) return send(res, 400, { code: "COMMON_001" });
      return send(res, 201, success({ trip: { ...trip, ...input, status: "PLANNING", mode: "PLANNING" }, context }));
    }
    if (path === `/api/v1/trips/${tripId}/places`) return send(res, 200, success([
      { id: "60000000-0000-0000-0000-000000000001", tripId, placeId,
        priority: null, estimatedDuration: null, notes: null, plannedOrder: 0, visited: true,
        createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
        place: { id: placeId, providerPlaceId: null, name: "Lâm Viên", address: null,
          latitude: null, longitude: null, provinceId: null, provinceName: null, category: null,
          createdAt: "2026-01-01T00:00:00Z" } },
    ]));
    if (path === "/api/v1/journal/memories" && req.method === "POST") {
      const input = json();
      if (!input.clientRequestId || input.media || !input.experiencedAt || input.note.length > 2000) return send(res, 400, { code: "COMMON_001" });
      state.keys.push(input.clientRequestId);
      if (!state.memory) {
        state.creates++;
        state.memory = { id: memoryId, userId, version: 0, tripId: input.tripId || null, placeId: input.placeId || null,
          note: input.note, experiencedAt: input.experiencedAt, coverImageUrl: null, mediaCount: 0, media: [] };
      }
      await pm.state.set(stateKey, state);
      if (state.mode === "create-response-lost") return send(res, 500, { code: "SERVER" });
      return send(res, 201, success(state.memory));
    }
    if (path === "/api/v1/media/upload" && req.method === "POST") {
      if (!state.memory || url.searchParams.get("memoryId") !== state.memory.id) return send(res, 404, { code: "MEMORY_001" });
      if (url.searchParams.get("tripId") !== state.memory.tripId) return send(res, 400, { code: "TRIP_001" });
      state.uploads++;
      // Reject JSON, a missing boundary, or the wrong multipart field name.
      const text = Buffer.isBuffer(body) ? body.toString("latin1") : String(body);
      state.multipart = /multipart\/form-data;.*boundary=/i.test(req.headers["content-type"] || "") && /name="file"; filename=/.test(text);
      if (!state.multipart) return send(res, 400, { code: "UPLOAD_003" });
      if (state.mode === "upload-failed") {
        await pm.state.set(stateKey, state);
        return send(res, 500, { code: "UPLOAD_004" });
      }
      state.memory.media = [{ id: mediaId, url: "https://example.com/photo.png", mimeType: "image/png", width: 1, height: 1, displayOrder: 0 }];
      state.memory.mediaCount = 1;
      state.memory.coverImageUrl = state.memory.media[0].url;
      state.memory.version++;
      await pm.state.set(stateKey, state);
      if (state.mode === "upload-response-lost") return send(res, 500, { code: "UPLOAD_004" });
      return send(res, 201, success({ mediaId, url: state.memory.coverImageUrl }));
    }
    if (path === "/api/v1/journal/memories/detail" && url.searchParams.get("memoryId") === memoryId && req.method === "GET") {
      if (!state.memory) return send(res, 404, { code: "MEMORY_001" });
      return send(res, 200, success(state.mode === "malformed" ? { ...state.memory, id: "bad" } : state.memory));
    }
    if (path === `/api/v1/journal/memories/${memoryId}` && req.method === "PATCH") {
      const input = json();
      if (input.version !== state.memory.version) return send(res, 409, { code: "MEMORY_003" });
      state.memory.note = input.note;
      state.memory.version++;
      await pm.state.set(stateKey, state);
      return send(res, 200, success(state.memory));
    }
    if (path === "/api/v1/journal/memories" && req.method === "GET") {
      const page = Number(url.searchParams.get("page"));
      const content = state.memory && page === 0 ? [state.memory] : [];
      return send(res, 200, success({ content, number: page, last: !state.memory || page > 0 }));
    }
    return send(res, 501, { code: "NOT_MODELED" });
  } catch { return send(res, 500, { code: "MOCK_ERROR" }); }
});
server.listen(process.env.PORT ? Number(process.env.PORT) : 4508);
module.exports = server;
