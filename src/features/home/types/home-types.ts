export type HomeScenario = "new" | "upcoming" | "ongoing" | "returning";
export type LocalizedText = { vi: string; en: string };
export type TripStop = {
  id: string;
  time: string;
  name: LocalizedText;
  kind: LocalizedText;
};
export type TripDay = { date: string; stops: TripStop[] };
export type Trip = {
  id: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  status: "draft" | "planned" | "completed" | "cancelled";
  days: TripDay[];
};
export type HomeSelection =
  | { kind: "ongoing"; trip: Trip; dayIndex: number }
  | { kind: "upcoming"; trip: Trip }
  | { kind: "returning" }
  | { kind: "new" };
export type Memory = { id: string; destination: string; text: string };
