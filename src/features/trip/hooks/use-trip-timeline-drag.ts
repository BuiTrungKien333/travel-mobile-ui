import { useEffect, useRef, useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import type { TripStop } from "@/features/home/types/home-types";
import { useAppTheme } from "@/hooks/use-app-theme";
import { moveTimelineStop, sameTimelineSlots, type TimelineSlot } from "../utils/timeline-reorder";

export function useTripTimelineDrag({
  stops,
  selectionKey,
  onReorder,
}: {
  stops: TripStop[];
  selectionKey: string;
  onReorder: (ids: string[]) => void;
}) {
  const theme = useAppTheme();
  const slots = useSharedValue<TimelineSlot[]>([]);
  const active = useSharedValue<string | null>(null);
  const from = useSharedValue(-1);
  const target = useSharedValue(-1);
  const offset = useSharedValue(0);
  const openSwipe = useSharedValue<string | null>(null);
  const revision = JSON.stringify([selectionKey, stops.map((stop) => [stop.id, !!stop.pinned])]);
  const [dragSession, setDragSession] = useState<{ id: string; revision: string } | null>(null);
  // Reset prop-dependent UI state before committing children for a different day/order.
  if (dragSession && dragSession.revision !== revision) setDragSession(null);
  const draggedId = dragSession?.revision === revision ? dragSession.id : null;
  const started = useRef<{ id: string; revision: string } | null>(null);
  const sizes = useRef<Record<string, number>>({});
  const estimate = theme.layout.tripTimelineEstimatedRowHeight;
  useEffect(() => {
    sizes.current = {};
    active.set(null);
    openSwipe.set(null);
    offset.set(0);
    started.current = null;
    return () => {
      started.current = null;
      active.set(null);
      offset.set(0);
    };
  }, [revision, active, openSwipe, offset]);
  useEffect(() => {
    const next = stops.map((stop) => ({
        id: stop.id,
        pinned: !!stop.pinned,
        height: sizes.current[stop.id] ?? estimate,
      }));
    if (!sameTimelineSlots(slots.get(), next)) slots.set(next);
  }, [stops, selectionKey, revision, slots, estimate]);
  function reset() {
    active.set(null);
    offset.set(0);
    from.set(-1);
    target.set(-1);
    started.current = null;
    setDragSession(null);
  }
  function begin(id: string) {
    if (active.get() !== id) return;
    if (!stops.some((stop) => stop.id === id && !stop.pinned)) { reset(); return; }
    started.current = { id, revision };
    setDragSession({ id, revision });
  }
  function finish(id: string, to: number) {
    if (active.get() !== id || started.current?.id !== id || started.current.revision !== revision) return;
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
    begin,
    reset,
    finish,
    measure,
  };
}

export type TripTimelineDrag = ReturnType<typeof useTripTimelineDrag>;
