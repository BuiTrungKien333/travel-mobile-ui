import { useRef, useState } from "react";
import { Linking } from "react-native";
import type { TripStop, TravelMode } from "@/features/home/types/home-types";
import { tripDirectionsUrl } from "@/features/home/utils/map-links";
import { useOngoingCopy } from "@/features/home/i18n/ongoing-copy";

export function useTripDirections() {
  const { copy } = useOngoingCopy();
  const opening = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  async function open(stop: TripStop, destination: string, mode: TravelMode | "bicycle" = "car") {
    if (opening.current) return;
    opening.current = true;
    setBusy(true);
    setError(undefined);
    try {
      // Omitting origin lets Maps use its current GPS location and permissions.
      // Do not use the trip's saved hotel/start node as the user's live position.
      await Linking.openURL(tripDirectionsUrl(stop, destination, mode));
    } catch {
      setError(copy.directionsError);
    } finally {
      opening.current = false;
      setBusy(false);
    }
  }
  return { open, busy, error };
}
