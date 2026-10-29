import type { Trip, TripDay, TripStop } from "@/features/home/types/home-types";

export type TripScheduleSnapshot = Pick<
  Trip,
  "days" | "unscheduledStops" | "startDate" | "endDate"
>;
export type TripMutation =
  | {
      kind: "info";
      dateRange?: { startDate: string; endDate: string };
      values: Pick<
        Trip,
        "title" | "budget" | "preferences" | "accommodation" | "notes"
      > & { destination?: string };
    }
  | { kind: "dates"; startDate: string; endDate: string }
  | {
      kind: "day";
      date: string;
      durations?: { stopId: string; durationMinutes: number }[];
      values: Pick<
        TripDay,
        "startLocation" | "startTime" | "returnToStart" | "transport"
      >;
    }
  | { kind: "add"; date: string | null; stops: TripStop[] }
  | {
      kind: "stop";
      date: string | null;
      stopId: string;
      targetDate: string | null;
      values: Pick<TripStop, "time" | "durationMinutes" | "pinned" | "note">;
    }
  | { kind: "remove"; date: string | null; stopId: string }
  | { kind: "reorder"; date: string; ids: string[] }
  | { kind: "restore"; snapshot: TripScheduleSnapshot };

export type TripDetailsSheetState = {
  kind:
    | "menu"
    | "info"
    | "day"
    | "transport"
    | "weather"
    | "reorder"
    | "optimize"
    | "dates";
};
