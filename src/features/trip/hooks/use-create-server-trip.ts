import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { authSession } from "@/features/auth/services/auth-session";
import type { Trip } from "@/features/home/types/home-types";
import { tripQueryKeys } from "../api/trip-query-keys";
import { ApiError } from "@/services/api/api-error";
import { createServerTrip } from "../api/create-trip";
import { createRequestId } from "@/utils/create-request-id";

export function useCreateServerTrip() {
  const profile = useProfile();
  const client = useQueryClient();
  const requests = useRef(new Map<string, { payload: string; id: string }>());
  return useMutation({
    retry: false,
    networkMode: "always",
    mutationFn: async ({ trip }: { trip: Trip }) => {
      if (!profile.data) throw new ApiError("AUTH_001", 401);
      const version = authSession.getVersion();
      const payload = JSON.stringify([trip.title, trip.destination, trip.startDate, trip.endDate, trip.budget, trip.preferences]);
      const previous = requests.current.get(trip.id);
      const requestId = previous?.payload === payload ? previous.id : createRequestId();
      requests.current.set(trip.id, { payload, id: requestId });
      const id = await createServerTrip(trip, requestId);
      if (version !== authSession.getVersion()) throw new ApiError("CANCELLED");
      await client.invalidateQueries({ queryKey: tripQueryKeys.all });
      return id;
    },
  });
}
