import type { TripCopy } from "../i18n/trip-copy";

export function confirmDiscard(copy: TripCopy, onDiscard: () => void) {
  if (window.confirm(`${copy.discardTitle}\n\n${copy.discardHint}`))
    onDiscard();
}
