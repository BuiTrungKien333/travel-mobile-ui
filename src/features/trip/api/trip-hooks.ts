import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tripApi } from "./trip-api";
import { tripQueryKeys } from "./trip-query-keys";
import type { AddTripPlaceRequest, CreateTripRequest, UpdateTripDayRequest, UpdateTripPlaceRequest, UpdateTripRequest } from "./trip-types";
import { ApiError } from "@/services/api/api-error";

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
  return useMutation({
    mutationFn: (request: UpdateTripRequest) => tripApi.update(tripId, request),
    onSuccess: async (trip) => {
      client.setQueryData(tripQueryKeys.detail(tripId), trip);
      await client.invalidateQueries({ queryKey: tripQueryKeys.all });
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) await client.invalidateQueries({ queryKey: tripQueryKeys.all });
    },
  });
}
export function useDeleteTripMutation() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ tripId, version }: { tripId: string; version: number }) => tripApi.remove(tripId, version), onError: async (error) => { if (error instanceof ApiError && error.status === 409) await client.invalidateQueries({ queryKey: tripQueryKeys.all }); }, onSuccess: async (_, { tripId }) => { await client.invalidateQueries({ queryKey: tripQueryKeys.all }); client.removeQueries({ queryKey: tripQueryKeys.detail(tripId) }); client.removeQueries({ queryKey: tripQueryKeys.places(tripId) }); client.removeQueries({ queryKey: tripQueryKeys.itinerary(tripId) }); } });
}
export function useUpdateTripDayMutation(tripId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ date, request }: { date: string; request: UpdateTripDayRequest }) => tripApi.updateDay(tripId, date, request),
    onSuccess: async (trip) => {
      client.setQueryData(tripQueryKeys.detail(tripId), trip);
      await client.invalidateQueries({ queryKey: tripQueryKeys.all });
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) await client.invalidateQueries({ queryKey: tripQueryKeys.all });
    },
  });
}
export function useAddTripPlaceMutation(tripId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (request: AddTripPlaceRequest) => tripApi.addPlace(tripId, request), onSuccess: async () => { await client.invalidateQueries({ queryKey: tripQueryKeys.all }); } });
}
export function useUpdateTripPlaceMutation(tripId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ placeId, request }: { placeId: string; request: UpdateTripPlaceRequest }) => tripApi.updatePlace(tripId, placeId, request), onSuccess: async () => { await client.invalidateQueries({ queryKey: tripQueryKeys.all }); } });
}
export function useDeleteTripPlaceMutation(tripId: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (placeId: string) => tripApi.removePlace(tripId, placeId), onSuccess: async () => { await client.invalidateQueries({ queryKey: tripQueryKeys.all }); } });
}
