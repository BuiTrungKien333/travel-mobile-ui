import { useRef } from "react";
import type { Trip } from "@/features/home/types/home-types";
import { ApiError } from "@/services/api/api-error";
import { todayCalendarDate } from "@/utils/calendar-date";
import { useUpdateTripPlaceMutation } from "../api/trip-hooks";

export function useTripVisit(trip: Trip) {
  const mutation = useUpdateTripPlaceMutation(trip.id);
  const inFlight = useRef(false);
  async function setVisited(placeId: string, date: string, visited: boolean) {
    if (inFlight.current) return false;
    if (trip.status === "cancelled" || date > todayCalendarDate()
      || !trip.days.some((day) => day.date === date && day.stops.some((stop) => stop.id === placeId)))
      throw new ApiError("VISIT_UNAVAILABLE");
    inFlight.current = true;
    try { await mutation.mutateAsync({ placeId, request: { visited } }); return true; }
    finally { inFlight.current = false; }
  }
  return { setVisited, isPending: mutation.isPending, error: mutation.error };
}
