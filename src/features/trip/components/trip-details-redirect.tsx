import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { useTripPreview } from "@/features/home/providers/trip-preview-provider";

/** Bridge existing Home actions to the single native details route, never during render. */
export function TripDetailsRedirect({
  tripId,
  dayIndex,
  onClose,
}: {
  tripId: string;
  dayIndex?: number;
  onClose: () => void;
}) {
  const date = useTripPreview((state) =>
    dayIndex === undefined
      ? undefined
      : state.trips.find((trip) => trip.id === tripId)?.days[dayIndex]?.date,
  );
  const dispatched = useRef(false);
  useEffect(() => {
    if (dispatched.current) return;
    dispatched.current = true;
    onClose();
    router.push({
      pathname: "/trip/[tripId]",
      params: { tripId, ...(date ? { day: date } : {}) },
    });
  }, [tripId, date, onClose]);
  return null;
}
