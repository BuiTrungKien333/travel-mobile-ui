export type WeatherCondition = "sun" | "cloud" | "rain";
export type WeatherExperience = "mist" | "walk" | "cafe" | "photo";
export type PackingItem = "layer" | "umbrella" | "sun" | "shoes";
export type ForecastHour = {
  time: string;
  temperature: number;
  rainChance: number;
  condition: WeatherCondition;
  experience?: WeatherExperience;
};
export type ForecastDay = {
  date: string;
  low: number;
  high: number;
  temperature: number;
  comfort: number;
  uv: number;
  condition: WeatherCondition;
  alert?: { from: string; to: string; chance: number };
  hours: ForecastHour[];
};

// UI fixtures, not a live forecast or a meteorological scoring algorithm.
const dalatDays: ForecastDay[] = [
  {
    date: "2026-10-24",
    low: 16,
    high: 24,
    temperature: 18,
    comfort: 8.2,
    uv: 6,
    condition: "rain",
    alert: { from: "14:00", to: "16:00", chance: 70 },
    hours: [
      {
        time: "05:30",
        temperature: 16,
        rainChance: 10,
        condition: "cloud",
        experience: "mist",
      },
      {
        time: "08:00",
        temperature: 18,
        rainChance: 15,
        condition: "cloud",
        experience: "walk",
      },
      { time: "11:00", temperature: 24, rainChance: 20, condition: "sun" },
      {
        time: "14:00",
        temperature: 21,
        rainChance: 70,
        condition: "rain",
        experience: "cafe",
      },
      {
        time: "17:00",
        temperature: 20,
        rainChance: 25,
        condition: "sun",
        experience: "photo",
      },
    ],
  },
  {
    date: "2026-10-25",
    low: 15,
    high: 23,
    temperature: 19,
    comfort: 9.1,
    uv: 7,
    condition: "sun",
    hours: [
      {
        time: "05:30",
        temperature: 15,
        rainChance: 5,
        condition: "cloud",
        experience: "mist",
      },
      {
        time: "08:00",
        temperature: 19,
        rainChance: 5,
        condition: "sun",
        experience: "walk",
      },
      { time: "11:00", temperature: 23, rainChance: 10, condition: "sun" },
      { time: "14:00", temperature: 22, rainChance: 15, condition: "cloud" },
      {
        time: "17:00",
        temperature: 19,
        rainChance: 10,
        condition: "sun",
        experience: "photo",
      },
    ],
  },
  {
    date: "2026-10-26",
    low: 17,
    high: 22,
    temperature: 20,
    comfort: 6.8,
    uv: 4,
    condition: "rain",
    alert: { from: "11:00", to: "15:00", chance: 80 },
    hours: [
      { time: "05:30", temperature: 17, rainChance: 35, condition: "cloud" },
      { time: "08:00", temperature: 19, rainChance: 40, condition: "cloud" },
      {
        time: "11:00",
        temperature: 21,
        rainChance: 80,
        condition: "rain",
        experience: "cafe",
      },
      {
        time: "14:00",
        temperature: 22,
        rainChance: 75,
        condition: "rain",
        experience: "cafe",
      },
      { time: "17:00", temperature: 20, rainChance: 45, condition: "cloud" },
    ],
  },
  {
    date: "2026-10-27",
    low: 16,
    high: 25,
    temperature: 21,
    comfort: 8.8,
    uv: 6,
    condition: "cloud",
    hours: [
      {
        time: "05:30",
        temperature: 16,
        rainChance: 10,
        condition: "cloud",
        experience: "mist",
      },
      {
        time: "08:00",
        temperature: 20,
        rainChance: 10,
        condition: "sun",
        experience: "walk",
      },
      { time: "11:00", temperature: 25, rainChance: 15, condition: "sun" },
      { time: "14:00", temperature: 24, rainChance: 20, condition: "cloud" },
      {
        time: "17:00",
        temperature: 21,
        rainChance: 15,
        condition: "sun",
        experience: "photo",
      },
    ],
  },
];

export const weatherPreviews: Partial<
  Record<
    string,
    {
      days: ForecastDay[];
      hasOutdoorWalking: boolean;
    }
  >
> = {
  dalat: { days: dalatDays, hasOutdoorWalking: true },
};

export function suggestedPacking(
  days: ForecastDay[],
  outdoorWalking: boolean,
): PackingItem[] {
  const rainy = days.some((day) =>
    day.hours.some((hour) => hour.rainChance > 40),
  );
  const items: PackingItem[] = [];
  if (days.some((day) => day.low < 20)) items.push("layer");
  if (rainy) items.push("umbrella");
  if (days.some((day) => day.uv > 5)) items.push("sun");
  if (rainy && outdoorWalking) items.push("shoes");
  return items;
}
