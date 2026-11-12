import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { authSession } from "@/features/auth/services/auth-session";
import { ApiError } from "@/services/api/api-error";
import { tripQueryKeys } from "./trip-query-keys";
import { itineraryApi } from "./itinerary-api";
import { weatherQueryKeys } from "@/features/weather/api/weather-query-keys";
import type {
  SaveItineraryDayRequest,
  UpdateDayScheduleRequest,
  ItineraryResponse,
} from "./itinerary-types";

export function useTripItineraryQuery(tripId: string | undefined) {
  const owner = useProfile().data?.id;
  return useQuery({
    queryKey: tripQueryKeys.itinerary(owner, tripId),
    enabled: !!owner && !!tripId,
    queryFn: ({ signal }) => {
      if (!tripId) throw new ApiError("INVALID_ITINERARY");
      return itineraryApi.get(tripId, signal);
    },
  });
}
export function useSaveItineraryDayMutation(tripId: string) {
  return useDayWrite<SaveItineraryDayRequest>(tripId, itineraryApi.saveDay);
}
export function useUpdateDayScheduleMutation(tripId: string) {
  return useDayWrite<UpdateDayScheduleRequest>(
    tripId,
    itineraryApi.updateSchedule,
  );
}
function useDayWrite<Request>(
  tripId: string,
  write: (
    tripId: string,
    date: string,
    request: Request,
  ) => Promise<ItineraryResponse>,
) {
  const client = useQueryClient();
  const owner = useProfile().data?.id;
  const key = tripQueryKeys.itinerary(owner, tripId);
  return useMutation({
    retry: false,
    mutationFn: async ({
      date,
      request,
    }: {
      date: string;
      request: Request;
    }) => {
      const session = authSession.getVersion();
      const result = await write(tripId, date, request);
      if (session !== authSession.getVersion()) throw new ApiError("CANCELLED");
      await client.cancelQueries({ queryKey: key });
      if (session !== authSession.getVersion()) throw new ApiError("CANCELLED");
      client.setQueryData(key, result);
      void Promise.all([
        client.invalidateQueries({ queryKey: tripQueryKeys.dashboard(owner) }),
        client.invalidateQueries({
          queryKey: tripQueryKeys.detail(owner, tripId),
        }),
        client.invalidateQueries({ queryKey: tripQueryKeys.list(owner) }),
        client.invalidateQueries({
          queryKey: weatherQueryKeys.forTrip(owner, tripId),
        }),
      ]);
      return result;
    },
  });
}
