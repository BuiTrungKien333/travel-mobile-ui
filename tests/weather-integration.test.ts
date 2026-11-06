import assert from "node:assert/strict";
import { test } from "node:test";
import * as tokens from "../src/theme/tokens.ts";
import { ApiError } from "../src/services/api/api-error.ts";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";

function fixture() {
  const date = "2026-11-07";
  const hours = [8, 12, 15, 18, 21].map((h) => ({
    time: `${date}T${String(h).padStart(2, "0")}:00:00`,
    temperature: 24,
    precipitationProbability: h === 15 ? 70 : 10,
    rainMm: h === 15 ? 1 : 0,
    weatherCode: h === 15 ? 61 : 1,
    condition: h === 15 ? "RAINY" : "PARTLY_CLOUDY",
    riskLevel: "CAUTION",
  }));
  return {
    date,
    today: date,
    availableThrough: "2026-11-22",
    fetchedAt: "2026-11-07T06:30:00Z",
    location: {
      placeId: "a0000000-0000-4000-8000-000000000001",
      name: "Saved place",
      latitude: 16,
      longitude: 108,
      basis: "SAVED_PLACE",
    },
    forecast: {
      latitude: 16,
      longitude: 108,
      timezone: "Asia/Ho_Chi_Minh",
      providerName: "open-meteo",
      dailySummaries: [
        {
          date,
          minTemperature: 18,
          maxTemperature: 27,
          maxPrecipitationProbability: 70,
          totalRainMm: 1,
          dominantCondition: "PARTLY_CLOUDY",
          highestRiskLevel: "CAUTION",
          hourlyForecasts: hours,
        },
      ],
    },
    current: {
      time: `${date}T13:30:00`,
      temperature: 25.2,
      apparentTemperature: 26,
      humidity: 70,
      rainMm: 0,
      windSpeedKmH: 5,
      isDay: true,
      condition: "CLOUDY",
      riskLevel: "SAFE",
    },
    unavailableReason: null,
  };
}
function apiHarness() {
  let payload: unknown = { success: true, data: fixture() };
  const calls: { url: string; options: Record<string, unknown> }[] = [];
  const load = tripModuleLoader({
    "@/services/api/client": {
      apiClient: {
        get: async (url: string, options: Record<string, unknown>) => {
          calls.push({ url, options });
          return { data: payload };
        },
      },
    },
    "@/services/api/api-error": { ApiError },
  });
  const module = load<
    typeof import("../src/features/weather/api/weather-api.ts")
  >("src/features/weather/api/weather-api.ts");
  return {
    ...module,
    calls,
    setPayload: (value: unknown) => {
      payload = value;
    },
  };
}
test("trip weather transport uses the authenticated trip route, date and cancellation signal", async () => {
  const h = apiHarness();
  const id = "a0000000-0000-4000-8000-000000000002";
  const signal = new AbortController().signal;
  const data = await h.weatherApi.trip(id, "2026-11-07", signal);
  assert.equal(data.forecast?.providerName, "open-meteo");
  assert.equal(h.calls[0].url, `/api/v1/trips/${id}/weather`);
  assert.equal(h.calls[0].options.signal, signal);
  assert.equal(
    JSON.stringify(h.calls[0].options.params),
    JSON.stringify({ date: "2026-11-07" }),
  );
  await assert.rejects(h.weatherApi.trip("preview-trip"), {
    code: "INVALID_TRIP",
  });
});
test("weather boundary rejects mock, missing measurements, wrong dates and impossible values", () => {
  const { tripWeatherSchema } = apiHarness();
  for (const change of [
    (d: ReturnType<typeof fixture>) => {
      d.forecast.providerName = "mock";
    },
    (d: ReturnType<typeof fixture>) => {
      d.forecast.dailySummaries[0].hourlyForecasts = [];
    },
    (d: ReturnType<typeof fixture>) => {
      d.forecast.dailySummaries[0].hourlyForecasts[0].precipitationProbability = 101;
    },
    (d: ReturnType<typeof fixture>) => {
      d.forecast.dailySummaries[0].hourlyForecasts[0].time =
        "2026-11-08T08:00:00";
    },
    (d: ReturnType<typeof fixture>) => {
      d.location.latitude = 100;
    },
    (d: ReturnType<typeof fixture>) => {
      d.forecast.dailySummaries[0].minTemperature = 40;
    },
  ]) {
    const data = fixture();
    change(data);
    assert.equal(tripWeatherSchema.safeParse(data).success, false);
  }
  assert.equal(
    tripWeatherSchema.safeParse({
      ...fixture(),
      forecast: null,
      current: null,
      location: null,
      unavailableReason: "NO_LOCATION",
    }).success,
    true,
  );
});
test("forecast view models retain real rain and temperature without inventing UV or comfort", () => {
  const h = apiHarness();
  const days = h.weatherDays(h.tripWeatherSchema.parse(fixture()));
  assert.equal(days[0].low, 18);
  assert.equal(days[0].high, 27);
  assert.equal(days[0].temperature, 24);
  assert.equal(days[0].uv, undefined);
  assert.equal(days[0].comfort, undefined);
  assert.equal(days[0].alert?.chance, 70);
  assert.equal(h.weatherIcon("THUNDERSTORM"), "rain");
  assert.equal(h.weatherIcon("FOGGY"), "cloud");
});

