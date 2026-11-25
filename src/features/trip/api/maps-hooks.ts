import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/services/api/api-error";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { mapsApi } from "./maps-api";

export function usePlaceRouteQuery(
  points: { latitude: number; longitude: number }[],
  enabled = true,
) {
  const owner = useProfile().data?.id;
  const pointsKey = points
    .map(({ latitude, longitude }) => `${latitude},${longitude}`)
    .join(";");

  return useQuery({
    queryKey: ["places", owner, "route", pointsKey],
    queryFn: ({ signal }) => {
      if (points.length < 2 || points.length > 25)
        throw new ApiError("INVALID_ROUTE");

      return mapsApi.route(
        {
          origin: points[0],
          destination: points[points.length - 1],
          ...(points.length > 2 ? { intermediates: points.slice(1, -1) } : {}),
          travelMode: "DRIVE",
        },
        signal,
      );
    },
    enabled: !!owner && enabled && points.length >= 2 && points.length <= 25,
    staleTime: 10 * 60_000,
  });
}
