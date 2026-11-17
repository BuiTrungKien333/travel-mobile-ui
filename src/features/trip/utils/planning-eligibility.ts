export function supportsAiPlanning(trip: {
  destination: { name: string }; mode: string; dayCount: number; status: string;
}) {
  const name = trip.destination.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d").trim().toLowerCase();
  return ["da nang", "danang", "tp da nang", "thanh pho da nang"].includes(name) && trip.mode === "PLANNING" && trip.status !== "ACTIVE"
    && trip.dayCount >= 1 && trip.dayCount <= 2;
}
