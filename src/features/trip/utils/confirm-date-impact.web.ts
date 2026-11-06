import type { TripDetailsCopy } from "../i18n/trip-details-copy";

export async function confirmDateImpact(copy: TripDetailsCopy, count: number): Promise<boolean> {
  return window.confirm(`${copy.dateImpactTitle}\n\n${copy.dateImpactHint.replace("{count}", String(count))}`);
}
