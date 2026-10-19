import type { ImageSource } from "expo-image";

export type HomeScenario = "new" | "upcoming" | "ongoing" | "returning";
export type LocalizedText = { vi: string; en: string };
export type TripStop = {
  id: string;
  time: string;
  name: LocalizedText;
  kind: LocalizedText;
  quickInfo?: {
    admission?: LocalizedText;
    closesAt?: string;
    sample?: boolean;
  };
};
export type TripDay = { date: string; stops: TripStop[] };
export type Trip = {
  id: string;
  destination: string;
  title?: string;
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
