import { useTripPreview } from "../providers/trip-preview-provider";
import { getDayProgress } from "../utils/day-progress";
import { selectHome } from "../utils/select-home";

export function useNavigationCapture() {
  const { trips, today, visited, openPanel } = useTripPreview((state) => ({
    trips: state.trips,
    today: state.today,
    visited: state.visited,
    openPanel: state.openPanel,
  }));
  return () => {
    const selection = selectHome(trips, today);
    if (selection.kind !== "ongoing") {
      openPanel({ kind: "capture-start" });
      return;
    }
    const trip = selection.trip;
    const stops = trip.days.find((day) => day.date === today)?.stops ?? [];
    const progress = getDayProgress(
      stops,
      visited[`${trip.id}:${today}`] ?? [],
    );
    openPanel({
      kind: "camera",
      tripId: trip.id,
      date: today,
      stopId: progress.nextStop?.id,
    });
  };
}
