import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { authSession } from "@/features/auth/services/auth-session";
import { ApiError } from "@/services/api/api-error";
import { tripQueryKeys } from "@/features/trip/api/trip-query-keys";
import { tripPlacesApi } from "@/features/trip/api/trip-place-api";
import { memoryApi } from "@/features/memories/api/memory-api";
import { memoryQueryKeys } from "./memory-query-keys";
import { homeApi, nextHomeRefreshDelay } from "./home-api";
import { weatherQueryKeys } from "@/features/weather/api/weather-query-keys";

export function useHomeDashboard() {
  const owner = useProfile().data?.id;
  const query = useQuery({
    queryKey: tripQueryKeys.dashboard(owner),
    enabled: !!owner,
    retry: false,
    queryFn: ({ signal }) => homeApi.get(signal),
  });
  const evaluatedDate = query.data?.context.evaluatedDate;
  const serverTime = query.data?.context.serverTime;
  const refetch = query.refetch;
  useEffect(() => {
    if (!evaluatedDate || !serverTime) return;
    const timer = setTimeout(() => {
      void refetch();
    }, nextHomeRefreshDelay({ evaluatedDate, serverTime }));
    return () => clearTimeout(timer);
  }, [evaluatedDate, serverTime, refetch]);
  return query;
}
export function useHomeActions() {
  const client = useQueryClient();
  const owner = useProfile().data?.id;
  const visit = useMutation({
    retry: false,
    mutationFn: async ({
      tripId,
      placeId,
    }: {
      tripId: string;
      placeId: string;
    }) => {
      const version = authSession.getVersion();
      await tripPlacesApi.updatePlace(tripId, placeId, { visited: true });
      if (version !== authSession.getVersion()) throw new ApiError("CANCELLED");
    },
    onSuccess: (_, { tripId }) =>
      Promise.all([
        client.invalidateQueries({
          queryKey: weatherQueryKeys.forTrip(owner, tripId),
        }),
        client.invalidateQueries({ queryKey: tripQueryKeys.dashboard(owner) }),
        client.invalidateQueries({ queryKey: tripQueryKeys.list(owner) }),
        client.invalidateQueries({
          queryKey: tripQueryKeys.detail(owner, tripId),
        }),
        client.invalidateQueries({
          queryKey: tripQueryKeys.places(owner, tripId),
        }),
        client.invalidateQueries({
          queryKey: tripQueryKeys.itinerary(owner, tripId),
        }),
      ]),
  });
  const removePhoto = useMutation({
    retry: false,
    mutationFn: async (id: string) => {
      const version = authSession.getVersion();
      await memoryApi.removePhoto(id);
      if (version !== authSession.getVersion()) throw new ApiError("CANCELLED");
    },
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: tripQueryKeys.dashboard(owner) }),
        client.invalidateQueries({ queryKey: [memoryQueryKeys.all[0], owner] }),
      ]),
  });
  return { visit, removePhoto };
}
