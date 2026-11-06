import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addTripPlaces, type AddTripPlacesInput } from "../api/add-trip-places";
import { tripQueryKeys } from "../api/trip-query-keys";

export function useAddTripPlaces(tripId: string) {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    networkMode: "always",
    mutationFn: (input: AddTripPlacesInput) => addTripPlaces(tripId, input),
    onSettled: async () => { await client.invalidateQueries({ queryKey: tripQueryKeys.all }); },
  });
}
