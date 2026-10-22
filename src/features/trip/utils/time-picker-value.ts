import { clockPattern } from "../schemas/trip-details-schema";

/** A local date is only a carrier for the picker; saved values stay timezone-free HH:mm. */
export function timePickerDate(value: string) {
  const [hours, minutes] = (clockPattern.test(value) ? value : "08:30")
    .split(":")
    .map(Number);
  return new Date(2000, 0, 1, hours, minutes);
}

export function timePickerValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
