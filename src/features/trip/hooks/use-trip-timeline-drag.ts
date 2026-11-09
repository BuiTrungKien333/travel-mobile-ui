import { useEffect, useRef, useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import type { TripStop } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { moveTimelineStop, type TimelineSlot } from "../utils/timeline-reorder";

export function useTripTimelineDrag({
  stops,
  selectionKey,
  onReorder,
  onDragStart,
  onDragEnd,
}: {
  stops: TripStop[];
  selectionKey: string;
  onReorder: (ids: string[]) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const theme = useAppTheme();
  const slots = useSharedValue<TimelineSlot[]>([]);
  const active = useSharedValue<string | null>(null);
  const from = useSharedValue(-1);
  const target = useSharedValue(-1);
  const offset = useSharedValue(0);
  const openSwipe = useSharedValue<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [previousSelection, setPreviousSelection] = useState(selectionKey);
  if (previousSelection !== selectionKey) {
    setPreviousSelection(selectionKey);
    setDraggedId(null);
  }
  const sizes = useRef<Record<string, number>>({});
  const estimate = theme.layout.tripTimelineEstimatedRowHeight;
  useEffect(() => {
    sizes.current = {};
    active.set(null);
    openSwipe.set(null);
    offset.set(0);
  }, [selectionKey, active, openSwipe, offset]);
  useEffect(() => {
    slots.set(
      stops.map((stop) => ({
        id: stop.id,
        pinned: !!stop.pinned,
        height: sizes.current[stop.id] ?? estimate,
      })),
    );
  }, [stops, selectionKey, slots, estimate]);
  function reset() {
    active.set(null);
    offset.set(0);
    setDraggedId(null);
    onDragEnd?.();
  }
  function finish(id: string, to: number) {
    const ids = moveTimelineStop(stops, id, to);
    if (ids) onReorder(ids);
    reset();
  }
  function measure(id: string, height: number) {
    if (height <= 0 || sizes.current[id] === height) return;
    sizes.current[id] = height;
    slots.set(
      slots.get().map((slot) => (slot.id === id ? { ...slot, height } : slot)),
    );
  }
  return {
    slots,
    active,
    from,
    target,
    offset,
    openSwipe,
    draggedId,
    begin: (id: string) => {
      onDragStart?.();
      setDraggedId(id);
    },
    reset,
    finish,
    measure,
  };
}

export type TripTimelineDrag = ReturnType<typeof useTripTimelineDrag>;
