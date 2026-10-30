import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tripApi } from "./trip-api";
import { tripQueryKeys } from "./trip-query-keys";
import type { AddTripPlaceRequest, CreateTripRequest, UpdateTripPlaceRequest, UpdateTripRequest } from "./trip-types";

export function useTripsQuery() {
  return useQuery({ queryKey: tripQueryKeys.list(), queryFn: ({ signal }) => tripApi.list(signal) });
}
export function useTripQuery(tripId: string | undefined) {
  return useQuery({
    queryKey: tripQueryKeys.detail(tripId ?? ""),
    queryFn: ({ signal }) => tripApi.get(tripId!, signal),
    enabled: !!tripId,
  });
}
export function useTripPlacesQuery(tripId: string | undefined) {
  return useQuery({
    queryKey: tripQueryKeys.places(tripId ?? ""),
    queryFn: ({ signal }) => tripApi.listPlaces(tripId!, signal),
    enabled: !!tripId,
  });
}
export function useCreateTripMutation() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (request: CreateTripRequest) => tripApi.create(request), onSuccess: async () => { await client.invalidateQueries({ queryKey: tripQueryKeys.all }); } });
}
export function useUpdateTripMutation(tripId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (request: UpdateTripRequest) => tripApi.update(tripId, request), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: tripQueryKeys.list() }), client.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) })]); } });
}
export function useDeleteTripMutation() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (tripId: string) => tripApi.remove(tripId), onSuccess: async (_, tripId) => { await client.invalidateQueries({ queryKey: tripQueryKeys.all }); client.removeQueries({ queryKey: tripQueryKeys.detail(tripId) }); client.removeQueries({ queryKey: tripQueryKeys.places(tripId) }); } });
}
export function useAddTripPlaceMutation(tripId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (request: AddTripPlaceRequest) => tripApi.addPlace(tripId, request), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: tripQueryKeys.places(tripId) }), client.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) }), client.invalidateQueries({ queryKey: tripQueryKeys.list() })]); } });
}
export function useUpdateTripPlaceMutation(tripId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ placeId, request }: { placeId: string; request: UpdateTripPlaceRequest }) => tripApi.updatePlace(tripId, placeId, request), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: tripQueryKeys.places(tripId) }), client.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) }), client.invalidateQueries({ queryKey: tripQueryKeys.list() })]); } });
}
export function useDeleteTripPlaceMutation(tripId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (placeId: string) => tripApi.removePlace(tripId, placeId), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: tripQueryKeys.places(tripId) }), client.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) }), client.invalidateQueries({ queryKey: tripQueryKeys.list() })]); } });
}
