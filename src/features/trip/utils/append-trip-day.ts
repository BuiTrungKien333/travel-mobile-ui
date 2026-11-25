import type { Trip } from "@/features/home/types/home-types";
import { tripDuration } from "@/features/home/utils/select-home";
import { isCalendarDate } from "@/utils/calendar-date";
import { tripFormLimits } from "../constants/trip-form";

export function appendTripDayRange(trip: Trip) {
  if (
    !trip.startDate ||
    !trip.endDate ||
    !isCalendarDate(trip.startDate) ||
    !isCalendarDate(trip.endDate) ||
    trip.startDate > trip.endDate ||
    tripDuration(trip) >= tripFormLimits.days
  )
    return null;
  const next = new Date(`${trip.endDate}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const endDate = next.toISOString().slice(0, 10);
  if (!isCalendarDate(endDate)) return null;

  return { startDate: trip.startDate, endDate };
}
