import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/features/auth/hooks/use-auth";
import { authSession } from "@/features/auth/services/auth-session";
import type { Trip } from "@/features/home/types/home-types";
import { memoryQueryKeys } from "@/features/memories/api/memory-api";
import { ApiError } from "@/services/api/api-error";
import { createServerTrip } from "../api/create-trip";

export function useCreateServerTrip() {
  const profile = useProfile();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    networkMode: "always",
    mutationFn: async ({ localId, trip }: { localId: string; trip: Trip }) => {
      if (!profile.data) throw new ApiError("AUTH_001", 401);
      const version = authSession.getVersion();
      const id = await createServerTrip(profile.data.id, localId, trip);
      if (version !== authSession.getVersion()) throw new ApiError("CANCELLED");
      await client.invalidateQueries({ queryKey: memoryQueryKeys.trips(profile.data.id) });
      return id;
    },
  });
}
