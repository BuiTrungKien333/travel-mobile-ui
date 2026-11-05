import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tripQueryKeys } from "./trip-query-keys";
import { itineraryApi } from "./itinerary-api";
import type { ItineraryOptimizationProposal, SaveItineraryRequest } from "./itinerary-types";
import { ApiError } from "@/services/api/api-error";

export function useTripItineraryQuery(tripId: string | undefined) {
  return useQuery({
    queryKey: tripQueryKeys.itinerary(tripId ?? ""),
    queryFn: ({ signal }) => itineraryApi.get(tripId!, signal),
    enabled: !!tripId,
  });
}

export function useSaveItineraryMutation(tripId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: SaveItineraryRequest) => itineraryApi.save(tripId, request),
    onSuccess: async (itinerary) => {
      client.setQueryData(tripQueryKeys.itinerary(tripId), itinerary);
      await client.invalidateQueries({ queryKey: tripQueryKeys.all });
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) await client.invalidateQueries({ queryKey: tripQueryKeys.all });
    },
  });
}

export function useOptimizeItineraryMutation(tripId: string) {
  return useMutation({
    mutationFn: () => itineraryApi.optimize(tripId),
  });
}

export function useApplyItineraryOptimizationMutation(tripId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { expectedUpdatedAt: string; proposal: ItineraryOptimizationProposal }) =>
      itineraryApi.applyOptimization(tripId, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: tripQueryKeys.itinerary(tripId) });
    },
  });
}
