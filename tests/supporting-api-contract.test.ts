import assert from "node:assert/strict";
import { test } from "node:test";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

test("destination search sends the query and reads all catalog pages", async () => {
  const calls: { q: string; page: number; size: number }[] = [];
  const load = tripModuleLoader({ "@/services/api/client": { apiClient: {
    get: async (url: string, options: { params: { q: string; page: number; size: number } }) => {
      assert.equal(url, "/api/v1/destinations"); calls.push(options.params);
      return { data: { success: true, data: { page: options.params.page, totalPages: 2, content: [{
        id: `10000000-0000-0000-0000-00000000000${options.params.page + 1}`, code: "VN", name: "Đà Nẵng",
      }] } } };
    },
  } } });
  const { searchDestinations } = load<typeof import("../src/features/trip/api/destinations-api.ts")>("src/features/trip/api/destinations-api.ts");
  assert.equal((await searchDestinations(" Đà Nẵng ")).length, 2);
  assert.deepEqual(calls.map((call) => [call.q, call.page, call.size]), [["Đà Nẵng", 0, 100], ["Đà Nẵng", 1, 100]]);
});

test("profile updates use PUT /users/me and invalid form values never reach the server", async () => {
  let count = 0;
  const user = { id: "10000000-0000-0000-0000-000000000001", fullName: "Updated name", email: "user@example.com", role: "USER" };
  const load = tripModuleLoader({ "@/services/api/client": { apiClient: {
    put: async (url: string, body: { fullName: string; avatarUrl: string }) => {
      count++; assert.equal(url, "/api/v1/users/me"); assert.equal(body.fullName, "Updated name");
      return { data: { success: true, data: user } };
    },
  } } });
  const { authApi } = load<typeof import("../src/features/auth/api/auth-api.ts")>("src/features/auth/api/auth-api.ts");
  assert.equal((await authApi.updateProfile({ fullName: " Updated name ", avatarUrl: "" })).fullName, user.fullName);
  await assert.rejects(authApi.updateProfile({ fullName: "", avatarUrl: "" }));
  await assert.rejects(authApi.updateProfile({ fullName: "Name", avatarUrl: "javascript:alert(1)" }));
  assert.equal(count, 1);
});

test("current weather sends coordinates and route responses reject invalid distances", async () => {
  const load = tripModuleLoader({ "@/services/api/client": { apiClient: {
    get: async (url: string, options: { params: { latitude: number; longitude: number } }) => {
      assert.equal(url, "/api/v1/public/weather/current"); assert.equal(options.params.latitude, 16); assert.equal(options.params.longitude, 108);
      return { data: { success: true, data: { latitude: 16, longitude: 108, time: "2026-11-05T10:00:00", temperature: 28,
        apparentTemperature: 29, humidity: 70, rainMm: 0, windSpeedKmH: 5, isDay: true, weatherCode: 0,
        condition: "CLEAR_SKY", riskLevel: "LOW", summary: "Clear" } } };
    },
    post: async () => ({ data: { success: true, data: { distanceMeters: -1, durationSeconds: 60, encodedPolyline: "", provider: "geoapify" } } }),
  } } });
  const { mapsApi } = load<typeof import("../src/features/trip/api/maps-api.ts")>("src/features/trip/api/maps-api.ts");
  assert.equal((await mapsApi.currentWeather(16, 108)).temperature, 28);
  await assert.rejects(mapsApi.route({ origin: { latitude: 16, longitude: 108 }, destination: { latitude: 17, longitude: 109 } }), { code: "INVALID_RESPONSE" });
});
