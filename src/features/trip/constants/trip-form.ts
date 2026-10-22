import type { TripPreference, TravelMode } from "../../home/types/home-types";

export const tripTransportModes = [
  "car",
  "motorcycle",
  "walk",
] as const satisfies readonly TravelMode[];

export const tripPreferenceIds: readonly TripPreference[] = [
  "nature",
  "food",
  "culture",
  "relaxation",
  "photography",
  "adventure",
  "shopping",
  "beach",
];
export const tripFormLimits = {
  title: 120,
  destination: 120,
  days: 365,
  budget: 1_000_000_000_000,
} as const;
