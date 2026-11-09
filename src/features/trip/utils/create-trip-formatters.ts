import { dayDistance } from "../../home/utils/select-home";
import type { TripCopy } from "../i18n/trip-copy";

export function tripMessage(
  template: string,
  values: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    String(values[key] ?? match),
  );
}
export function formatDisplayDate(value: string, locale: "vi" | "en"): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "--/--/----";
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
export function generateDefaultTitle(
  destination: string,
  start: string,
  end: string,
  copy: TripCopy,
) {
  if (!destination.trim()) return "";
  const name = destination.split(",")[0].trim();
  const days = start && end && end >= start ? dayDistance(start, end) + 1 : 0;
  return tripMessage(
    days > 1
      ? copy.defaultTitleDays
      : days === 1
        ? copy.defaultTitleDay
        : copy.defaultTitle,
    { destination: name, days, nights: Math.max(0, days - 1) },
  );
}
export function destinationRegion(destination: string, copy: TripCopy) {
  const name = destination.toLowerCase();
  const groups = {
    central: ["đà nẵng", "hội an", "quảng nam", "huế"],
    highlands: ["đà lạt", "lâm đồng"],
    north: ["hà nội", "sapa", "hạ long", "ninh bình"],
    south: ["phú quốc", "hồ chí minh", "sài gòn", "vũng tàu"],
    coast: ["nha trang", "quy nhơn", "phú yên"],
  } as const;
  for (const key of Object.keys(groups) as (keyof typeof groups)[])
    if (groups[key].some((city) => name.includes(city)))
      return copy.regions[key];
  return destination.trim() ? copy.regions.unknown : copy.chooseDestination;
}
export function formatBudget(value: string, locale: "vi" | "en") {
  return value
    ? new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-GB").format(
        Number(value),
      )
    : "";
}