type Element = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown, type: string): Element[] {
  if (Array.isArray(value)) return value.flatMap((v) => nodes(v, type));
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Element;
  return [
    ...(node.type === type ? [node] : []),
    ...nodes(node.props.children, type),
  ];
}
test("live glass modal shows current conditions and future hours, and explains missing-current data", () => {
  const api = apiHarness();
  let data = api.tripWeatherSchema.parse(fixture());
  const load = tripModuleLoader({
    "react/jsx-runtime": {
      jsx: (type: unknown, props: Record<string, unknown>) => ({ type, props }),
      jsxs: (type: unknown, props: Record<string, unknown>) => ({
        type,
        props,
      }),
    },
    react: { useState: () => [undefined, () => {}] },
    "react-native": { View: "View", Linking: { openURL: () => {} } },
    "@/hooks/use-app-theme": { useAppTheme: () => tokens },
    "@/hooks/use-i18n": { useI18n: () => ({ locale: "vi" }) },
    "@/services/api/api-error": { ApiError },
    "@/services/api/client": { apiClient: {} },
    "@/features/weather/api/weather-queries": {
      useTripWeather: () => ({ data, isPending: false, isError: false }),
    },
    "@/components/ui/app-button": { AppButton: "AppButton" },
    "@/components/ui/app-text": { AppText: "AppText" },
    "./ongoing-trip-panels": { JourneySheet: "JourneySheet" },
    "./travel-weather-details": {
      TravelWeatherDetails: "TravelWeatherDetails",
    },
    "./weather-forecast": { WeatherDateSelector: "WeatherDateSelector" },
  });
  const { TripWeatherModal } = load<
    typeof import("../src/features/home/components/connected-trip-weather.tsx")
  >("src/features/home/components/connected-trip-weather.tsx");
  const render = () =>
    TripWeatherModal({
      tripId: "a0000000-0000-4000-8000-000000000002",
      destination: "Đà Nẵng",
      onClose: () => {},
    });
  const first = nodes(render(), "TravelWeatherDetails")[0];
  assert.equal(
    (first.props.weather as { temperature: number }).temperature,
    25,
  );
  assert.equal(first.props.secondary, "Cảm giác như 26°C");
  assert.equal(first.props.conditionLabel, "Nhiều mây");
  assert.ok(
    (first.props.weather as { hours: { time: string }[] }).hours.every(
      (h) => h.time >= "13:30",
    ),
  );
  assert.match(
    (first.props.advice as { summary: string }).summary,
    /70%.*15:00/,
  );
  data = { ...data, current: null };
  const missing = nodes(render(), "TravelWeatherDetails")[0];
  assert.match(String(missing.props.secondary), /Trong ngày/);
  assert.ok(
    (missing.props.weather as { hours: { time: string }[] }).hours.every(
      (h) => h.time >= "13:30",
    ),
  );
});
