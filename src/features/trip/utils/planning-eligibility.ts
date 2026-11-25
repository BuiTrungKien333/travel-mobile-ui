export function supportsAiPlanning(trip: {
  destination: { name: string; provinceId: string | null }; mode: string; dayCount: number; status: string;
}) {
  return Boolean(trip.destination.name.trim()) && trip.destination.provinceId !== null
    && trip.mode === "PLANNING" && trip.status !== "ACTIVE"
    && trip.dayCount >= 1 && trip.dayCount <= 3;
}
