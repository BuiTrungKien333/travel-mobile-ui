import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTripWithPlaces, type CreateTripProgress, type CreateTripSession } from "../api/create-trip-with-places";
import { tripQueryKeys } from "../api/trip-query-keys";

export function useCreateTripWithPlaces(onProgress: (progress: CreateTripProgress) => void) {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    networkMode: "always",
    mutationFn: (session: CreateTripSession) => createTripWithPlaces(session, onProgress),
    onSettled: async (_data, _error, session) => {
      // A partial save must also appear in Home/Trips and in the trip's place pool.
      if (session.tripId) await client.invalidateQueries({ queryKey: tripQueryKeys.all });
    },
  });
}
