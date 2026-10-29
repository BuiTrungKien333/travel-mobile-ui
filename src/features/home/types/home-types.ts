import type { ImageSource } from "expo-image";

export type HomeScenario = "new" | "upcoming" | "ongoing" | "returning";
export type LocalizedText = { vi: string; en: string };
export type TripStop = {
  id: string;
  time: string;
  name: LocalizedText;
  kind: LocalizedText;
  address?: LocalizedText;
  locationType?: "address";
  location?: { latitude: number; longitude: number };
  durationMinutes?: number;
  pinned?: boolean;
  note?: string;
  quickInfo?: {
    admission?: LocalizedText;
    closesAt?: string;
    sample?: boolean;
  };
};
export type TravelMode = "car" | "motorcycle" | "walk";
export type TripDay = {
  date: string;
  stops: TripStop[];
  startLocation?: string;
  startTime?: string;
  returnToStart?: boolean;
  transport?: TravelMode;
};
export type TripPreference =
  | "nature"
  | "food"
  | "culture"
  | "relaxation"
  | "photography"
  | "adventure"
  | "shopping"
  | "beach";
export type Trip = {
  id: string;
  destination: string;
  title?: string;
  budget?: { amount: number; currency: "VND" };
  preferences?: TripPreference[];
  accommodation?: string;
  notes?: string;
  unscheduledStops?: TripStop[];
  startDate?: string;
  endDate?: string;
  status: "draft" | "planned" | "completed" | "cancelled";
  days: TripDay[];
  coverImage?: ImageSource | string | number;
};
export type HomeSelection =
  | { kind: "ongoing"; trip: Trip; dayIndex: number }
  | { kind: "upcoming"; trip: Trip }
  | { kind: "returning" }
  | { kind: "new" };
export type Memory = {
  id: string;
  destination: string;
  text: string;
  tripId?: string;
  date?: string;
  time?: string;
  place?: LocalizedText;
  photo?: ImageSource | string | number;
};
