export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function todayCalendarDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join("-");
}

/** Travel calendars use Vietnam time, independently of the device time zone. */
export function travelClockTime(now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

export function travelDateTime(date: string, time: string): Date {
  if (!isCalendarDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
    return new Date(NaN);
  return new Date(`${date}T${time}:00+07:00`);
}

/** Schedule one refresh at Vietnam midnight from the server's calendar snapshot. */
export function nextTravelDayRefreshDelay(context: {
  evaluatedDate: string;
  serverTime: string;
}) {
  return Math.max(
    1000,
    Date.parse(`${context.evaluatedDate}T00:00:00+07:00`) +
      86_400_000 -
      Date.parse(context.serverTime) +
      250,
  );
}
