import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/services/api/api-error";
import { tripQueryKeys } from "./trip-query-keys";
import { itineraryApi } from "./itinerary-api";
import type {
  ItineraryOptimizationProposal,
  SaveItineraryRequest,
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
