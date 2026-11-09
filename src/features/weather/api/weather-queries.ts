import { useQuery } from "@tanstack/react-query";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { weatherApi } from "./weather-api";

import { weatherQueryKeys } from "./weather-query-keys";
export function useTripWeather(tripId: string | undefined, date?: string) {
  const owner = useProfile().data?.id;
  return useQuery({
    queryKey: weatherQueryKeys.trip(owner, tripId, date),
    enabled: !!owner && !!tripId,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
    queryFn: ({ signal }) => {
      if (!tripId) throw new Error("Missing trip id");
      return weatherApi.trip(tripId, date, signal);
    },
  });
}
