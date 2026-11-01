import { router } from "expo-router";
import { useTripsQuery } from "@/features/trip/api/trip-hooks";
import { todayCalendarDate } from "@/utils/calendar-date";

export function useNavigationCapture() {
  const tripsQuery = useTripsQuery();
  const trips = tripsQuery.data ?? [];
  const today = todayCalendarDate();
  return () => {
    const trip = trips.find((item) => item.status === "ACTIVE" || (
      item.status !== "CANCELLED" && item.status !== "COMPLETED" &&
      item.startDate && item.endDate && item.startDate <= today && item.endDate >= today
    ));
    if (!trip) {
      router.navigate("/tabs/trips");
      return;
    }
    router.push({ pathname: "/trip/camera", params: { tripId: trip.id, day: today } });
  };
}
