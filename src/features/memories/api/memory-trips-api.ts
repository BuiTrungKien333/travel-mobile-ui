import type { Trip } from "@/features/home/types/home-types";
import { ApiError } from "@/services/api/api-error";
import { tripApi } from "@/features/trip/api/trip-api";
import { tripPlacesApi } from "@/features/trip/api/trip-place-api";
import {
  tripViewModel,
  type TripSummaryDto,
} from "@/features/trip/api/trip-contract";
import { toTripStop } from "@/features/trip/api/trip-adapters";

export async function loadMemoryTrips(signal?: AbortSignal): Promise<Trip[]> {
  const summaries: TripSummaryDto[] = [];
  for (let page = 0; ; page++) {
    const result = await tripApi.list(page, signal);
    if (
      result.page !== page ||
      (page + 1 < result.totalPages && !result.content.length)
    )
      throw new ApiError("INVALID_RESPONSE");
    summaries.push(...result.content);
    if (page + 1 >= result.totalPages) break;
  }
  return Promise.all(
    summaries.map(async (summary) => {
      const places = await tripPlacesApi.listPlaces(summary.id, signal);
      const stops = places.map(toTripStop);
      const days: Trip["days"] = [];
      if (summary.startDate && summary.endDate) {
        for (
          let date = summary.startDate;
          date <= summary.endDate && days.length < 365;
        ) {
          // These are photo association choices, not the scheduled itinerary.
          days.push({ date, stops });
          date = new Date(Date.parse(`${date}T12:00:00Z`) + 86400000)
            .toISOString()
            .slice(0, 10);
        }
      }
      return { ...tripViewModel(summary), days, unscheduledStops: stops };
    }),
  );
}
