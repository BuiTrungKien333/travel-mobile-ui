import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/services/api/api-error";
import { tripPlacesApi } from "./trip-place-api";
import { authSession } from "@/features/auth/services/auth-session";
import { placeDiscoveryKeys } from "./place-discovery-query-keys";
import { tripQueryKeys } from "./trip-query-keys";
import { weatherQueryKeys } from "@/features/weather/api/weather-query-keys";
import type { AddTripPlaceRequest, UpdateTripPlaceRequest } from "./trip-types";
export {
  useTripsQuery,
  useTripQuery,
  useCreateTripMutation,
} from "./trip-queries";

export function useTripPlacesQuery(tripId: string | undefined) {
  const owner = useProfile().data?.id;
  return useQuery({
    queryKey: tripQueryKeys.places(owner, tripId),
    enabled: !!owner && !!tripId,
    queryFn: ({ signal }) => {
      if (!tripId) throw new ApiError("INVALID_TRIP");
      return tripPlacesApi.listPlaces(tripId, signal);
    },
  });
}
export function useAddTripPlacesMutation(tripId: string) {
  const owner = useProfile().data?.id;
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (placeIds: string[]) => {
      const version = authSession.getVersion();
      const result = await tripPlacesApi.addPlaces(tripId, placeIds);
      if (version !== authSession.getVersion()) throw new ApiError("CANCELLED");
      return result;
    },
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: tripQueryKeys.places(owner, tripId),
        }),
        client.invalidateQueries({
          queryKey: tripQueryKeys.detail(owner, tripId),
        }),
        client.invalidateQueries({ queryKey: tripQueryKeys.list(owner) }),
        client.invalidateQueries({ queryKey: tripQueryKeys.dashboard(owner) }),
        client.invalidateQueries({
          queryKey: weatherQueryKeys.forTrip(owner, tripId),
        }),
        client.invalidateQueries({ queryKey: placeDiscoveryKeys.root }),
      ]);
    },
  });
}
export function useAddTripPlaceMutation(tripId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: AddTripPlaceRequest) =>
      tripPlacesApi.addPlace(tripId, request),
    onSuccess: () => client.invalidateQueries({ queryKey: tripQueryKeys.root }),
  });
}
export function useUpdateTripPlaceMutation(tripId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      placeId,
      request,
    }: {
      placeId: string;
      request: UpdateTripPlaceRequest;
    }) => tripPlacesApi.updatePlace(tripId, placeId, request),
    onSuccess: () => client.invalidateQueries({ queryKey: tripQueryKeys.root }),
  });
}
export function useDeleteTripPlaceMutation(tripId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (placeId: string) => tripPlacesApi.removePlace(tripId, placeId),
    onSuccess: () => client.invalidateQueries({ queryKey: tripQueryKeys.root }),
  });
}
