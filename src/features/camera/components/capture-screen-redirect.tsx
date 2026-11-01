import { useEffect, useRef } from "react";
import { router } from "expo-router";
import type { JourneyPanel } from "@/features/home/types/preview-state";

export function CaptureScreenRedirect({
  panel,
  onClose,
}: {
  panel: Extract<JourneyPanel, { kind: "camera" }>;
  onClose: () => void;
}) {
  const dispatched = useRef(false);
  useEffect(() => {
    if (dispatched.current) return;
    dispatched.current = true;
    onClose();
    router.navigate({
      pathname: "/trip/camera",
      params: {
        tripId: panel.tripId,
        day: panel.date,
        ...(panel.stopId ? { stopId: panel.stopId } : {}),
      },
    });
  }, [panel.tripId, panel.date, panel.stopId, onClose]);
  return null;
}
