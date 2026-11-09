import { useEffect, useRef, useState, type RefObject } from "react";
import type { TripStop } from "@/features/home/types/home-types";
import { ApiError } from "@/services/api/api-error";
import { toDayStops } from "../api/trip-adapters";
import type {
  ItineraryResponse,
  SaveItineraryDayRequest,
} from "../api/itinerary-types";
import { reorderDayStops } from "../utils/itinerary-day-order";

type DayStops = SaveItineraryDayRequest["stops"];
type Snapshot = {
  key: string;
  date: string;
  before: DayStops;
  stops: TripStop[];
  request: SaveItineraryDayRequest;
};
type Operation = Snapshot & { kind: "change" | "undo" };

export function useConnectedTimelineActions({
  selectionKey,
  date,
  itinerary,
  tripVersion,
  stops,
  editable,
  mutation,
  saving: savingRef,
}: {
  selectionKey: string;
  date?: string;
  itinerary?: ItineraryResponse;
  tripVersion?: number;
  stops: TripStop[];
  editable: boolean;
  mutation: {
    isPending: boolean;
    error: unknown;
    reset: () => void;
    mutateAsync: (input: {
      date: string;
      request: SaveItineraryDayRequest;
    }) => Promise<ItineraryResponse>;
  };
  saving: RefObject<boolean>;
}) {
  const [pending, setPending] = useState<Operation | null>(null);
  const [failed, setFailed] = useState<Operation | null>(null);
  const [undo, setUndo] = useState<Snapshot | null>(null);
  const dragSnapshot = useRef<Snapshot | null>(null);
  const currentSelection = useRef(selectionKey);
  const [previousSelection, setPreviousSelection] = useState(selectionKey);
  if (previousSelection !== selectionKey) {
    setPreviousSelection(selectionKey);
    setUndo(null);
    setFailed(null);
  }
  const blocked =
    mutation.error instanceof ApiError &&
    ["TRIP_006", "TRIP_007", "TRIP_008"].includes(mutation.error.code);

  useEffect(() => {
    currentSelection.current = selectionKey;
    dragSnapshot.current = null;
  }, [selectionKey]);

  function snapshot(): Snapshot | null {
    if (!editable || !date || !itinerary || tripVersion === undefined)
      return null;
    const before = toDayStops(itinerary, date);
    return {
      key: selectionKey,
      date,
      before,
      stops,
      request: {
        expectedTripVersion: tripVersion,
        expectedUpdatedAt: itinerary.updatedAt,
        stops: before,
      },
    };
  }

  async function commit(operation: Operation) {
    if (
      !editable ||
      savingRef.current ||
      blocked ||
      operation.key !== currentSelection.current
    )
      return;
    savingRef.current = true;
    mutation.reset();
    setPending(operation);
    setFailed(null);
    setUndo(null);
    try {
      const result = await mutation.mutateAsync({
        date: operation.date,
        request: operation.request,
      });
      if (operation.kind === "change")
        setUndo({
          ...operation,
          request: {
            expectedTripVersion: operation.request.expectedTripVersion,
            expectedUpdatedAt: result.updatedAt,
            stops: operation.before,
          },
        });
    } catch {
      // The query cache remains authoritative; discard the visual draft on failure.
      // Keep the original revision for retries, including ambiguous network failures.
      setFailed(operation);
    } finally {
      setPending(null);
      savingRef.current = false;
    }
  }

  function reorder(ids: string[]) {
    const base = dragSnapshot.current ?? snapshot();
    if (!base || base.key !== selectionKey) return;
    const byId = new Map(base.stops.map((stop) => [stop.id, stop.placeId]));
    const placeIds = ids.flatMap((id) => {
      const placeId = byId.get(id);
      return placeId ? [placeId] : [];
    });
    const ordered = reorderDayStops(base.before, placeIds);
    if (!ordered || ids.length !== base.before.length) return;
    if (
      ordered.every(
        (stop, index) => stop.placeId === base.before[index].placeId,
      )
    )
      return;
    void commit({
      ...base,
      kind: "change",
      request: { ...base.request, stops: ordered },
    });
  }

  function remove(id: string) {
    const base = snapshot();
    const placeId = base?.stops.find((stop) => stop.id === id)?.placeId;
    if (!base || !placeId) return;
    const remaining = base.before.filter((stop) => stop.placeId !== placeId);
    if (remaining.length === base.before.length) return;
    void commit({
      ...base,
      kind: "change",
      request: {
        ...base.request,
        stops: remaining.map((stop, sequence) => ({ ...stop, sequence })),
      },
    });
  }

  const activePending = pending?.key === selectionKey ? pending : null;
  const byPlace = new Map(stops.map((stop) => [stop.placeId, stop]));
  const displayStops = activePending
    ? activePending.request.stops.flatMap((entry) => {
        const stop =
          byPlace.get(entry.placeId) ??
          activePending.stops.find((s) => s.placeId === entry.placeId);
        return stop
          ? [{ ...stop, time: entry.arrivalTime?.slice(11, 16) ?? "" }]
          : [];
      })
    : stops;

  return {
    stops: displayStops,
    pending: !!activePending,
    canInteract: editable && !activePending && !mutation.isPending && !blocked,
    canUndo: !!undo && undo.key === selectionKey && editable && !blocked,
    hasFailure: !!failed && failed.key === selectionKey,
    canRetry: !!failed && failed.key === selectionKey && !blocked && editable,
    begin: () => {
      dragSnapshot.current = snapshot();
    },
    end: () => {
      dragSnapshot.current = null;
    },
    reorder,
    remove,
    undo: () => {
      if (undo) void commit({ ...undo, kind: "undo" });
    },
    retry: () => {
      if (failed) void commit(failed);
    },
    clear: () => {
      setUndo(null);
      setFailed(null);
      dragSnapshot.current = null;
    },
  };
}
