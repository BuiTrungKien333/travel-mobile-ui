import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { ApiError } from "@/services/api/api-error";
import { tripPlacesApi } from "./trip-place-api";
import { tripQueryKeys } from "./trip-query-keys";
import type { AddTripPlaceRequest, UpdateTripPlaceRequest } from "./trip-types";
export {
  useTripsQuery,
  useTripQuery,
  useCreateTripMutation,
} from "./trip-queries";

/** Prepared for the teammate's Places backend; not wired into the MVP UI yet. */
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
