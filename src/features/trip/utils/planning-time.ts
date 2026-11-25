/** Local itinerary timestamps already use the trip timezone; retain the date on spillover. */
export function planningTime(timestamp: string, dayDate: string) {
  return timestamp.slice(0, 10) === dayDate
    ? timestamp.slice(11, 16)
    : timestamp.slice(0, 16).replace("T", " ");
}
