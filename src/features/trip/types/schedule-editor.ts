import type { TripDay, TripStop } from "@/features/home/types/home-types";
import type { DayRoute, RouteMode } from "../api/trip-day-route";
import type { ItineraryResponse, SaveItineraryDayRequest } from "../api/itinerary-types";

export type ScheduleEdit =
  | { kind: "day"; date: string; day: TripDay; routeMode: RouteMode; }
  | { kind: "stop"; stop: TripStop; date?: string; }
  | { kind: "assign"; stops: TripStop[]; }
  | { kind: "reorder"; date: string; stops: TripStop[]; }
  | { kind: "optimize"; date: string; stops: TripStop[]; route?: DayRoute; };
export type ScheduleEditor = ScheduleEdit & {
  base: ItineraryResponse;
  tripVersion: number;
};

export type DayStops = SaveItineraryDayRequest["stops"];
