import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { authSession } from "@/features/auth/services/auth-session";
import { ApiError } from "@/services/api/api-error";
import { tripQueryKeys } from "./trip-query-keys";
import { itineraryApi } from "./itinerary-api";
import { weatherQueryKeys } from "@/features/weather/api/weather-query-keys";
import type {
  ItineraryOptimizationProposal,
  SaveItineraryRequest,
  SaveItineraryDayRequest,
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
export function useSaveItineraryMutation(tripId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: SaveItineraryRequest) =>
      itineraryApi.save(tripId, request),
    onSuccess: () => client.invalidateQueries({ queryKey: tripQueryKeys.root }),
  });
}
export function useSaveItineraryDayMutation(tripId: string) {
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
      request: SaveItineraryDayRequest;
    }) => {
      const session = authSession.getVersion();
      const result = await itineraryApi.saveDay(tripId, date, request);
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
export function useOptimizeItineraryMutation(tripId: string) {
  return useMutation({ mutationFn: () => itineraryApi.optimize(tripId) });
}
export function useApplyItineraryOptimizationMutation(tripId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      expectedUpdatedAt: string;
      proposal: ItineraryOptimizationProposal;
    }) => itineraryApi.applyOptimization(tripId, input),
    onSuccess: () => client.invalidateQueries({ queryKey: tripQueryKeys.root }),
  });
}
