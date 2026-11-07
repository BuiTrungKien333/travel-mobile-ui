import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/api-error";

const metric = z.number().nonnegative();
const leg = z.object({ distanceMeters: metric, durationSeconds: metric });
const route = leg.extend({
  encodedPolyline: z.string().min(1).max(250000),
  legs: z.array(leg).min(1).max(24),
});
const result = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("READY"),
    route,
    placeIds: z.array(z.guid()).min(2).max(25),
  }),
  z.object({
    status: z.enum([
      "TOO_FEW_STOPS",
      "MISSING_COORDINATES",
      "TOO_MANY_STOPS",
      "NOT_CONFIGURED",
      "NO_ROUTE",
    ]),
    route: z.null(),
  }),
]);
const envelope = z.object({ success: z.literal(true), data: result });
const proposal = z.object({
  order: z.array(z.guid()).min(4).max(12),
  originalOrder: z.array(z.guid()).min(4).max(12),
  distanceMeters: metric,
  durationSeconds: metric,
});
const proposalEnvelope = z.object({ success: z.literal(true), data: proposal });
export type DayRoute = z.infer<typeof route>;
export type DayRouteProposal = z.infer<typeof proposal>;
export type RouteMode = "DRIVE" | "WALK" | "BICYCLE";

function path(tripId: string, date: string) {
  return `/api/v1/trips/${encodeURIComponent(tripId)}/itinerary/days/${encodeURIComponent(date)}/route`;
}

export function useTripDayRoute({
  tripId,
  date,
  mode,
  waypointKey,
  enabled,
}: {
  tripId?: string;
  date?: string;
  mode: RouteMode;
  waypointKey: string;
  enabled: boolean;
}) {
  const owner = useProfile().data?.id;
  return useQuery({
    queryKey: ["trip-day-routes", owner, tripId, date, mode, waypointKey],
    enabled: enabled && !!owner && !!tripId && !!date,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!tripId || !date) throw new ApiError("INVALID_ITINERARY");
      const response = await apiClient.get<unknown>(path(tripId, date), {
        params: { mode },
        signal,
      });
      const parsed = envelope.safeParse(response.data);
      if (!parsed.success) throw new ApiError("INVALID_RESPONSE");
      return parsed.data.data;
    },
  });
}

export function useOptimizeDayRoute(tripId: string) {
  return useMutation({
    retry: false,
    mutationFn: async ({ date, mode }: { date: string; mode: RouteMode }) => {
      const response = await apiClient.post<unknown>(
        `${path(tripId, date)}/optimize`,
        null,
        { params: { mode } },
      );
      const parsed = proposalEnvelope.safeParse(response.data);
      if (
        !parsed.success ||
        new Set(parsed.data.data.order).size !== parsed.data.data.order.length
      )
        throw new ApiError("INVALID_RESPONSE");
      return parsed.data.data;
    },
  });
}
