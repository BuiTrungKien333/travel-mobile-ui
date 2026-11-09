import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidElement } from "react";
import { tripModuleLoader } from "./helpers/load-trip-module.ts";
import type { ForecastDay } from "../src/features/home/data/weather-preview.ts";

type WeatherProps = Parameters<
  typeof import("../src/features/home/components/travel-weather-details.tsx").TravelWeatherDetails
>[0];
const forecast: ForecastDay = {
  date: "2026-10-24",
  low: 16,
  high: 24,
  temperature: 18,
  comfort: 8.2,
  uv: 6,
  condition: "rain",
  alert: { from: "14:00", to: "16:00", chance: 70 },
  hours: [
    { time: "14:00", temperature: 21, rainChance: 70, condition: "rain" },
  ],
};

function harness(locale = "vi") {
  const load = tripModuleLoader({
    "@/hooks/use-i18n": { useI18n: () => ({ locale }) },
    "@/hooks/use-app-theme": {
      useAppTheme: () => ({
        layout: { weatherHeroArtworkSize: 72 },
        colors: {},
      }),
    },
    "@/components/ui/app-text": { AppText: "AppText" },
    "@/components/ui/app-icon": { AppIcon: "AppIcon" },
    "@/features/home/components/travel-weather-details": {
      TravelWeatherDetails: "TravelWeatherDetails",
    },
    "./travel-weather-details": {
      TravelWeatherDetails: "TravelWeatherDetails",
    },
    "../data/ongoing-preview": {
      ongoingWeatherSnapshot: {
        ...forecast,
        tripId: "live",
        date: "2026-10-21",
        feelsLike: 17,
        observedAt: "10:45",
        rainChance: 70,
        rainStartsAt: "14:00",
        rainEndsAt: "16:00",
      },
    },
  });
  return {
    ...load<
      typeof import("../src/features/trip/components/trip-forecast-details.tsx")
    >("src/features/trip/components/trip-forecast-details.tsx"),
    ...load<
      typeof import("../src/features/home/components/ongoing-weather-details.tsx")
    >("src/features/home/components/ongoing-weather-details.tsx"),
  };
}

test("upcoming forecast reuses Home's presentation with selected-day data and preparation advice", () => {
  const { TripForecastDetails } = harness();
  const node = TripForecastDetails({ forecast, destination: "Đà Lạt" });
  assert.ok(isValidElement<WeatherProps>(node));
  assert.equal(node.type, "TravelWeatherDetails");
  assert.equal(node.props.weather, forecast);
  assert.match(node.props.context ?? "", /24\/10/);
  assert.equal(node.props.secondary, "16°–24°C · UV 6");
  assert.match(node.props.advice.summary, /14:00–16:00/);
  assert.match(node.props.advice.summary, /70%/);
  assert.match(node.props.advice.items[0].text, /dù/);
  assert.match(node.props.footnote, /khởi hành/);
});

test("sunny days replace rain reminders; unsupported dates retain the empty state", () => {
  const { TripForecastDetails } = harness("en");
  const sunny = {
    ...forecast,
    date: "2026-10-25",
    condition: "sun" as const,
    alert: undefined,
    hours: [
      {
        time: "08:00",
        temperature: 19,
        rainChance: 5,
        condition: "sun" as const,
      },
    ],
  };
  const node = TripForecastDetails({ forecast: sunny, destination: "Da Lat" });
  assert.ok(isValidElement<WeatherProps>(node));
  assert.equal(node.props.conditionLabel, "Sunny");
  assert.equal(node.props.advice.icon, "sun");
  assert.match(node.props.advice.items[0].text, /Sunscreen/);
  assert.doesNotMatch(node.props.advice.summary, /14:00|70%/);
  const empty = TripForecastDetails({ destination: "Da Nang" });
  assert.notEqual(empty.type, "TravelWeatherDetails");
});

test("Home's live wrapper retains the feels-like value and observation time", () => {
  const { OngoingWeatherDetails } = harness();
  const node = OngoingWeatherDetails({
    tripId: "live",
    today: "2026-10-21",
    destination: "Đà Lạt",
  });
  assert.ok(isValidElement<WeatherProps>(node));
  assert.equal(node.type, "TravelWeatherDetails");
  assert.match(node.props.secondary, /17°C/);
  assert.match(node.props.footnote, /10:45/);
  assert.equal(node.props.context, undefined);
  const missing = OngoingWeatherDetails({
    tripId: "different",
    today: "2026-10-21",
    destination: "Đà Lạt",
  });
  assert.notEqual(missing.type, "TravelWeatherDetails");
});
